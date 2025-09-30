#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';
import path from 'path';

const prisma = new PrismaClient();

async function fixMenuFilenames() {
  try {
    console.log('🔧 Fixing menu filenames in database...');
    console.log(`📊 Environment: ${process.env['NODE_ENV'] || 'development'}`);
    
    // Get the appropriate images directory based on environment
    let imagesDir: string;
    if (process.env['NODE_ENV'] === 'development') {
      imagesDir = path.join(process.cwd(), 'public', 'images');
    } else {
      // For test/production, we need to check what's actually in the volume
      // Since we can't access the volume directly, we'll work with the database
      imagesDir = '/app/public/images'; // This is where the volume should be mounted
    }
    
    console.log(`📁 Images directory: ${imagesDir}`);
    
    // Get all events from database
    const events = await prisma.event.findMany({
      orderBy: { event_date: 'asc' }
    });
    
    console.log(`📊 Found ${events.length} events in database`);
    
    let updatedCount = 0;
    let errorCount = 0;
    
    // Define the expected filenames based on year
    const expectedFilenames: Record<number, string> = {
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
      2019: '2019_Menu.jpeg',
      2020: '2020_Menu.jpeg',
      2021: '2021_Menu.jpeg',
      2022: '2022_Menu.jpeg',
      2023: '2023_Menu.jpeg',
      2024: '2024_Menu.jpeg',
      2025: '2025_Menu.jpeg'
    };
    
    for (const event of events) {
      try {
        const year = event.event_date.getFullYear();
        const expectedFilename = expectedFilenames[year];
        
        if (!expectedFilename) {
          console.warn(`⚠️  No expected filename for year ${year}`);
          continue;
        }
        
        // Check if the filename needs to be updated
        if (event.menu_image_filename !== expectedFilename) {
          console.log(`🔄 Updating ${event.event_name}: ${event.menu_image_filename} → ${expectedFilename}`);
          
          await prisma.event.update({
            where: { event_id: event.event_id },
            data: { menu_image_filename: expectedFilename }
          });
          
          updatedCount++;
        } else {
          console.log(`✅ ${event.event_name}: ${event.menu_image_filename} (already correct)`);
        }
        
      } catch (error) {
        console.error(`❌ Error updating ${event.event_name}:`, error);
        errorCount++;
      }
    }
    
    console.log('\n📊 Summary:');
    console.log('===========');
    console.log(`✅ Updated: ${updatedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📊 Total events: ${events.length}`);
    
    if (updatedCount > 0) {
      console.log('\n🎉 Database filenames updated successfully!');
      console.log('📋 Next steps:');
      console.log('1. Check the test environment to see if images are now displaying');
      console.log('2. If still not working, restart the Railway service');
    } else {
      console.log('\n✅ All filenames are already correct!');
    }
    
  } catch (error) {
    console.error('❌ Error fixing menu filenames:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  fixMenuFilenames();
}

export default fixMenuFilenames;
