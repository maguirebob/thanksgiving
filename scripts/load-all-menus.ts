#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

interface MenuData {
  year: number;
  filename: string;
  eventName: string;
  eventType: string;
  eventLocation: string;
  eventDate: string;
  eventDescription: string;
  menuTitle: string;
}

// Define all available menu years and their details
const menuYears: MenuData[] = [
  { year: 1994, filename: '1994_Menu.png', eventName: 'Thanksgiving 1994', eventType: 'Thanksgiving', eventLocation: 'Family Home', eventDate: '1994-11-24', eventDescription: 'A special Thanksgiving gathering in 1994', menuTitle: 'Thanksgiving Menu 1994' },
  { year: 1997, filename: '1997_Menu.jpeg', eventName: 'Thanksgiving 1997', eventType: 'Thanksgiving', eventLocation: 'Family Home', eventDate: '1997-11-27', eventDescription: 'A special Thanksgiving gathering in 1997', menuTitle: 'Thanksgiving Menu 1997' },
  { year: 1999, filename: '1999_Menu.jpeg', eventName: 'Thanksgiving 1999', eventType: 'Thanksgiving', eventLocation: 'Family Home', eventDate: '1999-11-25', eventDescription: 'A special Thanksgiving gathering in 1999', menuTitle: 'Thanksgiving Menu 1999' },
  { year: 2000, filename: '2000_Menu.jpeg', eventName: 'Thanksgiving 2000', eventType: 'Thanksgiving', eventLocation: 'Family Home', eventDate: '2000-11-23', eventDescription: 'A special Thanksgiving gathering in 2000', menuTitle: 'Thanksgiving Menu 2000' },
  { year: 2002, filename: '2002_Menu.jpeg', eventName: 'Thanksgiving 2002', eventType: 'Thanksgiving', eventLocation: 'Family Home', eventDate: '2002-11-28', eventDescription: 'A special Thanksgiving gathering in 2002', menuTitle: 'Thanksgiving Menu 2002' },
  { year: 2004, filename: '2004_Menu.jpeg', eventName: 'Thanksgiving 2004', eventType: 'Thanksgiving', eventLocation: 'Family Home', eventDate: '2004-11-25', eventDescription: 'A special Thanksgiving gathering in 2004', menuTitle: 'Thanksgiving Menu 2004' },
  { year: 2005, filename: '2005_Menu.jpeg', eventName: 'Thanksgiving 2005', eventType: 'Thanksgiving', eventLocation: 'Family Home', eventDate: '2005-11-24', eventDescription: 'A special Thanksgiving gathering in 2005', menuTitle: 'Thanksgiving Menu 2005' },
  { year: 2006, filename: '2006_Menu.jpeg', eventName: 'Thanksgiving 2006', eventType: 'Thanksgiving', eventLocation: 'Family Home', eventDate: '2006-11-23', eventDescription: 'A special Thanksgiving gathering in 2006', menuTitle: 'Thanksgiving Menu 2006' },
  { year: 2007, filename: '2007_Menu.jpeg', eventName: 'Thanksgiving 2007', eventType: 'Thanksgiving', eventLocation: 'Family Home', eventDate: '2007-11-22', eventDescription: 'A special Thanksgiving gathering in 2007', menuTitle: 'Thanksgiving Menu 2007' },
  { year: 2008, filename: '2008_Menu.jpeg', eventName: 'Thanksgiving 2008', eventType: 'Thanksgiving', eventLocation: 'Family Home', eventDate: '2008-11-27', eventDescription: 'A special Thanksgiving gathering in 2008', menuTitle: 'Thanksgiving Menu 2008' },
  { year: 2009, filename: '2009_Menu.jpeg', eventName: 'Thanksgiving 2009', eventType: 'Thanksgiving', eventLocation: 'Family Home', eventDate: '2009-11-26', eventDescription: 'A special Thanksgiving gathering in 2009', menuTitle: 'Thanksgiving Menu 2009' },
  { year: 2010, filename: '2010_Menu.jpeg', eventName: 'Thanksgiving 2010', eventType: 'Thanksgiving', eventLocation: 'Family Home', eventDate: '2010-11-25', eventDescription: 'A special Thanksgiving gathering in 2010', menuTitle: 'Thanksgiving Menu 2010' },
  { year: 2011, filename: '2011_Menu.jpeg', eventName: 'Thanksgiving 2011', eventType: 'Thanksgiving', eventLocation: 'Family Home', eventDate: '2011-11-24', eventDescription: 'A special Thanksgiving gathering in 2011', menuTitle: 'Thanksgiving Menu 2011' },
  { year: 2012, filename: '2012_Menu.jpeg', eventName: 'Thanksgiving 2012', eventType: 'Thanksgiving', eventLocation: 'Family Home', eventDate: '2012-11-22', eventDescription: 'A special Thanksgiving gathering in 2012', menuTitle: 'Thanksgiving Menu 2012' },
  { year: 2013, filename: '2013_Menu.jpeg', eventName: 'Thanksgiving 2013', eventType: 'Thanksgiving', eventLocation: 'Family Home', eventDate: '2013-11-28', eventDescription: 'A special Thanksgiving gathering in 2013', menuTitle: 'Thanksgiving Menu 2013' },
  { year: 2014, filename: '2014_Menu.jpeg', eventName: 'Thanksgiving 2014', eventType: 'Thanksgiving', eventLocation: 'Family Home', eventDate: '2014-11-27', eventDescription: 'A special Thanksgiving gathering in 2014', menuTitle: 'Thanksgiving Menu 2014' },
  { year: 2015, filename: '2015_Menu.jpeg', eventName: 'Thanksgiving 2015', eventType: 'Thanksgiving', eventLocation: 'Family Home', eventDate: '2015-11-26', eventDescription: 'A special Thanksgiving gathering in 2015', menuTitle: 'Thanksgiving Menu 2015' },
  { year: 2016, filename: '2016_Menu.jpeg', eventName: 'Thanksgiving 2016', eventType: 'Thanksgiving', eventLocation: 'Family Home', eventDate: '2016-11-24', eventDescription: 'A special Thanksgiving gathering in 2016', menuTitle: 'Thanksgiving Menu 2016' },
  { year: 2017, filename: '2017_Menu.jpeg', eventName: 'Thanksgiving 2017', eventType: 'Thanksgiving', eventLocation: 'Family Home', eventDate: '2017-11-23', eventDescription: 'A special Thanksgiving gathering in 2017', menuTitle: 'Thanksgiving Menu 2017' },
  { year: 2018, filename: '2018_Menu.jpeg', eventName: 'Thanksgiving 2018', eventType: 'Thanksgiving', eventLocation: 'Family Home', eventDate: '2018-11-22', eventDescription: 'A special Thanksgiving gathering in 2018', menuTitle: 'Thanksgiving Menu 2018' },
  { year: 2019, filename: '2019_Menu.jpeg', eventName: 'Thanksgiving 2019', eventType: 'Thanksgiving', eventLocation: 'Family Home', eventDate: '2019-11-28', eventDescription: 'A special Thanksgiving gathering in 2019', menuTitle: 'Thanksgiving Menu 2019' },
  { year: 2020, filename: '2020_Menu.jpeg', eventName: 'Thanksgiving 2020', eventType: 'Thanksgiving', eventLocation: 'Family Home', eventDate: '2020-11-26', eventDescription: 'A special Thanksgiving gathering in 2020', menuTitle: 'Thanksgiving Menu 2020' },
  { year: 2021, filename: '2021_Menu.jpeg', eventName: 'Thanksgiving 2021', eventType: 'Thanksgiving', eventLocation: 'Family Home', eventDate: '2021-11-25', eventDescription: 'A special Thanksgiving gathering in 2021', menuTitle: 'Thanksgiving Menu 2021' },
  { year: 2022, filename: '2022_Menu.jpeg', eventName: 'Thanksgiving 2022', eventType: 'Thanksgiving', eventLocation: 'Family Home', eventDate: '2022-11-24', eventDescription: 'A special Thanksgiving gathering in 2022', menuTitle: 'Thanksgiving Menu 2022' },
  { year: 2023, filename: '2023_Menu.jpeg', eventName: 'Thanksgiving 2023', eventType: 'Thanksgiving', eventLocation: 'Family Home', eventDate: '2023-11-23', eventDescription: 'A special Thanksgiving gathering in 2023', menuTitle: 'Thanksgiving Menu 2023' },
  { year: 2024, filename: '2024_Menu.jpeg', eventName: 'Thanksgiving 2024', eventType: 'Thanksgiving', eventLocation: 'Family Home', eventDate: '2024-11-28', eventDescription: 'A special Thanksgiving gathering in 2024', menuTitle: 'Thanksgiving Menu 2024' }
];

