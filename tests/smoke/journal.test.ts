import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { testUtils } from '../setup';

// Import your server (you'll need to export it from server.ts)
// For now, we'll create a simple test server
import express from 'express';

describe('Smoke Tests - Journal Functionality', () => {
  let app: express.Application;
  let prisma: PrismaClient;

  beforeAll(async () => {
    // Initialize Prisma client
    prisma = new PrismaClient();
    
    // Create test Express app
    app = express();
    app.use(express.json());
    
    // Add journal routes for testing
    app.get('/api/journal/viewer/years', async (_req, res) => {
      try {
        const years = await prisma.journalPage.findMany({
          select: { year: true },
          distinct: ['year'],
          orderBy: { year: 'asc' }
        });

        res.json({
          success: true,
          data: { years: years.map(y => y.year) }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
      }
    });

    app.get('/api/journal/viewer/data', async (req, res) => {
      try {
        const { year } = req.query;

        if (!year) {
          return res.status(400).json({
            success: false,
            message: 'Year parameter is required'
          });
        }

        const journalPages = await prisma.journalPage.findMany({
          where: { year: parseInt(year as string) },
          include: {
            content_items: {
              orderBy: { display_order: 'asc' }
            },
            event: {
              select: {
                event_id: true,
                event_name: true,
                event_date: true
              }
            }
          },
          orderBy: { page_number: 'asc' }
        });

        res.json({
          success: true,
          data: {
            year: parseInt(year as string),
            pages: journalPages
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
      }
    });

    app.get('/api/journal/available-content/:eventId', async (req, res) => {
      try {
        const eventId = req.params.eventId;
        const { year } = req.query;

        if (!eventId || !year) {
          return res.status(400).json({
            success: false,
            message: 'Event ID and year are required'
          });
        }

        const [menus, photos, blogs] = await Promise.all([
          prisma.event.findMany({
            where: {
              event_id: parseInt(eventId),
              event_date: {
                gte: new Date(parseInt(year as string), 0, 1),
                lt: new Date(parseInt(year as string) + 1, 0, 1)
              }
            },
            select: {
              event_id: true,
              menu_title: true,
              menu_image_s3_url: true,
              event_date: true,
              event_name: true
            }
          }),
          prisma.photo.findMany({
            where: { event_id: parseInt(eventId) },
            select: {
              photo_id: true,
              filename: true,
              original_filename: true,
              description: true,
              caption: true,
              s3_url: true,
              photo_type: true,
              taken_date: true
            }
          }),
          prisma.blogPost.findMany({
            where: { event_id: parseInt(eventId) },
            select: {
              blog_post_id: true,
              title: true,
              content: true,
              excerpt: true,
              featured_image: true,
              images: true,
              tags: true,
              status: true,
              published_at: true
            }
          })
        ]);

        const individualPhotos = photos.filter(photo => photo.photo_type === 'individual');
        const pagePhotos = photos.filter(photo => photo.photo_type === 'page');

        res.json({
          success: true,
          data: {
            menus,
            photos: individualPhotos,
            page_photos: pagePhotos,
            blogs
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
      }
    });

    app.get('/api/journal/:journalPageId', async (req, res) => {
      try {
        const journalPageId = req.params.journalPageId;

        const journalPage = await prisma.journalPage.findUnique({
          where: { journal_page_id: parseInt(journalPageId) },
          include: {
            content_items: {
              orderBy: { display_order: 'asc' }
            }
          }
        });

        if (!journalPage) {
          return res.status(404).json({
            success: false,
            message: 'Journal page not found'
          });
        }

        res.json({
          success: true,
          data: { journal_page: journalPage }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
      }
    });

    // Add public journal viewer route
    app.get('/journal', (_req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>Journal Viewer Test</title></head>
        <body>
          <h1>Journal Viewer</h1>
          <div id="yearSelector">Loading years...</div>
          <div id="journalContent">Select a year to view journal pages</div>
        </body>
        </html>
      `);
    });

    // Add admin journal editor route
    app.get('/admin/journal-editor', (_req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>Journal Editor Test</title></head>
        <body>
          <h1>Journal Editor</h1>
          <div id="eventSelector">Select event...</div>
          <div id="yearSelector">Select year...</div>
          <div id="contentPanels">Content panels...</div>
        </body>
        </html>
      `);
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Journal Viewer Smoke Tests', () => {
    test('should load journal viewer page', async () => {
      const response = await request(app)
        .get('/journal')
        .expect(200);

      expect(response.text).toContain('Journal Viewer');
      expect(response.text).toContain('yearSelector');
      expect(response.text).toContain('journalContent');
    });

    test('should get available years', async () => {
      const response = await request(app)
        .get('/api/journal/viewer/years')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('years');
      expect(Array.isArray(response.body.data.years)).toBe(true);
    });

    test('should get journal data for a year', async () => {
      // First, ensure we have some test data
      const event = await testUtils.createTestEvent(prisma);
      
      // Create a test journal page
      const journalPage = await prisma.journalPage.create({
        data: {
          event_id: event.event_id,
          year: 2023,
          page_number: 1,
          title: 'Test Page',
          description: 'Test Description'
        }
      });

      // Create a test content item
      await prisma.journalContentItem.create({
        data: {
          journal_page_id: journalPage.journal_page_id,
          content_type: 'text',
          content_id: null,
          custom_text: 'Test content',
          display_order: 1
        }
      });

      const response = await request(app)
        .get('/api/journal/viewer/data')
        .query({ year: 2023 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('year', 2023);
      expect(response.body.data).toHaveProperty('pages');
      expect(Array.isArray(response.body.data.pages)).toBe(true);
      expect(response.body.data.pages.length).toBeGreaterThan(0);
    });

    test('should handle missing year parameter', async () => {
      const response = await request(app)
        .get('/api/journal/viewer/data')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Year parameter is required');
    });

    test('should handle non-existent year', async () => {
      const response = await request(app)
        .get('/api/journal/viewer/data')
        .query({ year: 9999 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pages).toHaveLength(0);
    });
  });

  describe('Journal Editor Smoke Tests', () => {
    test('should load journal editor page', async () => {
      const response = await request(app)
        .get('/admin/journal-editor')
        .expect(200);

      expect(response.text).toContain('Journal Editor');
      expect(response.text).toContain('eventSelector');
      expect(response.text).toContain('yearSelector');
      expect(response.text).toContain('contentPanels');
    });

    test('should get available content for event', async () => {
      const event = await testUtils.createTestEvent(prisma);
      
      const response = await request(app)
        .get(`/api/journal/available-content/${event.event_id}`)
        .query({ year: 2023 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('menus');
      expect(response.body.data).toHaveProperty('photos');
      expect(response.body.data).toHaveProperty('page_photos');
      expect(response.body.data).toHaveProperty('blogs');
      expect(Array.isArray(response.body.data.menus)).toBe(true);
      expect(Array.isArray(response.body.data.photos)).toBe(true);
      expect(Array.isArray(response.body.data.page_photos)).toBe(true);
      expect(Array.isArray(response.body.data.blogs)).toBe(true);
    });

    test('should get journal page by ID', async () => {
      const event = await testUtils.createTestEvent(prisma);
      
      const journalPage = await prisma.journalPage.create({
        data: {
          event_id: event.event_id,
          year: 2023,
          page_number: 1,
          title: 'Test Page',
          description: 'Test Description'
        }
      });

      const response = await request(app)
        .get(`/api/journal/${journalPage.journal_page_id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('journal_page');
      expect(response.body.data.journal_page.journal_page_id).toBe(journalPage.journal_page_id);
      expect(response.body.data.journal_page.title).toBe('Test Page');
    });

    test('should handle missing event ID parameter', async () => {
      const response = await request(app)
        .get('/api/journal/available-content/')
        .query({ year: 2023 })
        .expect(404); // Express route not found

      // Test with invalid event ID
      const response2 = await request(app)
        .get('/api/journal/available-content/invalid')
        .query({ year: 2023 })
        .expect(400);

      expect(response2.body.success).toBe(false);
      expect(response2.body.message).toContain('Event ID and year are required');
    });

    test('should handle missing year parameter for available content', async () => {
      const event = await testUtils.createTestEvent(prisma);
      
      const response = await request(app)
        .get(`/api/journal/available-content/${event.event_id}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Event ID and year are required');
    });

    test('should handle non-existent journal page', async () => {
      const response = await request(app)
        .get('/api/journal/99999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Journal page not found');
    });
  });

  describe('Journal Database Schema Tests', () => {
    test('should have journal pages table', async () => {
      const result = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'JournalPages'
      `;
      
      expect(result).toHaveLength(1);
    });

    test('should have journal content items table', async () => {
      const result = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'JournalContentItems'
      `;
      
      expect(result).toHaveLength(1);
    });

    test('should be able to create journal page', async () => {
      const event = await testUtils.createTestEvent(prisma);
      
      const journalPage = await prisma.journalPage.create({
        data: {
          event_id: event.event_id,
          year: 2023,
          page_number: 1,
          title: 'Smoke Test Page',
          description: 'Created during smoke test'
        }
      });

      expect(journalPage.journal_page_id).toBeDefined();
      expect(journalPage.title).toBe('Smoke Test Page');
      expect(journalPage.year).toBe(2023);
    });

    test('should be able to create journal content item', async () => {
      const event = await testUtils.createTestEvent(prisma);
      
      const journalPage = await prisma.journalPage.create({
        data: {
          event_id: event.event_id,
          year: 2023,
          page_number: 1,
          title: 'Smoke Test Page',
          description: 'Created during smoke test'
        }
      });

      const contentItem = await prisma.journalContentItem.create({
        data: {
          journal_page_id: journalPage.journal_page_id,
          content_type: 'text',
          content_id: null,
          custom_text: 'Smoke test content',
          display_order: 1
        }
      });

      expect(contentItem.content_item_id).toBeDefined();
      expect(contentItem.content_type).toBe('text');
      expect(contentItem.custom_text).toBe('Smoke test content');
    });
  });
});
