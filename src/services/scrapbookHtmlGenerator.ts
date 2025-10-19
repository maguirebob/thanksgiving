import fs from 'fs';
import path from 'path';
import prisma from '../lib/prisma';
import s3Service from './s3Service';

export interface ScrapbookContentItem {
  id: number;
  year: number;
  content_type: 'title' | 'text-paragraph' | 'menu' | 'photo' | 'page-photo' | 'blog';
  content_reference: string;
  display_order: number;
  page_break_before: boolean;
  page_break_after: boolean;
}

export interface ScrapbookPage {
  id: string;
  type: 'front-cover' | 'title-page' | 'text-page' | 'menu-page' | 'photo-page' | 'page-photo-page' | 'journal-page' | 'back-cover';
  content: any;
  pageBreakBefore?: boolean;
  pageBreakAfter?: boolean;
}

export interface ScrapbookData {
  year: number;
  title: string;
  pages: ScrapbookPage[];
}

export class ScrapbookHtmlGenerator {
  private templatePath: string;
  private outputDir: string;

  constructor() {
    this.templatePath = path.join(__dirname, '../../public/scrapbooks/simple.html');
    this.outputDir = path.join(__dirname, '../../public/scrapbooks');
  }

  /**
   * Generate HTML file for a specific year and save locally + S3 backup
   */
  async generateScrapbook(year: number): Promise<string> {
    console.log(`🔧 GENERATOR DEBUG: Starting scrapbook generation for year ${year}`);
    
    // Get all content items for the year
    console.log(`📊 GENERATOR DEBUG: Fetching content items from database`);
    const contentItems = await this.getContentItems(year);
    console.log(`📋 GENERATOR DEBUG: Found ${contentItems.length} content items`);
    
    if (contentItems.length === 0) {
      console.log(`❌ GENERATOR DEBUG: No content found for year ${year}`);
      throw new Error(`No content found for year ${year}`);
    }

    // Convert content items to scrapbook pages
    console.log(`🔄 GENERATOR DEBUG: Converting content items to scrapbook pages`);
    const scrapbookData = await this.convertToScrapbookData(year, contentItems);
    console.log(`📄 GENERATOR DEBUG: Generated ${scrapbookData.pages.length} pages`);
    
    // Generate HTML using template
    console.log(`📝 GENERATOR DEBUG: Generating HTML from template`);
    const htmlContent = await this.generateHtmlFromTemplate(scrapbookData);
    console.log(`📏 GENERATOR DEBUG: Generated HTML length: ${htmlContent.length} characters`);
    
    // Save HTML file locally (primary)
    const filename = `${year}.html`;
    const localPath = path.join(this.outputDir, filename);
    console.log(`💾 GENERATOR DEBUG: Writing to local file: ${localPath}`);
    await fs.promises.writeFile(localPath, htmlContent, 'utf8');
    
    // Also upload to S3 as backup
    const s3Key = `scrapbooks/${filename}`;
    console.log(`☁️ GENERATOR DEBUG: Uploading backup to S3: ${s3Key}`);
    try {
      const s3Url = await s3Service.uploadFile(
        s3Key,
        htmlContent,
        'text/html',
        {
          'scrapbook-year': year.toString(),
          'generated-at': new Date().toISOString(),
          'content-type': 'scrapbook'
        }
      );
      console.log(`🔗 GENERATOR DEBUG: S3 backup URL: ${s3Url}`);
    } catch (s3Error) {
      console.warn(`⚠️ GENERATOR DEBUG: S3 backup failed (non-critical):`, s3Error);
    }
    
    console.log(`✅ GENERATOR DEBUG: Scrapbook generation completed successfully`);
    return localPath;
  }

  /**
   * Get content items for a year from database
   */
  private async getContentItems(year: number): Promise<ScrapbookContentItem[]> {
    const items = await prisma.scrapbookContent.findMany({
      where: { year },
      orderBy: { display_order: 'asc' }
    });

    return items.map(item => ({
      id: item.id,
      year: item.year,
      content_type: item.content_type as any,
      content_reference: item.content_reference,
      display_order: item.display_order,
      page_break_before: item.page_break_before,
      page_break_after: item.page_break_after
    }));
  }

