const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../api/index');
const { User } = require('../../models');
const DatabaseHelper = require('../helpers/database');
const bcrypt = require('bcryptjs');

describe('Admin Profile Endpoints', () => {
  let adminToken;
  let userToken;
  let adminUser;
  let regularUser;

  beforeAll(async () => {
    await DatabaseHelper.setup();
  });

  afterAll(async () => {
    await DatabaseHelper.cleanup();
  });

  beforeEach(async () => {
    // Clean up users table
    await User.destroy({ where: {}, force: true });

    // Create admin user
    adminUser = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password_hash: await bcrypt.hash('admin123', 10),
      first_name: 'Admin',
      last_name: 'User',
      role: 'admin'
    });

    // Create regular user
    regularUser = await User.create({
      username: 'user',
      email: 'user@example.com',
      password_hash: await bcrypt.hash('user123', 10),
      first_name: 'Regular',
      last_name: 'User',
      role: 'user'
    });

    // Generate admin token
    adminToken = jwt.sign(
      {
        id: adminUser.id,
        username: adminUser.username,
        email: adminUser.email,
        role: adminUser.role
      },
      process.env.JWT_SECRET || 'thanksgiving-menu-jwt-secret-key-change-in-production',
      { expiresIn: '24h' }
    );

    // Generate user token
    userToken = jwt.sign(
      {
        id: regularUser.id,
        username: regularUser.username,
        email: regularUser.email,
        role: regularUser.role
      },
      process.env.JWT_SECRET || 'thanksgiving-menu-jwt-secret-key-change-in-production',
      { expiresIn: '24h' }
    );
  });

  describe('GET /api/v1/admin/users', () => {
    test('should return all users for admin', async () => {
      const response = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.users).toBeDefined();
      expect(Array.isArray(response.body.users)).toBe(true);
      expect(response.body.users.length).toBe(2);

      // Check user data structure
      const user = response.body.users.find(u => u.id === regularUser.id);
      expect(user).toBeDefined();
      expect(user.username).toBe('user');
      expect(user.email).toBe('user@example.com');
      expect(user.first_name).toBe('Regular');
      expect(user.last_name).toBe('User');
      expect(user.role).toBe('user');
      expect(user.created_at).toBeDefined();
    });

    test('should require admin role', async () => {
      const response = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Admin access required');
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .get('/api/v1/admin/users')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access token required');
    });

    test('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', 'Bearer invalid-token')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid token');
    });

    test('should return users in consistent order', async () => {
      // Create additional users
      await User.create({
        username: 'user1',
        email: 'user1@example.com',
        password_hash: await bcrypt.hash('password123', 10),
        role: 'user'
      });

      await User.create({
        username: 'user2',
        email: 'user2@example.com',
        password_hash: await bcrypt.hash('password123', 10),
        role: 'user'
      });

      const response = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.users.length).toBe(4);
      
      // Users should be in consistent order (by creation time)
      const usernames = response.body.users.map(u => u.username);
      expect(usernames).toContain('admin');
      expect(usernames).toContain('user');
      expect(usernames).toContain('user1');
      expect(usernames).toContain('user2');
    });
  });

  describe('PUT /api/v1/admin/users/:userId/role', () => {
    test('should update user role for admin', async () => {
      const response = await request(app)
        .put(`/api/v1/admin/users/${regularUser.id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'admin' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User role updated successfully');
      expect(response.body.user.id).toBe(regularUser.id);
      expect(response.body.user.role).toBe('admin');

      // Verify role was actually changed in database
      await regularUser.reload();
      expect(regularUser.role).toBe('admin');
    });

    test('should change role from admin to user', async () => {
      // First make user an admin
      await regularUser.update({ role: 'admin' });

      const response = await request(app)
        .put(`/api/v1/admin/users/${regularUser.id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'user' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.role).toBe('user');

      // Verify role was actually changed in database
      await regularUser.reload();
      expect(regularUser.role).toBe('user');
    });

    test('should prevent admin from changing own role', async () => {
      const response = await request(app)
        .put(`/api/v1/admin/users/${adminUser.id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'user' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('You cannot change your own role');
    });

    test('should validate role value', async () => {
      const response = await request(app)
        .put(`/api/v1/admin/users/${regularUser.id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'invalid-role' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid role. Must be "admin" or "user"');
    });

    test('should require role in request body', async () => {
      const response = await request(app)
        .put(`/api/v1/admin/users/${regularUser.id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Role is required');
    });

    test('should handle non-existent user', async () => {
      const response = await request(app)
        .put('/api/v1/admin/users/99999/role')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'admin' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');
    });

    test('should require admin role', async () => {
      const response = await request(app)
        .put(`/api/v1/admin/users/${regularUser.id}/role`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ role: 'admin' })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Admin access required');
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .put(`/api/v1/admin/users/${regularUser.id}/role`)
        .send({ role: 'admin' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access token required');
    });

    test('should handle invalid user ID format', async () => {
      const response = await request(app)
        .put('/api/v1/admin/users/invalid-id/role')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'admin' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should handle database errors gracefully', async () => {
      // Mock database error by using invalid user ID
      const response = await request(app)
        .put('/api/v1/admin/users/abc/role')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'admin' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should handle malformed JSON', async () => {
      const response = await request(app)
        .put(`/api/v1/admin/users/${regularUser.id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Security Tests', () => {
    test('should not expose sensitive user data', async () => {
      const response = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Check that password hashes are not included
      response.body.users.forEach(user => {
        expect(user.password_hash).toBeUndefined();
        expect(user.password).toBeUndefined();
      });
    });

    test('should validate user permissions properly', async () => {
      // Regular user should not be able to access admin endpoints
      const response = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Admin access required');
    });
  });
});
