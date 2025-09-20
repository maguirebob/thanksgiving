const { User } = require('../../models');
const DatabaseHelper = require('../helpers/database');
const bcrypt = require('bcryptjs');

describe('User Profile Management', () => {
  beforeAll(async () => {
    await DatabaseHelper.setup();
  });

  afterAll(async () => {
    await DatabaseHelper.cleanup();
  });

  beforeEach(async () => {
    // Clean up users table before each test
    await User.destroy({ where: {}, force: true });
  });

  describe('User Model Profile Methods', () => {
    let testUser;

    beforeEach(async () => {
      // Create a test user for each test
      testUser = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: await bcrypt.hash('password123', 10),
        first_name: 'Test',
        last_name: 'User',
        role: 'user'
      });
    });

    describe('updateProfile method', () => {
      test('should update user email', async () => {
        const updateData = {
          email: 'newemail@example.com'
        };

        await testUser.updateProfile(updateData);
        await testUser.reload();

        expect(testUser.email).toBe('newemail@example.com');
        expect(testUser.updated_at).not.toBe(testUser.created_at);
      });

      test('should update user first and last name', async () => {
        const updateData = {
          first_name: 'Updated',
          last_name: 'Name'
        };

        await testUser.updateProfile(updateData);
        await testUser.reload();

        expect(testUser.first_name).toBe('Updated');
        expect(testUser.last_name).toBe('Name');
      });

      test('should update multiple fields at once', async () => {
        const updateData = {
          email: 'multi@example.com',
          first_name: 'Multi',
          last_name: 'Update'
        };

        await testUser.updateProfile(updateData);
        await testUser.reload();

        expect(testUser.email).toBe('multi@example.com');
        expect(testUser.first_name).toBe('Multi');
        expect(testUser.last_name).toBe('Update');
      });

      test('should not update username or role', async () => {
        const updateData = {
          username: 'hacker',
          role: 'admin',
          email: 'valid@example.com'
        };

        await testUser.updateProfile(updateData);
        await testUser.reload();

        expect(testUser.username).toBe('testuser');
        expect(testUser.role).toBe('user');
        expect(testUser.email).toBe('valid@example.com');
      });

      test('should validate email format', async () => {
        const updateData = {
          email: 'invalid-email'
        };

        await expect(testUser.updateProfile(updateData)).rejects.toThrow();
      });

      test('should handle empty update data', async () => {
        const updateData = {};

        await testUser.updateProfile(updateData);
        await testUser.reload();

        // Should not change anything
        expect(testUser.email).toBe('test@example.com');
        expect(testUser.first_name).toBe('Test');
      });
    });

    describe('changePassword method', () => {
      test('should change password with valid current password', async () => {
        const currentPassword = 'password123';
        const newPassword = 'newpassword456';

        await testUser.changePassword(currentPassword, newPassword);
        await testUser.reload();

        // Verify old password no longer works
        const oldPasswordValid = await bcrypt.compare('password123', testUser.password_hash);
        expect(oldPasswordValid).toBe(false);

        // Verify new password works
        const newPasswordValid = await bcrypt.compare('newpassword456', testUser.password_hash);
        expect(newPasswordValid).toBe(true);
      });

      test('should reject invalid current password', async () => {
        const currentPassword = 'wrongpassword';
        const newPassword = 'newpassword456';

        await expect(testUser.changePassword(currentPassword, newPassword)).rejects.toThrow('Invalid current password');
      });

      test('should validate password strength', async () => {
        const currentPassword = 'password123';
        const weakPassword = '123';

        await expect(testUser.changePassword(currentPassword, weakPassword)).rejects.toThrow();
      });

      test('should require non-empty new password', async () => {
        const currentPassword = 'password123';
        const emptyPassword = '';

        await expect(testUser.changePassword(currentPassword, emptyPassword)).rejects.toThrow();
      });
    });

    describe('verifyPassword method', () => {
      test('should verify correct password', async () => {
        const isValid = await testUser.verifyPassword('password123');
        expect(isValid).toBe(true);
      });

      test('should reject incorrect password', async () => {
        const isValid = await testUser.verifyPassword('wrongpassword');
        expect(isValid).toBe(false);
      });

      test('should handle empty password', async () => {
        const isValid = await testUser.verifyPassword('');
        expect(isValid).toBe(false);
      });
    });

    describe('Email validation', () => {
      test('should accept valid email formats', async () => {
        const validEmails = [
          'user@example.com',
          'user.name@example.com',
          'user+tag@example.org',
          'user123@example.co.uk'
        ];

        for (const email of validEmails) {
          const user = await User.create({
            username: `user_${Date.now()}`,
            email: email,
            password_hash: await bcrypt.hash('password123', 10)
          });
          expect(user.email).toBe(email);
          await user.destroy();
        }
      });

      test('should reject invalid email formats', async () => {
        const invalidEmails = [
          'invalid-email',
          '@example.com',
          'user@',
          'user..name@example.com',
          'user@.com'
        ];

        for (const email of invalidEmails) {
          await expect(User.create({
            username: `user_${Date.now()}`,
            email: email,
            password_hash: await bcrypt.hash('password123', 10)
          })).rejects.toThrow();
        }
      });
    });

    describe('Password hashing', () => {
      test('should hash password correctly', async () => {
        const password = 'testpassword123';
        const hashedPassword = await User.hashPassword(password);
        
        expect(hashedPassword).not.toBe(password);
        expect(hashedPassword.length).toBeGreaterThan(50); // bcrypt hash length
        expect(hashedPassword.startsWith('$2')).toBe(true); // bcrypt identifier
      });

      test('should generate different hashes for same password', async () => {
        const password = 'testpassword123';
        const hash1 = await User.hashPassword(password);
        const hash2 = await User.hashPassword(password);
        
        expect(hash1).not.toBe(hash2);
      });
    });

    describe('Case-insensitive username handling', () => {
      test('should store usernames in lowercase', async () => {
        const user = await User.create({
          username: 'TestUser',
          email: 'testuser@example.com',
          password_hash: await bcrypt.hash('password123', 10)
        });

        expect(user.username).toBe('testuser');
      });

      test('should find users with case-insensitive lookup', async () => {
        await User.create({
          username: 'TestUser',
          email: 'testuser@example.com',
          password_hash: await bcrypt.hash('password123', 10)
        });

        const foundUser1 = await User.findByUsername('testuser');
        const foundUser2 = await User.findByUsername('TESTUSER');
        const foundUser3 = await User.findByUsername('TestUser');

        expect(foundUser1).toBeTruthy();
        expect(foundUser2).toBeTruthy();
        expect(foundUser3).toBeTruthy();
        expect(foundUser1.username).toBe('testuser');
      });
    });
  });

  describe('User Profile Statistics', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        username: 'statstest',
        email: 'stats@example.com',
        password_hash: await bcrypt.hash('password123', 10),
        first_name: 'Stats',
        last_name: 'Test'
      });
    });

    test('should track user creation time', async () => {
      expect(testUser.created_at).toBeDefined();
      expect(testUser.created_at).toBeInstanceOf(Date);
    });

    test('should track user update time', async () => {
      const originalUpdatedAt = testUser.updated_at;
      
      await testUser.updateProfile({ email: 'updated@example.com' });
      await testUser.reload();

      expect(testUser.updated_at).not.toEqual(originalUpdatedAt);
      expect(testUser.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });
});
