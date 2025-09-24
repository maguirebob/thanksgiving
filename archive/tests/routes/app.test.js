const request = require('supertest');
const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const multer = require('multer');
const db = require('../../models');
const DatabaseHelper = require('../helpers/database');

// Import routes
const menuRoutes = require('../../src/routes/menuRoutes');
const apiRoutes = require('../../src/routes/apiRoutes');
const authRoutes = require('../../src/routes/authRoutes');
const adminRoutes = require('../../src/routes/adminRoutes');

// Import middleware
const { addUserToLocals } = require('../../src/middleware/auth');

describe('Application Routes', () => {
  let app;
  let server;

  beforeAll(async () => {
    // Setup test database
    await DatabaseHelper.setup();
    
    // Create Express app
    app = express();
    
    // Middleware setup
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(express.static(path.join(__dirname, '../../../public')));
    app.use(expressLayouts);
    
    // Session configuration
    app.use(session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
      }
    }));

    // Multer configuration
    const upload = multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new Error('Only image files are allowed'), false);
        }
      }
    });

    // Add upload to request
    app.use((req, res, next) => {
      req.upload = upload;
      next();
    });

    // View engine setup
    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, '../../../views'));
    app.set('layout', 'layout');

    // Add user to locals for all views
    app.use(addUserToLocals);

    // Routes
    app.use('/', menuRoutes);
    app.use('/auth', authRoutes);
    app.use('/admin', adminRoutes);
    app.use('/api/v1', apiRoutes);

    // Error handling
    app.use((err, req, res, next) => {
      console.error('Error:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    });

    // Start server
    server = app.listen(0); // Use port 0 to get a random available port
  });

  afterAll(async () => {
    if (server) {
      server.close();
    }
    await DatabaseHelper.cleanup();
  });

  beforeEach(async () => {
    // Clear and repopulate test data before each test
    await DatabaseHelper.clearDatabase();
    await DatabaseHelper.insertTestData();
  });

  describe('Menu Routes', () => {
    test('GET / should return home page', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.text).toContain('Thanksgiving');
      expect(response.text).toContain('2020');
      expect(response.text).toContain('2021');
    });

    test('GET /menu/:id should return menu detail page', async () => {
      const response = await request(app)
        .get('/menu/1')
        .expect(200);

      expect(response.text).toContain('Thanksgiving 2020');
      expect(response.text).toContain('Turkey');
      expect(response.text).toContain('Mashed Potatoes');
    });

    test('GET /menu/:id should return 404 for non-existent menu', async () => {
      const response = await request(app)
        .get('/menu/999')
        .expect(404);
    });
  });

  describe('API Routes', () => {
    test('GET /api/v1/events should return all events', async () => {
      const response = await request(app)
        .get('/api/v1/events')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty('event_id');
      expect(response.body.data[0]).toHaveProperty('year');
      expect(response.body.data[0]).toHaveProperty('title');
    });

    test('GET /api/v1/events/:id should return specific event', async () => {
      const response = await request(app)
        .get('/api/v1/events/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.event_id).toBe(1);
      expect(response.body.data.title).toBe('Thanksgiving 2020');
    });

    test('GET /api/v1/events/:id should return 404 for non-existent event', async () => {
      const response = await request(app)
        .get('/api/v1/events/999')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('GET /api/v1/events/:id/photos should return event photos', async () => {
      const response = await request(app)
        .get('/api/v1/events/1/photos')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toHaveProperty('photo_id');
      expect(response.body.data[0]).toHaveProperty('filename');
    });

    test('POST /api/v1/events/:id/photos should upload photo', async () => {
      const response = await request(app)
        .post('/api/v1/events/1/photos')
        .attach('photo', Buffer.from('fake image data'), 'test.jpg')
        .field('description', 'Test photo upload')
        .field('caption', 'Test caption')
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('photo_id');
      expect(response.body.data.description).toBe('Test photo upload');
    });

    test('PUT /api/v1/events/:id should update event', async () => {
      const updateData = {
        title: 'Updated Thanksgiving 2020',
        description: 'Updated description'
      };

      const response = await request(app)
        .put('/api/v1/events/1')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Updated Thanksgiving 2020');
    });

    test('DELETE /api/v1/events/:id should delete event', async () => {
      const response = await request(app)
        .delete('/api/v1/events/1')
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify event is deleted
      const getResponse = await request(app)
        .get('/api/v1/events/1')
        .expect(404);
    });
  });

  describe('Authentication Routes', () => {
    test('GET /auth/login should return login page', async () => {
      const response = await request(app)
        .get('/auth/login')
        .expect(200);

      expect(response.text).toContain('Login');
      expect(response.text).toContain('username');
      expect(response.text).toContain('password');
    });

    test('GET /auth/register should return register page', async () => {
      const response = await request(app)
        .get('/auth/register')
        .expect(200);

      expect(response.text).toContain('Register');
      expect(response.text).toContain('username');
      expect(response.text).toContain('email');
    });

    test('POST /auth/login should authenticate user', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          username: 'testadmin',
          password: 'password123'
        })
        .expect(302);

      expect(response.headers.location).toBe('/');
    });

    test('POST /auth/login should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          username: 'testadmin',
          password: 'wrongpassword'
        })
        .expect(400);

      expect(response.text).toContain('Invalid username or password');
    });

    test('POST /auth/register should create new user', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          username: 'newuser',
          email: 'newuser@test.com',
          password: 'password123',
          confirmPassword: 'password123',
          firstName: 'New',
          lastName: 'User'
        })
        .expect(302);

      expect(response.headers.location).toBe('/auth/login');
    });

    test('POST /auth/logout should logout user', async () => {
      // First login
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          username: 'testadmin',
          password: 'password123'
        });

      // Get session cookie
      const cookies = loginResponse.headers['set-cookie'];

      // Then logout
      const response = await request(app)
        .post('/auth/logout')
        .set('Cookie', cookies)
        .expect(302);

      expect(response.headers.location).toContain('/auth/login');
    });
  });

  describe('Admin Routes', () => {
    let adminCookies;

    beforeEach(async () => {
      // Login as admin before each test
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          username: 'testadmin',
          password: 'password123'
        });

      adminCookies = loginResponse.headers['set-cookie'];
    });

    test('GET /admin should return admin dashboard', async () => {
      const response = await request(app)
        .get('/admin')
        .set('Cookie', adminCookies)
        .expect(200);

      expect(response.text).toContain('Admin Dashboard');
      expect(response.text).toContain('Users');
      expect(response.text).toContain('Events');
    });

    test('GET /admin/users should return user management page', async () => {
      const response = await request(app)
        .get('/admin/users')
        .set('Cookie', adminCookies)
        .expect(200);

      expect(response.text).toContain('User Management');
      expect(response.text).toContain('testadmin');
      expect(response.text).toContain('testuser');
    });

    test('PUT /admin/users/:userId/role should update user role', async () => {
      const response = await request(app)
        .put('/admin/users/2/role')
        .set('Cookie', adminCookies)
        .send({ role: 'admin' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('DELETE /admin/users/:userId should delete user', async () => {
      const response = await request(app)
        .delete('/admin/users/2')
        .set('Cookie', adminCookies)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('GET /admin should redirect to login for unauthenticated user', async () => {
      const response = await request(app)
        .get('/admin')
        .expect(302);

      expect(response.headers.location).toContain('/auth/login');
    });
  });

  describe('Error Handling', () => {
    test('Should handle 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/non-existent-route')
        .expect(404);
    });

    test('Should handle invalid JSON in API requests', async () => {
      const response = await request(app)
        .post('/api/v1/events')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);
    });
  });
});
