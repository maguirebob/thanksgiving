const request = require('supertest');
const express = require('express');
const session = require('express-session');
const db = require('../../models');
const DatabaseHelper = require('../helpers/database');
const { 
  requireAuth, 
  requireAdmin, 
  addUserToLocals, 
  requireAuthView, 
  requireAdminView 
} = require('../../src/middleware/auth');

describe('Auth Middleware', () => {
  let app;

  // Helper function to create test app with session support
  const createTestApp = () => {
    const testApp = express();
    testApp.use(express.json());
    testApp.use(session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false
    }));

    // Route to set session data for testing
    testApp.get('/set-session', (req, res) => {
      req.session.userId = parseInt(req.query.userId);
      req.session.username = req.query.username;
      req.session.role = req.query.role;
      res.json({ message: 'Session set' });
    });

    return testApp;
  };

  beforeAll(async () => {
    await DatabaseHelper.setup();
  });

  afterAll(async () => {
    await DatabaseHelper.cleanup();
  });

  beforeEach(async () => {
    await DatabaseHelper.clearDatabase();
    await DatabaseHelper.insertTestData();
  });

  describe('requireAuth', () => {
    test('should allow authenticated user', async () => {
      app = createTestApp();
      app.get('/protected', requireAuth, (req, res) => {
        res.json({ message: 'Access granted', user: req.user.username });
      });

      const agent = request.agent(app);
      
      // Manually set session data (simulate login)
      await agent
        .get('/set-session')
        .query({ userId: 1, username: 'testadmin', role: 'admin' });

      const response = await agent
        .get('/protected')
        .expect(200);

      expect(response.body.message).toBe('Access granted');
      expect(response.body.user).toBe('testadmin');
    });

    test('should reject unauthenticated user', async () => {
      app = express();
      app.use(express.json());
      app.use(session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false
      }));

      app.get('/protected', requireAuth, (req, res) => {
        res.json({ message: 'Access granted' });
      });

      const response = await request(app)
        .get('/protected')
        .expect(401);

      expect(response.body.error).toContain('Authentication required');
    });
  });

  describe('requireAdmin', () => {
    test('should allow admin user', async () => {
      app = express();
      app.use(express.json());
      app.use(session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false
      }));

      app.get('/set-session', (req, res) => {
        req.session.userId = parseInt(req.query.userId);
        req.session.username = req.query.username;
        req.session.role = req.query.role;
        res.json({ message: 'Session set' });
      });

      app.get('/admin-protected', requireAdmin, (req, res) => {
        res.json({ message: 'Admin access granted', user: req.user.username });
      });

      const agent = request.agent(app);
      
      // Manually set session data (simulate admin login)
      await agent
        .get('/set-session')
        .query({ userId: 1, username: 'testadmin', role: 'admin' });

      const response = await agent
        .get('/admin-protected')
        .expect(200);

      expect(response.body.message).toBe('Admin access granted');
      expect(response.body.user).toBe('testadmin');
    });

    test('should reject non-admin user', async () => {
      app = express();
      app.use(express.json());
      app.use(session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false
      }));

      app.get('/admin-protected', requireAdmin, (req, res) => {
        res.json({ message: 'Admin access granted' });
      });

      const agent = request.agent(app);
      
      // Login as regular user
      await agent
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'password123'
        });

      const response = await agent
        .get('/admin-protected')
        .expect(403);

      expect(response.body.error).toContain('Admin access required');
    });

    test('should reject unauthenticated user', async () => {
      app = express();
      app.use(express.json());
      app.use(session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false
      }));

      app.get('/admin-protected', requireAdmin, (req, res) => {
        res.json({ message: 'Admin access granted' });
      });

      const response = await request(app)
        .get('/admin-protected')
        .expect(401);

      expect(response.body.error).toContain('Authentication required');
    });
  });

  describe('addUserToLocals', () => {
    test('should add user to locals for authenticated user', async () => {
      app = express();
      app.use(express.json());
      app.use(session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false
      }));

      app.get('/test', addUserToLocals, (req, res) => {
        res.json({
          isAuthenticated: res.locals.isAuthenticated,
          user: res.locals.user ? res.locals.user.username : null,
          isAdmin: res.locals.isAdmin
        });
      });

      const agent = request.agent(app);
      
      // Login as admin
      await agent
        .post('/auth/login')
        .send({
          username: 'testadmin',
          password: 'password123'
        });

      const response = await agent
        .get('/test')
        .expect(200);

      expect(response.body.isAuthenticated).toBe(true);
      expect(response.body.user).toBe('testadmin');
      expect(response.body.isAdmin).toBe(true);
    });

    test('should set defaults for unauthenticated user', async () => {
      app = express();
      app.use(express.json());
      app.use(session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false
      }));

      app.get('/test', addUserToLocals, (req, res) => {
        res.json({
          isAuthenticated: res.locals.isAuthenticated,
          user: res.locals.user,
          isAdmin: res.locals.isAdmin
        });
      });

      const response = await request(app)
        .get('/test')
        .expect(200);

      expect(response.body.isAuthenticated).toBe(false);
      expect(response.body.user).toBeNull();
      expect(response.body.isAdmin).toBe(false);
    });
  });

  describe('requireAuthView', () => {
    test('should allow authenticated user', async () => {
      app = createTestApp();
      app.get('/protected-view', requireAuthView, (req, res) => {
        res.json({ message: 'View access granted', user: req.user.username });
      });

      const agent = request.agent(app);
      
      // Manually set session data (simulate login)
      await agent
        .get('/set-session')
        .query({ userId: 1, username: 'testadmin', role: 'admin' });

      const response = await agent
        .get('/protected-view')
        .expect(200);

      expect(response.body.message).toBe('View access granted');
      expect(response.body.user).toBe('testadmin');
    });

    test('should redirect unauthenticated user to login', async () => {
      app = express();
      app.use(express.json());
      app.use(session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false
      }));

      app.get('/protected-view', requireAuthView, (req, res) => {
        res.json({ message: 'View access granted' });
      });

      const response = await request(app)
        .get('/protected-view')
        .expect(302);

      expect(response.headers.location).toContain('/auth/login');
    });

    test('should handle invalid session user', async () => {
      app = express();
      app.use(express.json());
      app.use(session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false
      }));

      app.get('/protected-view', requireAuthView, (req, res) => {
        res.json({ message: 'View access granted' });
      });

      const agent = request.agent(app);
      
      // Create session with invalid user ID
      await agent
        .post('/auth/login')
        .send({
          username: 'testadmin',
          password: 'password123'
        });

      // Manually set invalid user ID in session
      const response = await agent
        .get('/protected-view')
        .expect(302);

      expect(response.headers.location).toContain('/auth/login');
    });
  });

  describe('requireAdminView', () => {
    test('should allow admin user', async () => {
      app = express();
      app.use(express.json());
      app.use(session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false
      }));

      app.get('/admin-view', requireAdminView, (req, res) => {
        res.json({ message: 'Admin view access granted', user: req.user.username });
      });

      const agent = request.agent(app);
      
      // Login as admin
      await agent
        .post('/auth/login')
        .send({
          username: 'testadmin',
          password: 'password123'
        });

      const response = await agent
        .get('/admin-view')
        .expect(200);

      expect(response.body.message).toBe('Admin view access granted');
      expect(response.body.user).toBe('testadmin');
    });

    test('should redirect non-admin user to login', async () => {
      app = express();
      app.use(express.json());
      app.use(session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false
      }));

      app.get('/admin-view', requireAdminView, (req, res) => {
        res.json({ message: 'Admin view access granted' });
      });

      const agent = request.agent(app);
      
      // Login as regular user
      await agent
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'password123'
        });

      const response = await agent
        .get('/admin-view')
        .expect(403);

      expect(response.text).toContain('Access Denied');
    });

    test('should redirect unauthenticated user to login', async () => {
      app = express();
      app.use(express.json());
      app.use(session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false
      }));

      app.get('/admin-view', requireAdminView, (req, res) => {
        res.json({ message: 'Admin view access granted' });
      });

      const response = await request(app)
        .get('/admin-view')
        .expect(302);

      expect(response.headers.location).toContain('/auth/login');
    });
  });

  describe('Error Handling', () => {
    test('should handle database errors in requireAuthView', async () => {
      app = express();
      app.use(express.json());
      app.use(session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false
      }));

      app.get('/protected-view', requireAuthView, (req, res) => {
        res.json({ message: 'View access granted' });
      });

      const agent = request.agent(app);
      
      // Login first
      await agent
        .post('/auth/login')
        .send({
          username: 'testadmin',
          password: 'password123'
        });

      // Mock database error
      const originalFindByPk = db.User.findByPk;
      db.User.findByPk = jest.fn().mockRejectedValue(new Error('Database error'));

      const response = await agent
        .get('/protected-view')
        .expect(302);

      expect(response.headers.location).toContain('/auth/login');

      // Restore original method
      db.User.findByPk = originalFindByPk;
    });

    test('should handle database errors in requireAdminView', async () => {
      app = express();
      app.use(express.json());
      app.use(session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false
      }));

      app.get('/admin-view', requireAdminView, (req, res) => {
        res.json({ message: 'Admin view access granted' });
      });

      const agent = request.agent(app);
      
      // Login as admin
      await agent
        .post('/auth/login')
        .send({
          username: 'testadmin',
          password: 'password123'
        });

      // Mock database error
      const originalFindByPk = db.User.findByPk;
      db.User.findByPk = jest.fn().mockRejectedValue(new Error('Database error'));

      const response = await agent
        .get('/admin-view')
        .expect(302);

      expect(response.headers.location).toContain('/auth/login');

      // Restore original method
      db.User.findByPk = originalFindByPk;
    });
  });
});
