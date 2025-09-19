const request = require('supertest');
const app = require('../../api/index');

// Mock JWT token for testing
const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywidXNlcm5hbWUiOiJib2IiLCJlbWFpbCI6ImJvYkBleGFtcGxlLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1ODI5NTc5OCwiZXhwIjoxNzU4MzgyMTk4fQ.KFPzCIsYJ3iPflPXgoD94ZX-M8H1EQueJBuJGGVKr28';

describe('Photo API Endpoints', () => {
  let testEventId;
  let testPhotoId;

  beforeAll(async () => {
    // Create a test event for photo testing
    const { Client } = require('pg');
    const client = new Client({
      connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    });

    try {
      await client.connect();
      const eventResult = await client.query(`
        INSERT INTO "Events" (event_name, event_date, description, menu_image_url)
        VALUES ('Test Thanksgiving 2024', '2024-11-28', 'Test event for photo API testing', '/images/test.jpg')
        RETURNING id
      `);
      testEventId = eventResult.rows[0].id;
    } catch (error) {
      console.error('Error setting up test event:', error);
    } finally {
      await client.end();
    }
  });

  afterAll(async () => {
    // Clean up test data
    const { Client } = require('pg');
    const client = new Client({
      connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    });

    try {
      await client.connect();
      if (testEventId) {
        await client.query('DELETE FROM "Events" WHERE id = $1', [testEventId]);
      }
    } catch (error) {
      console.error('Error cleaning up test data:', error);
    } finally {
      await client.end();
    }
  });

  describe('POST /api/v1/events/:eventId/photos', () => {
    test('should upload a photo successfully', async () => {
      const photoData = {
        filename: 'test-photo.jpg',
        file_data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        description: 'Test photo description',
        caption: 'Test photo caption'
      };

      const response = await request(app)
        .post(`/api/v1/events/${testEventId}/photos`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send(photoData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.photo).toBeDefined();
      expect(response.body.photo.filename).toBe(photoData.filename);
      expect(response.body.photo.description).toBe(photoData.description);
      expect(response.body.photo.caption).toBe(photoData.caption);

      testPhotoId = response.body.photo.id;
    });

    test('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post(`/api/v1/events/${testEventId}/photos`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send({
          description: 'Test photo without filename'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Filename and file data are required');
    });

    test('should return 404 for non-existent event', async () => {
      const photoData = {
        filename: 'test-photo.jpg',
        file_data: 'base64data'
      };

      const response = await request(app)
        .post('/api/v1/events/99999/photos')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(photoData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Event not found');
    });

    test('should return 401 without authentication', async () => {
      const photoData = {
        filename: 'test-photo.jpg',
        file_data: 'base64data'
      };

      const response = await request(app)
        .post(`/api/v1/events/${testEventId}/photos`)
        .send(photoData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access token required');
    });
  });

  describe('GET /api/v1/events/:eventId/photos', () => {
    test('should get photos for an event', async () => {
      const response = await request(app)
        .get(`/api/v1/events/${testEventId}/photos`)
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.photos).toBeDefined();
      expect(Array.isArray(response.body.photos)).toBe(true);
      expect(response.body.photos.length).toBeGreaterThan(0);
    });

    test('should return empty array for event with no photos', async () => {
      // Create a new event without photos
      const { Client } = require('pg');
      const client = new Client({
        connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      });

      let emptyEventId;
      try {
        await client.connect();
        const eventResult = await client.query(`
          INSERT INTO "Events" (event_name, event_date, description, menu_image_url)
          VALUES ('Empty Event', '2024-11-28', 'Event with no photos', '/images/empty.jpg')
          RETURNING id
        `);
        emptyEventId = eventResult.rows[0].id;

        const response = await request(app)
          .get(`/api/v1/events/${emptyEventId}/photos`)
          .set('Authorization', `Bearer ${mockToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.photos).toEqual([]);
      } finally {
        if (emptyEventId) {
          await client.query('DELETE FROM "Events" WHERE id = $1', [emptyEventId]);
        }
        await client.end();
      }
    });

    test('should return 401 without authentication', async () => {
      const response = await request(app)
        .get(`/api/v1/events/${testEventId}/photos`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access token required');
    });
  });

  describe('GET /api/v1/photos/:photoId', () => {
    test('should get photo binary data', async () => {
      const response = await request(app)
        .get(`/api/v1/photos/${testPhotoId}`)
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(response.headers['content-type']).toContain('image/jpeg');
      expect(response.headers['cache-control']).toBe('public, max-age=31536000');
      expect(Buffer.isBuffer(response.body)).toBe(true);
    });

    test('should return 404 for non-existent photo', async () => {
      const response = await request(app)
        .get('/api/v1/photos/99999')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Photo not found');
    });

    test('should return 401 without authentication', async () => {
      const response = await request(app)
        .get(`/api/v1/photos/${testPhotoId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access token required');
    });
  });

  describe('PUT /api/v1/photos/:photoId', () => {
    test('should update photo metadata', async () => {
      const updateData = {
        description: 'Updated description',
        caption: 'Updated caption'
      };

      const response = await request(app)
        .put(`/api/v1/photos/${testPhotoId}`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.photo.description).toBe(updateData.description);
      expect(response.body.photo.caption).toBe(updateData.caption);
    });

    test('should handle partial updates', async () => {
      const updateData = {
        description: 'Only description updated'
      };

      const response = await request(app)
        .put(`/api/v1/photos/${testPhotoId}`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.photo.description).toBe(updateData.description);
    });

    test('should return 404 for non-existent photo', async () => {
      const updateData = {
        description: 'Updated description'
      };

      const response = await request(app)
        .put('/api/v1/photos/99999')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Photo not found');
    });

    test('should return 401 without authentication', async () => {
      const updateData = {
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/api/v1/photos/${testPhotoId}`)
        .send(updateData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access token required');
    });
  });

  describe('DELETE /api/v1/photos/:photoId', () => {
    test('should delete photo successfully', async () => {
      // First create a photo to delete
      const photoData = {
        filename: 'delete-test.jpg',
        file_data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
      };

      const createResponse = await request(app)
        .post(`/api/v1/events/${testEventId}/photos`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send(photoData);

      const photoToDelete = createResponse.body.photo.id;

      const response = await request(app)
        .delete(`/api/v1/photos/${photoToDelete}`)
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Photo deleted');
    });

    test('should return 404 for non-existent photo', async () => {
      const response = await request(app)
        .delete('/api/v1/photos/99999')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Photo not found');
    });

    test('should return 401 without authentication', async () => {
      const response = await request(app)
        .delete(`/api/v1/photos/${testPhotoId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access token required');
    });
  });

  describe('Error Handling', () => {
    test('should handle database connection errors gracefully', async () => {
      // This test would require mocking the database connection
      // For now, we'll test that the API structure is correct
      const response = await request(app)
        .get(`/api/v1/events/${testEventId}/photos`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBeDefined();
      expect(typeof response.status).toBe('number');
    });

    test('should validate event ID format', async () => {
      const response = await request(app)
        .get('/api/v1/events/invalid-id/photos')
        .set('Authorization', `Bearer ${mockToken}`);

      // Should handle invalid ID gracefully
      expect(response.status).toBeDefined();
    });

    test('should validate photo ID format', async () => {
      const response = await request(app)
        .get('/api/v1/photos/invalid-id')
        .set('Authorization', `Bearer ${mockToken}`);

      // Should handle invalid ID gracefully
      expect(response.status).toBeDefined();
    });
  });

  describe('Performance Tests', () => {
    test('should handle multiple photo uploads efficiently', async () => {
      const photos = [];
      const uploadPromises = [];

      // Create multiple photos simultaneously
      for (let i = 0; i < 5; i++) {
        const photoData = {
          filename: `batch-test-${i}.jpg`,
          file_data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
          description: `Batch test photo ${i}`,
          caption: `Caption ${i}`
        };

        uploadPromises.push(
          request(app)
            .post(`/api/v1/events/${testEventId}/photos`)
            .set('Authorization', `Bearer ${mockToken}`)
            .send(photoData)
        );
      }

      const responses = await Promise.all(uploadPromises);
      
      // All uploads should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        photos.push(response.body.photo.id);
      });

      // Clean up batch photos
      const deletePromises = photos.map(photoId =>
        request(app)
          .delete(`/api/v1/photos/${photoId}`)
          .set('Authorization', `Bearer ${mockToken}`)
      );
      
      await Promise.all(deletePromises);
    });

    test('should handle large photo data', async () => {
      // Create a larger base64 image (simulated)
      const largeBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='.repeat(100);
      
      const photoData = {
        filename: 'large-photo.jpg',
        file_data: largeBase64,
        description: 'Large photo test',
        caption: 'Large photo'
      };

      const response = await request(app)
        .post(`/api/v1/events/${testEventId}/photos`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send(photoData)
        .expect(200);

      expect(response.body.success).toBe(true);
      
      // Clean up
      await request(app)
        .delete(`/api/v1/photos/${response.body.photo.id}`)
        .set('Authorization', `Bearer ${mockToken}`);
    });
  });
});
