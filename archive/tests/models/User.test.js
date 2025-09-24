const db = require('../../models');
const DatabaseHelper = require('../helpers/database');
const bcrypt = require('bcryptjs');

describe('User Model', () => {
  beforeAll(async () => {
    await DatabaseHelper.setup();
  });

  afterAll(async () => {
    await DatabaseHelper.cleanup();
  });

  beforeEach(async () => {
    await DatabaseHelper.clearDatabase();
  });

  describe('User Creation', () => {
    test('should create user with valid data', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password_hash: bcrypt.hashSync('password123', 10),
        role: 'user',
        first_name: 'Test',
        last_name: 'User'
      };

      const user = await db.User.create(userData);

      expect(user).toBeTruthy();
      expect(user.username).toBe('testuser');
      expect(user.email).toBe('test@example.com');
      expect(user.role).toBe('user');
      expect(user.first_name).toBe('Test');
      expect(user.last_name).toBe('User');
      expect(user.user_id).toBeDefined();
      expect(user.created_at).toBeDefined();
      expect(user.updated_at).toBeDefined();
    });

    test('should hash password before saving', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'plaintextpassword',
        role: 'user'
      };

      const user = await db.User.create(userData);

      expect(user.password_hash).not.toBe('plaintextpassword');
      expect(user.password_hash).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash pattern
    });

    test('should enforce unique username', async () => {
      const userData1 = {
        username: 'testuser',
        email: 'test1@example.com',
        password_hash: bcrypt.hashSync('password123', 10),
        role: 'user'
      };

      const userData2 = {
        username: 'testuser', // Same username
        email: 'test2@example.com',
        password_hash: bcrypt.hashSync('password123', 10),
        role: 'user'
      };

      await db.User.create(userData1);

      await expect(db.User.create(userData2)).rejects.toThrow();
    });

    test('should enforce unique email', async () => {
      const userData1 = {
        username: 'testuser1',
        email: 'test@example.com',
        password_hash: bcrypt.hashSync('password123', 10),
        role: 'user'
      };

      const userData2 = {
        username: 'testuser2',
        email: 'test@example.com', // Same email
        password_hash: bcrypt.hashSync('password123', 10),
        role: 'user'
      };

      await db.User.create(userData1);

      await expect(db.User.create(userData2)).rejects.toThrow();
    });

    test('should set default role to user', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password_hash: bcrypt.hashSync('password123', 10)
        // No role specified
      };

      const user = await db.User.create(userData);

      expect(user.role).toBe('user');
    });
  });

  describe('User Methods', () => {
    let user;

    beforeEach(async () => {
      user = await db.User.create({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: bcrypt.hashSync('password123', 10),
        role: 'user',
        first_name: 'Test',
        last_name: 'User'
      });
    });

    test('validPassword should return true for correct password', () => {
      expect(user.validPassword('password123')).toBe(true);
    });

    test('validPassword should return false for incorrect password', () => {
      expect(user.validPassword('wrongpassword')).toBe(false);
    });

    test('isAdmin should return true for admin user', async () => {
      const adminUser = await db.User.create({
        username: 'adminuser',
        email: 'admin@example.com',
        password_hash: bcrypt.hashSync('password123', 10),
        role: 'admin'
      });

      expect(adminUser.isAdmin()).toBe(true);
    });

    test('isAdmin should return false for regular user', () => {
      expect(user.isAdmin()).toBe(false);
    });

    test('getFullName should return full name when both names provided', () => {
      expect(user.getFullName()).toBe('Test User');
    });

    test('getFullName should return first name only when last name missing', async () => {
      const userWithFirstNameOnly = await db.User.create({
        username: 'firstonly',
        email: 'first@example.com',
        password_hash: bcrypt.hashSync('password123', 10),
        first_name: 'First'
      });

      expect(userWithFirstNameOnly.getFullName()).toBe('First');
    });

    test('getFullName should return last name only when first name missing', async () => {
      const userWithLastNameOnly = await db.User.create({
        username: 'lastonly',
        email: 'last@example.com',
        password_hash: bcrypt.hashSync('password123', 10),
        last_name: 'Last'
      });

      expect(userWithLastNameOnly.getFullName()).toBe('Last');
    });

    test('getFullName should return empty string when no names provided', async () => {
      const userWithNoNames = await db.User.create({
        username: 'nonames',
        email: 'none@example.com',
        password_hash: bcrypt.hashSync('password123', 10)
      });

      expect(userWithNoNames.getFullName()).toBe('');
    });
  });

  describe('User Updates', () => {
    let user;

    beforeEach(async () => {
      user = await db.User.create({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: bcrypt.hashSync('password123', 10),
        role: 'user',
        first_name: 'Test',
        last_name: 'User'
      });
    });

    test('should update user fields', async () => {
      user.first_name = 'Updated';
      user.last_name = 'Name';
      user.email = 'updated@example.com';
      await user.save();

      const updatedUser = await db.User.findByPk(user.user_id);
      expect(updatedUser.first_name).toBe('Updated');
      expect(updatedUser.last_name).toBe('Name');
      expect(updatedUser.email).toBe('updated@example.com');
    });

    test('should update password hash when password changes', async () => {
      const originalHash = user.password_hash;
      user.password_hash = 'newpassword';
      await user.save();

      expect(user.password_hash).not.toBe(originalHash);
      expect(user.password_hash).not.toBe('newpassword');
      expect(user.password_hash).toMatch(/^\$2[aby]\$\d+\$/);
    });

    test('should update updated_at timestamp', async () => {
      const originalUpdatedAt = user.updated_at;
      
      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100));
      
      user.first_name = 'Updated';
      await user.save();

      expect(user.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('User Deletion', () => {
    test('should delete user', async () => {
      const user = await db.User.create({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: bcrypt.hashSync('password123', 10),
        role: 'user'
      });

      const userId = user.user_id;
      await user.destroy();

      const deletedUser = await db.User.findByPk(userId);
      expect(deletedUser).toBeNull();
    });

    test('should cascade delete sessions when user is deleted', async () => {
      const user = await db.User.create({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: bcrypt.hashSync('password123', 10),
        role: 'user'
      });

      // Create a session for the user
      const session = await db.Session.create({
        session_id: 'test-session-id',
        user_id: user.user_id,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        data: 'test data'
      });

      // Delete the user
      await user.destroy();

      // Check that the session was also deleted
      const deletedSession = await db.Session.findByPk(session.session_id);
      expect(deletedSession).toBeNull();
    });
  });

  describe('User Queries', () => {
    beforeEach(async () => {
      // Create test users
      await db.User.bulkCreate([
        {
          username: 'user1',
          email: 'user1@example.com',
          password_hash: bcrypt.hashSync('password123', 10),
          role: 'user',
          first_name: 'User',
          last_name: 'One'
        },
        {
          username: 'user2',
          email: 'user2@example.com',
          password_hash: bcrypt.hashSync('password123', 10),
          role: 'user',
          first_name: 'User',
          last_name: 'Two'
        },
        {
          username: 'admin1',
          email: 'admin1@example.com',
          password_hash: bcrypt.hashSync('password123', 10),
          role: 'admin',
          first_name: 'Admin',
          last_name: 'One'
        }
      ]);
    });

    test('should find user by username', async () => {
      const user = await db.User.findOne({ where: { username: 'user1' } });
      expect(user).toBeTruthy();
      expect(user.username).toBe('user1');
    });

    test('should find user by email', async () => {
      const user = await db.User.findOne({ where: { email: 'user1@example.com' } });
      expect(user).toBeTruthy();
      expect(user.email).toBe('user1@example.com');
    });

    test('should find users by role', async () => {
      const users = await db.User.findAll({ where: { role: 'user' } });
      expect(users).toHaveLength(2);
      expect(users.every(user => user.role === 'user')).toBe(true);
    });

    test('should find admin users', async () => {
      const admins = await db.User.findAll({ where: { role: 'admin' } });
      expect(admins).toHaveLength(1);
      expect(admins[0].username).toBe('admin1');
    });

    test('should count users', async () => {
      const userCount = await db.User.count();
      expect(userCount).toBe(3);
    });

    test('should count users by role', async () => {
      const userCount = await db.User.count({ where: { role: 'user' } });
      expect(userCount).toBe(2);
    });
  });
});


