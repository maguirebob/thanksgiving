#!/usr/bin/env ts-node

/**
 * Script to upload menu images from local Mac directory to S3
 * 
 * This script:
 * 1. Reads all menu files from /Thanksgiving App/Menus
 * 2. Uploads each file to S3 in the menus/ directory
 * 3. Updates the database with the S3 URL
 * 4. Provides detailed logging and error handling
 */

import { PrismaClient } from '@prisma/client';
import s3Service from '../src/services/s3Service';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

interface UploadResult {
  success: boolean;
  filename: string;
  eventId?: number;
  eventName?: string;
  s3Url?: string;
  error?: string;
}

class LocalMenuUploader {
  private results: UploadResult[] = [];
  private dryRun: boolean = false;
  private localMenuPath: string = path.join(process.env['HOME'] || '', 'Documents', 'Thanksgiving App', 'Content', 'Menus');

  constructor() {
    // Check if --live flag is provided
    this.dryRun = !process.argv.includes('--live');
    
    if (this.dryRun) {
      console.log('🔍 DRY RUN MODE - No files will be uploaded');
    } else {
      console.log('🚀 LIVE MODE - Files will be uploaded to S3');
    }
  }

  async run(): Promise<void> {
    console.log('🚀 Starting local menu upload to S3...');
    console.log(`📁 Local menu path: ${this.localMenuPath}`);
    
    try {
      // Check if local directory exists
      if (!fs.existsSync(this.localMenuPath)) {
        throw new Error(`Local menu directory not found: ${this.localMenuPath}`);
      }

      // Get all menu files from local directory
      const menuFiles = this.getMenuFiles();
      console.log(`📋 Found ${menuFiles.length} menu files`);

      if (menuFiles.length === 0) {
        console.log('❌ No menu files found in directory');
        return;
      }

      // Process each file
      for (const file of menuFiles) {
        await this.uploadMenuFile(file);
      }

      // Print summary
      this.printSummary();

    } catch (error) {
      console.error('❌ Upload failed:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }

  private getMenuFiles(): string[] {
    const files = fs.readdirSync(this.localMenuPath);
    return files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
    });
  }

  private async uploadMenuFile(filename: string): Promise<void> {
    console.log(`\n🔄 Processing: ${filename}`);
    
    try {
      const localPath = path.join(this.localMenuPath, filename);
      
      // Check if file exists
      if (!fs.existsSync(localPath)) {
        const error = `File not found: ${localPath}`;
        console.log(`   ❌ ${error}`);
        this.results.push({
          success: false,
          filename,
          error
        });
        return;
      }

      // Get file stats
      const stats = fs.statSync(localPath);
      console.log(`   📊 File size: ${this.formatFileSize(stats.size)}`);

      // Try to find matching event in database (skip if can't connect)
      let event = null;
      try {
        event = await this.findMatchingEvent(filename);
        if (event) {
          console.log(`   🎯 Found matching event: ${event.event_name} (ID: ${event.event_id})`);
        } else {
          console.log(`   ⚠️  No matching event found for: ${filename}`);
        }
      } catch (dbError) {
        console.log(`   ⚠️  Database connection failed, skipping event matching: ${(dbError as Error).message}`);
      }

      if (this.dryRun) {
        console.log(`   🔍 DRY RUN: Would upload to S3`);
        this.results.push({
          success: true,
          filename,
          eventId: event?.event_id,
          eventName: event?.event_name,
          s3Url: `https://thanksgiving-images-prod.s3.us-east-1.amazonaws.com/menus/${filename}`
        });
        return;
      }

      // Read file
      const fileBuffer = fs.readFileSync(localPath);
      
      // Determine content type
      const ext = path.extname(filename).toLowerCase();
      const contentType = this.getContentType(ext);

      // Upload to S3
      const s3Key = `menus/${filename}`;
      console.log(`   ⬆️  Uploading to S3: ${s3Key}`);
      
      const s3Url = await s3Service.uploadFile(s3Key, fileBuffer, contentType);
      console.log(`   ✅ Uploaded successfully: ${s3Url}`);

      // Update database if event found and we can connect
      if (event) {
        try {
          await prisma.event.update({
            where: { event_id: event.event_id },
            data: { 
              menu_image_filename: filename,
              menu_image_s3_url: s3Url 
            }
          });
          console.log(`   💾 Database updated for event: ${event.event_name}`);
        } catch (dbError) {
          console.log(`   ⚠️  Database update failed: ${(dbError as Error).message}`);
        }
      }

      this.results.push({
        success: true,
        filename,
        eventId: event?.event_id,
        eventName: event?.event_name,
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

  private async findMatchingEvent(filename: string): Promise<any> {
    // Try different matching strategies
    const strategies = [
      // Exact filename match
      { menu_image_filename: filename },
      // Filename without extension
      { menu_image_filename: path.parse(filename).name },
      // Try to extract year from filename
      ...this.extractYearFromFilename(filename)
    ];

    for (const strategy of strategies) {
      const event = await prisma.event.findFirst({
        where: strategy,
        select: {
          event_id: true,
          event_name: true,
          event_date: true,
          menu_image_filename: true
        }
      });
      
      if (event) {
        return event;
      }
    }

    return null;
  }

  private extractYearFromFilename(filename: string): any[] {
    const yearMatch = filename.match(/(\d{4})/);
    if (yearMatch && yearMatch[1]) {
      const year = parseInt(yearMatch[1]);
      return [
        { event_date: { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) } }
      ];
    }
    return [];
  }

  private getContentType(ext: string): string {
    const contentTypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };
    return contentTypes[ext] || 'image/jpeg';
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
        console.log(`   • ${result.filename}${result.eventName ? ` → ${result.eventName}` : ''}`);
      });
    }
    
    if (failed.length > 0) {
      console.log('\n❌ Failed uploads:');
      failed.forEach(result => {
        console.log(`   • ${result.filename}: ${result.error}`);
      });
    }
  }
}

// Run the script
async function main() {
  try {
    const uploader = new LocalMenuUploader();
    await uploader.run();
    console.log('\n🎉 Upload process completed!');
  } catch (error) {
    console.error('💥 Script failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
