const db = require('../../models');

describe('User Model - Case Insensitive Username (Simple)', () => {
  beforeAll(async () => {
    // Connect to test database
    await db.sequelize.authenticate();
    console.log('✅ Test database connection established');
    
    // Sync all models (create tables)
    await db.sequelize.sync({ force: true });
    console.log('✅ Test database tables created');
  });

  afterAll(async () => {
    // Close database connection
    await db.sequelize.close();
    console.log('✅ Test database connection closed');
  });

  beforeEach(async () => {
    // Clear all data
    await db.User.destroy({ where: {} });
  });

  describe('Case Insensitive Username Creation', () => {
    test('should create user with mixed case username', async () => {
      const userData = {
        username: 'TestUser123',
        username_lower: 'testuser123',
        email: 'test@example.com',
        password_hash: 'test_hash',
        first_name: 'Test',
        last_name: 'User'
      };

      const user = await db.User.create(userData);

      expect(user).toBeTruthy();
      expect(user.username).toBe('TestUser123');
      expect(user.username_lower).toBe('testuser123');
      expect(user.email).toBe('test@example.com');
    });

    test('should prevent duplicate usernames regardless of case', async () => {
      // Create first user
      await db.User.create({
        username: 'TestUser',
        username_lower: 'testuser',
        email: 'test1@example.com',
        password_hash: 'test_hash'
      });

      // Try to create user with different case - should fail due to unique constraint
      await expect(db.User.create({
        username: 'TESTUSER',
        username_lower: 'testuser', // Same username_lower
        email: 'test2@example.com',
        password_hash: 'test_hash'
      })).rejects.toThrow();
    });
  });

  describe('Case Insensitive Username Lookup', () => {
    beforeEach(async () => {
      // Create test user
      await db.User.create({
        username: 'TestUser',
        username_lower: 'testuser',
        email: 'test@example.com',
        password_hash: 'test_hash',
        first_name: 'Test',
        last_name: 'User'
      });
    });

    test('findByUsername should work with lowercase', async () => {
      const user = await db.User.findByUsername('testuser');
      expect(user).toBeTruthy();
      expect(user.username).toBe('TestUser');
    });

    test('findByUsername should work with uppercase', async () => {
      const user = await db.User.findByUsername('TESTUSER');
      expect(user).toBeTruthy();
      expect(user.username).toBe('TestUser');
    });

    test('findByUsername should work with mixed case', async () => {
      const user = await db.User.findByUsername('TestUser');
      expect(user).toBeTruthy();
      expect(user.username).toBe('TestUser');
    });

    test('findByUsername should work with random case', async () => {
      const user = await db.User.findByUsername('tEsTuSeR');
      expect(user).toBeTruthy();
      expect(user.username).toBe('TestUser');
    });

    test('findByUsername should return null for non-existent username', async () => {
      const user = await db.User.findByUsername('nonexistent');
      expect(user).toBeNull();
    });
  });

  describe('Case Insensitive Username Existence Check', () => {
    beforeEach(async () => {
      await db.User.create({
        username: 'TestUser',
        username_lower: 'testuser',
        email: 'test@example.com',
        password_hash: 'test_hash'
      });
    });

    test('usernameExists should return true for lowercase', async () => {
      const exists = await db.User.usernameExists('testuser');
      expect(exists).toBe(true);
    });

    test('usernameExists should return true for uppercase', async () => {
      const exists = await db.User.usernameExists('TESTUSER');
      expect(exists).toBe(true);
    });

    test('usernameExists should return true for mixed case', async () => {
      const exists = await db.User.usernameExists('TestUser');
      expect(exists).toBe(true);
    });

    test('usernameExists should return false for non-existent username', async () => {
      const exists = await db.User.usernameExists('nonexistent');
      expect(exists).toBe(false);
    });
  });

  describe('Case Insensitive Authentication', () => {
    beforeEach(async () => {
      // Create user with hashed password
      const password_hash = await db.User.hashPassword('password123');
      await db.User.create({
        username: 'TestUser',
        username_lower: 'testuser',
        email: 'test@example.com',
        password_hash: password_hash
      });
    });

    test('findByCredentials should work with lowercase username', async () => {
      const user = await db.User.findByCredentials('testuser', 'password123');
      expect(user).toBeTruthy();
      expect(user.username).toBe('TestUser');
    });

    test('findByCredentials should work with uppercase username', async () => {
      const user = await db.User.findByCredentials('TESTUSER', 'password123');
      expect(user).toBeTruthy();
      expect(user.username).toBe('TestUser');
    });

    test('findByCredentials should work with mixed case username', async () => {
      const user = await db.User.findByCredentials('TestUser', 'password123');
      expect(user).toBeTruthy();
      expect(user.username).toBe('TestUser');
    });

    test('findByCredentials should throw error for wrong password', async () => {
      await expect(db.User.findByCredentials('testuser', 'wrongpassword')).rejects.toThrow('Invalid credentials');
    });

    test('findByCredentials should throw error for non-existent username', async () => {
      await expect(db.User.findByCredentials('nonexistent', 'password123')).rejects.toThrow('Invalid credentials');
    });
  });
});