  /**
   * Convert content items to scrapbook data structure
   */
  private async convertToScrapbookData(year: number, items: ScrapbookContentItem[]): Promise<ScrapbookData> {
    const pages: ScrapbookPage[] = [];
    
    // Add front cover
    pages.push({
      id: 'front-cover',
      type: 'front-cover',
      content: {
        title: 'Maguire Family Thanksgiving',
        year: year
      }
    });

    // Group photos for 6-photo grids and blog items for single page
    const photoItems: ScrapbookContentItem[] = [];
    const blogItems: ScrapbookContentItem[] = [];
    
    // Process content items and create pages
    for (const item of items) {
      // Add page break before if specified
      if (item.page_break_before && pages.length > 1) {
        // Page break is handled by page type
      }

      // Handle photos specially - group them into 6-photo grids
      if (item.content_type === 'photo') {
        photoItems.push(item);
        
        // When we have 6 photos, create a photo grid page
        if (photoItems.length === 6) {
          const photoPage = await this.createPhotoGridPage(photoItems);
          pages.push(photoPage);
          photoItems.length = 0; // Clear the array
        }
      } else if (item.content_type === 'blog') {
        // Handle blog items specially - group them into a single page
        blogItems.push(item);
      } else {
        // For non-photo, non-blog items, create page normally
        const page = await this.createPageFromContent(item);
        if (page) {
          pages.push(page);
        }
      }

      // Add page break after if specified
      if (item.page_break_after) {
        // Page break is handled by page type
      }
    }

    // Handle any remaining photos (less than 6)
    if (photoItems.length > 0) {
      const photoPage = await this.createPhotoGridPage(photoItems);
      pages.push(photoPage);
    }

    // Handle blog items - create a single journal page
    if (blogItems.length > 0) {
      const journalPage = await this.createJournalPage(blogItems);
      pages.push(journalPage);
    }

    // Add back cover
    pages.push({
      id: 'back-cover',
      type: 'back-cover',
      content: {
        title: 'Thank You',
        year: year
      }
    });

    return {
      year,
      title: `Thanksgiving ${year} Scrapbook`,
      pages
    };
  }

  /**
   * Create a photo grid page from multiple photo items
   */
  private async createPhotoGridPage(photoItems: ScrapbookContentItem[]): Promise<ScrapbookPage> {
    const photos = await Promise.all(photoItems.map(async item => ({
      imageUrl: await this.getPhotoFilename(item.content_reference),
      caption: 'Thanksgiving Memory'
    })));

    return {
      id: `photo-grid-${photoItems[0]?.id || 'unknown'}`,
      type: 'photo-page',
      content: {
        title: 'Thanksgiving Memories',
        photos: photos
      }
    };
  }

  /**
   * Create a journal page from multiple blog items
   */
  private async createJournalPage(blogItems: ScrapbookContentItem[]): Promise<ScrapbookPage> {
    const allBlogImages: { imageUrl: string; caption: string }[] = [];
    
    // Process each blog item to get all its images
    for (const item of blogItems) {
      const blogImages = await this.getBlogImages(item.content_reference);
      blogImages.forEach(imageUrl => {
        allBlogImages.push({
          imageUrl: imageUrl,
          caption: 'Journal Entry'
        });
      });
    }

    return {
      id: `journal-page-${blogItems[0]?.id || 'unknown'}`,
      type: 'journal-page',
      content: {
        title: 'Thanksgiving Memories',
        blogImages: allBlogImages
      }
    };
  }

  /**
   * Create a page from content item
   */
  private async createPageFromContent(item: ScrapbookContentItem): Promise<ScrapbookPage | null> {
    switch (item.content_type) {
      case 'title':
        return {
          id: `title-${item.id}`,
          type: 'title-page',
          content: {
            title: item.content_reference
          }
        };

      case 'text-paragraph':
        return {
          id: `text-${item.id}`,
          type: 'text-page',
          content: {
            text: item.content_reference
          }
        };

      case 'menu':
        const menuId = await this.getMenuId(item.content_reference);
        return {
          id: `menu-${item.id}`,
          type: 'menu-page',
          content: {
            title: `Thanksgiving Menu ${item.year}`,
            menuId: menuId
          }
        };

      case 'photo':
        // Photos are handled by createPhotoGridPage method
        return null;

      case 'page-photo':
        const pagePhotoFilename = await this.getPhotoFilename(item.content_reference);
        return {
          id: `page-photo-${item.id}`,
          type: 'page-photo-page',
          content: {
            imageUrl: pagePhotoFilename,
            caption: 'Thanksgiving Memory'
          }
        };

      case 'blog':
        // Blog items are handled by createJournalPage method
        return null;

      default:
        console.warn(`Unknown content type: ${item.content_type}`);
        return null;
    }
  }

