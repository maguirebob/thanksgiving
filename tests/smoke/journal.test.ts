import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import expressLayouts from 'express-ejs-layouts';
import { config } from '../../src/lib/config';
import authRoutes from '../../src/routes/authRoutes';
import adminRoutes from '../../src/routes/adminRoutes';
import photoRoutes from '../../src/routes/photoRoutes';
import blogRoutes from '../../src/routes/blogRoutes';
import eventRoutes from '../../src/routes/eventRoutes';
import carouselRoutes from '../../src/routes/carouselRoutes';
import journalRoutes from '../../src/routes/journalRoutes';
import photoTypeRoutes from '../../src/routes/photoTypeRoutes';
import { addUserToLocals } from '../../src/middleware/auth';

// Create test app without starting server
const createTestApp = () => {
  const app = express();

  // Middleware setup (same as server.ts but without listening)
  app.use(cors({
    origin: true,
    credentials: true
  }));

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://code.jquery.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    }
  }));

  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
  });
  app.use('/api/', limiter);

  // Session configuration
  app.use(session({
    secret: config.getConfig().sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: config.getConfig().nodeEnv === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // View engine setup
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, '../../views'));
  app.use(expressLayouts);
  app.set('layout', 'layout');

  // Static files
  app.use(express.static(path.join(__dirname, '../../public')));

  // Middleware
  app.use(addUserToLocals);

  // Routes
  app.use('/auth', authRoutes);
  app.use('/admin', adminRoutes);
  app.use('/api', photoRoutes);
  app.use('/api', blogRoutes);
  app.use('/api/v1', eventRoutes);
  app.use('/api/carousel', carouselRoutes);
  app.use('/api/journal', journalRoutes);
  app.use('/api/photos', photoTypeRoutes);

  // Error handling middleware
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: config.isDevelopment() ? err.message : 'Something went wrong'
    });
  });

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({ error: 'Not Found' });
  });

  return app;
};

