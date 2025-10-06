#!/usr/bin/env ts-node

/**
 * Migration script to upload existing menu images to S3
 * 
 * This script:
 * 1. Finds all events with local menu images (no S3 URL)
 * 2. Uploads each image to S3
 * 3. Updates the database with the S3 URL
 * 4. Provides detailed logging and error handling
 */

import { PrismaClient } from '@prisma/client';
import s3Service from '../src/services/s3Service';
import fs from 'fs';
import path from 'path';
import { config } from '../src/lib/config';

const prisma = new PrismaClient();

interface MigrationResult {
  success: boolean;
  eventId: number;
  eventName: string;
  filename: string;
  s3Url?: string;
  error?: string;
}

class MenuImageMigration {
  private results: MigrationResult[] = [];
  private dryRun: boolean;

  constructor(dryRun: boolean = false) {
    this.dryRun = dryRun;
  }

  async run(): Promise<void> {
    console.log('🚀 Starting menu image migration to S3...');
    console.log(`📊 Mode: ${this.dryRun ? 'DRY RUN' : 'LIVE MIGRATION'}`);
    console.log(`🪣 S3 Bucket: ${config.getS3BucketName()}`);
    console.log(`🌍 Region: ${config.getAwsRegion()}`);
    console.log('');

    // Check S3 configuration
    if (!config.isS3Configured()) {
      console.error('❌ S3 is not properly configured. Please check your environment variables.');
      process.exit(1);
    }

    try {
      // Test S3 connection
      const isConfigured = await s3Service.isConfigured();
      if (!isConfigured) {
        console.error('❌ Cannot connect to S3. Please check your AWS credentials.');
        process.exit(1);
      }
      console.log('✅ S3 connection verified');

      // Find events with local images
      const events = await this.findEventsWithLocalImages();
      console.log(`📋 Found ${events.length} events with local menu images`);
      console.log('');

      if (events.length === 0) {
        console.log('✅ No events need migration. All menu images are already in S3!');
        return;
      }

      // Process each event
      for (const event of events) {
        await this.migrateEvent(event);
      }

      // Print summary
      this.printSummary();

    } catch (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  }

  private async findEventsWithLocalImages() {
    const allEvents = await prisma.event.findMany({
      select: {
        event_id: true,
        event_name: true,
        menu_image_filename: true,
        menu_image_s3_url: true
      },
      orderBy: { event_date: 'desc' }
    });

    // Filter for events without S3 URLs
    return allEvents.filter(event => !event.menu_image_s3_url);
  }

  private async migrateEvent(event: any): Promise<void> {
    const { event_id, event_name, menu_image_filename } = event;
    
    console.log(`🔄 Processing: ${event_name} (ID: ${event_id})`);
    console.log(`   📁 Filename: ${menu_image_filename}`);
    console.log(`   🌍 Environment: ${process.env['NODE_ENV']}`);

    try {
      // Check if local file exists - handle different environments
      const publicPath = process.env['NODE_ENV'] === 'development' 
        ? path.join(process.cwd(), 'public', 'images')
        : '/app/public/images';
      const localPath = path.join(publicPath, menu_image_filename);
      console.log(`   🔍 Looking for file at: ${localPath}`);
      
      if (!fs.existsSync(localPath)) {
        const error = `Local file not found: ${localPath}`;
        console.log(`   ❌ ${error}`);
        this.results.push({
          success: false,
          eventId: event_id,
          eventName: event_name,
          filename: menu_image_filename,
          error
        });
        return;
      }

      // Get file stats
      const stats = fs.statSync(localPath);
      console.log(`   📊 File size: ${this.formatFileSize(stats.size)}`);

      if (this.dryRun) {
        console.log(`   🔍 DRY RUN: Would upload to S3`);
        this.results.push({
          success: true,
          eventId: event_id,
          eventName: event_name,
          filename: menu_image_filename,
          s3Url: `https://${config.getS3BucketName()}.s3.${config.getAwsRegion()}.amazonaws.com/menus/${menu_image_filename}`
        });
        return;
      }

      // Read file
      const fileBuffer = fs.readFileSync(localPath);
      
      // Determine content type
      const ext = path.extname(menu_image_filename).toLowerCase();
      const contentType = this.getContentType(ext);

      // Upload to S3
      const s3Key = `menus/${menu_image_filename}`;
      console.log(`   ⬆️  Uploading to S3: ${s3Key}`);
      
      const s3Url = await s3Service.uploadFile(s3Key, fileBuffer, contentType);
      console.log(`   ✅ Uploaded successfully: ${s3Url}`);

      // Update database
      await prisma.event.update({
        where: { event_id: event_id },
        data: { menu_image_s3_url: s3Url }
      });
      console.log(`   💾 Database updated`);

      this.results.push({
        success: true,
        eventId: event_id,
        eventName: event_name,
        filename: menu_image_filename,
        s3Url
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log(`   ❌ Failed: ${errorMessage}`);
      
      this.results.push({
        success: false,
        eventId: event_id,
        eventName: event_name,
        filename: menu_image_filename,
        error: errorMessage
      });
    }

    console.log('');
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
    console.log('📊 Migration Summary');
    console.log('==================');
    
    const successful = this.results.filter(r => r.success);
    const failed = this.results.filter(r => !r.success);
    
    console.log(`✅ Successful: ${successful.length}`);
    console.log(`❌ Failed: ${failed.length}`);
    console.log(`📋 Total processed: ${this.results.length}`);
    console.log('');

    if (successful.length > 0) {
      console.log('✅ Successfully migrated:');
      successful.forEach(result => {
        console.log(`   • ${result.eventName} (${result.filename})`);
      });
      console.log('');
    }

    if (failed.length > 0) {
      console.log('❌ Failed migrations:');
      failed.forEach(result => {
        console.log(`   • ${result.eventName} (${result.filename}): ${result.error}`);
      });
      console.log('');
    }

    if (this.dryRun) {
      console.log('🔍 This was a DRY RUN. No actual changes were made.');
      console.log('   Run with --live to perform the actual migration.');
    } else {
      console.log('🎉 Migration completed!');
    }
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--live');
  
  if (dryRun) {
    console.log('🔍 Running in DRY RUN mode. Use --live to perform actual migration.');
  } else {
    console.log('⚠️  LIVE MIGRATION mode. This will modify your database and upload files to S3.');
  }
  
  console.log('');

  const migration = new MenuImageMigration(dryRun);
  await migration.run();
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the migration
main().catch((error) => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
