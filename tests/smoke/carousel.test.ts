import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { testUtils } from '../setup';

// Import your server (you'll need to export it from server.ts)
// For now, we'll create a simple test server
import express from 'express';

describe('Smoke Tests - Carousel API', () => {
  let app: express.Application;
  let prisma: PrismaClient;

  beforeAll(async () => {
    // Initialize Prisma client
    prisma = new PrismaClient();
    
    // Create test Express app
    app = express();
    app.use(express.json());
    
    // Add carousel routes for testing
    app.get('/api/carousel/photos', async (req, res) => {
      try {
        const page = parseInt(req.query['page'] as string) || 1;
        const limit = parseInt(req.query['limit'] as string) || 50;
        const offset = (page - 1) * limit;

        // Validate pagination parameters
        if (isNaN(page) || page < 1) {
          res.status(400).json({ success: false, message: 'Invalid page number' });
          return;
        }
        if (isNaN(limit) || limit < 1 || limit > 100) {
          res.status(400).json({ success: false, message: 'Invalid limit (1-100)' });
          return;
        }

        const photosCount = await prisma.photo.count();
        const photos = await prisma.photo.findMany({
          skip: offset,
          take: limit,
          orderBy: {
            created_at: 'desc',
          },
          select: {
            photo_id: true,
            filename: true,
            original_filename: true,
            description: true,
            caption: true,
            file_size: true,
            mime_type: true,
            s3_url: true,
            taken_date: true,
            created_at: true,
            event: {
              select: {
                event_id: true,
                event_name: true,
                event_date: true,
                event_location: true,
              },
            },
          },
        });

        const transformedPhotos = photos.map(photo => ({
          id: photo.photo_id,
          filename: photo.filename,
          originalFilename: photo.original_filename,
          description: photo.description,
          caption: photo.caption,
          fileSize: photo.file_size,
          mimeType: photo.mime_type,
          s3Url: photo.s3_url,
          takenDate: photo.taken_date,
          createdAt: photo.created_at,
          event: photo.event ? {
            id: photo.event.event_id,
            name: photo.event.event_name,
            date: photo.event.event_date,
            location: photo.event.event_location,
          } : null,
          previewUrl: photo.s3_url ? photo.s3_url : `/api/photos/${photo.filename}/preview`,
        }));

        res.json({
          success: true,
          data: {
            photos: transformedPhotos,
            pagination: {
              total: photosCount,
              page,
              limit,
              pages: Math.ceil(photosCount / limit),
            },
            metadata: {}
          },
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Failed to fetch carousel photos',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    app.get('/api/carousel/photos/:id/metadata', async (req, res) => {
      try {
        const photoId = parseInt(req.params['id'] || '0');
        
        if (isNaN(photoId) || photoId <= 0) {
          res.status(400).json({ success: false, message: 'Invalid photo ID' });
          return;
        }

        const photo = await prisma.photo.findUnique({
          where: { photo_id: photoId },
          include: {
            event: {
              select: {
                event_id: true,
                event_name: true,
                event_date: true,
                event_location: true,
              },
            },
          },
        });

        if (!photo) {
          res.status(404).json({ success: false, message: 'Photo not found' });
          return;
        }

        res.json({
          success: true,
          data: {
            id: photo.photo_id,
            filename: photo.filename,
            originalFilename: photo.original_filename,
            description: photo.description,
            caption: photo.caption,
            fileSize: photo.file_size,
            mimeType: photo.mime_type,
            s3Url: photo.s3_url,
            takenDate: photo.taken_date,
            createdAt: photo.created_at,
            event: photo.event ? {
              id: photo.event.event_id,
              name: photo.event.event_name,
              date: photo.event.event_date,
              location: photo.event.event_location,
            } : null,
          },
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Failed to fetch photo metadata',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    app.get('/api/carousel/stats', async (req, res) => {
      try {
        const totalPhotos = await prisma.photo.count();
        const photosWithS3 = await prisma.photo.count({
          where: { s3_url: { not: null } }
        });
        const photosWithoutS3 = totalPhotos - photosWithS3;
        const s3CoveragePercentage = totalPhotos > 0 ? Math.round((photosWithS3 / totalPhotos) * 100) : 0;
        
        const totalEvents = await prisma.event.count();
        
        const recentPhotos = await prisma.photo.findMany({
          take: 5,
          orderBy: { created_at: 'desc' },
          select: {
            photo_id: true,
            filename: true,
            caption: true,
            created_at: true,
            event: {
              select: {
                event_name: true,
                event_date: true,
              },
            },
          },
        });

        const transformedRecentPhotos = recentPhotos.map(photo => ({
          id: photo.photo_id,
          filename: photo.filename,
          caption: photo.caption,
          createdAt: photo.created_at,
          eventName: photo.event?.event_name || 'Unknown Event',
          eventDate: photo.event?.event_date || new Date(),
        }));

        res.json({
          success: true,
          data: {
            totalPhotos,
            photosWithS3,
            photosWithoutS3,
            s3CoveragePercentage,
            totalEvents,
            recentPhotos: transformedRecentPhotos,
          },
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Failed to fetch carousel statistics',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
  });

  afterAll(async () => {
    await testUtils.cleanupTestData(prisma);
    await prisma.$disconnect();
  });

  describe('Carousel Photos API', () => {
    test('GET /api/carousel/photos should return photos with pagination', async () => {
      const response = await request(app)
        .get('/api/carousel/photos')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          photos: expect.any(Array),
          pagination: {
            total: expect.any(Number),
            page: 1,
            limit: 50,
            pages: expect.any(Number),
          },
          metadata: expect.any(Object)
        }
      });

      // Check photo structure
      if (response.body.data.photos.length > 0) {
        const photo = response.body.data.photos[0];
        expect(photo).toMatchObject({
          id: expect.any(Number),
          filename: expect.any(String),
          createdAt: expect.any(String),
          previewUrl: expect.any(String),
        });
      }
    });

    test('GET /api/carousel/photos should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/carousel/photos?page=1&limit=10')
        .expect(200);

      expect(response.body.data.pagination).toMatchObject({
        page: 1,
        limit: 10,
      });
    });

    test('GET /api/carousel/photos should validate pagination parameters', async () => {
      // Test invalid page
      await request(app)
        .get('/api/carousel/photos?page=0')
        .expect(400);

      // Test invalid limit
      await request(app)
        .get('/api/carousel/photos?limit=101')
        .expect(400);
    });
  });

  describe('Photo Metadata API', () => {
    test('GET /api/carousel/photos/:id/metadata should return photo details', async () => {
      // First get a photo ID from the photos endpoint
      const photosResponse = await request(app)
        .get('/api/carousel/photos')
        .expect(200);

      if (photosResponse.body.data.photos.length > 0) {
        const photoId = photosResponse.body.data.photos[0].id;
        
        const response = await request(app)
          .get(`/api/carousel/photos/${photoId}/metadata`)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            id: photoId,
            filename: expect.any(String),
            createdAt: expect.any(String),
          }
        });
      }
    });

    test('GET /api/carousel/photos/:id/metadata should handle invalid photo ID', async () => {
      await request(app)
        .get('/api/carousel/photos/99999/metadata')
        .expect(404);

      await request(app)
        .get('/api/carousel/photos/invalid/metadata')
        .expect(400);
    });
  });

  describe('Carousel Statistics API', () => {
    test('GET /api/carousel/stats should return statistics', async () => {
      const response = await request(app)
        .get('/api/carousel/stats')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          totalPhotos: expect.any(Number),
          photosWithS3: expect.any(Number),
          photosWithoutS3: expect.any(Number),
          s3CoveragePercentage: expect.any(Number),
          totalEvents: expect.any(Number),
          recentPhotos: expect.any(Array),
        }
      });

      // Validate statistics make sense
      const stats = response.body.data;
      expect(stats.photosWithS3 + stats.photosWithoutS3).toBe(stats.totalPhotos);
      expect(stats.s3CoveragePercentage).toBeGreaterThanOrEqual(0);
      expect(stats.s3CoveragePercentage).toBeLessThanOrEqual(100);
    });
  });

  describe('Database Integration', () => {
    test('Should be able to query photos table', async () => {
      const count = await prisma.photo.count();
      expect(typeof count).toBe('number');
    });

    test('Should be able to query events table for carousel data', async () => {
      const count = await prisma.event.count();
      expect(typeof count).toBe('number');
    });
  });
});
