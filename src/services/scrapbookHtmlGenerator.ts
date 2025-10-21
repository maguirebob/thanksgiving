import fs from 'fs';
import path from 'path';
import prisma from '../lib/prisma';
import s3Service from './s3Service';

export interface ScrapbookContentItem {
  id: number;
  year: number;
  content_type: 'title' | 'text-paragraph' | 'menu' | 'photo' | 'page-photo' | 'blog' | 'heading';
  content_reference: string;
  display_order: number;
  page_break_before: boolean;
  page_break_after: boolean;
}

export interface ScrapbookPage {
  id: string;
  type: 'front-cover' | 'title-page' | 'text-page' | 'heading-page' | 'menu-page' | 'photo-page' | 'page-photo-page' | 'journal-page' | 'back-cover';
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
    // Try multiple possible paths for the template
    const possiblePaths = [
      path.join(__dirname, '../templates/scrapbook-template.html'),
      path.join(process.cwd(), 'src/templates/scrapbook-template.html'),
      path.join(process.cwd(), 'dist/templates/scrapbook-template.html'),
      path.join(__dirname, '../../src/templates/scrapbook-template.html'),
      path.join(__dirname, '../../dist/templates/scrapbook-template.html')
    ];
    
    // Find the first path that exists
    let templatePath = possiblePaths[0]; // default fallback
    for (const testPath of possiblePaths) {
      try {
        require('fs').accessSync(testPath);
        templatePath = testPath;
        break;
      } catch (error) {
        // Continue to next path
      }
    }
    
