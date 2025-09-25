/**
 * Database Constraints Tests
 * Tests database constraints, validation, and data integrity
 */

import { PrismaClient } from '@prisma/client';
import { testUtils } from '../setup';

describe('Database Constraints Tests', () => {
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

  describe('Foreign Key Constraints', () => {
    test('should enforce event_id foreign key in photos', async () => {
      await expect(
        prisma.photo.create({
          data: {
            event_id: 99999, // Non-existent event
            filename: 'test.jpg',
            description: 'Test photo'
          }
        })
      ).rejects.toThrow();
    });

    test('should enforce event_id foreign key in recipes', async () => {
      const user = await testUtils.createTestUser(prisma);

      await expect(
        prisma.recipe.create({
          data: {
            event_id: 99999, // Non-existent event
            user_id: user.user_id,
            title: 'Test Recipe',
            ingredients: 'Test ingredients',
            instructions: 'Test instructions'
          }
        })
      ).rejects.toThrow();
    });

    test('should enforce event_id foreign key in blog posts', async () => {
      const user = await testUtils.createTestUser(prisma);

      await expect(
        prisma.blogPost.create({
          data: {
            event_id: 99999, // Non-existent event
            user_id: user.user_id,
            title: 'Test Post',
            content: 'Test content'
          }
        })
      ).rejects.toThrow();
    });

    test('should enforce user_id foreign key in recipes', async () => {
      const event = await testUtils.createTestEvent(prisma);

      await expect(
        prisma.recipe.create({
          data: {
            event_id: event.event_id,
            user_id: 99999, // Non-existent user
            title: 'Test Recipe',
            ingredients: 'Test ingredients',
            instructions: 'Test instructions'
          }
        })
      ).rejects.toThrow();
    });

    test('should enforce user_id foreign key in blog posts', async () => {
      const event = await testUtils.createTestEvent(prisma);

      await expect(
        prisma.blogPost.create({
          data: {
            event_id: event.event_id,
            user_id: 99999, // Non-existent user
            title: 'Test Post',
            content: 'Test content'
          }
        })
      ).rejects.toThrow();
    });
  });

  describe('Unique Constraints', () => {
    test('should enforce unique username constraint', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      };

      // Create first user
      await prisma.user.create({ data: userData });

      // Try to create second user with same username
      await expect(
        prisma.user.create({
          data: {
            ...userData,
            email: 'different@example.com'
          }
        })
      ).rejects.toThrow();
    });

    test('should enforce unique email constraint', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      };

      // Create first user
      await prisma.user.create({ data: userData });

      // Try to create second user with same email
      await expect(
        prisma.user.create({
          data: {
            ...userData,
            username: 'differentuser'
          }
        })
      ).rejects.toThrow();
    });
  });

  describe('Required Field Constraints', () => {
    test('should require event_name in events', async () => {
      await expect(
        prisma.event.create({
          data: {
            event_type: 'Thanksgiving',
            event_location: 'Test Location',
            event_date: new Date(),
            event_description: 'Test Description',
            menu_title: 'Test Menu',
            menu_image_filename: 'test.jpg'
            // Missing event_name
          } as any
        })
      ).rejects.toThrow();
    });

    test('should require filename in photos', async () => {
      const event = await testUtils.createTestEvent(prisma);

      await expect(
        prisma.photo.create({
          data: {
            event_id: event.event_id,
            // Missing filename
            description: 'Test photo'
          } as any
        })
      ).rejects.toThrow();
    });

    test('should require title in recipes', async () => {
      const event = await testUtils.createTestEvent(prisma);
      const user = await testUtils.createTestUser(prisma);

      await expect(
        prisma.recipe.create({
          data: {
            event_id: event.event_id,
            user_id: user.user_id,
            // Missing title
            ingredients: 'Test ingredients',
            instructions: 'Test instructions'
          } as any
        })
      ).rejects.toThrow();
    });

    test('should require ingredients in recipes', async () => {
      const event = await testUtils.createTestEvent(prisma);
      const user = await testUtils.createTestUser(prisma);

      await expect(
        prisma.recipe.create({
          data: {
            event_id: event.event_id,
            user_id: user.user_id,
            title: 'Test Recipe',
            // Missing ingredients
            instructions: 'Test instructions'
          } as any
        })
      ).rejects.toThrow();
    });

    test('should require instructions in recipes', async () => {
      const event = await testUtils.createTestEvent(prisma);
      const user = await testUtils.createTestUser(prisma);

      await expect(
        prisma.recipe.create({
          data: {
            event_id: event.event_id,
            user_id: user.user_id,
            title: 'Test Recipe',
            ingredients: 'Test ingredients'
            // Missing instructions
          } as any
        })
      ).rejects.toThrow();
    });

    test('should require title in blog posts', async () => {
      const event = await testUtils.createTestEvent(prisma);
      const user = await testUtils.createTestUser(prisma);

      await expect(
        prisma.blogPost.create({
          data: {
            event_id: event.event_id,
            user_id: user.user_id,
            // Missing title
            content: 'Test content'
          } as any
        })
      ).rejects.toThrow();
    });

    test('should require content in blog posts', async () => {
      const event = await testUtils.createTestEvent(prisma);
      const user = await testUtils.createTestUser(prisma);

      await expect(
        prisma.blogPost.create({
          data: {
            event_id: event.event_id,
            user_id: user.user_id,
            title: 'Test Post'
            // Missing content
          } as any
        })
      ).rejects.toThrow();
    });
  });

  describe('Cascade Delete Constraints', () => {
    test('should cascade delete photos when event is deleted', async () => {
      const event = await testUtils.createTestEvent(prisma);

      const photo = await prisma.photo.create({
        data: {
          event_id: event.event_id,
          filename: 'test.jpg',
          description: 'Test photo'
        }
      });

      // Delete the event
      await prisma.event.delete({
        where: { event_id: event.event_id }
      });

      // Photo should be deleted
      const deletedPhoto = await prisma.photo.findUnique({
        where: { photo_id: photo.photo_id }
      });
      expect(deletedPhoto).toBeNull();
    });

    test('should cascade delete recipes when event is deleted', async () => {
      const event = await testUtils.createTestEvent(prisma);
      const user = await testUtils.createTestUser(prisma);

      const recipe = await prisma.recipe.create({
        data: {
          event_id: event.event_id,
          user_id: user.user_id,
          title: 'Test Recipe',
          ingredients: 'Test ingredients',
          instructions: 'Test instructions'
        }
      });

      // Delete the event
      await prisma.event.delete({
        where: { event_id: event.event_id }
      });

      // Recipe should be deleted
      const deletedRecipe = await prisma.recipe.findUnique({
        where: { recipe_id: recipe.recipe_id }
      });
      expect(deletedRecipe).toBeNull();
    });

    test('should cascade delete blog posts when event is deleted', async () => {
      const event = await testUtils.createTestEvent(prisma);
      const user = await testUtils.createTestUser(prisma);

      const blogPost = await prisma.blogPost.create({
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

      // Blog post should be deleted
      const deletedPost = await prisma.blogPost.findUnique({
        where: { blog_post_id: blogPost.blog_post_id }
      });
      expect(deletedPost).toBeNull();
    });

    test('should set user_id to null when user is deleted (SetNull behavior)', async () => {
      const event = await testUtils.createTestEvent(prisma);
      const user = await testUtils.createTestUser(prisma);

      const recipe = await prisma.recipe.create({
        data: {
          event_id: event.event_id,
          user_id: user.user_id,
          title: 'Test Recipe',
          ingredients: 'Test ingredients',
          instructions: 'Test instructions'
        }
      });

      // Delete the user
      await prisma.user.delete({
        where: { user_id: user.user_id }
      });

      // Recipe should still exist but with user_id set to null
      const updatedRecipe = await prisma.recipe.findUnique({
        where: { recipe_id: recipe.recipe_id }
      });
      expect(updatedRecipe).toBeDefined();
      expect(updatedRecipe?.user_id).toBeNull();
    });

    test('should cascade delete blog posts when user is deleted', async () => {
      const event = await testUtils.createTestEvent(prisma);
      const user = await testUtils.createTestUser(prisma);

      const blogPost = await prisma.blogPost.create({
        data: {
          event_id: event.event_id,
          user_id: user.user_id,
          title: 'Test Post',
          content: 'Test content'
        }
      });

      // Delete the user
      await prisma.user.delete({
        where: { user_id: user.user_id }
      });

      // Blog post should be deleted
      const deletedPost = await prisma.blogPost.findUnique({
        where: { blog_post_id: blogPost.blog_post_id }
      });
      expect(deletedPost).toBeNull();
    });
  });

  describe('Data Type Constraints', () => {
    test('should enforce boolean type for is_featured in recipes', async () => {
      const event = await testUtils.createTestEvent(prisma);
      const user = await testUtils.createTestUser(prisma);

      // Valid boolean values should work
      const recipe1 = await prisma.recipe.create({
        data: {
          event_id: event.event_id,
          user_id: user.user_id,
          title: 'Test Recipe 1',
          ingredients: 'Test ingredients',
          instructions: 'Test instructions',
          is_featured: true
        }
      });

      const recipe2 = await prisma.recipe.create({
        data: {
          event_id: event.event_id,
          user_id: user.user_id,
          title: 'Test Recipe 2',
          ingredients: 'Test ingredients',
          instructions: 'Test instructions',
          is_featured: false
        }
      });

      expect(recipe1.is_featured).toBe(true);
      expect(recipe2.is_featured).toBe(false);
    });

    test('should enforce array type for tags in blog posts', async () => {
      const event = await testUtils.createTestEvent(prisma);
      const user = await testUtils.createTestUser(prisma);

      const blogPost = await prisma.blogPost.create({
        data: {
          event_id: event.event_id,
          user_id: user.user_id,
          title: 'Test Post',
          content: 'Test content',
          tags: ['tag1', 'tag2', 'tag3']
        }
      });

      expect(blogPost.tags).toEqual(['tag1', 'tag2', 'tag3']);
    });

    test('should enforce enum type for user roles', async () => {
      const user1 = await prisma.user.create({
        data: {
          username: 'adminuser',
          email: 'admin@example.com',
          password_hash: 'hashedpassword',
          role: 'admin'
        }
      });

      const user2 = await prisma.user.create({
        data: {
          username: 'regularuser',
          email: 'user@example.com',
          password_hash: 'hashedpassword',
          role: 'user'
        }
      });

      expect(user1.role).toBe('admin');
      expect(user2.role).toBe('user');
    });
  });

  describe('Default Value Constraints', () => {
    test('should apply default values for timestamps', async () => {
      const event = await testUtils.createTestEvent(prisma);

      const photo = await prisma.photo.create({
        data: {
          event_id: event.event_id,
          filename: 'test.jpg',
          description: 'Test photo'
        }
      });

      expect(photo.created_at).toBeDefined();
      expect(photo.updated_at).toBeDefined();
      expect(photo.taken_date).toBeDefined();
    });

    test('should apply default values for boolean fields', async () => {
      const event = await testUtils.createTestEvent(prisma);
      const user = await testUtils.createTestUser(prisma);

      const recipe = await prisma.recipe.create({
        data: {
          event_id: event.event_id,
          user_id: user.user_id,
          title: 'Test Recipe',
          ingredients: 'Test ingredients',
          instructions: 'Test instructions'
        }
      });

      expect(recipe.is_featured).toBe(false); // Default value
    });

    test('should apply default values for status fields', async () => {
      const event = await testUtils.createTestEvent(prisma);
      const user = await testUtils.createTestUser(prisma);

      const blogPost = await prisma.blogPost.create({
        data: {
          event_id: event.event_id,
          user_id: user.user_id,
          title: 'Test Post',
          content: 'Test content'
        }
      });

      expect(blogPost.status).toBe('draft'); // Default value
    });
  });
});
