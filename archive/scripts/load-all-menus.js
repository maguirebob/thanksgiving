const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

async function loadAllMenus() {
  console.log('🔄 Loading all Thanksgiving menus...');
  
  // Get database URL from environment
  const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error('POSTGRES_URL environment variable is required');
  }

  const client = new Client({
    connectionString: databaseUrl,
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Get list of menu images
    const imagesDir = path.join(__dirname, '../public/images');
    const imageFiles = fs.readdirSync(imagesDir)
      .filter(file => file.endsWith('.jpeg') || file.endsWith('.png'))
      .sort();

    console.log(`📁 Found ${imageFiles.length} menu images`);

    // Clear existing events (except the ones we already have)
    console.log('🗑️ Clearing existing events...');
    await client.query('DELETE FROM "Events"');

    // Insert all menus
    const menus = [];
    
    for (const imageFile of imageFiles) {
      const year = parseInt(imageFile.split('_')[0]);
      const eventName = `Thanksgiving ${year}`;
      const eventDate = getThanksgivingDate(year);
      const description = getMenuDescription(year);
      
      const menu = {
        event_name: eventName,
        event_date: eventDate,
        description: description,
        menu_image_url: `/images/${imageFile}`
      };
      
      menus.push(menu);
    }

    // Insert menus in batches
    console.log('📝 Inserting menus...');
    for (const menu of menus) {
      await client.query(
        `INSERT INTO "Events" (event_name, event_date, description, menu_image_url) 
         VALUES ($1, $2, $3, $4)`,
        [menu.event_name, menu.event_date, menu.description, menu.menu_image_url]
      );
      console.log(`✅ Added ${menu.event_name}`);
    }

    console.log(`🎉 Successfully loaded ${menus.length} Thanksgiving menus!`);
    
    // Show summary
    const result = await client.query('SELECT COUNT(*) as count FROM "Events"');
    console.log(`📊 Total menus in database: ${result.rows[0].count}`);

  } catch (error) {
    console.error('❌ Error loading menus:', error);
    throw error;
  } finally {
    await client.end();
  }
}

function getThanksgivingDate(year) {
  // Thanksgiving is the 4th Thursday of November
  const november = new Date(year, 10, 1); // November 1st
  const firstThursday = november.getDay() === 4 ? 1 : (4 - november.getDay() + 7) % 7 + 1;
  const thanksgivingDate = new Date(year, 10, firstThursday + 21); // 4th Thursday
  return thanksgivingDate.toISOString().split('T')[0];
}

function getMenuDescription(year) {
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
  
  return descriptions[year % descriptions.length];
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

module.exports = loadAllMenus;