    this.templatePath = templatePath!;
    this.outputDir = path.join(__dirname, '../../public/scrapbooks');
  }

  /**
   * Generate HTML file for a specific year and save locally + S3 backup
   */
  async generateScrapbook(year: number): Promise<string> {
    try {
      // Validate year parameter
      if (!year || typeof year !== 'number' || year < 1900 || year > 2100) {
        throw new Error(`Invalid year parameter: ${year}. Must be a number between 1900 and 2100.`);
      }
      
      // Get all content items for the year
      const contentItems = await this.getContentItems(year);
      
      if (contentItems.length === 0) {
        throw new Error(`No content found for year ${year}. Please ensure there are journal sections and content items for this year.`);
      }

      // Convert content items to scrapbook pages
      const scrapbookData = await this.convertToScrapbookData(year, contentItems);
      
      // Generate HTML using template
      const htmlContent = await this.generateHtmlFromTemplate(scrapbookData, year);
    
      // Ensure output directory exists
      try {
        await fs.promises.access(this.outputDir);
      } catch (error) {
        await fs.promises.mkdir(this.outputDir, { recursive: true });
      }
      
      // Save HTML file locally (primary)
      const filename = `${year}.html`;
      const localPath = path.join(this.outputDir, filename);
      await fs.promises.writeFile(localPath, htmlContent, 'utf8');
    
      // Also upload to S3 as backup
      const s3Key = `scrapbooks/${filename}`;
      let s3Url: string | null = null;
      try {
        s3Url = await s3Service.uploadFile(
          s3Key,
          htmlContent,
          'text/html',
          {
            'scrapbook-year': year.toString(),
            'generated-at': new Date().toISOString(),
            'content-type': 'scrapbook'
          }
        );
      } catch (s3Error) {
        console.warn(`S3 backup failed (non-critical):`, s3Error);
      }
      
      // Record scrapbook file in database
      const fileStats = await fs.promises.stat(localPath);
      
      try {
        await prisma.scrapbookFiles.upsert({
        where: { year: year },
        update: {
          filename: filename,
          local_path: localPath,
          s3_url: s3Url,
          s3_key: s3Key,
          status: 'generated',
          file_size: fileStats.size,
          generated_at: new Date(),
          updated_at: new Date()
        },
        create: {
          year: year,
          filename: filename,
          local_path: localPath,
          s3_url: s3Url,
          s3_key: s3Key,
          status: 'generated',
          file_size: fileStats.size,
          generated_at: new Date()
        }
      });
    } catch (dbError) {
      console.error(`Database upsert failed:`, dbError);
      throw dbError;
    }
    
    return localPath;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Provide more specific error messages
      if (errorMessage.includes('Template file not found')) {
        throw new Error(`Scrapbook generation failed: Template file is missing. This is likely a deployment issue. Error: ${errorMessage}`);
      } else if (errorMessage.includes('No content found')) {
        throw new Error(`Scrapbook generation failed: No content available for year ${year}. Please add journal sections and content items first.`);
      } else if (errorMessage.includes('Failed to read template')) {
        throw new Error(`Scrapbook generation failed: Cannot read template file. This is likely a file permissions issue. Error: ${errorMessage}`);
      } else if (errorMessage.includes('Invalid year parameter')) {
        throw new Error(`Scrapbook generation failed: ${errorMessage}`);
      } else {
        throw new Error(`Scrapbook generation failed for year ${year}: ${errorMessage}`);
      }
    }
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

    // Group photos for 6-photo grids
    const photoItems: ScrapbookContentItem[] = [];
    
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
      } else {
        // Before processing non-photo items, handle any remaining photos
        if (photoItems.length > 0) {
          const photoPage = await this.createPhotoGridPage(photoItems);
          pages.push(photoPage);
          photoItems.length = 0; // Clear the array
        }
        
        if (item.content_type === 'blog') {
          // Handle each blog item individually - create separate pages
          const blogPages = await this.createBlogPages(item);
          pages.push(...blogPages);
        } else {
          // For non-photo, non-blog items, create page normally
          const page = await this.createPageFromContent(item);
          if (page) {
            pages.push(page);
          }
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
   * Create multiple pages for a single blog entry, distributing images across pages
   */
  private async createBlogPages(blogItem: ScrapbookContentItem): Promise<ScrapbookPage[]> {
    const pages: ScrapbookPage[] = [];
    
    // Get blog data from database
    const blogId = parseInt(blogItem.content_reference.replace('blog_', ''));
    const blog = await prisma.blogPost.findUnique({
      where: { blog_post_id: blogId },
      select: { 
        title: true, 
        content: true, 
        featured_image: true, 
        images: true 
      }
    });

    if (!blog) {
      console.error(`Blog with ID ${blogId} not found`);
      return [];
    }

    // Get all images for this blog
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

    // Create first page with title, content, and up to 2 images
    const firstPageImages = allImages.slice(0, 2);
    const remainingImages = allImages.slice(2);

    pages.push({
      id: `blog-${blogId}-page-1`,
      type: 'journal-page',
      content: {
        title: blog.title,
        content: blog.content,
        blogImages: firstPageImages.map(imageUrl => ({
          imageUrl: imageUrl,
          caption: 'Journal Entry'
        }))
      }
    });

    // Create additional pages for remaining images (2 per page)
    let pageNumber = 2;
    for (let i = 0; i < remainingImages.length; i += 2) {
      const pageImages = remainingImages.slice(i, i + 2);
      
      pages.push({
        id: `blog-${blogId}-page-${pageNumber}`,
        type: 'journal-page',
        content: {
          title: `${blog.title} (continued)`,
          content: '', // No content on continuation pages
          blogImages: pageImages.map(imageUrl => ({
            imageUrl: imageUrl,
            caption: 'Journal Entry'
          }))
        }
      });
      pageNumber++;
    }

    console.log(`📝 Created ${pages.length} pages for blog "${blog.title}" with ${allImages.length} images`);
    return pages;
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

      case 'heading':
        console.log(`🔧 HEADING DEBUG: Processing heading content: ${item.content_reference}`);
        return {
          id: `heading-${item.id}`,
          type: 'heading-page',
          content: {
            text: item.content_reference
          }
        };

      default:
        console.warn(`Unknown content type: ${item.content_type}`);
        return null;
    }
  }

  /**
   * Generate HTML from template
   */
  private async generateHtmlFromTemplate(data: ScrapbookData, year: number): Promise<string> {
    console.log(`🔧 TEMPLATE DEBUG: Attempting to read template from: ${this.templatePath}`);
    
    // Check if template file exists with detailed error info
    try {
      await fs.promises.access(this.templatePath);
      console.log(`🔧 TEMPLATE DEBUG: Template file exists`);
    } catch (error) {
      console.error(`🔧 TEMPLATE DEBUG: Template file does not exist: ${error}`);
      
      // List all files in possible directories for debugging
      const possibleDirs = [
        path.join(__dirname, '../templates'),
        path.join(process.cwd(), 'src/templates'),
        path.join(process.cwd(), 'dist/templates'),
        path.join(__dirname, '../../src/templates'),
        path.join(__dirname, '../../dist/templates')
      ];
      
      for (const dir of possibleDirs) {
        try {
          const files = await fs.promises.readdir(dir);
          console.log(`🔧 TEMPLATE DEBUG: Files in ${dir}:`, files);
        } catch (dirError) {
          console.log(`🔧 TEMPLATE DEBUG: Directory ${dir} does not exist or is not readable`);
        }
      }
      
      throw new Error(`Template file not found at: ${this.templatePath}. Checked multiple possible locations.`);
    }
    
    // Read the template file with better error handling
    let template: string;
    try {
      template = await fs.promises.readFile(this.templatePath, 'utf8');
      console.log(`🔧 TEMPLATE DEBUG: Successfully read template file (${template.length} characters)`);
    } catch (error) {
      console.error(`🔧 TEMPLATE DEBUG: Failed to read template file: ${error}`);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to read template file at ${this.templatePath}: ${errorMessage}`);
    }
    
            // Add generation metadata comment at the top
            const now = new Date();
            const estTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
            const generationComment = `<!-- 
SCRAPBOOK GENERATION METADATA:
- Generated: ${estTime.toLocaleString()} EST
- Expected Items: ${data.pages.length}
- Year: ${year}
- Template: ${this.templatePath}
-->
`;
            
            // Replace the title and add metadata comment
            let html = template.replace('Simple Scrapbook', data.title);
            html = html.replace('<!DOCTYPE html>', `<!DOCTYPE html>\n${generationComment}`);
    
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
      
      case 'heading-page':
        return this.generateHeadingPage(page.content);
      
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
    // Handle both old string format and new JSON format
    let title = '';
    let description = '';
    
    try {
      // Try to parse as JSON (new format with description)
      const parsedContent = JSON.parse(content.title || content);
      title = parsedContent.title || '';
      description = parsedContent.description || '';
    } catch {
      // Fall back to old string format
      title = content.title || content;
    }
    
    let html = `        <!-- Section Header Page -->
        <div class="page section-header">
            <div class="section-title">${title}</div>`;
    
    if (description && description.trim()) {
      html += `
            <div class="section-description">
                <p>${description}</p>
            </div>`;
    }
    
    html += `
        </div>`;
    
    return html;
  }

  private generateTextPage(content: any): string {
    return `        <!-- Text Page -->
            <div class="page text-page">
                <div class="thanksgiving-border">
                    <p>${content.text}</p>
                </div>
            </div>`;
  }

  private generateHeadingPage(content: any): string {
    return `        <!-- Heading Page -->
        <div class="page heading-page">
            <h2 class="section-heading">${content.text}</h2>
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
    const title = content.title || 'Journal Entry';
    const blogContent = content.content || '';
    
    const imageItems = blogImages.map((image: any) => 
      `<img src="/api/blog-images/${image.imageUrl}/preview" alt="${image.caption}">`
    ).join('\n                ');
    
    // Put title and content at the top of the page
    const contentHtml = blogContent ? `
            <div class="blog-content">
                <h3 class="blog-title">${title}</h3>
                <div class="blog-text">${blogContent}</div>
            </div>` : '';
    
    return `        <!-- Journal Page -->
        <div class="page journal-page">
            <div class="blog-header">
                ${contentHtml}
            </div>
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

}
