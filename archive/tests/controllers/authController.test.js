const request = require('supertest');
const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const db = require('../../models');
const DatabaseHelper = require('../helpers/database');
const authRoutes = require('../../src/routes/authRoutes');
const { addUserToLocals } = require('../../src/middleware/auth');

describe('Auth Controller', () => {
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
  });

  afterAll(async () => {
    await DatabaseHelper.cleanup();
  });

  beforeEach(async () => {
    await DatabaseHelper.clearDatabase();
    await DatabaseHelper.insertTestData();
  });

  describe('showLoginForm', () => {
    test('should return login form', async () => {
      const response = await request(app)
        .get('/auth/login')
        .expect(200);

      expect(response.text).toContain('Login');
      expect(response.text).toContain('username');
      expect(response.text).toContain('password');
      expect(response.text).toContain('form');
    });

    test('should display success message if provided', async () => {
      const response = await request(app)
        .get('/auth/login?success=Login successful')
        .expect(200);

      expect(response.text).toContain('Login successful');
    });

    test('should display error message if provided', async () => {
      const response = await request(app)
        .get('/auth/login?error=Login failed')
        .expect(200);

      expect(response.text).toContain('Login failed');
    });
  });

  describe('login', () => {
    test('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          username: 'testadmin',
          password: 'password123'
        })
        .expect(302);

      expect(response.headers.location).toBe('/');
    });

    test('should login with email instead of username', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          username: 'admin@test.com',
          password: 'password123'
        })
        .expect(302);

      expect(response.headers.location).toBe('/');
    });

    test('should reject invalid username', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          username: 'nonexistent',
          password: 'password123'
        })
        .expect(400);

      expect(response.text).toContain('Invalid username or password');
    });

    test('should reject invalid password', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          username: 'testadmin',
          password: 'wrongpassword'
        })
        .expect(400);

      expect(response.text).toContain('Invalid username or password');
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          username: '',
          password: ''
        })
        .expect(400);

      expect(response.text).toContain('Username is required');
      expect(response.text).toContain('Password is required');
    });

    test('should maintain session after login', async () => {
      const agent = request.agent(app);
      
      const loginResponse = await agent
        .post('/auth/login')
        .send({
          username: 'testadmin',
          password: 'password123'
        })
        .expect(302);

      // Test that session is maintained
      const profileResponse = await agent
        .get('/auth/profile')
        .expect(200);

      expect(profileResponse.text).toContain('testadmin');
    });
  });

  describe('showRegisterForm', () => {
    test('should return registration form', async () => {
      const response = await request(app)
        .get('/auth/register')
        .expect(200);

      expect(response.text).toContain('Register');
      expect(response.text).toContain('username');
      expect(response.text).toContain('email');
      expect(response.text).toContain('password');
      expect(response.text).toContain('form');
    });
  });

  describe('register', () => {
    test('should register new user with valid data', async () => {
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

      // Verify user was created
      const user = await db.User.findOne({ where: { username: 'newuser' } });
      expect(user).toBeTruthy();
      expect(user.email).toBe('newuser@test.com');
    });

    test('should reject duplicate username', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          username: 'testadmin', // Already exists
          email: 'newemail@test.com',
          password: 'password123',
          confirmPassword: 'password123',
          firstName: 'New',
          lastName: 'User'
        })
        .expect(400);

      expect(response.text).toContain('Username already exists');
    });

    test('should reject duplicate email', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          username: 'newuser',
          email: 'admin@test.com', // Already exists
          password: 'password123',
          confirmPassword: 'password123',
          firstName: 'New',
          lastName: 'User'
        })
        .expect(400);

      expect(response.text).toContain('Email already exists');
    });

    test('should validate password confirmation', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          username: 'newuser',
          email: 'newuser@test.com',
          password: 'password123',
          confirmPassword: 'differentpassword',
          firstName: 'New',
          lastName: 'User'
        })
        .expect(400);

      expect(response.text).toContain('Passwords do not match');
    });

    test('should validate email format', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          username: 'newuser',
          email: 'invalid-email',
          password: 'password123',
          confirmPassword: 'password123',
          firstName: 'New',
          lastName: 'User'
        })
        .expect(400);

      expect(response.text).toContain('Please enter a valid email');
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          username: '',
          email: '',
          password: '',
          confirmPassword: '',
          firstName: '',
          lastName: ''
        })
        .expect(400);

      expect(response.text).toContain('Username is required');
      expect(response.text).toContain('Email is required');
      expect(response.text).toContain('Password is required');
    });
  });

  describe('logout', () => {
    test('should logout authenticated user', async () => {
      const agent = request.agent(app);
      
      // First login
      await agent
        .post('/auth/login')
        .send({
          username: 'testadmin',
          password: 'password123'
        });

      // Then logout
      const response = await agent
        .post('/auth/logout')
        .expect(302);

      expect(response.headers.location).toContain('/auth/login');
    });

    test('should handle logout for unauthenticated user', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .expect(302);

      expect(response.headers.location).toContain('/auth/login');
    });
  });

  describe('showProfile', () => {
    test('should show profile for authenticated user', async () => {
      const agent = request.agent(app);
      
      // Login first
      await agent
        .post('/auth/login')
        .send({
          username: 'testadmin',
          password: 'password123'
        });

      const response = await agent
        .get('/auth/profile')
        .expect(200);

      expect(response.text).toContain('Profile');
      expect(response.text).toContain('testadmin');
      expect(response.text).toContain('admin@test.com');
    });

    test('should redirect to login for unauthenticated user', async () => {
      const response = await request(app)
        .get('/auth/profile')
        .expect(302);

      expect(response.headers.location).toContain('/auth/login');
    });
  });

  describe('updateProfile', () => {
    test('should update profile for authenticated user', async () => {
      const agent = request.agent(app);
      
      // Login first
      await agent
        .post('/auth/login')
        .send({
          username: 'testadmin',
          password: 'password123'
        });

      const response = await agent
        .post('/auth/profile')
        .send({
          firstName: 'Updated',
          lastName: 'Admin',
          email: 'updated@test.com'
        })
        .expect(302);

      expect(response.headers.location).toContain('/auth/profile');

      // Verify update
      const user = await db.User.findOne({ where: { username: 'testadmin' } });
      expect(user.first_name).toBe('Updated');
      expect(user.last_name).toBe('Admin');
      expect(user.email).toBe('updated@test.com');
    });

    test('should redirect to login for unauthenticated user', async () => {
      const response = await request(app)
        .post('/auth/profile')
        .send({
          firstName: 'Test'
        })
        .expect(302);

      expect(response.headers.location).toContain('/auth/login');
    });
  });
});