  /**
   * Generate HTML from template
   */
  private async generateHtmlFromTemplate(data: ScrapbookData): Promise<string> {
    // Read the simple.html template
    const template = await fs.promises.readFile(this.templatePath, 'utf8');
    
    // Replace the title
    let html = template.replace('Simple Scrapbook', data.title);
    
    // Find the flipbook container and replace its content
    const flipbookStart = html.indexOf('<div class="flipbook">');
    let flipbookEnd = html.indexOf('</div>', flipbookStart);
    
    // Find the correct closing div by counting nested divs
    let divCount = 0;
    let i = flipbookStart;
    while (i < html.length) {
      if (html.substring(i, i + 4) === '<div') {
        divCount++;
      } else if (html.substring(i, i + 6) === '</div>') {
        divCount--;
        if (divCount === 0) {
          flipbookEnd = i + 6;
          break;
        }
      }
      i++;
    }
    
    if (flipbookStart === -1 || flipbookEnd === -1) {
      throw new Error('Could not find flipbook container in template');
    }
    
    // Generate pages HTML
    const pagesHtml = this.generatePagesHtml(data.pages);
    
    // Replace flipbook content
    const beforeFlipbook = html.substring(0, flipbookStart + '<div class="flipbook">'.length);
    const afterFlipbook = html.substring(flipbookEnd);
    
    return beforeFlipbook + '\n' + pagesHtml + '\n    </div>\n' + afterFlipbook;
  }

  /**
   * Generate HTML for all pages
   */
  private generatePagesHtml(pages: ScrapbookPage[]): string {
    return pages.map(page => this.generatePageHtml(page)).join('\n');
  }

  /**
   * Generate HTML for a single page
   */
  private generatePageHtml(page: ScrapbookPage): string {
    switch (page.type) {
      case 'front-cover':
        return this.generateCoverPage(page.content, 'front');
      
      case 'back-cover':
        return this.generateCoverPage(page.content, 'back');
      
      case 'title-page':
        return this.generateTitlePage(page.content);
      
      case 'text-page':
        return this.generateTextPage(page.content);
      
      case 'menu-page':
        return this.generateMenuPage(page.content);
      
      case 'photo-page':
        return this.generatePhotoPage(page.content);
      
      case 'page-photo-page':
        return this.generatePagePhotoPage(page.content);
      
      case 'journal-page':
        return this.generateJournalPage(page.content);
      
      default:
        return `<!-- Unknown page type: ${page.type} -->`;
    }
  }

  private generateCoverPage(content: any, type: 'front' | 'back'): string {
    let title = type === 'front' ? content.title : content.title;
    
    // Split front cover title into two lines
    if (type === 'front' && title === 'Maguire Family Thanksgiving') {
      title = 'Maguire Family<br>Thanksgiving';
    }
    
    return `        <!-- ${type === 'front' ? 'Cover' : 'Back Cover'} -->
        <div class="page cover">
            <div class="embossed-text">${title}</div>
            <i class="bottom-corners"></i>
            <span class="rivet rivet-tl"></span>
            <span class="rivet rivet-tr"></span>
            <span class="rivet rivet-bl"></span>
            <span class="rivet rivet-br"></span>
        </div>`;
  }

  private generateTitlePage(content: any): string {
    return `        <!-- Section Header Page -->
        <div class="page section-header">${content.title}</div>`;
  }

  private generateTextPage(content: any): string {
    return `        <!-- Text Page -->
        <div class="page">
            <p>${content.text}</p>
        </div>`;
  }

  private generateMenuPage(content: any): string {
    return `        <!-- Menu Page -->
        <div class="page menu-page">
            <img src="/api/v1/menu-images/${content.menuId}" alt="Menu">
        </div>`;
  }

  private generatePhotoPage(content: any): string {
    const photos = content.photos || [];
    if (photos.length === 0) return `        <div class="page"><p>No photos</p></div>`;
    
    // Create a 6-photo grid matching simple.html format
    const photoItems = photos.map((photo: any) => 
      `<img src="/api/photos/${photo.imageUrl}/preview" alt="${photo.caption}">`
    ).join('\n                ');
    
    return `        <!-- Photo Grid Page -->
        <div class="page">
            <div class="photo-grid">
                ${photoItems}
            </div>
        </div>`;
  }

