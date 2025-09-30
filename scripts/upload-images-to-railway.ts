#!/usr/bin/env ts-node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

/**
 * Script to upload existing menu images to Railway test volume
 * This ensures test environment has all historical menu images
 */

interface ImageFile {
  filename: string;
  year: string;
  size: number;
  path: string;
}

class ImageUploader {
  private imagesDir: string;
  private existingImages: ImageFile[] = [];

  constructor() {
    this.imagesDir = path.join(process.cwd(), 'public/images');
  }

  /**
   * Scan for existing menu images
   */
  scanExistingImages(): void {
    console.log('🔍 Scanning for existing menu images...');
    
    if (!fs.existsSync(this.imagesDir)) {
      console.log('❌ Images directory not found:', this.imagesDir);
      return;
    }

    const files = fs.readdirSync(this.imagesDir);
    
    files.forEach(file => {
      const filePath = path.join(this.imagesDir, file);
      const stats = fs.statSync(filePath);
      
      // Check if it's an image file
      if (stats.isFile() && this.isImageFile(file)) {
        const year = this.extractYearFromFilename(file);
        
        this.existingImages.push({
          filename: file,
          year: year,
          size: stats.size,
          path: filePath
        });
      }
    });

    console.log(`✅ Found ${this.existingImages.length} existing menu images`);
    this.displayImageSummary();
  }

  /**
   * Check if file is an image
   */
  private isImageFile(filename: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = path.extname(filename).toLowerCase();
    return imageExtensions.includes(ext);
  }

  /**
   * Extract year from filename (e.g., "2024_Menu.jpeg" -> "2024")
   */
  private extractYearFromFilename(filename: string): string {
    const match = filename.match(/(\d{4})/);
    return match ? match[1]! : 'Unknown';
  }

  /**
   * Display summary of found images
   */
  private displayImageSummary(): void {
    console.log('\n📊 Image Summary:');
    console.log('================');
    
    const yearGroups = this.existingImages.reduce((groups, img) => {
      if (!groups[img.year]) {
        groups[img.year] = [];
      }
      groups[img.year]!.push(img);
      return groups;
    }, {} as Record<string, ImageFile[]>);

    Object.keys(yearGroups)
      .sort()
      .forEach(year => {
        const images = yearGroups[year]!;
        console.log(`${year}: ${images.length} image(s)`);
        images.forEach(img => {
          const sizeKB = Math.round(img.size / 1024);
          console.log(`  - ${img.filename} (${sizeKB}KB)`);
        });
      });

    const totalSize = this.existingImages.reduce((sum, img) => sum + img.size, 0);
    const totalSizeMB = Math.round(totalSize / (1024 * 1024) * 100) / 100;
    console.log(`\n📦 Total size: ${totalSizeMB}MB`);
  }

  /**
   * Upload images to Railway test volume
   */
  async uploadToRailwayVolume(): Promise<void> {
    console.log('\n🚀 Uploading images to Railway test volume...');
    
    try {
      // Check if Railway CLI is available
      execSync('railway --version', { stdio: 'pipe' });
      console.log('✅ Railway CLI is available');
    } catch (error) {
      console.log('❌ Railway CLI not found. Please install it first:');
      console.log('   npm install -g @railway/cli');
      return;
    }
    
    // Service is already connected via terminal
    console.log('✅ Using pre-connected Railway service');

    // Create directory if it doesn't exist
    try {
      console.log('📁 Creating directory /app/public/images...');
      execSync('railway run mkdir -p /app/public/images', { stdio: 'pipe' });
      console.log('✅ Directory created successfully');
    } catch (error) {
      console.log('❌ Failed to create directory');
      console.log('Error details:', error instanceof Error ? error.message : 'Unknown error');
      console.log('Please check your Railway connection and try manually:');
      console.log('  railway run mkdir -p /app/public/images');
      return;
    }

    // Upload each image using the specific service
    let successCount = 0;
    let errorCount = 0;

    for (const image of this.existingImages) {
      try {
        console.log(`📤 Uploading ${image.filename}...`);
        
        // Use Railway CLI to copy file to volume (service already connected)
        const command = `railway run cp "${image.path}" "/app/public/images/${image.filename}"`;
        execSync(command, { stdio: 'pipe' });
        
        console.log(`✅ ${image.filename} uploaded successfully`);
        successCount++;
      } catch (error) {
        console.log(`❌ Failed to upload ${image.filename}`);
        errorCount++;
      }
    }

    console.log('\n📊 Upload Summary:');
    console.log('==================');
    console.log(`✅ Successful uploads: ${successCount}`);
    console.log(`❌ Failed uploads: ${errorCount}`);
    console.log(`📦 Total images: ${this.existingImages.length}`);

    if (successCount > 0) {
      console.log('\n🎉 Upload completed!');
      console.log('📋 Next steps:');
      console.log('1. Verify images are accessible in test environment');
      console.log('2. Test image display on the website');
      console.log('3. Create production volume and repeat process');
    }
  }

  /**
   * Alternative method using Railway file upload
   */
  async uploadViaRailwayFiles(): Promise<void> {
    console.log('\n📁 Alternative: Manual file upload via Railway dashboard');
    console.log('=======================================================');
    
    console.log('1. Go to Railway dashboard');
    console.log('2. Select your test project');
    console.log('3. Go to the volume: images-storage-thanksgiving-test');
    console.log('4. Upload the following files:');
    
    this.existingImages.forEach(img => {
      console.log(`   - ${img.filename}`);
    });
    
    console.log('\n📂 Source directory:', this.imagesDir);
    console.log('🎯 Target directory: /app/public/images/');
  }

  /**
   * Verify uploaded images
   */
  async verifyUploads(): Promise<void> {
    console.log('\n🔍 Verifying uploaded images...');
    
    try {
      // List files in Railway volume (service already connected)
      const command = `railway run ls -la /app/public/images/`;
      const output = execSync(command, { encoding: 'utf8' });
      
      console.log('📁 Files in Railway volume:');
      console.log(output);
      
      // Count uploaded files
      const lines = output.split('\n').filter(line => line.includes('.'));
      const imageFiles = lines.filter(line => 
        line.includes('.jpg') || line.includes('.jpeg') || line.includes('.png')
      );
      
      console.log(`\n✅ Found ${imageFiles.length} image files in volume`);
      
    } catch (error) {
      console.log('❌ Failed to verify uploads');
      console.log('   You may need to check manually in Railway dashboard');
    }
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🖼️  Railway Image Upload Script');
  console.log('==============================');
  
  const uploader = new ImageUploader();
  
  // Scan for existing images
  uploader.scanExistingImages();
  
  if (uploader['existingImages'].length === 0) {
    console.log('❌ No images found to upload');
    return;
  }
  
  // Ask user which method to use
  console.log('\n📋 Upload Methods:');
  console.log('1. Automatic upload via Railway CLI');
  console.log('2. Manual upload via Railway dashboard');
  console.log('3. Verify existing uploads');
  
  // For now, show both options
  console.log('\n🚀 Starting automatic upload...');
  await uploader.uploadToRailwayVolume();
  
  console.log('\n📁 Manual upload instructions:');
  await uploader.uploadViaRailwayFiles();
  
  console.log('\n🔍 Verification:');
  await uploader.verifyUploads();
}

// Run the script
main().catch(console.error);
