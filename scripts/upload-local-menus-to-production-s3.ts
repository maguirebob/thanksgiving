#!/usr/bin/env ts-node

/**
 * Script to upload menu images from local Mac directory to PRODUCTION S3
 * 
 * This script:
 * 1. Reads all menu files from /Thanksgiving App/Content/Menus
 * 2. Uploads each file to PRODUCTION S3 bucket in the menus/ directory
 * 3. Provides detailed logging and error handling
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

interface UploadResult {
  success: boolean;
  filename: string;
  s3Url?: string;
  error?: string;
}

class ProductionMenuUploader {
  private results: UploadResult[] = [];
  private dryRun: boolean = false;
  private localMenuPath: string = path.join(process.env['HOME'] || '', 'Documents', 'Thanksgiving App', 'Content', 'Menus');
  private s3Client: S3Client;
  private bucketName: string = 'thanksgiving-images-prod';
  private region: string = 'us-east-1';

  constructor() {
    // Check if --live flag is provided
    this.dryRun = !process.argv.includes('--live');
    
    if (this.dryRun) {
      console.log('🔍 DRY RUN MODE - No files will be uploaded');
    } else {
      console.log('🚀 LIVE MODE - Files will be uploaded to PRODUCTION S3');
    }

    // Initialize S3 client for production
    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: process.env['AWS_ACCESS_KEY_ID'] || '',
        secretAccessKey: process.env['AWS_SECRET_ACCESS_KEY'] || ''
      }
    });

    console.log(`S3Service initialized for PRODUCTION bucket: ${this.bucketName} in region: ${this.region}`);
  }

  async run(): Promise<void> {
    console.log('🚀 Starting local menu upload to PRODUCTION S3...');
    console.log(`📁 Local menu path: ${this.localMenuPath}`);
    console.log(`🪣 Production S3 bucket: ${this.bucketName}`);
    
    try {
      // Check if local directory exists
      if (!fs.existsSync(this.localMenuPath)) {
        throw new Error(`Local menu directory not found: ${this.localMenuPath}`);
      }

      // Get all image files
      const files = this.getImageFiles();
      console.log(`📋 Found ${files.length} menu files`);

      if (files.length === 0) {
        console.log('⚠️ No menu files found in directory');
        return;
      }

      // Process each file
      for (const filename of files) {
        await this.uploadFile(filename);
      }

      // Print summary
      this.printSummary();

    } catch (error) {
      console.error('❌ Upload failed:', error);
      throw error;
    }
  }

  private getImageFiles(): string[] {
    const files = fs.readdirSync(this.localMenuPath);
    return files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
    });
  }

  private async uploadFile(filename: string): Promise<void> {
    const localPath = path.join(this.localMenuPath, filename);
    
    console.log(`\n🔄 Processing: ${filename}`);

    try {
      // Get file stats
      const stats = fs.statSync(localPath);
      console.log(`   📊 File size: ${this.formatFileSize(stats.size)}`);

      if (this.dryRun) {
        console.log(`   🔍 DRY RUN: Would upload to S3`);
        this.results.push({
          success: true,
          filename,
          s3Url: `https://${this.bucketName}.s3.${this.region}.amazonaws.com/menus/${filename}`
        });
        return;
      }

      // Read file
      const fileBuffer = fs.readFileSync(localPath);
      const contentType = this.getContentType(filename);

      // Upload to S3
      const s3Key = `menus/${filename}`;
      console.log(`   ⬆️  Uploading to PRODUCTION S3: ${s3Key}`);
      
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
        Body: fileBuffer,
        ContentType: contentType
      });

      await this.s3Client.send(command);
      
      const s3Url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${s3Key}`;
      console.log(`   ✅ Uploaded successfully: ${s3Url}`);

      this.results.push({
        success: true,
        filename,
        s3Url
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log(`   ❌ Upload failed: ${errorMessage}`);
      this.results.push({
        success: false,
        filename,
        error: errorMessage
      });
    }
  }

  private getContentType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const contentTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };
    return contentTypes[ext] || 'application/octet-stream';
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private printSummary(): void {
    console.log('\n📊 Upload Summary:');
    console.log('==================');
    
    const successful = this.results.filter(r => r.success);
    const failed = this.results.filter(r => !r.success);
    
    console.log(`✅ Successful: ${successful.length}`);
    console.log(`❌ Failed: ${failed.length}`);
    
    if (successful.length > 0) {
      console.log('\n✅ Successful uploads:');
      successful.forEach(result => {
        console.log(`   • ${result.filename}`);
      });
    }
    
    if (failed.length > 0) {
      console.log('\n❌ Failed uploads:');
      failed.forEach(result => {
        console.log(`   • ${result.filename}: ${result.error}`);
      });
    }

    if (successful.length > 0) {
      console.log('\n🔗 Production S3 URLs:');
      successful.forEach(result => {
        console.log(`   • ${result.filename}: ${result.s3Url}`);
      });
    }
  }
}

// Run the script
async function main() {
  try {
    const uploader = new ProductionMenuUploader();
    await uploader.run();
    console.log('\n🎉 Production upload process completed!');
  } catch (error) {
    console.error('💥 Script failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