  private generatePagePhotoPage(content: any): string {
    return `        <!-- Page Photo Page -->
        <div class="page page-photo">
            <div class="page-photo-content">
                <img src="/api/photos/${content.imageUrl}/preview" alt="${content.caption}">
            </div>
        </div>`;
  }

  private generateJournalPage(content: any): string {
    const blogImages = content.blogImages || [];
    if (blogImages.length === 0) return `        <div class="page"><p>No blog images</p></div>`;
    
    const imageItems = blogImages.map((image: any) => 
      `<img src="/api/blog-images/${image.imageUrl}/preview" alt="${image.caption}">`
    ).join('\n                ');
    
    return `        <!-- Blog Images Page -->
        <div class="page">
            <div class="blog-images">
                ${imageItems}
            </div>
        </div>`;
  }

  /**
   * Get menu ID from database
   */
  private async getMenuId(contentReference: string): Promise<number> {
    // Extract menu ID from content_reference (e.g., "menu_15" -> 15)
    const menuId = parseInt(contentReference.replace('menu_', ''));
    console.log(`🔍 DEBUG: Looking up menu ID ${menuId} for reference ${contentReference}`);
    
    if (isNaN(menuId)) {
      throw new Error(`Invalid menu ID extracted from ${contentReference}`);
    }
    
    const event = await prisma.event.findUnique({
      where: { event_id: menuId },
      select: { event_id: true }
    });

    console.log(`🍽️ DEBUG: Found event:`, event);

    if (!event) {
      throw new Error(`Event with ID ${menuId} not found in database`);
    }

    return event.event_id;
  }

  /**
   * Get photo filename from database
   */
  private async getPhotoFilename(contentReference: string): Promise<string> {
    // Extract photo ID from content_reference (e.g., "photo_45" -> 45, "page_photo_57" -> 57)
    let photoId: number;
    
    if (contentReference.startsWith('page_photo_')) {
      photoId = parseInt(contentReference.replace('page_photo_', ''));
    } else if (contentReference.startsWith('photo_')) {
      photoId = parseInt(contentReference.replace('photo_', ''));
    } else {
      throw new Error(`Invalid photo reference format: ${contentReference}`);
    }
    
    console.log(`🔍 DEBUG: Looking up photo ID ${photoId} for reference ${contentReference}`);
    
    if (isNaN(photoId)) {
      throw new Error(`Invalid photo ID extracted from ${contentReference}`);
    }
    
    const photo = await prisma.photo.findUnique({
      where: { photo_id: photoId },
      select: { filename: true, s3_url: true }
    });

    console.log(`📸 DEBUG: Found photo:`, photo);

    if (!photo) {
      throw new Error(`Photo with ID ${photoId} not found in database`);
    }

    if (!photo.filename) {
      throw new Error(`Photo with ID ${photoId} has no filename`);
    }

    return photo.filename;
  }

  /**
   * Get all blog images from database (featured_image + images array)
   */
  private async getBlogImages(contentReference: string): Promise<string[]> {
    // Extract blog ID from content_reference (e.g., "blog_4" -> 4)
    const blogId = parseInt(contentReference.replace('blog_', ''));
    console.log(`🔍 DEBUG: Looking up blog ID ${blogId} for reference ${contentReference}`);
    
    if (isNaN(blogId)) {
      throw new Error(`Invalid blog ID extracted from ${contentReference}`);
    }
    
    const blog = await prisma.blogPost.findUnique({
      where: { blog_post_id: blogId },
      select: { featured_image: true, images: true }
    });

    console.log(`📝 DEBUG: Found blog:`, blog);

    if (!blog) {
      throw new Error(`Blog with ID ${blogId} not found in database`);
    }

    const allImages: string[] = [];
    
    // Add featured image if it exists
    if (blog.featured_image) {
      const featuredFilename = blog.featured_image
        .replace('/api/blog-images/', '')
        .replace('/preview', '');
      allImages.push(featuredFilename);
    }
    
    // Add all images from the images array
    if (blog.images && Array.isArray(blog.images)) {
      blog.images.forEach(imagePath => {
        const imageFilename = imagePath
          .replace('/api/blog-images/', '')
          .replace('/preview', '');
        allImages.push(imageFilename);
      });
    }
    
    console.log(`📝 DEBUG: All blog images:`, allImages);
    return allImages;
  }
}
