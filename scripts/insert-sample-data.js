require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');

// Database configuration
const config = {
  username: process.env.PGUSER || process.env.DB_USER,
  password: process.env.PGPASSWORD || process.env.DB_PASSWORD,
  database: process.env.PGDATABASE || process.env.DB_NAME,
  host: process.env.PGHOST || process.env.DB_HOST,
  port: process.env.PGPORT || process.env.DB_PORT || 5432,
  dialect: 'postgres',
  logging: false,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  port: config.port,
  dialect: config.dialect,
  logging: config.logging,
  ssl: config.ssl,
});

// Define the Event model
const Event = sequelize.define('Event', {
  event_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  event_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  event_type: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  event_location: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  event_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  event_description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  menu_title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  menu_image_filename: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
}, {
  tableName: 'Events',
  timestamps: false,
});

// Sample data
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
    event_name: 'Thanksgiving Dinner 1997',
    event_type: 'Thanksgiving',
    event_location: 'Canajoharie, NY',
    event_date: '1997-11-27',
    event_description: 'This dinner was at my parents house in Canajoharie, NY',
    menu_title: 'Thanksgiving 1997',
    menu_image_filename: '1997_Menu.jpeg'
  },
  {
    event_name: 'Thanksgiving Dinner 1999',
    event_type: 'Thanksgiving',
    event_location: 'Canajoharie, NY',
    event_date: '1999-11-25',
    event_description: 'This dinner was at my parents house in Canajoharie, NY',
    menu_title: 'Thanksgiving 1999',
    menu_image_filename: '1999_Menu.jpeg'
  },
  {
    event_name: 'Thanksgiving Dinner 2000',
    event_type: 'Thanksgiving',
    event_location: 'Canajoharie, NY',
    event_date: '2000-11-23',
    event_description: 'This dinner was at my parents house in Canajoharie, NY',
    menu_title: 'Thanksgiving 2000',
    menu_image_filename: '2000_Menu.jpeg'
  },
  {
    event_name: 'Thanksgiving Dinner 2002',
    event_type: 'Thanksgiving',
    event_location: 'Canajoharie, NY',
    event_date: '2002-11-28',
    event_description: 'This dinner was at my parents house in Canajoharie, NY',
    menu_title: 'Thanksgiving 2002',
    menu_image_filename: '2002_Menu.jpeg'
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
    event_description: 'This dinner was at Bob and Tricia\'s house in Middletown, NJ',
    menu_title: 'Thanksgiving 2005',
    menu_image_filename: '2005_Menu.jpeg'
  },
  {
    event_name: 'Thanksgiving Dinner 2006',
    event_type: 'Thanksgiving',
    event_location: 'Middletown, NJ',
    event_date: '2006-11-23',
    event_description: 'This dinner was at Bob and Tricia\'s house in Middletown, NJ',
    menu_title: 'Thanksgiving 2006',
    menu_image_filename: '2006_Menu.jpeg'
  },
  {
    event_name: 'Thanksgiving Dinner 2007',
    event_type: 'Thanksgiving',
    event_location: 'Middletown, NJ',
    event_date: '2007-11-22',
    event_description: 'This dinner was at Bob and Tricia\'s house in Middletown, NJ',
    menu_title: 'Thanksgiving 2007',
    menu_image_filename: '2007_Menu.jpeg'
  },
  {
    event_name: 'Thanksgiving Dinner 2008',
    event_type: 'Thanksgiving',
    event_location: 'Middletown, NJ',
    event_date: '2008-11-27',
    event_description: 'This dinner was at Bob and Tricia\'s house in Middletown, NJ',
    menu_title: 'Thanksgiving 2008',
    menu_image_filename: '2008_Menu.jpeg'
  },
  {
    event_name: 'Thanksgiving Dinner 2009',
    event_type: 'Thanksgiving',
    event_location: 'Middletown, NJ',
    event_date: '2009-11-26',
    event_description: 'This dinner was at Bob and Tricia\'s house in Middletown, NJ',
    menu_title: 'Thanksgiving 2009',
    menu_image_filename: '2009_Menu.jpeg'
  },
  {
    event_name: 'Thanksgiving Dinner 2010',
    event_type: 'Thanksgiving',
    event_location: 'Middletown, NJ',
    event_date: '2010-11-25',
    event_description: 'This dinner was at Bob and Tricia\'s house in Middletown, NJ',
    menu_title: 'Thanksgiving 2010',
    menu_image_filename: '2010_Menu.jpeg'
  },
  {
    event_name: 'Thanksgiving Dinner 2011',
    event_type: 'Thanksgiving',
    event_location: 'Middletown, NJ',
    event_date: '2011-11-24',
    event_description: 'This dinner was at Bob and Tricia\'s house in Middletown, NJ',
    menu_title: 'Thanksgiving 2011',
    menu_image_filename: '2011_Menu.jpeg'
  },
  {
    event_name: 'Thanksgiving Dinner 2012',
    event_type: 'Thanksgiving',
    event_location: 'Middletown, NJ',
    event_date: '2012-11-22',
    event_description: 'This dinner was at Bob and Tricia\'s house in Middletown, NJ',
    menu_title: 'Thanksgiving 2012',
    menu_image_filename: '2012_Menu.jpeg'
  },
  {
    event_name: 'Thanksgiving Dinner 2013',
    event_type: 'Thanksgiving',
    event_location: 'Middletown, NJ',
    event_date: '2013-11-28',
    event_description: 'This dinner was at Bob and Tricia\'s house in Middletown, NJ',
    menu_title: 'Thanksgiving 2013',
    menu_image_filename: '2013_Menu.jpeg'
  },
  {
    event_name: 'Thanksgiving Dinner 2014',
    event_type: 'Thanksgiving',
    event_location: 'Middletown, NJ',
    event_date: '2014-11-27',
    event_description: 'This dinner was at Bob and Tricia\'s house in Middletown, NJ',
    menu_title: 'Thanksgiving 2014',
    menu_image_filename: '2014_Menu.jpeg'
  },
  {
    event_name: 'Thanksgiving Dinner 2015',
    event_type: 'Thanksgiving',
    event_location: 'Middletown, NJ',
    event_date: '2015-11-26',
    event_description: 'This dinner was at Bob and Tricia\'s house in Middletown, NJ',
    menu_title: 'Thanksgiving 2015',
    menu_image_filename: '2015_Menu.jpeg'
  },
  {
    event_name: 'Thanksgiving Dinner 2016',
    event_type: 'Thanksgiving',
    event_location: 'Middletown, NJ',
    event_date: '2016-11-24',
    event_description: 'This dinner was at Bob and Tricia\'s house in Middletown, NJ',
    menu_title: 'Thanksgiving 2016',
    menu_image_filename: '2016_Menu.jpeg'
  },
  {
    event_name: 'Thanksgiving Dinner 2017',
    event_type: 'Thanksgiving',
    event_location: 'Middletown, NJ',
    event_date: '2017-11-23',
    event_description: 'This dinner was at Bob and Tricia\'s house in Middletown, NJ',
    menu_title: 'Thanksgiving 2017',
    menu_image_filename: '2017_Menu.jpeg'
  },
  {
    event_name: 'Thanksgiving Dinner 2018',
    event_type: 'Thanksgiving',
    event_location: 'Middletown, NJ',
    event_date: '2018-11-22',
    event_description: 'This dinner was at Bob and Tricia\'s house in Middletown, NJ',
    menu_title: 'Thanksgiving 2018',
    menu_image_filename: '2018_Menu.jpeg'
  },
  {
    event_name: 'Thanksgiving Dinner 2019',
    event_type: 'Thanksgiving',
    event_location: 'Middletown, NJ',
    event_date: '2019-11-28',
    event_description: 'This dinner was at Bob and Tricia\'s house in Middletown, NJ',
    menu_title: 'Thanksgiving 2019',
    menu_image_filename: '2019_Menu.jpeg'
  },
  {
    event_name: 'Thanksgiving Dinner 2020',
    event_type: 'Thanksgiving',
    event_location: 'Middletown, NJ',
    event_date: '2020-11-26',
    event_description: 'This dinner was at Bob and Tricia\'s house in Middletown, NJ',
    menu_title: 'Thanksgiving 2020',
    menu_image_filename: '2020_Menu.jpeg'
  },
  {
    event_name: 'Thanksgiving Dinner 2021',
    event_type: 'Thanksgiving',
    event_location: 'Middletown, NJ',
    event_date: '2021-11-25',
    event_description: 'This dinner was at Bob and Tricia\'s house in Middletown, NJ',
    menu_title: 'Thanksgiving 2021',
    menu_image_filename: '2021_Menu.jpeg'
  },
  {
    event_name: 'Thanksgiving Dinner 2022',
    event_type: 'Thanksgiving',
    event_location: 'Middletown, NJ',
    event_date: '2022-11-24',
    event_description: 'This dinner was at Bob and Tricia\'s house in Middletown, NJ',
    menu_title: 'Thanksgiving 2022',
    menu_image_filename: '2022_Menu.jpeg'
  },
  {
    event_name: 'Thanksgiving Dinner 2023',
    event_type: 'Thanksgiving',
    event_location: 'Middletown, NJ',
    event_date: '2023-11-23',
    event_description: 'This dinner was at Bob and Tricia\'s house in Middletown, NJ',
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

async function insertSampleData() {
  try {
    console.log('🔌 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Sync the model with the database
    await Event.sync({ force: false });
    console.log('✅ Event model synced with database.');

    // Check if data already exists
    const existingCount = await Event.count();
    console.log(`📊 Current records in Events table: ${existingCount}`);

    if (existingCount > 0) {
      console.log('⚠️  Data already exists. Clearing existing data...');
      await Event.destroy({ where: {}, truncate: true });
      console.log('✅ Existing data cleared.');
    }

    // Insert sample data
    console.log('📝 Inserting sample data...');
    await Event.bulkCreate(sampleData);
    console.log(`✅ Successfully inserted ${sampleData.length} records.`);

    // Verify the data
    const finalCount = await Event.count();
    console.log(`📊 Final record count: ${finalCount}`);

    console.log('🎉 Sample data insertion completed successfully!');
  } catch (error) {
    console.error('❌ Error inserting sample data:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

insertSampleData();
