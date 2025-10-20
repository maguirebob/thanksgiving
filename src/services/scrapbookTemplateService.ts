import fs from 'fs';
import path from 'path';

export interface ScrapbookPage {
  type: 'cover' | 'menu' | 'photo-grid' | 'blog-images' | 'page-photo' | 'section-header';
  content: any;
}

export interface ScrapbookData {
  title: string;
  pages: ScrapbookPage[];
}

export class ScrapbookTemplateService {
  private templatePath: string;
  private outputDir: string;

  constructor() {
    this.templatePath = path.join(__dirname, '../templates/scrapbook-template.html');
    this.outputDir = path.join(__dirname, '../../public/scrapbooks');
  }

  /**
   * Generate a scrapbook HTML file from template and data
   */
  async generateScrapbook(scrapbookData: ScrapbookData, filename: string): Promise<string> {
    // Read the template
    const template = fs.readFileSync(this.templatePath, 'utf8');
    
    // Generate the pages HTML
    const pagesHtml = this.generatePagesHtml(scrapbookData.pages);
    
    // Replace the title
    let generatedHtml = template.replace('<title>Simple Scrapbook</title>', `<title>${scrapbookData.title}</title>`);
    
    // Find and replace the flipbook content more carefully
    const flipbookStart = generatedHtml.indexOf('<div class="flipbook">');
    let flipbookEnd = generatedHtml.indexOf('</div>', flipbookStart);
    
    // Find the closing </div> for the flipbook by counting nested divs
    let nestedCount = 0;
    let currentPos = flipbookStart;
    while (currentPos < generatedHtml.length) {
      if (generatedHtml.substring(currentPos, currentPos + 5) === '<div ') {
        nestedCount++;
      } else if (generatedHtml.substring(currentPos, currentPos + 6) === '</div>') {
        nestedCount--;
        if (nestedCount === 0) {
          flipbookEnd = currentPos + 6;
          break;
        }
      }
      currentPos++;
    }
    
    const beforeFlipbook = generatedHtml.substring(0, flipbookStart);
    const afterFlipbook = generatedHtml.substring(flipbookEnd);
    
    generatedHtml = beforeFlipbook + '<div class="flipbook">' + pagesHtml + '</div>' + afterFlipbook;
    
    // Write the generated file
    const outputPath = path.join(this.outputDir, `${filename}.html`);
    fs.writeFileSync(outputPath, generatedHtml);
    
    return outputPath;
  }

  /**
   * Generate HTML for all pages
   */
  private generatePagesHtml(pages: ScrapbookPage[]): string {
    let html = '';
    
    for (const page of pages) {
      html += this.generatePageHtml(page);
    }
    
    return html;
  }

  /**
   * Generate HTML for a single page
   */
  private generatePageHtml(page: ScrapbookPage): string {
    switch (page.type) {
      case 'cover':
        return this.generateCoverPage(page.content);
      case 'menu':
        return this.generateMenuPage(page.content);
      case 'photo-grid':
        return this.generatePhotoGridPage(page.content);
      case 'blog-images':
        return this.generateBlogImagesPage(page.content);
      case 'page-photo':
        return this.generatePagePhotoPage(page.content);
      case 'section-header':
        return this.generateSectionHeaderPage(page.content);
      default:
        throw new Error(`Unknown page type: ${page.type}`);
    }
  }

  private generateCoverPage(content: { title: string; isBackCover?: boolean }): string {
    const text = content.isBackCover ? 'The End' : content.title;
    return `
        <!-- ${content.isBackCover ? 'Back Cover' : 'Cover'} -->
        <div class="page cover">
            <div class="embossed-text">${text}</div>
        </div>
        
`;
  }

  private generateMenuPage(content: { imagePath: string; alt?: string }): string {
    return `
        <!-- Menu Page -->
        <div class="page menu-page">
            <img src="${content.imagePath}" alt="${content.alt || 'Menu'}">
        </div>
        
`;
  }

  private generatePhotoGridPage(content: { images: Array<{ src: string; alt: string }> }): string {
    const imageHtml = content.images.map(img => 
      `                <img src="${img.src}" alt="${img.alt}">`
    ).join('\n');
    
    return `
        <!-- Photo Grid Page -->
        <div class="page">
            <div class="photo-grid">
${imageHtml}
            </div>
        </div>
        
`;
  }

  private generateBlogImagesPage(content: { images: Array<{ src: string; alt: string }> }): string {
    const imageHtml = content.images.map(img => 
      `                        <img src="${img.src}" alt="${img.alt}">`
    ).join('\n');
    
    return `
        <!-- Blog Images Page -->
        <div class="page">
            <div class="blog-images">
${imageHtml}
            </div>
        </div>
        
`;
  }

  private generatePagePhotoPage(content: { imagePath: string; alt?: string }): string {
    return `
        <!-- Page Photo Page -->
        <div class="page page-photo">
            <div class="page-photo-content">
                <img src="${content.imagePath}" alt="${content.alt || 'Scrapbook Page'}">
            </div>
        </div>
        
`;
  }

  private generateSectionHeaderPage(content: { title: string }): string {
    return `
        <!-- Section Header Page -->
        <div class="page section-header">${content.title}</div>
        
`;
  }
}
