const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../api/index');
const { User } = require('../../models');
const DatabaseHelper = require('../helpers/database');
const bcrypt = require('bcryptjs');

describe('Profile Management Integration', () => {
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

    // Generate tokens
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

  describe('Complete Profile Update Workflow', () => {
    test('user can update profile information end-to-end', async () => {
      // Step 1: Get current profile
      const getResponse = await request(app)
        .get('/api/v1/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(getResponse.body.user.email).toBe('user@example.com');
      expect(getResponse.body.user.first_name).toBe('Regular');

      // Step 2: Update profile
      const updateData = {
        email: 'updated@example.com',
        first_name: 'Updated',
        last_name: 'Name',
        current_password: 'user123'
      };

      const updateResponse = await request(app)
        .put('/api/v1/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.user.email).toBe('updated@example.com');
      expect(updateResponse.body.user.first_name).toBe('Updated');
      expect(updateResponse.body.user.last_name).toBe('Name');

      // Step 3: Verify changes in database
      await regularUser.reload();
      expect(regularUser.email).toBe('updated@example.com');
      expect(regularUser.first_name).toBe('Updated');
      expect(regularUser.last_name).toBe('Name');

      // Step 4: Get updated profile
      const getUpdatedResponse = await request(app)
        .get('/api/v1/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(getUpdatedResponse.body.user.email).toBe('updated@example.com');
      expect(getUpdatedResponse.body.user.first_name).toBe('Updated');
      expect(getUpdatedResponse.body.user.last_name).toBe('Name');
    });

    test('profile update fails with invalid password', async () => {
      const updateData = {
        email: 'updated@example.com',
        current_password: 'wrongpassword'
      };

      const response = await request(app)
        .put('/api/v1/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid current password');

      // Verify no changes were made
      await regularUser.reload();
      expect(regularUser.email).toBe('user@example.com');
    });

    test('profile update fails with invalid email format', async () => {
      const updateData = {
        email: 'invalid-email',
        current_password: 'user123'
      };

      const response = await request(app)
        .put('/api/v1/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid email format');

      // Verify no changes were made
      await regularUser.reload();
      expect(regularUser.email).toBe('user@example.com');
    });
  });

  describe('Password Change Workflow', () => {
    test('user can change password end-to-end', async () => {
      // Step 1: Change password
      const passwordData = {
        current_password: 'user123',
        new_password: 'newpassword456',
        confirm_password: 'newpassword456'
      };

      const changeResponse = await request(app)
        .put('/api/v1/profile/password')
        .set('Authorization', `Bearer ${userToken}`)
        .send(passwordData)
        .expect(200);

      expect(changeResponse.body.success).toBe(true);
      expect(changeResponse.body.message).toBe('Password changed successfully');

      // Step 2: Verify old password no longer works for login
      const oldLoginResponse = await request(app)
        .post('/auth/login')
        .send({
          username: 'user',
          password: 'user123'
        })
        .expect(401);

      expect(oldLoginResponse.body.success).toBe(false);

      // Step 3: Verify new password works for login
      const newLoginResponse = await request(app)
        .post('/auth/login')
        .send({
          username: 'user',
          password: 'newpassword456'
        })
        .expect(200);

      expect(newLoginResponse.body.success).toBe(true);

      // Step 4: Verify password change with new password
      const newPasswordData = {
        current_password: 'newpassword456',
        new_password: 'anotherpassword789',
        confirm_password: 'anotherpassword789'
      };

      const secondChangeResponse = await request(app)
        .put('/api/v1/profile/password')
        .set('Authorization', `Bearer ${userToken}`)
        .send(newPasswordData)
        .expect(200);

      expect(secondChangeResponse.body.success).toBe(true);
    });

    test('password change fails with wrong current password', async () => {
      const passwordData = {
        current_password: 'wrongpassword',
        new_password: 'newpassword456',
        confirm_password: 'newpassword456'
      };

      const response = await request(app)
        .put('/api/v1/profile/password')
        .set('Authorization', `Bearer ${userToken}`)
        .send(passwordData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid current password');

      // Verify old password still works
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          username: 'user',
          password: 'user123'
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
    });

    test('password change fails with mismatched confirmation', async () => {
      const passwordData = {
        current_password: 'user123',
        new_password: 'newpassword456',
        confirm_password: 'differentpassword'
      };

      const response = await request(app)
        .put('/api/v1/profile/password')
        .set('Authorization', `Bearer ${userToken}`)
        .send(passwordData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Password confirmation does not match');
    });
  });

  describe('Admin Role Management Workflow', () => {
    test('admin can manage user roles end-to-end', async () => {
      // Step 1: Admin gets list of all users
      const getUsersResponse = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(getUsersResponse.body.success).toBe(true);
      expect(getUsersResponse.body.users.length).toBe(2);

      const user = getUsersResponse.body.users.find(u => u.id === regularUser.id);
      expect(user.role).toBe('user');

      // Step 2: Admin promotes user to admin
      const promoteResponse = await request(app)
        .put(`/api/v1/admin/users/${regularUser.id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'admin' })
        .expect(200);

      expect(promoteResponse.body.success).toBe(true);
      expect(promoteResponse.body.user.role).toBe('admin');

      // Step 3: Verify role change in database
      await regularUser.reload();
      expect(regularUser.role).toBe('admin');

      // Step 4: Admin demotes user back to regular user
      const demoteResponse = await request(app)
        .put(`/api/v1/admin/users/${regularUser.id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'user' })
        .expect(200);

      expect(demoteResponse.body.success).toBe(true);
      expect(demoteResponse.body.user.role).toBe('user');

      // Step 5: Verify final role in database
      await regularUser.reload();
      expect(regularUser.role).toBe('user');
    });

    test('admin cannot change own role', async () => {
      const response = await request(app)
        .put(`/api/v1/admin/users/${adminUser.id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'user' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('You cannot change your own role');

      // Verify admin role unchanged
      await adminUser.reload();
      expect(adminUser.role).toBe('admin');
    });

    test('regular user cannot access admin endpoints', async () => {
      // Try to get all users
      const getUsersResponse = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(getUsersResponse.body.success).toBe(false);
      expect(getUsersResponse.body.error).toBe('Admin access required');

      // Try to change user role
      const changeRoleResponse = await request(app)
        .put(`/api/v1/admin/users/${adminUser.id}/role`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ role: 'user' })
        .expect(403);

      expect(changeRoleResponse.body.success).toBe(false);
      expect(changeRoleResponse.body.error).toBe('Admin access required');
    });
  });

  describe('Cross-Feature Integration', () => {
    test('profile updates work after role changes', async () => {
      // Step 1: Admin promotes user
      await request(app)
        .put(`/api/v1/admin/users/${regularUser.id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'admin' })
        .expect(200);

      // Step 2: User (now admin) can still update their profile
      const updateData = {
        email: 'admin@example.com',
        first_name: 'Promoted',
        current_password: 'user123'
      };

      const response = await request(app)
        .put('/api/v1/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe('admin@example.com');
      expect(response.body.user.first_name).toBe('Promoted');
    });

    test('password changes work after profile updates', async () => {
      // Step 1: Update profile
      await request(app)
        .put('/api/v1/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          email: 'updated@example.com',
          current_password: 'user123'
        })
        .expect(200);

      // Step 2: Change password
      const passwordData = {
        current_password: 'user123',
        new_password: 'newpassword456',
        confirm_password: 'newpassword456'
      };

      const response = await request(app)
        .put('/api/v1/profile/password')
        .set('Authorization', `Bearer ${userToken}`)
        .send(passwordData)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Step 3: Verify both changes persisted
      await regularUser.reload();
      expect(regularUser.email).toBe('updated@example.com');
      
      // Verify new password works
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          username: 'user',
          password: 'newpassword456'
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
    });
  });

  describe('Error Recovery', () => {
    test('system recovers from partial failures', async () => {
      // Step 1: Attempt invalid profile update
      const invalidUpdate = {
        email: 'invalid-email',
        current_password: 'user123'
      };

      await request(app)
        .put('/api/v1/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidUpdate)
        .expect(400);

      // Step 2: Verify system still works with valid data
      const validUpdate = {
        email: 'valid@example.com',
        current_password: 'user123'
      };

      const response = await request(app)
        .put('/api/v1/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send(validUpdate)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('authentication remains valid after profile changes', async () => {
      // Step 1: Update profile
      await request(app)
        .put('/api/v1/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          email: 'updated@example.com',
          current_password: 'user123'
        })
        .expect(200);

      // Step 2: Verify token still works
      const response = await request(app)
        .get('/api/v1/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe('updated@example.com');
    });
  });
});
