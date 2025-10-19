import fs from 'fs';
import path from 'path';
import { ScrapbookHtmlGenerator } from '../src/services/scrapbookHtmlGenerator';

interface ImageValidationResult {
  filename: string;
  exists: boolean;
  path: string;
  type: 'menu' | 'photo' | 'page-photo' | 'blog';
}

class HtmlFilenameValidator {
  private publicDir: string;
  private generator: ScrapbookHtmlGenerator;

  constructor() {
    this.publicDir = path.join(__dirname, '../public');
    this.generator = new ScrapbookHtmlGenerator();
  }

  /**
   * Extract all image references from HTML content
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
   * Validate if a file exists
   */
  private validateFileExists(filePath: string): boolean {
    try {
      return fs.existsSync(filePath);
    } catch (error) {
      return false;
    }
  }

  /**
   * Determine image type from path
   */
  private getImageType(filePath: string): 'menu' | 'photo' | 'page-photo' | 'blog' {
    if (filePath.includes('/images/')) return 'menu';
    if (filePath.includes('/photos/')) return 'photo';
    if (filePath.includes('/page_photos/')) return 'page-photo';
    if (filePath.includes('/blog_images/')) return 'blog';
    return 'photo'; // default
  }

  /**
   * Validate all image references in HTML content
   */
  async validateHtmlImages(htmlContent: string): Promise<ImageValidationResult[]> {
    const imageReferences = this.extractImageReferences(htmlContent);
    const results: ImageValidationResult[] = [];

    for (const reference of imageReferences) {
      // Convert relative path to absolute path
      const absolutePath = path.join(this.publicDir, reference.replace('../', ''));
      const exists = this.validateFileExists(absolutePath);
      const type = this.getImageType(reference);

      results.push({
        filename: reference,
        exists,
        path: absolutePath,
        type
      });
    }

    return results;
  }

  /**
   * Test scrapbook generation and validate all images
   */
  async testScrapbookGeneration(year: number): Promise<{
    success: boolean;
    htmlPath: string;
    validationResults: ImageValidationResult[];
    summary: {
      totalImages: number;
      validImages: number;
      invalidImages: number;
      byType: Record<string, { total: number; valid: number; invalid: number }>;
    };
  }> {
    try {
      console.log(`🧪 Testing scrapbook generation for year ${year}...`);
      
      // Generate scrapbook HTML
      const htmlPath = await this.generator.generateScrapbook(year);
      console.log(`✅ Generated HTML: ${htmlPath}`);

      // Read HTML content
      const htmlContent = await fs.promises.readFile(htmlPath, 'utf8');
      console.log(`📄 Read HTML content (${htmlContent.length} characters)`);

      // Validate all images
      const validationResults = await this.validateHtmlImages(htmlContent);
      console.log(`🔍 Validated ${validationResults.length} image references`);

      // Calculate summary
      const validImages = validationResults.filter(r => r.exists).length;
      const invalidImages = validationResults.filter(r => !r.exists).length;
      
      const byType: Record<string, { total: number; valid: number; invalid: number }> = {};
      validationResults.forEach(result => {
        if (!byType[result.type]) {
          byType[result.type] = { total: 0, valid: 0, invalid: 0 };
        }
        byType[result.type].total++;
        if (result.exists) {
          byType[result.type].valid++;
        } else {
          byType[result.type].invalid++;
        }
      });

      return {
        success: true,
        htmlPath,
        validationResults,
        summary: {
          totalImages: validationResults.length,
          validImages,
          invalidImages,
          byType
        }
      };

    } catch (error) {
      console.error(`❌ Test failed for year ${year}:`, error);
      return {
        success: false,
        htmlPath: '',
        validationResults: [],
        summary: {
          totalImages: 0,
          validImages: 0,
          invalidImages: 0,
          byType: {}
        }
      };
    }
  }

  /**
   * Print detailed validation report
   */
  printValidationReport(result: Awaited<ReturnType<HtmlFilenameValidator['testScrapbookGeneration']>>): void {
    console.log('\n📊 VALIDATION REPORT');
    console.log('==================');
    console.log(`HTML File: ${result.htmlPath}`);
    console.log(`Total Images: ${result.summary.totalImages}`);
    console.log(`Valid Images: ${result.summary.validImages} ✅`);
    console.log(`Invalid Images: ${result.summary.invalidImages} ❌`);
    
    console.log('\n📈 BY TYPE:');
    Object.entries(result.summary.byType).forEach(([type, stats]) => {
      const status = stats.invalid === 0 ? '✅' : '❌';
      console.log(`  ${type}: ${stats.valid}/${stats.total} valid ${status}`);
    });

    if (result.summary.invalidImages > 0) {
      console.log('\n❌ INVALID IMAGES:');
      result.validationResults
        .filter(r => !r.exists)
        .forEach(r => {
          console.log(`  ${r.type}: ${r.filename}`);
          console.log(`    Expected: ${r.path}`);
        });
    }

    if (result.summary.validImages > 0) {
      console.log('\n✅ VALID IMAGES:');
      result.validationResults
        .filter(r => r.exists)
        .forEach(r => {
          console.log(`  ${r.type}: ${r.filename}`);
        });
    }
  }
}

// Test function
async function runValidationTest() {
  const validator = new HtmlFilenameValidator();
  
  console.log('🧪 Starting HTML Filename Validation Test...\n');
  
  // Test 2013 scrapbook
  const result = await validator.testScrapbookGeneration(2013);
  
  if (result.success) {
    validator.printValidationReport(result);
    
    // Determine if test passed
    const allImagesValid = result.summary.invalidImages === 0;
    console.log(`\n🎯 TEST RESULT: ${allImagesValid ? 'PASSED ✅' : 'FAILED ❌'}`);
    
    if (!allImagesValid) {
      console.log('\n💡 NEXT STEPS:');
      console.log('1. Check database for correct filenames');
      console.log('2. Verify files exist in public directories');
      console.log('3. Update ScrapbookHtmlGenerator if needed');
    }
  } else {
    console.log('❌ Test failed to generate scrapbook');
  }
}

// Run the test
if (require.main === module) {
  runValidationTest().catch(console.error);
}

export { HtmlFilenameValidator };
