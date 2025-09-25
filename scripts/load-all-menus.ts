/**
 * Load All Thanksgiving Menus Script
 * Creates Thanksgiving events for all menu images in the public/images directory
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function loadAllMenus() {
  console.log('🔄 Loading all Thanksgiving menus...');

  try {
    // Get list of menu images
    const imagesDir = path.join(__dirname, '../public/images');
    const imageFiles = fs.readdirSync(imagesDir)
      .filter(file => file.endsWith('.jpeg') || file.endsWith('.png'))
      .sort();

    console.log(`📁 Found ${imageFiles.length} menu images`);

    // Clear existing events
    console.log('🗑️ Clearing existing events...');
    await prisma.event.deleteMany();

    // Insert all menus
    const menus = [];
    
    for (const imageFile of imageFiles) {
      const yearStr = imageFile.split('_')[0];
      if (!yearStr) continue;
      
      const year = parseInt(yearStr);
      const eventName = `Thanksgiving ${year}`;
      const eventDate = getThanksgivingDate(year);
      const description = getMenuDescription(year);
      const menuTitle = `Thanksgiving Menu ${year}`;
      
      const menu = {
        event_name: eventName,
        event_type: 'Thanksgiving',
        event_location: 'Family Home',
        event_date: eventDate,
        event_description: description,
        menu_title: menuTitle,
        menu_image_filename: imageFile
      };
      
      menus.push(menu);
    }

    // Insert menus in batches
    console.log('📝 Inserting menus...');
    for (const menu of menus) {
      await prisma.event.create({
        data: menu
      });
      console.log(`✅ Added ${menu.event_name}`);
    }

    console.log(`🎉 Successfully loaded ${menus.length} Thanksgiving menus!`);
    
    // Show summary
    const count = await prisma.event.count();
    console.log(`📊 Total menus in database: ${count}`);

  } catch (error) {
    console.error('❌ Error loading menus:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

function getThanksgivingDate(year: number): Date {
  // Thanksgiving is the 4th Thursday of November
  const november = new Date(year, 10, 1); // November 1st
  const firstThursday = november.getDay() === 4 ? 1 : (4 - november.getDay() + 7) % 7 + 1;
  const thanksgivingDate = new Date(year, 10, firstThursday + 21); // 4th Thursday
  return thanksgivingDate;
}

function getMenuDescription(year: number): string {
  const descriptions = [
    'A traditional Thanksgiving feast with family and friends',
    'Annual Thanksgiving celebration with classic dishes',
    'Thanksgiving dinner featuring Grandma\'s favorite recipes',
    'A wonderful Thanksgiving gathering with loved ones',
    'Traditional Thanksgiving meal with all the trimmings',
    'Thanksgiving celebration with family traditions',
    'Annual Thanksgiving feast celebrating gratitude',
    'Thanksgiving dinner with classic family recipes',
    'A memorable Thanksgiving celebration',
    'Traditional Thanksgiving gathering with family',
    'Thanksgiving feast with Grandma\'s recipes',
    'Annual Thanksgiving celebration',
    'Thanksgiving dinner with family and friends',
    'A special Thanksgiving gathering',
    'Traditional Thanksgiving meal',
    'Thanksgiving celebration with loved ones',
    'Annual Thanksgiving feast',
    'Thanksgiving dinner with family traditions',
    'A wonderful Thanksgiving gathering',
    'Traditional Thanksgiving celebration',
    'Thanksgiving feast with family',
    'Annual Thanksgiving meal',
    'Thanksgiving dinner celebration',
    'A memorable Thanksgiving feast',
    'Traditional Thanksgiving gathering',
    'Thanksgiving celebration with family',
    'Annual Thanksgiving dinner',
    'Thanksgiving feast with loved ones',
    'A special Thanksgiving meal',
    'Traditional Thanksgiving celebration'
  ];
  
  return descriptions[year % descriptions.length] || 'A traditional Thanksgiving celebration';
}

// Run the script
if (require.main === module) {
  loadAllMenus()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export default loadAllMenus;
