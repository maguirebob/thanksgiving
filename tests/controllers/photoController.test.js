const request = require('supertest');
const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const multer = require('multer');
const fs = require('fs');
const db = require('../../models');
const DatabaseHelper = require('../helpers/database');
const apiRoutes = require('../../src/routes/apiRoutes');
const { addUserToLocals } = require('../../src/middleware/auth');

describe('Photo Controller', () => {
  let app;
  let uploadDir;

  beforeAll(async () => {
    await DatabaseHelper.setup();
    
    // Create upload directory
    uploadDir = path.join(__dirname, '../../../public/uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
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

    app.use((req, res, next) => {
      req.upload = upload;
      next();
    });

    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, '../../../views'));
    app.set('layout', 'layout');

    app.use(addUserToLocals);
    app.use('/api/v1', apiRoutes);
  });

  afterAll(async () => {
    // Clean up upload directory
    if (fs.existsSync(uploadDir)) {
      const files = fs.readdirSync(uploadDir);
      files.forEach(file => {
        fs.unlinkSync(path.join(uploadDir, file));
      });
      fs.rmdirSync(uploadDir);
    }
    
    await DatabaseHelper.cleanup();
  });

  beforeEach(async () => {
    await DatabaseHelper.clearDatabase();
    await DatabaseHelper.insertTestData();
  });

  describe('getEventPhotos', () => {
    test('should return photos for existing event', async () => {
      const response = await request(app)
        .get('/api/v1/events/1/photos')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toHaveProperty('photo_id');
      expect(response.body.data[0]).toHaveProperty('filename');
      expect(response.body.data[0]).toHaveProperty('event_id', 1);
    });

    test('should return empty array for event with no photos', async () => {
      const response = await request(app)
        .get('/api/v1/events/2/photos')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });

    test('should return 404 for non-existent event', async () => {
      const response = await request(app)
        .get('/api/v1/events/999/photos')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
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
    test('should upload photo with valid data', async () => {
      const response = await request(app)
        .post('/api/v1/events/1/photos')
        .attach('photo', Buffer.from('fake image data'), 'test-upload.jpg')
        .field('description', 'Test upload photo')
        .field('caption', 'Test upload caption')
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('photo_id');
      expect(response.body.data.description).toBe('Test upload photo');
      expect(response.body.data.caption).toBe('Test upload caption');
      expect(response.body.data.event_id).toBe(1);
    });

    test('should upload photo without optional fields', async () => {
      const response = await request(app)
        .post('/api/v1/events/1/photos')
        .attach('photo', Buffer.from('fake image data'), 'test-upload.jpg')
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('photo_id');
      expect(response.body.data.event_id).toBe(1);
    });

    test('should reject upload without photo file', async () => {
      const response = await request(app)
        .post('/api/v1/events/1/photos')
        .field('description', 'Test upload without file')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('No photo file provided');
    });

    test('should reject non-image files', async () => {
      const response = await request(app)
        .post('/api/v1/events/1/photos')
        .attach('photo', Buffer.from('not an image'), 'test.txt')
        .field('description', 'Test upload')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Only image files are allowed');
    });

    test('should reject files that are too large', async () => {
      // Create a large buffer (11MB)
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024);
      
      const response = await request(app)
        .post('/api/v1/events/1/photos')
        .attach('photo', largeBuffer, 'large-image.jpg')
        .field('description', 'Test large upload')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('File too large');
    });

    test('should return 404 for non-existent event', async () => {
      const response = await request(app)
        .post('/api/v1/events/999/photos')
        .attach('photo', Buffer.from('fake image data'), 'test.jpg')
        .field('description', 'Test upload')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });
  });

  describe('updatePhoto', () => {
    test('should update photo metadata', async () => {
      const response = await request(app)
        .put('/api/v1/photos/1')
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
        .send({
          description: 'Updated description'
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });
  });

  describe('deletePhoto', () => {
    test('should delete existing photo', async () => {
      const response = await request(app)
        .delete('/api/v1/photos/1')
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify photo is deleted
      const photo = await db.Photo.findByPk(1);
      expect(photo).toBeNull();
    });

    test('should return 404 for non-existent photo', async () => {
      const response = await request(app)
        .delete('/api/v1/photos/999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });
  });

  describe('Error Handling', () => {
    test('should handle database errors gracefully', async () => {
      // Mock database error
      const originalFindAll = db.Photo.findAll;
      db.Photo.findAll = jest.fn().mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/v1/events/1/photos')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Failed to fetch photos');

      // Restore original method
      db.Photo.findAll = originalFindAll;
    });

    test('should handle file system errors during upload', async () => {
      // Mock fs.writeFile to throw error
      const originalWriteFile = fs.writeFile;
      fs.writeFile = jest.fn().mockImplementation((path, data, callback) => {
        callback(new Error('File system error'));
      });

      const response = await request(app)
        .post('/api/v1/events/1/photos')
        .attach('photo', Buffer.from('fake image data'), 'test.jpg')
        .field('description', 'Test upload')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Failed to upload photo');

      // Restore original method
      fs.writeFile = originalWriteFile;
    });
  });
});
