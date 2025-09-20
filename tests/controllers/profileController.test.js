const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../api/index');
const { User } = require('../../models');
const DatabaseHelper = require('../helpers/database');
const bcrypt = require('bcryptjs');

describe('Profile API Endpoints', () => {
  let authToken;
  let testUser;

  beforeAll(async () => {
    await DatabaseHelper.setup();
  });

  afterAll(async () => {
    await DatabaseHelper.cleanup();
  });

  beforeEach(async () => {
    // Clean up users table
    await User.destroy({ where: {}, force: true });

    // Create test user
    testUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password_hash: await bcrypt.hash('password123', 10),
      first_name: 'Test',
      last_name: 'User',
      role: 'user'
    });

    // Generate auth token
    authToken = jwt.sign(
      {
        id: testUser.id,
        username: testUser.username,
        email: testUser.email,
        role: testUser.role
      },
      process.env.JWT_SECRET || 'thanksgiving-menu-jwt-secret-key-change-in-production',
      { expiresIn: '24h' }
    );
  });

  describe('GET /api/v1/profile', () => {
    test('should return current user profile', async () => {
      const response = await request(app)
        .get('/api/v1/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.id).toBe(testUser.id);
      expect(response.body.user.username).toBe('testuser');
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.user.first_name).toBe('Test');
      expect(response.body.user.last_name).toBe('User');
      expect(response.body.user.role).toBe('user');
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .get('/api/v1/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access token required');
    });

    test('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid token');
    });

    test('should reject expired token', async () => {
      const expiredToken = jwt.sign(
        { id: testUser.id, username: testUser.username },
        process.env.JWT_SECRET || 'thanksgiving-menu-jwt-secret-key-change-in-production',
        { expiresIn: '-1h' }
      );

      const response = await request(app)
        .get('/api/v1/profile')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid token');
    });
  });

  describe('PUT /api/v1/profile', () => {
    test('should update user profile with valid data', async () => {
      const updateData = {
        email: 'newemail@example.com',
        first_name: 'Updated',
        last_name: 'Name',
        current_password: 'password123'
      };

      const response = await request(app)
        .put('/api/v1/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Profile updated successfully');
      expect(response.body.user.email).toBe('newemail@example.com');
      expect(response.body.user.first_name).toBe('Updated');
      expect(response.body.user.last_name).toBe('Name');
    });

    test('should require current password verification', async () => {
      const updateData = {
        email: 'newemail@example.com',
        current_password: 'wrongpassword'
      };

      const response = await request(app)
        .put('/api/v1/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid current password');
    });

    test('should validate email format', async () => {
      const updateData = {
        email: 'invalid-email',
        current_password: 'password123'
      };

      const response = await request(app)
        .put('/api/v1/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid email format');
    });

    test('should reject invalid current password', async () => {
      const updateData = {
        email: 'newemail@example.com',
        current_password: 'wrongpassword'
      };

      const response = await request(app)
        .put('/api/v1/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid current password');
    });

    test('should require current password', async () => {
      const updateData = {
        email: 'newemail@example.com'
        // Missing current_password
      };

      const response = await request(app)
        .put('/api/v1/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Current password is required');
    });

    test('should not allow username or role updates', async () => {
      const updateData = {
        username: 'hacker',
        role: 'admin',
        email: 'valid@example.com',
        current_password: 'password123'
      };

      const response = await request(app)
        .put('/api/v1/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      // Should update email but not username or role
      expect(response.body.user.username).toBe('testuser');
      expect(response.body.user.role).toBe('user');
      expect(response.body.user.email).toBe('valid@example.com');
    });

    test('should handle partial updates', async () => {
      const updateData = {
        first_name: 'OnlyFirst',
        current_password: 'password123'
      };

      const response = await request(app)
        .put('/api/v1/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.user.first_name).toBe('OnlyFirst');
      expect(response.body.user.last_name).toBe('User'); // Should remain unchanged
      expect(response.body.user.email).toBe('test@example.com'); // Should remain unchanged
    });

    test('should require authentication', async () => {
      const updateData = {
        email: 'newemail@example.com',
        current_password: 'password123'
      };

      const response = await request(app)
        .put('/api/v1/profile')
        .send(updateData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access token required');
    });
  });

  describe('PUT /api/v1/profile/password', () => {
    test('should change password with valid current password', async () => {
      const passwordData = {
        current_password: 'password123',
        new_password: 'newpassword456',
        confirm_password: 'newpassword456'
      };

      const response = await request(app)
        .put('/api/v1/profile/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Password changed successfully');

      // Verify old password no longer works
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'password123'
        })
        .expect(401);

      expect(loginResponse.body.success).toBe(false);

      // Verify new password works
      const newLoginResponse = await request(app)
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'newpassword456'
        })
        .expect(200);

      expect(newLoginResponse.body.success).toBe(true);
    });

    test('should require password confirmation', async () => {
      const passwordData = {
        current_password: 'password123',
        new_password: 'newpassword456',
        confirm_password: 'differentpassword'
      };

      const response = await request(app)
        .put('/api/v1/profile/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Password confirmation does not match');
    });

    test('should validate password strength', async () => {
      const passwordData = {
        current_password: 'password123',
        new_password: '123',
        confirm_password: '123'
      };

      const response = await request(app)
        .put('/api/v1/profile/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Password must be at least 8 characters');
    });

    test('should require current password', async () => {
      const passwordData = {
        new_password: 'newpassword456',
        confirm_password: 'newpassword456'
        // Missing current_password
      };

      const response = await request(app)
        .put('/api/v1/profile/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Current password is required');
    });

    test('should reject invalid current password', async () => {
      const passwordData = {
        current_password: 'wrongpassword',
        new_password: 'newpassword456',
        confirm_password: 'newpassword456'
      };

      const response = await request(app)
        .put('/api/v1/profile/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid current password');
    });

    test('should require authentication', async () => {
      const passwordData = {
        current_password: 'password123',
        new_password: 'newpassword456',
        confirm_password: 'newpassword456'
      };

      const response = await request(app)
        .put('/api/v1/profile/password')
        .send(passwordData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access token required');
    });

    test('should handle empty new password', async () => {
      const passwordData = {
        current_password: 'password123',
        new_password: '',
        confirm_password: ''
      };

      const response = await request(app)
        .put('/api/v1/profile/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('New password is required');
    });
  });

  describe('Error Handling', () => {
    test('should handle database errors gracefully', async () => {
      // Mock database error by using invalid data
      const updateData = {
        email: 'a'.repeat(300) + '@example.com', // Too long email
        current_password: 'password123'
      };

      const response = await request(app)
        .put('/api/v1/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should handle malformed JSON', async () => {
      const response = await request(app)
        .put('/api/v1/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
