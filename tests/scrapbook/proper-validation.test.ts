import { ScrapbookHtmlGenerator } from '../src/services/scrapbookHtmlGenerator';
import fs from 'fs';
import path from 'path';

interface ValidationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  imageReferences: {
    filename: string;
    exists: boolean;
    type: string;
    source: 'database' | 'fallback' | 'hardcoded';
  }[];
}

class ProperHtmlValidator {
  private generator: ScrapbookHtmlGenerator;
  private publicDir: string;

  constructor() {
    this.generator = new ScrapbookHtmlGenerator();
    this.publicDir = path.join(__dirname, '../../public');
  }

  /**
   * Test scrapbook generation with proper validation
   */
  async validateScrapbookGeneration(year: number): Promise<ValidationResult> {
    const result: ValidationResult = {
      success: true,
      errors: [],
      warnings: [],
      imageReferences: []
    };

    try {
      console.log(`🧪 Testing scrapbook generation for year ${year}...`);
      
      // Generate scrapbook HTML
      const htmlPath = await this.generator.generateScrapbook(year);
      console.log(`✅ Generated HTML: ${htmlPath}`);

      // Read HTML content
      const htmlContent = await fs.promises.readFile(htmlPath, 'utf8');
      
      // Extract image references
      const imageRefs = this.extractImageReferences(htmlContent);
      
      // Validate each image reference
      for (const ref of imageRefs) {
        const validation = await this.validateImageReference(ref);
        result.imageReferences.push(validation);
        
        if (!validation.exists && validation.source === 'database') {
          result.errors.push(`Database lookup failed for ${ref}: file not found`);
        } else if (!validation.exists && validation.source === 'fallback') {
          result.warnings.push(`Using fallback placeholder for ${ref}`);
        }
      }

      // Check for common issues
      const placeholderCount = result.imageReferences.filter(r => r.filename.includes('placeholder')).length;
      if (placeholderCount > 0) {
        result.warnings.push(`${placeholderCount} images using placeholder fallback`);
      }

      const hardcodedCount = result.imageReferences.filter(r => r.source === 'hardcoded').length;
      if (hardcodedCount > 0) {
        result.warnings.push(`${hardcodedCount} hardcoded image references found`);
      }

      result.success = result.errors.length === 0;

    } catch (error) {
      result.success = false;
      result.errors.push(`Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Extract image references from HTML
   */
  private extractImageReferences(htmlContent: string): string[] {
    const imgRegex = /<img[^>]+src="([^"]+)"/g;
    const references: string[] = [];
    let match;

    while ((match = imgRegex.exec(htmlContent)) !== null) {
      references.push(match[1]);
    }

    return references;
  }

  /**
   * Validate a single image reference
   */
  private async validateImageReference(reference: string): Promise<{
    filename: string;
    exists: boolean;
    type: string;
    source: 'database' | 'fallback' | 'hardcoded';
  }> {
    const absolutePath = path.join(this.publicDir, reference.replace('../', ''));
    const exists = fs.existsSync(absolutePath);
    
    let type = 'unknown';
    let source: 'database' | 'fallback' | 'hardcoded' = 'database';
    
    if (reference.includes('/images/')) type = 'menu';
    else if (reference.includes('/photos/')) type = 'photo';
    else if (reference.includes('/page_photos/')) type = 'page-photo';
    else if (reference.includes('/blog_images/')) type = 'blog';
    
    if (reference.includes('placeholder')) source = 'fallback';
    else if (reference.includes('2013_Journal_P')) source = 'hardcoded';
    
    return {
      filename: reference,
      exists,
      type,
      source
    };
  }

  /**
   * Print detailed validation report
   */
  printReport(result: ValidationResult): void {
    console.log('\n📊 VALIDATION REPORT');
    console.log('==================');
    console.log(`Status: ${result.success ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Total Images: ${result.imageReferences.length}`);
    console.log(`Errors: ${result.errors.length}`);
    console.log(`Warnings: ${result.warnings.length}`);
    
    if (result.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      result.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    if (result.warnings.length > 0) {
      console.log('\n⚠️ WARNINGS:');
      result.warnings.forEach(warning => console.log(`  - ${warning}`));
    }
    
    console.log('\n📸 IMAGE BREAKDOWN:');
    const byType = result.imageReferences.reduce((acc, img) => {
      if (!acc[img.type]) acc[img.type] = { total: 0, valid: 0, invalid: 0 };
      acc[img.type].total++;
      if (img.exists) acc[img.type].valid++;
      else acc[img.type].invalid++;
      return acc;
    }, {} as Record<string, { total: number; valid: number; invalid: number }>);
    
    Object.entries(byType).forEach(([type, stats]) => {
      const status = stats.invalid === 0 ? '✅' : '❌';
      console.log(`  ${type}: ${stats.valid}/${stats.total} valid ${status}`);
    });
    
    console.log('\n🔍 DETAILED IMAGES:');
    result.imageReferences.forEach(img => {
      const status = img.exists ? '✅' : '❌';
      const source = img.source === 'database' ? 'DB' : img.source === 'fallback' ? 'FALLBACK' : 'HARDCODED';
      console.log(`  ${status} ${img.type}: ${img.filename} (${source})`);
    });
  }
}

// Test function
async function runProperValidation() {
  const validator = new ProperHtmlValidator();
  
  console.log('🧪 Starting Proper HTML Validation Test...\n');
  
  const result = await validator.validateScrapbookGeneration(2013);
  validator.printReport(result);
  
  if (!result.success) {
    console.log('\n💡 NEXT STEPS:');
    console.log('1. Fix database query errors');
    console.log('2. Verify photo IDs exist in database');
    console.log('3. Check file paths and permissions');
    console.log('4. Update fallback logic if needed');
  }
}

// Run the test
if (require.main === module) {
  runProperValidation().catch(console.error);
}

export { ProperHtmlValidator };
