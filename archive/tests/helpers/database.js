const db = require('../../models');

// Database helper functions for testing
class DatabaseHelper {
  static async setup() {
    try {
      // Connect to test database
      await db.sequelize.authenticate();
      console.log('✅ Test database connection established');
      
      // Sync all models (create tables)
      await db.sequelize.sync({ force: true });
      console.log('✅ Test database tables created');
      
      // Insert test data
      await this.insertTestData();
      console.log('✅ Test data inserted');
      
    } catch (error) {
      console.error('❌ Database setup failed:', error);
      throw error;
    }
  }

  static async cleanup() {
    try {
      // Close database connection
      await db.sequelize.close();
      console.log('✅ Test database connection closed');
    } catch (error) {
      console.error('❌ Database cleanup failed:', error);
    }
  }

  static async insertTestData() {
    // Insert test events
    const testEvents = [
      {
        year: 2020,
        title: 'Thanksgiving 2020',
        description: 'Test Thanksgiving 2020',
        date: '2020-11-26',
        location: 'Test Location',
        host: 'Test Host',
        menu_items: JSON.stringify([
          { item: 'Turkey', category: 'Main Course' },
          { item: 'Mashed Potatoes', category: 'Side Dish' }
        ]),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        year: 2021,
        title: 'Thanksgiving 2021',
        description: 'Thanksgiving 2021',
        date: '2021-11-25',
        location: 'Test Location 2',
        host: 'Test Host 2',
        menu_items: JSON.stringify([
          { item: 'Ham', category: 'Main Course' },
          { item: 'Green Beans', category: 'Side Dish' }
        ]),
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await db.Event.bulkCreate(testEvents);

    // Insert test users
    const bcrypt = require('bcryptjs');
    const testUsers = [
      {
        username: 'testadmin',
        email: 'admin@test.com',
        password_hash: bcrypt.hashSync('password123', 10),
        role: 'admin',
        first_name: 'Test',
        last_name: 'Admin',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        username: 'testuser',
        email: 'user@test.com',
        password_hash: bcrypt.hashSync('password123', 10),
        role: 'user',
        first_name: 'Test',
        last_name: 'User',
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await db.User.bulkCreate(testUsers);

    // Insert test photos
    const testPhotos = [
      {
        photo_id: 1,
        event_id: 1,
        filename: 'test-photo-1.jpg',
        original_filename: 'test-photo-1.jpg',
        description: 'Test photo 1',
        caption: 'Test caption 1',
        taken_date: new Date(),
        file_size: 1024000,
        mime_type: 'image/jpeg',
        file_path: '/uploads/test-photo-1.jpg',
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await db.Photo.bulkCreate(testPhotos);
  }

  static async clearDatabase() {
    try {
      await db.sequelize.sync({ force: true });
    } catch (error) {
      console.error('❌ Database clear failed:', error);
      throw error;
    }
  }
}

module.exports = DatabaseHelper;
