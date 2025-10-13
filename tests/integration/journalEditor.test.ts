/**
 * Integration tests for Journal Editor Workflow
 */
import request from 'supertest';
import express from 'express';
import journalRoutes from '../../src/routes/journalRoutes';
import photoTypeRoutes from '../../src/routes/photoTypeRoutes';
import { PrismaClient } from '@prisma/client';

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

describe('Journal Editor Integration Tests', () => {
  let testEventId: number;
  let testPhotoId: number;
  let testBlogId: number;

  beforeAll(async () => {
    // Create test event
    const testEvent = await prisma.event.create({
      data: {
        event_name: 'Test Thanksgiving 2023',
        event_type: 'Thanksgiving',
        event_date: new Date('2023-11-23'),
        menu_title: 'Test Menu 2023',
        menu_image_filename: 'test-menu.jpg'
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

    // Create test blog
    const testBlog = await prisma.blogPost.create({
      data: {
        event_id: testEventId,
        user_id: 1, // Assuming user ID 1 exists
        title: 'Test Blog Post',
        content: 'This is a test blog post content',
        tags: ['test'],
        status: 'published'
      }
    });
    testBlogId = testBlog.blog_post_id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.journalContentItem.deleteMany({
      where: { journal_page: { event_id: testEventId } }
    });
    await prisma.journalPage.deleteMany({
      where: { event_id: testEventId }
    });
    await prisma.blogPost.deleteMany({
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

  describe('Complete Editor Workflow', () => {
    let journalPageId: number;

    it('should create a new journal page', async () => {
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

    it('should load available content for editor', async () => {
      const response = await request(app)
        .get('/api/journal/available-content')
        .query({ event_id: testEventId, year: 2023 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('menus');
      expect(response.body.data).toHaveProperty('photos');
      expect(response.body.data).toHaveProperty('page_photos');
      expect(response.body.data).toHaveProperty('blogs');
      
      // Should have our test content
      expect(response.body.data.menus).toHaveLength(1);
      expect(response.body.data.photos).toHaveLength(1);
      expect(response.body.data.blogs).toHaveLength(1);
    });

    it('should add text content to journal page', async () => {
      const response = await request(app)
        .post(`/api/journal/${journalPageId}/content-items`)
        .send({
          content_type: 'text',
          custom_text: 'This is a test text block',
          display_order: 1
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.content_item.custom_text).toBe('This is a test text block');
    });

    it('should add heading content to journal page', async () => {
      const response = await request(app)
        .post(`/api/journal/${journalPageId}/content-items`)
        .send({
          content_type: 'heading',
          custom_text: 'Test Heading',
          heading_level: 2,
          display_order: 2
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.content_item.custom_text).toBe('Test Heading');
      expect(response.body.data.content_item.heading_level).toBe(2);
    });

    it('should add photo content to journal page', async () => {
      const response = await request(app)
        .post(`/api/journal/${journalPageId}/content-items`)
        .send({
          content_type: 'photo',
          content_id: testPhotoId,
          display_order: 3
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.content_item.content_id).toBe(testPhotoId);
    });

    it('should add blog content to journal page', async () => {
      const response = await request(app)
        .post(`/api/journal/${journalPageId}/content-items`)
        .send({
          content_type: 'blog',
          content_id: testBlogId,
          display_order: 4
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.content_item.content_id).toBe(testBlogId);
    });

    it('should retrieve complete journal page with content', async () => {
      const response = await request(app)
        .get(`/api/journal/${journalPageId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.journal_page.title).toBe('Test Journal Page');
      expect(response.body.data.journal_page.content_items).toHaveLength(4);
      
      // Verify content order
      const contentItems = response.body.data.journal_page.content_items;
      expect(contentItems[0].display_order).toBe(1);
      expect(contentItems[1].display_order).toBe(2);
      expect(contentItems[2].display_order).toBe(3);
      expect(contentItems[3].display_order).toBe(4);
    });

    it('should reorder content items', async () => {
      const response = await request(app)
        .get(`/api/journal/${journalPageId}`)
        .expect(200);

      const contentItems = response.body.data.journal_page.content_items;
      
      // Reorder items (move first item to last)
      const reorderData = contentItems.map((item, index) => ({
        content_item_id: item.content_item_id,
        display_order: index === 0 ? contentItems.length : index
      }));

      const reorderResponse = await request(app)
        .put(`/api/journal/${journalPageId}/reorder`)
        .send({ content_items: reorderData })
        .expect(200);

      expect(reorderResponse.body.success).toBe(true);

      // Verify new order
      const updatedResponse = await request(app)
        .get(`/api/journal/${journalPageId}`)
        .expect(200);

      const updatedItems = updatedResponse.body.data.journal_page.content_items;
      expect(updatedItems[updatedItems.length - 1].display_order).toBe(contentItems.length);
    });

    it('should update journal page metadata', async () => {
      const response = await request(app)
        .put(`/api/journal/${journalPageId}`)
        .send({
          title: 'Updated Journal Page',
          description: 'Updated Description',
          is_published: true
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.journal_page.title).toBe('Updated Journal Page');
      expect(response.body.data.journal_page.is_published).toBe(true);
    });

    it('should delete content item', async () => {
      const response = await request(app)
        .get(`/api/journal/${journalPageId}`)
        .expect(200);

      const contentItems = response.body.data.journal_page.content_items;
      const itemToDelete = contentItems[0];

      await request(app)
        .delete(`/api/journal/content-items/${itemToDelete.content_item_id}`)
        .expect(200);

      // Verify deletion
      const updatedResponse = await request(app)
        .get(`/api/journal/${journalPageId}`)
        .expect(200);

      expect(updatedResponse.body.data.journal_page.content_items).toHaveLength(contentItems.length - 1);
    });

    it('should delete journal page', async () => {
      await request(app)
        .delete(`/api/journal/${journalPageId}`)
        .expect(200);

      // Verify deletion
      await request(app)
        .get(`/api/journal/${journalPageId}`)
        .expect(404);
    });
  });

  describe('Photo Type Management Integration', () => {
    it('should change photo type from individual to page', async () => {
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

    it('should change photo type back to individual', async () => {
      const response = await request(app)
        .put(`/api/photos/${testPhotoId}/type`)
        .send({ photo_type: 'individual' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.photo_type).toBe('individual');

      // Verify in database
      const updatedPhoto = await prisma.photo.findUnique({
        where: { photo_id: testPhotoId }
      });
      expect(updatedPhoto?.photo_type).toBe('individual');
    });

    it('should get photos by type', async () => {
      const response = await request(app)
        .get(`/api/photos/events/${testEventId}/photos/individual`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.photo_type).toBe('individual');
      expect(response.body.data.photos).toHaveLength(1);
      expect(response.body.data.photos[0].photo_id).toBe(testPhotoId);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid photo type', async () => {
      await request(app)
        .put(`/api/photos/${testPhotoId}/type`)
        .send({ photo_type: 'invalid' })
        .expect(400);
    });

    it('should handle non-existent photo', async () => {
      await request(app)
        .put('/api/photos/99999/type')
        .send({ photo_type: 'page' })
        .expect(404);
    });

    it('should handle non-existent journal page', async () => {
      await request(app)
        .get('/api/journal/99999')
        .expect(404);
    });

    it('should handle invalid content type', async () => {
      const response = await request(app)
        .post('/api/journal/1/content-items')
        .send({
          content_type: 'invalid',
          display_order: 1
        })
        .expect(500); // This should be handled by Prisma validation
    });
  });
});

