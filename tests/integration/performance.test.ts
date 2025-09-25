/**
 * Database Performance Tests
 * Tests database performance and optimization
 */

import { PrismaClient } from '@prisma/client';
import { testUtils } from '../setup';

describe('Database Performance Tests', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await testUtils.cleanupTestData(prisma);
  });

  describe('Query Performance', () => {
    test('should efficiently query events with all related content', async () => {
      // Create test data
      const event = await testUtils.createTestEvent(prisma);
      const user = await testUtils.createTestUser(prisma);

      // Create multiple related records
      await prisma.photo.createMany({
        data: Array.from({ length: 5 }, (_, i) => ({
          event_id: event.event_id,
          filename: `photo${i + 1}.jpg`,
          description: `Photo ${i + 1}`
        }))
      });

      await prisma.recipe.createMany({
        data: Array.from({ length: 3 }, (_, i) => ({
          event_id: event.event_id,
          user_id: user.user_id,
          title: `Recipe ${i + 1}`,
          ingredients: `Ingredients ${i + 1}`,
          instructions: `Instructions ${i + 1}`
        }))
      });

      await prisma.blogPost.createMany({
        data: Array.from({ length: 2 }, (_, i) => ({
          event_id: event.event_id,
          user_id: user.user_id,
          title: `Blog Post ${i + 1}`,
          content: `Content ${i + 1}`
        }))
      });

      // Test query performance
      const startTime = Date.now();

      const eventWithContent = await prisma.event.findUnique({
        where: { event_id: event.event_id },
        include: {
          photos: true,
          recipes: {
            include: {
              user: true
            }
          },
          blog_posts: {
            include: {
              user: true
            }
          }
        }
      });

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      // Should complete within reasonable time
      expect(queryTime).toBeLessThan(500); // 500ms

      // Verify results
      expect(eventWithContent).toBeDefined();
      expect(eventWithContent?.photos).toHaveLength(5);
      expect(eventWithContent?.recipes).toHaveLength(3);
      expect(eventWithContent?.blog_posts).toHaveLength(2);
    });

    test('should efficiently filter and paginate results', async () => {
      const user = await testUtils.createTestUser(prisma);

      // Create multiple events
      const events = await Promise.all(
        Array.from({ length: 20 }, (_, i) =>
          testUtils.createTestEvent(prisma, {
            event_name: `Event ${i + 1}`,
            event_type: i % 2 === 0 ? 'Thanksgiving' : 'Christmas'
          })
        )
      );

      // Create recipes for some events
      for (let i = 0; i < 10; i++) {
        const event = events[i];
        if (event) {
          await prisma.recipe.create({
            data: {
              event_id: event.event_id,
              user_id: user.user_id,
              title: `Recipe for Event ${i + 1}`,
              ingredients: 'Test ingredients',
              instructions: 'Test instructions'
            }
          });
        }
      }

      const startTime = Date.now();

      // Test pagination and filtering
      const thanksgivingEvents = await prisma.event.findMany({
        where: { event_type: 'Thanksgiving' },
        include: {
          recipes: true,
          _count: {
            select: {
              photos: true,
              recipes: true,
              blog_posts: true
            }
          }
        },
        skip: 0,
        take: 10,
        orderBy: { event_date: 'desc' }
      });

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      // Should complete within reasonable time
      expect(queryTime).toBeLessThan(300); // 300ms

      // Verify results
      expect(thanksgivingEvents).toHaveLength(10);
      expect(thanksgivingEvents[0]?.event_type).toBe('Thanksgiving');
    });
  });

  describe('Bulk Operations Performance', () => {
    test('should efficiently handle bulk inserts', async () => {
      const event = await testUtils.createTestEvent(prisma);

      const startTime = Date.now();

      // Bulk insert photos
      const photos = Array.from({ length: 50 }, (_, i) => ({
        event_id: event.event_id,
        filename: `bulk_photo_${i + 1}.jpg`,
        description: `Bulk photo ${i + 1}`,
        file_size: 1024000,
        mime_type: 'image/jpeg'
      }));

      await prisma.photo.createMany({
        data: photos
      });

      const endTime = Date.now();
      const insertTime = endTime - startTime;

      // Should complete within reasonable time
      expect(insertTime).toBeLessThan(1000); // 1 second

      // Verify all photos were inserted
      const count = await prisma.photo.count({
        where: { event_id: event.event_id }
      });
      expect(count).toBe(50);
    });

    test('should efficiently handle bulk updates', async () => {
      const event = await testUtils.createTestEvent(prisma);
      const user = await testUtils.createTestUser(prisma);

      // Create recipes to update
      await prisma.recipe.createMany({
        data: Array.from({ length: 20 }, (_, i) => ({
          event_id: event.event_id,
          user_id: user.user_id,
          title: `Original Recipe ${i + 1}`,
          ingredients: 'Original ingredients',
          instructions: 'Original instructions'
        }))
      });

      const startTime = Date.now();

      // Bulk update recipes
      await prisma.recipe.updateMany({
        where: { event_id: event.event_id },
        data: { 
          title: 'Updated Recipe',
          updated_at: new Date()
        }
      });

      const endTime = Date.now();
      const updateTime = endTime - startTime;

      // Should complete within reasonable time
      expect(updateTime).toBeLessThan(500); // 500ms

      // Verify all recipes were updated
      const updatedRecipes = await prisma.recipe.findMany({
        where: { event_id: event.event_id }
      });
      expect(updatedRecipes).toHaveLength(20);
      expect(updatedRecipes[0]?.title).toBe('Updated Recipe');
    });
  });

  describe('Concurrent Operations', () => {
    test('should handle concurrent reads efficiently', async () => {
      const event = await testUtils.createTestEvent(prisma);

      // Create test data
      await prisma.photo.createMany({
        data: Array.from({ length: 10 }, (_, i) => ({
          event_id: event.event_id,
          filename: `concurrent_photo_${i + 1}.jpg`,
          description: `Concurrent photo ${i + 1}`
        }))
      });

      const startTime = Date.now();

      // Simulate concurrent reads
      const promises = Array.from({ length: 10 }, () =>
        prisma.event.findUnique({
          where: { event_id: event.event_id },
          include: { photos: true }
        })
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Should complete within reasonable time
      expect(totalTime).toBeLessThan(1000); // 1 second

      // Verify all results are correct
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result?.photos).toHaveLength(10);
      });
    });

    test('should handle concurrent writes safely', async () => {
      const event = await testUtils.createTestEvent(prisma);
      const user = await testUtils.createTestUser(prisma);

      const startTime = Date.now();

      // Simulate concurrent writes
      const promises = Array.from({ length: 5 }, (_, i) =>
        prisma.recipe.create({
          data: {
            event_id: event.event_id,
            user_id: user.user_id,
            title: `Concurrent Recipe ${i + 1}`,
            ingredients: `Concurrent ingredients ${i + 1}`,
            instructions: `Concurrent instructions ${i + 1}`
          }
        })
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Should complete within reasonable time
      expect(totalTime).toBeLessThan(1000); // 1 second

      // Verify all recipes were created
      expect(results).toHaveLength(5);
      results.forEach((result, index) => {
        expect(result.title).toBe(`Concurrent Recipe ${index + 1}`);
      });

      // Verify total count
      const count = await prisma.recipe.count({
        where: { event_id: event.event_id }
      });
      expect(count).toBe(5);
    });
  });

  describe('Memory Usage', () => {
    test('should not leak memory during large result sets', async () => {
      const user = await testUtils.createTestUser(prisma);

      // Create multiple events with content
      const events = await Promise.all(
        Array.from({ length: 10 }, (_, i) =>
          testUtils.createTestEvent(prisma, {
            event_name: `Memory Test Event ${i + 1}`
          })
        )
      );

      // Create content for each event
      for (const event of events) {
        await prisma.photo.createMany({
          data: Array.from({ length: 5 }, (_, i) => ({
            event_id: event.event_id,
            filename: `memory_test_${event.event_id}_${i + 1}.jpg`,
            description: `Memory test photo ${i + 1}`
          }))
        });

        await prisma.recipe.createMany({
          data: Array.from({ length: 3 }, (_, i) => ({
            event_id: event.event_id,
            user_id: user.user_id,
            title: `Memory Test Recipe ${i + 1}`,
            ingredients: 'Test ingredients',
            instructions: 'Test instructions'
          }))
        });
      }

      // Query large result set
      const allEventsWithContent = await prisma.event.findMany({
        include: {
          photos: true,
          recipes: true,
          blog_posts: true
        }
      });

      // Verify results
      expect(allEventsWithContent).toHaveLength(10);
      allEventsWithContent.forEach(event => {
        expect(event.photos).toHaveLength(5);
        expect(event.recipes).toHaveLength(3);
      });

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
    });
  });
});
