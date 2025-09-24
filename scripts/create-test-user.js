const db = require('../models');
const bcrypt = require('bcryptjs');

async function createTestUser() {
  try {
    await db.sequelize.authenticate();
    console.log('Database connection established.');

    const testUsername = 'testuser';
    const testPassword = 'testpass123';
    const testEmail = 'test@thanksgiving.com';

    let testUser = await db.User.findOne({ where: { username: testUsername } });

    if (testUser) {
      console.log(`Test user already exists:`);
    } else {
      console.log('Creating test user...');
      const hashedPassword = await bcrypt.hash(testPassword, 10);
      testUser = await db.User.create({
        username: testUsername,
        email: testEmail,
        password_hash: hashedPassword, // Corrected field name
        role: 'user',
        first_name: 'Test',
        last_name: 'User'
      });
      console.log('Test user created successfully!');
    }
    console.log(`Username: ${testUsername}`);
    console.log(`Password: ${testPassword}`);
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await db.sequelize.close();
  }
}

createTestUser();