describe('Smoke Tests - Journal Functionality', () => {
  let app: express.Application;
  let prisma: PrismaClient;

  beforeAll(async () => {
    // Initialize Prisma client
    prisma = new PrismaClient();
    
    // Create test app
    app = createTestApp();
  });

  afterAll(async () => {
    // Close Prisma connection
    await prisma.$disconnect();
  });

  describe('Photo Upload Tests', () => {
    test('should upload photo with correct photo_type', async () => {
      // Create test event directly
      const event = await prisma.event.create({
        data: {
          event_name: 'Test Thanksgiving Photo Upload',
          event_type: 'Thanksgiving',
          event_location: 'Test Home',
          event_date: new Date('2024-11-28'),
          event_description: 'Test Thanksgiving event for photo upload',
          menu_title: 'Test Menu',
          menu_image_filename: 'test_menu.jpg'
        }
      });
      
      // Create a temporary test image file
      const testImagePath = path.join(__dirname, 'test-image.jpg');
      const testImageBuffer = Buffer.from('fake-image-data');
      fs.writeFileSync(testImagePath, testImageBuffer);

      try {
        // Test uploading a page photo
        const response = await request(app)
          .post(`/api/events/${event.event_id}/photos`)
          .attach('photo', testImagePath)
          .field('photo_type', 'page')
          .field('caption', 'Test Page Photo')
          .field('description', 'This is a test page photo')
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.photo).toBeDefined();
        expect(response.body.data.photo.photo_type).toBe('page');
        expect(response.body.data.photo.caption).toBe('Test Page Photo');
        expect(response.body.data.photo.description).toBe('This is a test page photo');

        // Verify the photo was saved correctly in the database
        const savedPhoto = await prisma.photo.findFirst({
          where: {
            event_id: event.event_id,
            caption: 'Test Page Photo'
          }
        });

        expect(savedPhoto).toBeDefined();
        expect(savedPhoto?.photo_type).toBe('page');
        expect(savedPhoto?.caption).toBe('Test Page Photo');
        expect(savedPhoto?.description).toBe('This is a test page photo');

        // Clean up the test photo
        if (savedPhoto) {
          await prisma.photo.delete({
            where: { photo_id: savedPhoto.photo_id }
          });
        }

        // Clean up the test event
        await prisma.event.delete({
          where: { event_id: event.event_id }
        });

      } finally {
        // Clean up the test image file
        if (fs.existsSync(testImagePath)) {
          fs.unlinkSync(testImagePath);
        }
      }
    });

    test('should upload photo with individual photo_type', async () => {
      // Create test event directly
      const event = await prisma.event.create({
        data: {
          event_name: 'Test Thanksgiving Individual Photo',
          event_type: 'Thanksgiving',
          event_location: 'Test Home',
          event_date: new Date('2024-11-28'),
          event_description: 'Test Thanksgiving event for individual photo',
          menu_title: 'Test Menu',
          menu_image_filename: 'test_menu.jpg'
        }
      });
      
      // Create a temporary test image file
      const testImagePath = path.join(__dirname, 'test-image-individual.jpg');
      const testImageBuffer = Buffer.from('fake-image-data-individual');
      fs.writeFileSync(testImagePath, testImageBuffer);

      try {
        // Test uploading an individual photo
        const response = await request(app)
          .post(`/api/events/${event.event_id}/photos`)
          .attach('photo', testImagePath)
          .field('photo_type', 'individual')
          .field('caption', 'Test Individual Photo')
          .field('description', 'This is a test individual photo')
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.photo).toBeDefined();
        expect(response.body.data.photo.photo_type).toBe('individual');
        expect(response.body.data.photo.caption).toBe('Test Individual Photo');
        expect(response.body.data.photo.description).toBe('This is a test individual photo');

        // Verify the photo was saved correctly in the database
        const savedPhoto = await prisma.photo.findFirst({
          where: {
            event_id: event.event_id,
            caption: 'Test Individual Photo'
          }
        });

        expect(savedPhoto).toBeDefined();
        expect(savedPhoto?.photo_type).toBe('individual');
        expect(savedPhoto?.caption).toBe('Test Individual Photo');
        expect(savedPhoto?.description).toBe('This is a test individual photo');

        // Clean up the test photo
        if (savedPhoto) {
          await prisma.photo.delete({
            where: { photo_id: savedPhoto.photo_id }
          });
        }

        // Clean up the test event
        await prisma.event.delete({
          where: { event_id: event.event_id }
        });

      } finally {
        // Clean up the test image file
        if (fs.existsSync(testImagePath)) {
          fs.unlinkSync(testImagePath);
        }
      }
    });

    test('should default to individual photo_type when not specified', async () => {
      // Create test event directly
      const event = await prisma.event.create({
        data: {
          event_name: 'Test Thanksgiving Default Photo',
          event_type: 'Thanksgiving',
          event_location: 'Test Home',
          event_date: new Date('2024-11-28'),
          event_description: 'Test Thanksgiving event for default photo',
          menu_title: 'Test Menu',
          menu_image_filename: 'test_menu.jpg'
        }
      });
      
      // Create a temporary test image file
      const testImagePath = path.join(__dirname, 'test-image-default.jpg');
      const testImageBuffer = Buffer.from('fake-image-data-default');
      fs.writeFileSync(testImagePath, testImageBuffer);

      try {
        // Test uploading without specifying photo_type
        const response = await request(app)
          .post(`/api/events/${event.event_id}/photos`)
          .attach('photo', testImagePath)
          .field('caption', 'Test Default Photo')
          .field('description', 'This is a test default photo')
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.photo).toBeDefined();
        expect(response.body.data.photo.photo_type).toBe('individual'); // Should default to individual
        expect(response.body.data.photo.caption).toBe('Test Default Photo');
        expect(response.body.data.photo.description).toBe('This is a test default photo');

        // Verify the photo was saved correctly in the database
        const savedPhoto = await prisma.photo.findFirst({
          where: {
            event_id: event.event_id,
            caption: 'Test Default Photo'
          }
        });

        expect(savedPhoto).toBeDefined();
        expect(savedPhoto?.photo_type).toBe('individual');
        expect(savedPhoto?.caption).toBe('Test Default Photo');
        expect(savedPhoto?.description).toBe('This is a test default photo');

        // Clean up the test photo
        if (savedPhoto) {
          await prisma.photo.delete({
            where: { photo_id: savedPhoto.photo_id }
          });
        }

        // Clean up the test event
        await prisma.event.delete({
          where: { event_id: event.event_id }
        });

      } finally {
        // Clean up the test image file
        if (fs.existsSync(testImagePath)) {
          fs.unlinkSync(testImagePath);
        }
      }
    });

    test('should reject invalid photo_type', async () => {
      // Create test event directly
      const event = await prisma.event.create({
        data: {
          event_name: 'Test Thanksgiving Invalid Photo',
          event_type: 'Thanksgiving',
          event_location: 'Test Home',
          event_date: new Date('2024-11-28'),
          event_description: 'Test Thanksgiving event for invalid photo',
          menu_title: 'Test Menu',
          menu_image_filename: 'test_menu.jpg'
        }
      });
      
      // Create a temporary test image file
      const testImagePath = path.join(__dirname, 'test-image-invalid.jpg');
      const testImageBuffer = Buffer.from('fake-image-data-invalid');
      fs.writeFileSync(testImagePath, testImageBuffer);

      try {
        // Test uploading with invalid photo_type
        const response = await request(app)
          .post(`/api/events/${event.event_id}/photos`)
          .attach('photo', testImagePath)
          .field('photo_type', 'invalid_type')
          .field('caption', 'Test Invalid Photo')
          .field('description', 'This is a test invalid photo')
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Photo type must be either "individual" or "page"');

        // Clean up the test event
        await prisma.event.delete({
          where: { event_id: event.event_id }
        });

      } finally {
        // Clean up the test image file
        if (fs.existsSync(testImagePath)) {
          fs.unlinkSync(testImagePath);
        }
      }
    });
  });

  describe('Journal API Tests', () => {
    test('should get available years', async () => {
      const response = await request(app)
        .get('/api/journal/viewer/years')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.years).toBeDefined();
      expect(Array.isArray(response.body.data.years)).toBe(true);
    });

    test('should get journal data for a year', async () => {
      const response = await request(app)
        .get('/api/journal/viewer/data?year=2013')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.year).toBe(2013);
      expect(response.body.data.journal_sections).toBeDefined();
      expect(Array.isArray(response.body.data.journal_sections)).toBe(true);
    });

    test('should handle missing year parameter', async () => {
      const response = await request(app)
        .get('/api/journal/viewer/data')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Year parameter is required');
    });
  });
});