/**
 * Database Integration Tests
 * Tests database operations across all models and relationships
 */

import { PrismaClient } from '@prisma/client';
import { testUtils } from '../setup';

describe('Database Integration Tests', () => {
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

  describe('Event-Centric Operations', () => {
    test('should create event with all related content types', async () => {
      // Create test data
      const event = await testUtils.createTestEvent(prisma);
      const user = await testUtils.createTestUser(prisma);

      // Create photos
      await prisma.photo.create({
        data: {
          event_id: event.event_id,
          filename: 'photo1.jpg',
          description: 'Test photo 1',
          caption: 'Caption 1'
        }
      });

      await prisma.photo.create({
        data: {
          event_id: event.event_id,
          filename: 'photo2.jpg',
          description: 'Test photo 2',
          caption: 'Caption 2'
        }
      });

      // Create recipes
      await prisma.recipe.create({
        data: {
          event_id: event.event_id,
          user_id: user.user_id,
          title: 'Grandma\'s Turkey',
          ingredients: 'Turkey, herbs, butter',
          instructions: 'Season and roast turkey',
          category: 'Main Course',
          difficulty_level: 'Medium'
        }
      });

      await prisma.recipe.create({
        data: {
          event_id: event.event_id,
          user_id: user.user_id,
          title: 'Mashed Potatoes',
          ingredients: 'Potatoes, butter, milk',
          instructions: 'Boil and mash potatoes',
          category: 'Side Dish',
          difficulty_level: 'Easy'
        }
      });

      // Create blog posts
      await prisma.blogPost.create({
        data: {
          event_id: event.event_id,
          user_id: user.user_id,
          title: 'Memories of Thanksgiving',
          content: 'This Thanksgiving was wonderful...',
          excerpt: 'A heartwarming story',
          tags: ['family', 'memories'],
          status: 'published',
          published_at: new Date()
        }
      });

      await prisma.blogPost.create({
        data: {
          event_id: event.event_id,
          user_id: user.user_id,
          title: 'Recipe Collection',
          content: 'Here are our favorite recipes...',
          excerpt: 'Recipe roundup',
          tags: ['recipes', 'cooking'],
          status: 'draft'
        }
      });

      // Verify all content is associated with the event
      const eventWithContent = await prisma.event.findUnique({
        where: { event_id: event.event_id },
        include: {
          photos: true,
          recipes: true,
          blog_posts: true
        }
      });

      expect(eventWithContent).toBeDefined();
      expect(eventWithContent?.photos).toHaveLength(2);
      expect(eventWithContent?.recipes).toHaveLength(2);
      expect(eventWithContent?.blog_posts).toHaveLength(2);

      // Verify content details
      expect(eventWithContent?.photos[0]?.filename).toBe('photo1.jpg');
      expect(eventWithContent?.recipes[0]?.title).toBe('Grandma\'s Turkey');
      expect(eventWithContent?.blog_posts[0]?.title).toBe('Memories of Thanksgiving');
    });

    test('should cascade delete all related content when event is deleted', async () => {
      const event = await testUtils.createTestEvent(prisma);
      const user = await testUtils.createTestUser(prisma);

      // Create related content
      await prisma.photo.create({
        data: {
          event_id: event.event_id,
          filename: 'test-photo.jpg',
          description: 'Test photo'
        }
      });

      await prisma.recipe.create({
        data: {
          event_id: event.event_id,
          user_id: user.user_id,
          title: 'Test Recipe',
          ingredients: 'Test ingredients',
          instructions: 'Test instructions'
        }
      });

      await prisma.blogPost.create({
        data: {
          event_id: event.event_id,
          user_id: user.user_id,
          title: 'Test Post',
          content: 'Test content'
        }
      });

      // Delete the event
      await prisma.event.delete({
        where: { event_id: event.event_id }
      });

      // Verify all related content is deleted
      const photos = await prisma.photo.findMany({
        where: { event_id: event.event_id }
      });
      const recipes = await prisma.recipe.findMany({
        where: { event_id: event.event_id }
      });
      const blogPosts = await prisma.blogPost.findMany({
        where: { event_id: event.event_id }
      });

      expect(photos).toHaveLength(0);
      expect(recipes).toHaveLength(0);
      expect(blogPosts).toHaveLength(0);
    });
  });

  describe('User-Centric Operations', () => {
    test('should track user contributions across content types', async () => {
      const event = await testUtils.createTestEvent(prisma);
      const user = await testUtils.createTestUser(prisma);

      // Create content by the user
      await prisma.recipe.create({
        data: {
          event_id: event.event_id,
          user_id: user.user_id,
          title: 'User Recipe',
          ingredients: 'Ingredients',
          instructions: 'Instructions'
        }
      });

      await prisma.blogPost.create({
        data: {
          event_id: event.event_id,
          user_id: user.user_id,
          title: 'User Post',
          content: 'User content'
        }
      });

      // Verify user's contributions
      const userWithContent = await prisma.user.findUnique({
        where: { user_id: user.user_id },
        include: {
          recipes: true,
          blog_posts: true
        }
      });

      expect(userWithContent).toBeDefined();
      expect(userWithContent?.recipes).toHaveLength(1);
      expect(userWithContent?.blog_posts).toHaveLength(1);
      expect(userWithContent?.recipes[0]?.title).toBe('User Recipe');
      expect(userWithContent?.blog_posts[0]?.title).toBe('User Post');
    });

    test('should handle user deletion with cascade constraints', async () => {
      const event = await testUtils.createTestEvent(prisma);
      const user = await testUtils.createTestUser(prisma);

      // Create content by the user
      await prisma.recipe.create({
        data: {
          event_id: event.event_id,
          user_id: user.user_id,
          title: 'User Recipe',
          ingredients: 'Ingredients',
          instructions: 'Instructions'
        }
      });

      await prisma.blogPost.create({
        data: {
          event_id: event.event_id,
          user_id: user.user_id,
          title: 'User Post',
          content: 'User content'
        }
      });

      // Delete the user
      await prisma.user.delete({
        where: { user_id: user.user_id }
      });

      // Verify cascade behavior
      const recipes = await prisma.recipe.findMany({
        where: { user_id: user.user_id }
      });
      const blogPosts = await prisma.blogPost.findMany({
        where: { user_id: user.user_id }
      });

      // Recipes should be deleted (cascade)
      expect(recipes).toHaveLength(0);
      // Blog posts should be deleted (cascade)
      expect(blogPosts).toHaveLength(0);
    });
  });

  describe('Complex Queries', () => {
    test('should perform complex queries across multiple models', async () => {
      const event = await testUtils.createTestEvent(prisma);
      const user = await testUtils.createTestUser(prisma);

      // Create diverse content
      await prisma.photo.create({
        data: {
          event_id: event.event_id,
          filename: 'photo1.jpg',
          description: 'Family photo'
        }
      });

      await prisma.recipe.create({
        data: {
          event_id: event.event_id,
          user_id: user.user_id,
          title: 'Turkey Recipe',
          ingredients: 'Turkey',
          instructions: 'Cook turkey',
          category: 'Main Course',
          is_featured: true
        }
      });

      await prisma.blogPost.create({
        data: {
          event_id: event.event_id,
          user_id: user.user_id,
          title: 'Thanksgiving Story',
          content: 'Our Thanksgiving story...',
          tags: ['family', 'thanksgiving'],
          status: 'published',
          published_at: new Date()
        }
      });

      // Complex query: Get event with featured recipes and published blog posts
      const eventWithFeaturedContent = await prisma.event.findUnique({
        where: { event_id: event.event_id },
        include: {
          photos: true,
          recipes: {
            where: { is_featured: true }
          },
          blog_posts: {
            where: { status: 'published' }
          }
        }
      });

      expect(eventWithFeaturedContent).toBeDefined();
      expect(eventWithFeaturedContent?.photos).toHaveLength(1);
      expect(eventWithFeaturedContent?.recipes).toHaveLength(1);
      expect(eventWithFeaturedContent?.blog_posts).toHaveLength(1);
      expect(eventWithFeaturedContent?.recipes[0]?.is_featured).toBe(true);
      expect(eventWithFeaturedContent?.blog_posts[0]?.status).toBe('published');
    });

    test('should handle tag-based queries for blog posts', async () => {
      const event = await testUtils.createTestEvent(prisma);
      const user = await testUtils.createTestUser(prisma);

      // Create blog posts with different tags
      await prisma.blogPost.create({
        data: {
          event_id: event.event_id,
          user_id: user.user_id,
          title: 'Family Story',
          content: 'Family content',
          tags: ['family', 'memories']
        }
      });

      await prisma.blogPost.create({
        data: {
          event_id: event.event_id,
          user_id: user.user_id,
          title: 'Recipe Post',
          content: 'Recipe content',
          tags: ['recipes', 'cooking']
        }
      });

      await prisma.blogPost.create({
        data: {
          event_id: event.event_id,
          user_id: user.user_id,
          title: 'Mixed Post',
          content: 'Mixed content',
          tags: ['family', 'recipes']
        }
      });

      // Query by specific tag
      const familyPosts = await prisma.blogPost.findMany({
        where: {
          tags: {
            has: 'family'
          }
        }
      });

      expect(familyPosts).toHaveLength(2);
      expect(familyPosts[0]?.title).toBe('Family Story');
      expect(familyPosts[1]?.title).toBe('Mixed Post');
    });
  });

  describe('Data Integrity', () => {
    test('should enforce foreign key constraints', async () => {
      // Try to create content with non-existent event
      await expect(
        prisma.photo.create({
          data: {
            event_id: 99999,
            filename: 'test.jpg',
            description: 'Test'
          }
        })
      ).rejects.toThrow();

      // Try to create content with non-existent user
      const event = await testUtils.createTestEvent(prisma);
      await expect(
        prisma.recipe.create({
          data: {
            event_id: event.event_id,
            user_id: 99999,
            title: 'Test Recipe',
            ingredients: 'Test',
            instructions: 'Test'
          }
        })
      ).rejects.toThrow();
    });

    test('should maintain referential integrity during updates', async () => {
      const event = await testUtils.createTestEvent(prisma);
      const user = await testUtils.createTestUser(prisma);

      const recipe = await prisma.recipe.create({
        data: {
          event_id: event.event_id,
          user_id: user.user_id,
          title: 'Test Recipe',
          ingredients: 'Test',
          instructions: 'Test'
        }
      });

      // Update recipe
      const updatedRecipe = await prisma.recipe.update({
        where: { recipe_id: recipe.recipe_id },
        data: { title: 'Updated Recipe' }
      });

      expect(updatedRecipe.title).toBe('Updated Recipe');
      expect(updatedRecipe.event_id).toBe(event.event_id);
      expect(updatedRecipe.user_id).toBe(user.user_id);
    });
  });

  describe('Performance Tests', () => {
    test('should handle bulk operations efficiently', async () => {
      const event = await testUtils.createTestEvent(prisma);
      const user = await testUtils.createTestUser(prisma);

      const startTime = Date.now();

      // Create multiple recipes in bulk
      const recipes = Array.from({ length: 10 }, (_, i) => ({
        event_id: event.event_id,
        user_id: user.user_id,
        title: `Recipe ${i + 1}`,
        ingredients: `Ingredients ${i + 1}`,
        instructions: `Instructions ${i + 1}`
      }));

      await prisma.recipe.createMany({
        data: recipes
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (less than 1 second)
      expect(duration).toBeLessThan(1000);

      // Verify all recipes were created
      const count = await prisma.recipe.count({
        where: { event_id: event.event_id }
      });
      expect(count).toBe(10);
    });
  });
});
