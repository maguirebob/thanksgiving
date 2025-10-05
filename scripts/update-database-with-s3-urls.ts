#!/usr/bin/env ts-node

/**
 * Script to update production database with S3 URLs for menu images
 * 
 * This script:
 * 1. Connects to the production database
 * 2. Updates all events with menu_image_s3_url pointing to the uploaded S3 files
 * 3. Provides detailed logging and error handling
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface UpdateResult {
  success: boolean;
  eventId: number;
  eventName: string;
  filename: string;
  s3Url?: string;
  error?: string;
}

class DatabaseUpdater {
  private results: UpdateResult[] = [];
  private dryRun: boolean = false;

  constructor() {
    // Check if --live flag is provided
    this.dryRun = !process.argv.includes('--live');
    
    if (this.dryRun) {
      console.log('🔍 DRY RUN MODE - No database updates will be made');
    } else {
      console.log('🚀 LIVE MODE - Database will be updated');
    }
  }

  async run(): Promise<void> {
    console.log('🚀 Starting database update with S3 URLs...');
    console.log(`📊 Database URL: ${process.env['DATABASE_URL'] ? 'SET' : 'NOT SET'}`);
    
    try {
      // Get all events that need S3 URL updates
      const events = await this.getEventsNeedingUpdate();
      console.log(`📋 Found ${events.length} events needing S3 URL updates`);

      if (events.length === 0) {
        console.log('✅ All events already have S3 URLs');
        return;
      }

      // Process each event
      for (const event of events) {
        await this.updateEvent(event);
      }

      // Print summary
      this.printSummary();

    } catch (error) {
      console.error('❌ Update failed:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }

  private async getEventsNeedingUpdate(): Promise<any[]> {
    // Get all events with menu images
    const allEvents = await prisma.event.findMany({
      select: {
        event_id: true,
        event_name: true,
        event_date: true,
        menu_image_filename: true,
        menu_image_s3_url: true
      },
      orderBy: {
        event_date: 'asc'
      }
    });

    // Filter to only events that have menu_image_filename but no menu_image_s3_url
    return allEvents.filter(event => 
      event.menu_image_filename && !event.menu_image_s3_url
    );
  }

  private async updateEvent(event: any): Promise<void> {
    const { event_id, event_name, menu_image_filename } = event;
    
    console.log(`\n🔄 Processing: ${event_name} (ID: ${event_id})`);
    console.log(`   📁 Filename: ${menu_image_filename}`);

    try {
      // Generate S3 URL
      const s3Url = `https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com/menus/${menu_image_filename}`;
      console.log(`   🔗 S3 URL: ${s3Url}`);

      if (this.dryRun) {
        console.log(`   🔍 DRY RUN: Would update database`);
        this.results.push({
          success: true,
          eventId: event_id,
          eventName: event_name,
          filename: menu_image_filename,
          s3Url
        });
        return;
      }

      // Update database
      await prisma.event.update({
        where: { event_id: event_id },
        data: { 
          menu_image_s3_url: s3Url
        }
      });
      
      console.log(`   ✅ Database updated successfully`);

      this.results.push({
        success: true,
        eventId: event_id,
        eventName: event_name,
        filename: menu_image_filename,
        s3Url
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log(`   ❌ Update failed: ${errorMessage}`);
      this.results.push({
        success: false,
        eventId: event_id,
        eventName: event_name,
        filename: menu_image_filename,
        error: errorMessage
      });
    }
  }

  private printSummary(): void {
    console.log('\n📊 Update Summary:');
    console.log('==================');
    
    const successful = this.results.filter(r => r.success);
    const failed = this.results.filter(r => !r.success);
    
    console.log(`✅ Successful: ${successful.length}`);
    console.log(`❌ Failed: ${failed.length}`);
    
    if (successful.length > 0) {
      console.log('\n✅ Successful updates:');
      successful.forEach(result => {
        console.log(`   • ${result.eventName} (${result.filename})`);
      });
    }
    
    if (failed.length > 0) {
      console.log('\n❌ Failed updates:');
      failed.forEach(result => {
        console.log(`   • ${result.eventName}: ${result.error}`);
      });
    }

    if (successful.length > 0) {
      console.log('\n🔗 S3 URLs are now available for:');
      successful.forEach(result => {
        console.log(`   • ${result.eventName}: ${result.s3Url}`);
      });
    }
  }
}

// Run the script
async function main() {
  try {
    const updater = new DatabaseUpdater();
    await updater.run();
    console.log('\n🎉 Database update process completed!');
  } catch (error) {
    console.error('💥 Script failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
