const request = require('supertest');
const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const db = require('../../models');
const DatabaseHelper = require('../helpers/database');
const menuRoutes = require('../../src/routes/menuRoutes');
const { addUserToLocals } = require('../../src/middleware/auth');

describe('Menu Controller', () => {
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
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty('event_id');
      expect(response.body.data[0]).toHaveProperty('year');
      expect(response.body.data[0]).toHaveProperty('title');
      expect(response.body.data[0]).toHaveProperty('menu_items');
    });

    test('should support year filtering', async () => {
      const response = await request(app)
        .get('/api/v1/events?year=2020')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].year).toBe(2020);
    });

    test('should support limit parameter', async () => {
      const response = await request(app)
        .get('/api/v1/events?limit=1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });

    test('should support offset parameter', async () => {
      const response = await request(app)
        .get('/api/v1/events?offset=1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('getMenuByIdAPI', () => {
    test('should return specific menu as JSON', async () => {
      const response = await request(app)
        .get('/api/v1/events/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.event_id).toBe(1);
      expect(response.body.data.title).toBe('Thanksgiving 2020');
      expect(response.body.data.menu_items).toBeDefined();
    });

    test('should return 404 for non-existent menu', async () => {
      const response = await request(app)
        .get('/api/v1/events/999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });
  });

  describe('createMenuAPI', () => {
    test('should create new menu with valid data', async () => {
      const newMenu = {
        year: 2022,
        title: 'Thanksgiving 2022',
        description: 'Test Thanksgiving 2022',
        date: '2022-11-24',
        location: 'Test Location 2022',
        host: 'Test Host 2022',
        menu_items: [
          { item: 'Roast Beef', category: 'Main Course' },
          { item: 'Sweet Potatoes', category: 'Side Dish' }
        ]
      };

      const response = await request(app)
        .post('/api/v1/events')
        .send(newMenu);

      console.log('Create menu response status:', response.status);
      console.log('Create menu response body:', response.body);
      
      if (response.status !== 201) {
        console.log('Error response:', response.status, response.body);
      }
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Thanksgiving 2022');
      expect(response.body.data.year).toBe(2022);
    });

    test('should validate required fields', async () => {
      const invalidMenu = {
        title: 'Incomplete Menu'
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/v1/events')
        .send(invalidMenu)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Validation');
    });

    test('should validate year format', async () => {
      const invalidMenu = {
        year: 'invalid-year',
        title: 'Invalid Year Menu',
        description: 'Test',
        date: '2022-11-24',
        location: 'Test',
        host: 'Test',
        menu_items: []
      };

      const response = await request(app)
        .post('/api/v1/events')
        .send(invalidMenu)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('updateMenuAPI', () => {
    test('should update existing menu', async () => {
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

    test('should return 404 for non-existent menu', async () => {
      const updateData = {
        title: 'Updated Title'
      };

      const response = await request(app)
        .put('/api/v1/events/999')
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('deleteMenuAPI', () => {
    test('should delete existing menu', async () => {
      const response = await request(app)
        .delete('/api/v1/events/1')
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify menu is deleted
      const getResponse = await request(app)
        .get('/api/v1/events/1')
        .expect(404);
    });

    test('should return 404 for non-existent menu', async () => {
      const response = await request(app)
        .delete('/api/v1/events/999')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});
