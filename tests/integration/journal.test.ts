import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import express from 'express';
import journalRoutes from '../../src/routes/journalRoutes';
import photoTypeRoutes from '../../src/routes/photoTypeRoutes';

// Test database setup
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
    }
  }
});

const app = express();
app.use(express.json());
app.use('/api/journal', journalRoutes);
app.use('/api/photos', photoTypeRoutes);

describe('Journal API Integration Tests', () => {
  let testEventId: number;
  let testPhotoId: number;

  beforeAll(async () => {
    // Create test event
    const testEvent = await prisma.event.create({
      data: {
        event_name: 'Test Thanksgiving',
        event_type: 'Thanksgiving',
        event_date: new Date('2023-11-23'),
        menu_title: 'Test Menu',
        menu_image_filename: 'test.jpg'
      }
    });
    testEventId = testEvent.event_id;

    // Create test photo
    const testPhoto = await prisma.photo.create({
      data: {
        event_id: testEventId,
        filename: 'test-photo.jpg',
        original_filename: 'test-photo.jpg',
        photo_type: 'individual'
      }
    });
    testPhotoId = testPhoto.photo_id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.journalContentItem.deleteMany({
      where: { journal_page: { event_id: testEventId } }
    });
    await prisma.journalPage.deleteMany({
      where: { event_id: testEventId }
    });
    await prisma.photo.deleteMany({
      where: { event_id: testEventId }
    });
    await prisma.event.delete({
      where: { event_id: testEventId }
    });
    await prisma.$disconnect();
  });

  describe('Journal Pages CRUD', () => {
    let journalPageId: number;

    it('should create a journal page', async () => {
      const response = await request(app)
        .post('/api/journal')
        .send({
          event_id: testEventId,
          year: 2023,
          title: 'Test Journal Page',
          description: 'Test Description'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.journal_page.title).toBe('Test Journal Page');
      journalPageId = response.body.data.journal_page.journal_page_id;
    });

    it('should get journal pages', async () => {
      const response = await request(app)
        .get('/api/journal')
        .query({ event_id: testEventId, year: 2023 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.journal_pages).toHaveLength(1);
      expect(response.body.data.pagination.total).toBe(1);
    });

    it('should get a specific journal page', async () => {
      const response = await request(app)
        .get(`/api/journal/${journalPageId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.journal_page.journal_page_id).toBe(journalPageId);
    });

    it('should update a journal page', async () => {
      const response = await request(app)
        .put(`/api/journal/${journalPageId}`)
        .send({
          title: 'Updated Journal Page',
          is_published: true
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.journal_page.title).toBe('Updated Journal Page');
      expect(response.body.data.journal_page.is_published).toBe(true);
    });

    it('should delete a journal page', async () => {
      await request(app)
        .delete(`/api/journal/${journalPageId}`)
        .expect(200);

      // Verify it's deleted
      await request(app)
        .get(`/api/journal/${journalPageId}`)
        .expect(404);
    });
  });

  describe('Content Items CRUD', () => {
    let journalPageId: number;
    let contentItemId: number;

    beforeEach(async () => {
      // Create a journal page for content item tests
      const journalPage = await prisma.journalPage.create({
        data: {
          event_id: testEventId,
          year: 2023,
          title: 'Content Test Page'
        }
      });
      journalPageId = journalPage.journal_page_id;
    });

    afterEach(async () => {
      // Clean up journal page
      await prisma.journalPage.delete({
        where: { journal_page_id: journalPageId }
      });
    });

    it('should create a content item', async () => {
      const response = await request(app)
        .post(`/api/journal/${journalPageId}/content-items`)
        .send({
          content_type: 'text',
          custom_text: 'Test content',
          display_order: 1
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.content_item.custom_text).toBe('Test content');
      contentItemId = response.body.data.content_item.content_item_id;
    });

    it('should update a content item', async () => {
      // Create content item first
      const contentItem = await prisma.journalContentItem.create({
        data: {
          journal_page_id: journalPageId,
          content_type: 'text',
          custom_text: 'Original text',
          display_order: 1
        }
      });

      const response = await request(app)
        .put(`/api/journal/content-items/${contentItem.content_item_id}`)
        .send({
          custom_text: 'Updated text'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.content_item.custom_text).toBe('Updated text');
    });

    it('should delete a content item', async () => {
      // Create content item first
      const contentItem = await prisma.journalContentItem.create({
        data: {
          journal_page_id: journalPageId,
          content_type: 'text',
          custom_text: 'To be deleted',
          display_order: 1
        }
      });

      await request(app)
        .delete(`/api/journal/content-items/${contentItem.content_item_id}`)
        .expect(200);

      // Verify it's deleted
      const deletedItem = await prisma.journalContentItem.findUnique({
        where: { content_item_id: contentItem.content_item_id }
      });
      expect(deletedItem).toBeNull();
    });
  });

  describe('Photo Type Management', () => {
    it('should update photo type', async () => {
      const response = await request(app)
        .put(`/api/photos/${testPhotoId}/type`)
        .send({ photo_type: 'page' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.photo_type).toBe('page');

      // Verify in database
      const updatedPhoto = await prisma.photo.findUnique({
        where: { photo_id: testPhotoId }
      });
      expect(updatedPhoto?.photo_type).toBe('page');
    });

    it('should get photos by type', async () => {
      const response = await request(app)
        .get(`/api/photos/events/${testEventId}/photos/page`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.photo_type).toBe('page');
      expect(response.body.data.photos).toHaveLength(1);
    });

    it('should return 400 for invalid photo type', async () => {
      await request(app)
        .put(`/api/photos/${testPhotoId}/type`)
        .send({ photo_type: 'invalid' })
        .expect(400);
    });
  });

  describe('Available Content', () => {
    it('should get available content for editor', async () => {
      const response = await request(app)
        .get('/api/journal/available-content')
        .query({ event_id: testEventId, year: 2023 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('menus');
      expect(response.body.data).toHaveProperty('photos');
      expect(response.body.data).toHaveProperty('page_photos');
      expect(response.body.data).toHaveProperty('blogs');
    });
  });
});
