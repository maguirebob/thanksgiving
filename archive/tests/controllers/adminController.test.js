const request = require('supertest');
const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const db = require('../../models');
const DatabaseHelper = require('../helpers/database');
const adminRoutes = require('../../src/routes/adminRoutes');
const authRoutes = require('../../src/routes/authRoutes');
const { addUserToLocals } = require('../../src/middleware/auth');

describe('Admin Controller', () => {
  let app;

  beforeAll(async () => {
    await DatabaseHelper.setup();
    
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(express.static(path.join(__dirname, '../../../public')));
    app.use(expressLayouts);
    
    app.use(session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false
    }));

    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, '../../../views'));
    app.set('layout', 'layout');

    app.use(addUserToLocals);
    app.use('/auth', authRoutes);
    app.use('/admin', adminRoutes);
  });

  afterAll(async () => {
    await DatabaseHelper.cleanup();
  });

  beforeEach(async () => {
    await DatabaseHelper.clearDatabase();
    await DatabaseHelper.insertTestData();
  });

  describe('showDashboard', () => {
    test('should show admin dashboard for admin user', async () => {
      const agent = request.agent(app);
      
      // Login as admin
      await agent
        .post('/auth/login')
        .send({
          username: 'testadmin',
          password: 'password123'
        });

      const response = await agent
        .get('/admin')
        .expect(200);

      expect(response.text).toContain('Admin Dashboard');
      expect(response.text).toContain('Users');
      expect(response.text).toContain('Events');
      expect(response.text).toContain('Statistics');
    });

    test('should redirect to login for unauthenticated user', async () => {
      const response = await request(app)
        .get('/admin')
        .expect(302);

      expect(response.headers.location).toContain('/auth/login');
    });

    test('should return 403 for non-admin user', async () => {
      const agent = request.agent(app);
      
      // Login as regular user
      await agent
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'password123'
        });

      const response = await agent
        .get('/admin')
        .expect(403);

      expect(response.text).toContain('Access Denied');
    });
  });

  describe('showUsers', () => {
    test('should show user management page for admin', async () => {
      const agent = request.agent(app);
      
      // Login as admin
      await agent
        .post('/auth/login')
        .send({
          username: 'testadmin',
          password: 'password123'
        });

      const response = await agent
        .get('/admin/users')
        .expect(200);

      expect(response.text).toContain('User Management');
      expect(response.text).toContain('testadmin');
      expect(response.text).toContain('testuser');
      expect(response.text).toContain('admin');
      expect(response.text).toContain('user');
    });

    test('should redirect to login for unauthenticated user', async () => {
      const response = await request(app)
        .get('/admin/users')
        .expect(302);

      expect(response.headers.location).toContain('/auth/login');
    });

    test('should return 403 for non-admin user', async () => {
      const agent = request.agent(app);
      
      // Login as regular user
      await agent
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'password123'
        });

      const response = await agent
        .get('/admin/users')
        .expect(403);

      expect(response.text).toContain('Access Denied');
    });
  });

  describe('updateUserRole', () => {
    test('should update user role for admin', async () => {
      const agent = request.agent(app);
      
      // Login as admin
      await agent
        .post('/auth/login')
        .send({
          username: 'testadmin',
          password: 'password123'
        });

      const response = await agent
        .put('/admin/users/2/role')
        .send({ role: 'admin' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.role).toBe('admin');

      // Verify role was updated in database
      const user = await db.User.findByPk(2);
      expect(user.role).toBe('admin');
    });

    test('should validate role values', async () => {
      const agent = request.agent(app);
      
      // Login as admin
      await agent
        .post('/auth/login')
        .send({
          username: 'testadmin',
          password: 'password123'
        });

      const response = await agent
        .put('/admin/users/2/role')
        .send({ role: 'invalid-role' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid role');
    });

    test('should return 404 for non-existent user', async () => {
      const agent = request.agent(app);
      
      // Login as admin
      await agent
        .post('/auth/login')
        .send({
          username: 'testadmin',
          password: 'password123'
        });

      const response = await agent
        .put('/admin/users/999/role')
        .send({ role: 'admin' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });

    test('should redirect to login for unauthenticated user', async () => {
      const response = await request(app)
        .put('/admin/users/2/role')
        .send({ role: 'admin' })
        .expect(302);

      expect(response.headers.location).toContain('/auth/login');
    });

    test('should return 403 for non-admin user', async () => {
      const agent = request.agent(app);
      
      // Login as regular user
      await agent
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'password123'
        });

      const response = await agent
        .put('/admin/users/2/role')
        .send({ role: 'admin' })
        .expect(403);

      expect(response.text).toContain('Access Denied');
    });
  });

  describe('deleteUser', () => {
    test('should delete user for admin', async () => {
      const agent = request.agent(app);
      
      // Login as admin
      await agent
        .post('/auth/login')
        .send({
          username: 'testadmin',
          password: 'password123'
        });

      const response = await agent
        .delete('/admin/users/2')
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify user was deleted
      const user = await db.User.findByPk(2);
      expect(user).toBeNull();
    });

    test('should not allow admin to delete themselves', async () => {
      const agent = request.agent(app);
      
      // Login as admin
      await agent
        .post('/auth/login')
        .send({
          username: 'testadmin',
          password: 'password123'
        });

      const response = await agent
        .delete('/admin/users/1') // Admin's own ID
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('cannot delete yourself');
    });

    test('should return 404 for non-existent user', async () => {
      const agent = request.agent(app);
      
      // Login as admin
      await agent
        .post('/auth/login')
        .send({
          username: 'testadmin',
          password: 'password123'
        });

      const response = await agent
        .delete('/admin/users/999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });

    test('should redirect to login for unauthenticated user', async () => {
      const response = await request(app)
        .delete('/admin/users/2')
        .expect(302);

      expect(response.headers.location).toContain('/auth/login');
    });

    test('should return 403 for non-admin user', async () => {
      const agent = request.agent(app);
      
      // Login as regular user
      await agent
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'password123'
        });

      const response = await agent
        .delete('/admin/users/2')
        .expect(403);

      expect(response.text).toContain('Access Denied');
    });
  });

  describe('Error Handling', () => {
    test('should handle database errors gracefully', async () => {
      const agent = request.agent(app);
      
      // Login as admin
      await agent
        .post('/auth/login')
        .send({
          username: 'testadmin',
          password: 'password123'
        });

      // Mock database error
      const originalFindAll = db.User.findAll;
      db.User.findAll = jest.fn().mockRejectedValue(new Error('Database error'));

      const response = await agent
        .get('/admin/users')
        .expect(500);

      expect(response.text).toContain('Error');

      // Restore original method
      db.User.findAll = originalFindAll;
    });

    test('should handle validation errors', async () => {
      const agent = request.agent(app);
      
      // Login as admin
      await agent
        .post('/auth/login')
        .send({
          username: 'testadmin',
          password: 'password123'
        });

      const response = await agent
        .put('/admin/users/2/role')
        .send({}) // Missing role field
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Role is required');
    });
  });
});
