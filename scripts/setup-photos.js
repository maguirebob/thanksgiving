require('dotenv').config();
const db = require('../models');

async function setupPhotos() {
  try {
    console.log('🔄 Setting up Photos table...');
    
    // Test database connection
    await db.sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Sync all models (create tables if they don't exist)
    await db.sequelize.sync({ alter: true });
    console.log('✅ Photos table created/synced');
    
    // Check if we have any photos
    const photoCount = await db.Photo.count();
    console.log(`📊 Found ${photoCount} photos in database`);
    
    console.log('🎉 Photos setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  } finally {
    await db.sequelize.close();
  }
}

setupPhotos();



