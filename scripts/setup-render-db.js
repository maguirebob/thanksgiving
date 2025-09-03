const { Event, sequelize } = require('../models');
require('dotenv').config();

const sampleData = [
  {
    event_name: 'Thanksgiving Dinner 1994',
    event_type: 'Thanksgiving',
    event_location: 'Canajoharie, NY',
    event_date: '1994-11-24',
    event_description: 'First Thanksgiving Dinner that we have menu for at my parents house in Canajoharie, NY',
    menu_title: 'Maguire Family Dinner 1994',
    menu_image_filename: '1994_Menu.png'
  },
  {
    event_name: 'Thanksgiving Dinner 1995',
    event_type: 'Thanksgiving',
    event_location: 'Canajoharie, NY',
    event_date: '1995-11-23',
    event_description: 'Thanksgiving at my parents house in Canajoharie, NY',
    menu_title: 'Maguire Family Dinner 1995',
    menu_image_filename: '1995_Menu.png'
  },
  {
    event_name: 'Thanksgiving Dinner 1996',
    event_type: 'Thanksgiving',
    event_location: 'Canajoharie, NY',
    event_date: '1996-11-28',
    event_description: 'Thanksgiving at my parents house in Canajoharie, NY',
    menu_title: 'Maguire Family Dinner 1996',
    menu_image_filename: '1996_Menu.png'
  },
  {
    event_name: 'Thanksgiving Dinner 1997',
    event_type: 'Thanksgiving',
    event_location: 'Canajoharie, NY',
    event_date: '1997-11-27',
    event_description: 'Thanksgiving at my parents house in Canajoharie, NY',
    menu_title: 'Maguire Family Dinner 1997',
    menu_image_filename: '1997_Menu.png'
  },
  {
    event_name: 'Thanksgiving Dinner 1998',
    event_type: 'Thanksgiving',
    event_location: 'Canajoharie, NY',
    event_date: '1998-11-26',
    event_description: 'Thanksgiving at my parents house in Canajoharie, NY',
    menu_title: 'Maguire Family Dinner 1998',
    menu_image_filename: '1998_Menu.png'
  },
  {
    event_name: 'Thanksgiving Dinner 1999',
    event_type: 'Thanksgiving',
    event_location: 'Canajoharie, NY',
    event_date: '1999-11-25',
    event_description: 'Thanksgiving at my parents house in Canajoharie, NY',
    menu_title: 'Maguire Family Dinner 1999',
    menu_image_filename: '1999_Menu.png'
  },
  {
    event_name: 'Thanksgiving Dinner 2000',
    event_type: 'Thanksgiving',
    event_location: 'Canajoharie, NY',
    event_date: '2000-11-23',
    event_description: 'Thanksgiving at my parents house in Canajoharie, NY',
    menu_title: 'Maguire Family Dinner 2000',
    menu_image_filename: '2000_Menu.png'
  },
  {
    event_name: 'Thanksgiving Dinner 2001',
    event_type: 'Thanksgiving',
    event_location: 'Canajoharie, NY',
    event_date: '2001-11-22',
    event_description: 'Thanksgiving at my parents house in Canajoharie, NY',
    menu_title: 'Maguire Family Dinner 2001',
    menu_image_filename: '2001_Menu.png'
  },
  {
    event_name: 'Thanksgiving Dinner 2002',
    event_type: 'Thanksgiving',
    event_location: 'Canajoharie, NY',
    event_date: '2002-11-28',
    event_description: 'Thanksgiving at my parents house in Canajoharie, NY',
    menu_title: 'Maguire Family Dinner 2002',
    menu_image_filename: '2002_Menu.png'
  },
  {
    event_name: 'Thanksgiving Dinner 2003',
    event_type: 'Thanksgiving',
    event_location: 'Canajoharie, NY',
    event_date: '2003-11-27',
    event_description: 'Thanksgiving at my parents house in Canajoharie, NY',
    menu_title: 'Maguire Family Dinner 2003',
    menu_image_filename: '2003_Menu.png'
  },
  {
    event_name: 'Thanksgiving Dinner 2004',
    event_type: 'Thanksgiving',
    event_location: 'Middletown, NJ',
    event_date: '2004-11-25',
    event_description: 'This dinner was at Bob and Tricia\'s house in Middletown, NJ',
    menu_title: 'Thanksgiving 2004',
    menu_image_filename: '2004_Menu.jpeg'
  },
  {
    event_name: 'Thanksgiving Dinner 2005',
    event_type: 'Thanksgiving',
    event_location: 'Middletown, NJ',
    event_date: '2005-11-24',
    event_description: 'Thanksgiving at Bob and Tricia\'s house in Middletown, NJ',
    menu_title: 'Thanksgiving 2005',
    menu_image_filename: '2005_Menu.jpeg'
  },
  {
    event_name: 'Thanksgiving Dinner 2006',
    event_type: 'Thanksgiving',
    event_location: 'Middletown, NJ',
    event_date: '2006-11-23',
    event_description: 'Thanksgiving at Bob and Tricia\'s house in Middletown, NJ',
    menu_title: 'Thanksgiving 2006',
    menu_image_filename: '2006_Menu.jpeg'
  },
  {
    event_name: 'Thanksgiving Dinner 2007',
    event_type: 'Thanksgiving',
    event_location: 'Middletown, NJ',
    event_date: '2007-11-22',
    event_description: 'Thanksgiving at Bob and Tricia\'s house in Middletown, NJ',
    menu_title: 'Thanksgiving 2007',
    menu_image_filename: '2007_Menu.jpeg'
  },
  {
    event_name: 'Thanksgiving Dinner 2008',
    event_type: 'Thanksgiving',
    event_location: 'Middletown, NJ',
    event_date: '2008-11-27',
    event_description: 'Thanksgiving at Bob and Tricia\'s house in Middletown, NJ',
    menu_title: 'Thanksgiving 2008',
    menu_image_filename: '2008_Menu.jpeg'
  },
  {
    event_name: 'Thanksgiving Dinner 2009',
    event_type: 'Thanksgiving',
    event_location: 'Middletown, NJ',
    event_date: '2009-11-26',
    event_description: 'Thanksgiving at Bob and Tricia\'s house in Middletown, NJ',
    menu_title: 'Thanksgiving 2009',
    menu_image_filename: '2009_Menu.jpeg'
  },
  {
    event_name: 'Thanksgiving Dinner 2010',
    event_type: 'Thanksgiving',
    event_location: 'Middletown, NJ',
    event_date: '2010-11-25',
    event_description: 'Thanksgiving at Bob and Tricia\'s house in Middletown, NJ',
    menu_title: 'Thanksgiving 2010',
    menu_image_filename: '2010_Menu.jpeg'
  },
  {
    event_name: 'Thanksgiving Dinner 2011',
    event_type: 'Thanksgiving',
    event_location: 'Middletown, NJ',
    event_date: '2011-11-24',
    event_description: 'Thanksgiving at Bob and Tricia\'s house in Middletown, NJ',
    menu_title: 'Thanksgiving 2011',
    menu_image_filename: '2011_Menu.jpeg'
  },
  {
    event_name: 'Thanksgiving Dinner 2012',
    event_type: 'Thanksgiving',
    event_location: 'Middletown, NJ',
    event_date: '2012-11-22',
    event_description: 'Thanksgiving at Bob and Tricia\'s house in Middletown, NJ',
    menu_title: 'Thanksgiving 2012',
    menu_image_filename: '2012_Menu.jpeg'
  },
  {
    event_name: 'Thanksgiving Dinner 2013',
    event_type: 'Thanksgiving',
    event_location: 'Middletown, NJ',
    event_date: '2013-11-28',
    event_description: 'Thanksgiving at Bob and Tricia\'s house in Middletown, NJ',
    menu_title: 'Thanksgiving 2013',
    menu_image_filename: '2013_Menu.jpeg'
  },
  {
    event_name: 'Thanksgiving Dinner 2014',
    event_type: 'Thanksgiving',
    event_location: 'Middletown, NJ',
    event_date: '2014-11-27',
    event_description: 'Thanksgiving at Bob and Tricia\'s house in Middletown, NJ',
    menu_title: 'Thanksgiving 2014',
    menu_image_filename: '2014_Menu.jpeg'
  },
  {
    event_name: 'Thanksgiving Dinner 2015',
    event_type: 'Thanksgiving',
    event_location: 'Middletown, NJ',
    event_date: '2015-11-26',
    event_description: 'Thanksgiving at Bob and Tricia\'s house in Middletown, NJ',
    menu_title: 'Thanksgiving 2015',
    menu_image_filename: '2015_Menu.jpeg'
  },
  {
    event_name: 'Thanksgiving Dinner 2016',
    event_type: 'Thanksgiving',
    event_location: 'Middletown, NJ',
    event_date: '2016-11-24',
    event_description: 'Thanksgiving at Bob and Tricia\'s house in Middletown, NJ',
    menu_title: 'Thanksgiving 2016',
    menu_image_filename: '2016_Menu.jpeg'
  },
  {
    event_name: 'Thanksgiving Dinner 2017',
    event_type: 'Thanksgiving',
    event_location: 'Middletown, NJ',
    event_date: '2017-11-23',
    event_description: 'Thanksgiving at Bob and Tricia\'s house in Middletown, NJ',
    menu_title: 'Thanksgiving 2017',
    menu_image_filename: '2017_Menu.jpeg'
  },
  {
    event_name: 'Thanksgiving Dinner 2018',
    event_type: 'Thanksgiving',
    event_location: 'Middletown, NJ',
    event_date: '2018-11-22',
    event_description: 'Thanksgiving at Bob and Tricia\'s house in Middletown, NJ',
    menu_title: 'Thanksgiving 2018',
    menu_image_filename: '2018_Menu.jpeg'
  },
  {
    event_name: 'Thanksgiving Dinner 2019',
    event_type: 'Thanksgiving',
    event_location: 'Middletown, NJ',
    event_date: '2019-11-28',
    event_description: 'Thanksgiving at Bob and Tricia\'s house in Middletown, NJ',
    menu_title: 'Thanksgiving 2019',
    menu_image_filename: '2019_Menu.jpeg'
  },
  {
    event_name: 'Thanksgiving Dinner 2020',
    event_type: 'Thanksgiving',
    event_location: 'Middletown, NJ',
    event_date: '2020-11-26',
    event_description: 'Thanksgiving at Bob and Tricia\'s house in Middletown, NJ',
    menu_title: 'Thanksgiving 2020',
    menu_image_filename: '2020_Menu.jpeg'
  },
  {
    event_name: 'Thanksgiving Dinner 2021',
    event_type: 'Thanksgiving',
    event_location: 'Middletown, NJ',
    event_date: '2021-11-25',
    event_description: 'Thanksgiving at Bob and Tricia\'s house in Middletown, NJ',
    menu_title: 'Thanksgiving 2021',
    menu_image_filename: '2021_Menu.jpeg'
  },
  {
    event_name: 'Thanksgiving Dinner 2022',
    event_type: 'Thanksgiving',
    event_location: 'Middletown, NJ',
    event_date: '2022-11-24',
    event_description: 'Thanksgiving at Bob and Tricia\'s house in Middletown, NJ',
    menu_title: 'Thanksgiving 2022',
    menu_image_filename: '2022_Menu.jpeg'
  },
  {
    event_name: 'Thanksgiving Dinner 2023',
    event_type: 'Thanksgiving',
    event_location: 'Middletown, NJ',
    event_date: '2023-11-23',
    event_description: 'Thanksgiving at Bob and Tricia\'s house in Middletown, NJ',
    menu_title: 'Thanksgiving 2023',
    menu_image_filename: '2023_Menu.jpeg'
  },
  {
    event_name: 'Thanksgiving Dinner 2024',
    event_type: 'Thanksgiving',
    event_location: 'Middletown, NJ',
    event_date: '2024-11-28',
    event_description: 'This dinner was marked by the death of Tricia\'s Grandmother, Grandman Goodse',
    menu_title: 'Thanksgiving 2024',
    menu_image_filename: '2024_Menu.jpeg'
  }
];

async function setupRenderDatabase() {
  try {
    console.log('🔌 Connecting to Render database...');
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    console.log('🔄 Syncing database models...');
    await Event.sync({ alter: true });
    console.log('✅ Event model synced with database.');

    const currentCount = await Event.count();
    console.log(`📊 Current records in Events table: ${currentCount}`);

    if (currentCount === 0) {
      console.log('📝 Inserting sample data...');
      await Event.bulkCreate(sampleData, { ignoreDuplicates: true });
      console.log(`✅ Successfully inserted ${sampleData.length} records.`);
    } else {
      console.log('⚠️  Database already contains records. Skipping insertion.');
    }

    const finalCount = await Event.count();
    console.log(`📊 Final record count: ${finalCount}`);
    console.log('🎉 Render database setup completed successfully!');
  } catch (error) {
    console.error('❌ Error setting up Render database:', error.message);
    console.error('Full error:', error);
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  setupRenderDatabase();
}

module.exports = { setupRenderDatabase };
