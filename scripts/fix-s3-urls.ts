#!/usr/bin/env ts-node

/**
 * Script to fix S3 URLs in database to match actual uploaded filenames
 * 
 * This script:
 * 1. Maps database events to the correct S3 filenames we uploaded
 * 2. Updates menu_image_s3_url with the correct URLs
 * 3. Updates menu_image_filename with the correct filenames
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Map of event years to actual S3 filenames we uploaded
const yearToFilename: Record<number, string> = {
  1994: '1994_Menu.png',
  1997: '1997_Menu.jpeg',
  1999: '1999_Menu.jpeg',
  2000: '2000_Menu.jpeg',
  2002: '2002_Menu.jpeg',
  2004: '2004_Menu.jpeg',
  2005: '2005_Menu.jpeg',
  2006: '2006_Menu.jpeg',
  2007: '2007_Menu.jpeg',
  2008: '2008_Menu.jpeg',
  2009: '2009_Menu.jpeg',
  2010: '2010_Menu.jpeg',
  2011: '2011_Menu.jpeg',
  2012: '2012_Menu.jpeg',
  2013: '2013_Menu.jpeg',
  2014: '2014_Menu.jpeg',
  2015: '2015_Menu.jpeg',
  2016: '2016_Menu.jpeg',
  2017: '2017_Menu.jpeg',
  2018: '2018_Menu.jpeg',
  2020: '2020_Menu.jpeg',
  2021: '2021_Menu.jpeg',
  2022: '2022_Menu.jpeg',
  2023: '2023_Menu.jpeg',
  2024: '2024_Menu.jpeg'
};

interface FixResult {
  success: boolean;
  eventId: number;
  eventName: string;
  year: number;
  oldFilename?: string;
  newFilename: string;
  oldS3Url?: string;
  newS3Url: string;
  error?: string;
}

class S3UrlFixer {
  private results: FixResult[] = [];
  private dryRun: boolean = false;
  private bucketName: string = 'thanksgiving-images-prod';
  private region: string = 'us-east-1';

  constructor() {
    this.dryRun = !process.argv.includes('--live');
    
    if (this.dryRun) {
      console.log('🔍 DRY RUN MODE - No database updates will be made');
    } else {
      console.log('🚀 LIVE MODE - Database will be updated');
    }
  }

  async run(): Promise<void> {
    console.log('🚀 Starting S3 URL fix...');
    console.log(`🪣 S3 bucket: ${this.bucketName}`);
    
    try {
      // Get all events
      const events = await prisma.event.findMany({
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

      console.log(`📋 Found ${events.length} events`);

      // Process each event
      for (const event of events) {
        await this.fixEvent(event);
      }

      // Print summary
      this.printSummary();

    } catch (error) {
      console.error('❌ Fix failed:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }

  private async fixEvent(event: any): Promise<void> {
    const { event_id, event_name, event_date, menu_image_filename, menu_image_s3_url } = event;
    const year = event_date.getFullYear();
    
    console.log(`\n🔄 Processing: ${event_name} (ID: ${event_id}, Year: ${year})`);

    // Check if we have a mapping for this year
    const correctFilename = yearToFilename[year];
    if (!correctFilename) {
      console.log(`   ⚠️  No mapping found for year ${year}`);
      this.results.push({
        success: false,
        eventId: event_id,
        eventName: event_name,
        year: year,
        newFilename: '',
        newS3Url: '',
        error: `No mapping found for year ${year}`
      });
      return;
    }

    const newS3Url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/menus/${correctFilename}`;
    
    console.log(`   📁 Current filename: ${menu_image_filename || 'null'}`);
    console.log(`   📁 Correct filename: ${correctFilename}`);
    console.log(`   🔗 Current S3 URL: ${menu_image_s3_url || 'null'}`);
    console.log(`   🔗 Correct S3 URL: ${newS3Url}`);

    if (this.dryRun) {
      console.log(`   🔍 DRY RUN: Would update database`);
      this.results.push({
        success: true,
        eventId: event_id,
        eventName: event_name,
        year: year,
        oldFilename: menu_image_filename,
        newFilename: correctFilename,
        oldS3Url: menu_image_s3_url,
        newS3Url: newS3Url
      });
      return;
    }

    try {
      // Update database
      await prisma.event.update({
        where: { event_id: event_id },
        data: { 
          menu_image_filename: correctFilename,
          menu_image_s3_url: newS3Url
        }
      });
      
      console.log(`   ✅ Database updated successfully`);

      this.results.push({
        success: true,
        eventId: event_id,
        eventName: event_name,
        year: year,
        oldFilename: menu_image_filename,
        newFilename: correctFilename,
        oldS3Url: menu_image_s3_url,
        newS3Url: newS3Url
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log(`   ❌ Update failed: ${errorMessage}`);
      this.results.push({
        success: false,
        eventId: event_id,
        eventName: event_name,
        year: year,
        newFilename: correctFilename,
        newS3Url: newS3Url,
        error: errorMessage
      });
    }
  }

  private printSummary(): void {
    console.log('\n📊 Fix Summary:');
    console.log('==================');
    
    const successful = this.results.filter(r => r.success);
    const failed = this.results.filter(r => !r.success);
    
    console.log(`✅ Successful: ${successful.length}`);
    console.log(`❌ Failed: ${failed.length}`);
    
    if (successful.length > 0) {
      console.log('\n✅ Successful fixes:');
      successful.forEach(result => {
        console.log(`   • ${result.eventName} (${result.year}): ${result.newFilename}`);
      });
    }
    
    if (failed.length > 0) {
      console.log('\n❌ Failed fixes:');
      failed.forEach(result => {
        console.log(`   • ${result.eventName} (${result.year}): ${result.error}`);
      });
    }

    if (successful.length > 0) {
      console.log('\n🔗 Corrected S3 URLs:');
      successful.forEach(result => {
        console.log(`   • ${result.eventName}: ${result.newS3Url}`);
      });
    }
  }
}

// Run the script
async function main() {
  try {
    const fixer = new S3UrlFixer();
    await fixer.run();
    console.log('\n🎉 S3 URL fix process completed!');
  } catch (error) {
    console.error('💥 Script failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