async function loadAllMenus(forceReload: boolean = false) {
  try {
    console.log('🚀 Starting to load all Thanksgiving menus...');
    console.log(`📊 Environment: ${process.env['NODE_ENV'] || 'development'}`);
    console.log(`🔄 Force reload: ${forceReload ? 'Yes' : 'No'}`);
    
    // Check if images directory exists
    const imagesDir = path.join(process.cwd(), 'public', 'images');
    if (!fs.existsSync(imagesDir)) {
      console.error('❌ Images directory not found:', imagesDir);
      process.exit(1);
    }

    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    let updatedCount = 0;

    for (const menu of menuYears) {
      try {
        // Check if image file exists
        const imagePath = path.join(imagesDir, menu.filename);
        if (!fs.existsSync(imagePath)) {
          console.warn(`⚠️  Image file not found: ${menu.filename}`);
          errorCount++;
          continue;
        }

        // Check if event already exists
        const existingEvent = await prisma.event.findFirst({
          where: {
            event_name: menu.eventName
          }
        });

        if (existingEvent && !forceReload) {
          console.log(`⏭️  Skipping ${menu.eventName} - already exists`);
          skippedCount++;
          continue;
        }

        if (existingEvent && forceReload) {
          // Update existing event
          const updatedEvent = await prisma.event.update({
            where: { event_id: existingEvent.event_id },
            data: {
              event_name: menu.eventName,
              event_type: menu.eventType,
              event_location: menu.eventLocation,
              event_date: new Date(menu.eventDate),
              event_description: menu.eventDescription,
              menu_title: menu.menuTitle,
              menu_image_filename: menu.filename
            }
          });
          console.log(`🔄 Updated ${menu.eventName} (ID: ${updatedEvent.event_id})`);
          updatedCount++;
        } else {
          // Create new event
          const event = await prisma.event.create({
            data: {
              event_name: menu.eventName,
              event_type: menu.eventType,
              event_location: menu.eventLocation,
              event_date: new Date(menu.eventDate),
              event_description: menu.eventDescription,
              menu_title: menu.menuTitle,
              menu_image_filename: menu.filename
            }
          });
          console.log(`✅ Created ${menu.eventName} (ID: ${event.event_id})`);
          createdCount++;
        }

      } catch (error) {
        console.error(`❌ Error processing ${menu.eventName}:`, error);
        errorCount++;
      }
    }

    // Summary
    console.log('\n📊 Summary:');
    console.log(`✅ Created: ${createdCount} events`);
    console.log(`🔄 Updated: ${updatedCount} events`);
    console.log(`⏭️  Skipped: ${skippedCount} events (already exist)`);
    console.log(`❌ Errors: ${errorCount} events`);
    console.log(`📈 Total processed: ${menuYears.length} menu years`);

    // Verify final count
    const totalEvents = await prisma.event.count();
    console.log(`\n🎯 Total events in database: ${totalEvents}`);

    if (createdCount > 0 || updatedCount > 0) {
      console.log('\n🎉 Menu loading completed successfully!');
    } else if (skippedCount === menuYears.length) {
      console.log('\n✨ All menus already loaded - nothing to do!');
    } else {
      console.log('\n⚠️  Some issues occurred during loading.');
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const forceReload = args.includes('--force') || args.includes('-f');

// Run the script
if (require.main === module) {
  loadAllMenus(forceReload);
}

export { loadAllMenus };