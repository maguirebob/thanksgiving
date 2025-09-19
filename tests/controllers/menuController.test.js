const request = require('supertest');
const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const jwt = require('jsonwebtoken');
const db = require('../../models');
const DatabaseHelper = require('../helpers/database');
const menuRoutes = require('../../src/routes/menuRoutes');
const { addUserToLocals } = require('../../src/middleware/auth');

describe('Menu Controller', () => {
  let app;
  let authToken;

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
    app.use('/', menuRoutes);
    
    // Add API routes
    const apiRoutes = require('../../src/routes/apiRoutes');
    app.use('/api/v1', apiRoutes);
    
    // Add error handling middleware
    app.use((err, req, res, next) => {
      console.error('Error in test:', err);
      console.error('Error stack:', err.stack);
      res.status(500).json({ 
        error: err.message,
        stack: err.stack,
        name: err.name
      });
    });
  });

  afterAll(async () => {
    await DatabaseHelper.cleanup();
  });

  beforeEach(async () => {
    await DatabaseHelper.clearDatabase();
    await DatabaseHelper.insertTestData();
    
    // Create auth token for API requests
    authToken = jwt.sign(
      { id: 1, username: 'testuser', role: 'user' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  describe('getAllMenus', () => {
    test('should return all menus with correct data structure', async () => {
      // Test the service directly instead of through the route
      const menuService = require('../../src/services/menuService');
      const menus = await menuService.getAllMenus();
      
      expect(menus).toHaveLength(2);
      expect(menus[0]).toHaveProperty('event_id');
      expect(menus[0]).toHaveProperty('title');
      expect(menus[0]).toHaveProperty('year');
    });

    test('should handle empty menu list', async () => {
      // Clear all events
      await db.Event.destroy({ where: {} });
      
      const menuService = require('../../src/services/menuService');
      const menus = await menuService.getAllMenus();
      
      expect(menus).toHaveLength(0);
    });
  });

  describe('getMenuById', () => {
    test('should return specific menu with all details', async () => {
      const menuService = require('../../src/services/menuService');
      const menu = await menuService.getMenuById(1);
      
      expect(menu).toBeTruthy();
      expect(menu.event_id).toBe(1);
      expect(menu.title).toBe('Thanksgiving 2020');
    });

    test('should return null for non-existent menu', async () => {
      const menuService = require('../../src/services/menuService');
      const menu = await menuService.getMenuById(999);
      
      expect(menu).toBeNull();
    });

    test('should handle invalid menu ID format', async () => {
      const menuService = require('../../src/services/menuService');
      
      await expect(menuService.getMenuById('invalid')).rejects.toThrow('Invalid menu ID');
    });
  });

  describe('getAllMenusAPI', () => {
    test('should return JSON response with all menus', async () => {
      const response = await request(app)
        .get('/api/v1/events')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0]).toHaveProperty('event_name');
      expect(response.body.data[0]).toHaveProperty('event_date');
      expect(response.body.data[0]).toHaveProperty('description');
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .get('/api/v1/events')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Access token required');
    });

    test('should support year filtering', async () => {
      const response = await request(app)
        .get('/api/v1/events?year=2020')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(new Date(response.body.data[0].event_date).getFullYear()).toBe(2020);
    });

    test('should support limit parameter', async () => {
      const response = await request(app)
        .get('/api/v1/events?limit=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });

    test('should support offset parameter', async () => {
      const response = await request(app)
        .get('/api/v1/events?offset=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('getMenuByIdAPI', () => {
    test('should return specific menu as JSON', async () => {
      const response = await request(app)
        .get('/api/v1/events/1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(1);
      expect(response.body.data.event_name).toBe('Thanksgiving 2020');
      expect(response.body.data.description).toBeDefined();
    });

    test('should return 404 for non-existent menu', async () => {
      const response = await request(app)
        .get('/api/v1/events/999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .get('/api/v1/events/1')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Access token required');
    });
  });

  describe('createMenuAPI', () => {
    test('should create new menu with valid data', async () => {
      const newMenu = {
        event_name: 'Thanksgiving 2022',
        event_type: 'Thanksgiving',
        event_date: '2022-11-24',
        event_location: 'Test Location 2022',
        description: 'Test Thanksgiving 2022',
        menu_image_url: '/images/2022_Menu.jpeg'
      };

      const response = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newMenu);

      console.log('Create menu response status:', response.status);
      console.log('Create menu response body:', response.body);
      
      if (response.status !== 201) {
        console.log('Error response:', response.status, response.body);
      }
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.event_name).toBe('Thanksgiving 2022');
      expect(response.body.data.event_type).toBe('Thanksgiving');
    });

    test('should validate required fields', async () => {
      const invalidMenu = {
        event_name: 'Incomplete Menu'
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidMenu)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Validation');
    });

    test('should validate date format', async () => {
      const invalidMenu = {
        event_name: 'Invalid Date Menu',
        event_type: 'Thanksgiving',
        event_date: 'invalid-date',
        event_location: 'Test',
        description: 'Test',
        menu_image_url: '/images/test.jpg'
      };

      const response = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidMenu)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should require authentication', async () => {
      const newMenu = {
        event_name: 'Test Menu',
        event_type: 'Thanksgiving',
        event_date: '2022-11-24',
        event_location: 'Test',
        description: 'Test',
        menu_image_url: '/images/test.jpg'
      };

      const response = await request(app)
        .post('/api/v1/events')
        .send(newMenu)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Access token required');
    });
  });

  describe('updateMenuAPI', () => {
    test('should update existing menu', async () => {
      const updateData = {
        event_name: 'Updated Thanksgiving 2020',
        description: 'Updated description'
      };

      const response = await request(app)
        .put('/api/v1/events/1')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.event_name).toBe('Updated Thanksgiving 2020');
    });

    test('should return 404 for non-existent menu', async () => {
      const updateData = {
        event_name: 'Updated Title'
      };

      const response = await request(app)
        .put('/api/v1/events/999')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('should require authentication', async () => {
      const updateData = {
        event_name: 'Updated Title'
      };

      const response = await request(app)
        .put('/api/v1/events/1')
        .send(updateData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Access token required');
    });
  });

  describe('deleteMenuAPI', () => {
    test('should delete existing menu', async () => {
      const response = await request(app)
        .delete('/api/v1/events/1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify menu is deleted
      const getResponse = await request(app)
        .get('/api/v1/events/1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    test('should return 404 for non-existent menu', async () => {
      const response = await request(app)
        .delete('/api/v1/events/999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .delete('/api/v1/events/1')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Access token required');
    });
  });
});
