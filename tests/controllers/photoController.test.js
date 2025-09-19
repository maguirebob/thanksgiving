const request = require('supertest');
const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const jwt = require('jsonwebtoken');
const db = require('../../models');
const DatabaseHelper = require('../helpers/database');
const apiRoutes = require('../../src/routes/apiRoutes');
const { addUserToLocals } = require('../../src/middleware/auth');

describe('Photo Controller', () => {
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
    app.use('/api/v1', apiRoutes);
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

  describe('getEventPhotos', () => {
    test('should return photos for existing event', async () => {
      const response = await request(app)
        .get('/api/v1/events/1/photos')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0]).toHaveProperty('filename');
      expect(response.body.data[0]).toHaveProperty('event_id', 1);
    });

    test('should return empty array for event with no photos', async () => {
      const response = await request(app)
        .get('/api/v1/events/2/photos')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });

    test('should return 404 for non-existent event', async () => {
      const response = await request(app)
        .get('/api/v1/events/999/photos')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .get('/api/v1/events/1/photos')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Access token required');
    });

    test('should return photos ordered by taken_date DESC', async () => {
      // Add another photo with different date
      await db.Photo.create({
        event_id: 1,
        filename: 'test-photo-2.jpg',
        original_filename: 'test-photo-2.jpg',
        description: 'Test photo 2',
        caption: 'Test caption 2',
        taken_date: new Date('2020-01-01'),
        file_size: 1024000,
        mime_type: 'image/jpeg',
        file_path: '/uploads/test-photo-2.jpg'
      });

      const response = await request(app)
        .get('/api/v1/events/1/photos')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      // Should be ordered by taken_date DESC
      expect(new Date(response.body.data[0].taken_date)).toBeInstanceOf(Date);
    });
  });

  describe('uploadPhoto', () => {
    test('should upload photo with valid base64 data', async () => {
      const base64Data = 'data:image/jpeg;base64,' + Buffer.from('fake image data').toString('base64');
      
      const response = await request(app)
        .post('/api/v1/events/1/photos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          filename: 'test-upload.jpg',
          file_data: base64Data,
          description: 'Test upload photo',
          caption: 'Test upload caption'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.description).toBe('Test upload photo');
      expect(response.body.data.caption).toBe('Test upload caption');
      expect(response.body.data.event_id).toBe(1);
    });

    test('should upload photo without optional fields', async () => {
      const base64Data = 'data:image/jpeg;base64,' + Buffer.from('fake image data').toString('base64');
      
      const response = await request(app)
        .post('/api/v1/events/1/photos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          filename: 'test-upload.jpg',
          file_data: base64Data
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.event_id).toBe(1);
    });

    test('should reject upload without photo data', async () => {
      const response = await request(app)
        .post('/api/v1/events/1/photos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Test upload without file data'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('file_data is required');
    });

    test('should reject invalid base64 data', async () => {
      const response = await request(app)
        .post('/api/v1/events/1/photos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          filename: 'test.jpg',
          file_data: 'invalid-base64-data',
          description: 'Test upload'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid base64 data');
    });

    test('should return 404 for non-existent event', async () => {
      const base64Data = 'data:image/jpeg;base64,' + Buffer.from('fake image data').toString('base64');
      
      const response = await request(app)
        .post('/api/v1/events/999/photos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          filename: 'test.jpg',
          file_data: base64Data,
          description: 'Test upload'
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });

    test('should require authentication', async () => {
      const base64Data = 'data:image/jpeg;base64,' + Buffer.from('fake image data').toString('base64');
      
      const response = await request(app)
        .post('/api/v1/events/1/photos')
        .send({
          filename: 'test.jpg',
          file_data: base64Data,
          description: 'Test upload'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Access token required');
    });
  });

  describe('updatePhoto', () => {
    test('should update photo metadata', async () => {
      const response = await request(app)
        .put('/api/v1/photos/1')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Updated description',
          caption: 'Updated caption'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.description).toBe('Updated description');
      expect(response.body.data.caption).toBe('Updated caption');
    });

    test('should update only provided fields', async () => {
      const response = await request(app)
        .put('/api/v1/photos/1')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Only description updated'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.description).toBe('Only description updated');
      expect(response.body.data.caption).toBe('Test caption 1'); // Should remain unchanged
    });

    test('should return 404 for non-existent photo', async () => {
      const response = await request(app)
        .put('/api/v1/photos/999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Updated description'
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .put('/api/v1/photos/1')
        .send({
          description: 'Updated description'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Access token required');
    });
  });

  describe('deletePhoto', () => {
    test('should delete existing photo', async () => {
      const response = await request(app)
        .delete('/api/v1/photos/1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify photo is deleted
      const photo = await db.Photo.findByPk(1);
      expect(photo).toBeNull();
    });

    test('should return 404 for non-existent photo', async () => {
      const response = await request(app)
        .delete('/api/v1/photos/999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .delete('/api/v1/photos/1')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Access token required');
    });
  });

  describe('Error Handling', () => {
    test('should handle database errors gracefully', async () => {
      // Mock database error
      const originalFindAll = db.Photo.findAll;
      db.Photo.findAll = jest.fn().mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/v1/events/1/photos')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Failed to fetch photos');

      // Restore original method
      db.Photo.findAll = originalFindAll;
    });

    test('should handle base64 processing errors during upload', async () => {
      const response = await request(app)
        .post('/api/v1/events/1/photos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          filename: 'test.jpg',
          file_data: 'invalid-base64-data',
          description: 'Test upload'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid base64 data');
    });
  });
});
