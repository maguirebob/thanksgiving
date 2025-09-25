/**
 * BlogPost Model Tests
 * Tests for the BlogPost Prisma model functionality
 */

import { PrismaClient } from '@prisma/client';
import { testUtils } from '../setup';

describe('BlogPost Model', () => {
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

  describe('BlogPost Creation', () => {
    test('should create a blog post with all fields', async () => {
      const event = await testUtils.createTestEvent(prisma);
      const user = await testUtils.createTestUser(prisma);

      const blogPostData = {
        event_id: event.event_id,
        user_id: user.user_id,
        title: 'Memories of Thanksgiving 2024',
        content: 'This Thanksgiving was truly special. We gathered around the table with three generations of family, sharing stories and laughter. The turkey was perfectly cooked, and Grandma\'s stuffing recipe never fails to bring back childhood memories.',
        excerpt: 'A heartwarming story about our family Thanksgiving celebration',
        featured_image: 'thanksgiving-2024.jpg',
        tags: ['family', 'memories', 'thanksgiving', 'tradition'],
        status: 'published',
        published_at: new Date()
      };

      const blogPost = await prisma.blogPost.create({
        data: blogPostData
      });

      expect(blogPost).toBeDefined();
      expect(blogPost.title).toBe('Memories of Thanksgiving 2024');
      expect(blogPost.event_id).toBe(event.event_id);
      expect(blogPost.user_id).toBe(user.user_id);
      expect(blogPost.status).toBe('published');
      expect(blogPost.tags).toEqual(['family', 'memories', 'thanksgiving', 'tradition']);
      expect(blogPost.published_at).toBeDefined();
    });

    test('should create a draft blog post', async () => {
      const event = await testUtils.createTestEvent(prisma);
      const user = await testUtils.createTestUser(prisma);

      const blogPostData = {
        event_id: event.event_id,
        user_id: user.user_id,
        title: 'Draft Post',
        content: 'This is a draft post that hasn\'t been published yet.',
        tags: ['draft']
      };

      const blogPost = await prisma.blogPost.create({
        data: blogPostData
      });

      expect(blogPost).toBeDefined();
      expect(blogPost.title).toBe('Draft Post');
      expect(blogPost.status).toBe('draft'); // Default value
      expect(blogPost.published_at).toBeNull();
    });

    test('should enforce required user relationship', async () => {
      const event = await testUtils.createTestEvent(prisma);

      const blogPostData = {
        event_id: event.event_id,
        user_id: 99999, // Non-existent user
        title: 'Invalid Post',
        content: 'This should fail'
      };

      await expect(
        prisma.blogPost.create({ data: blogPostData })
      ).rejects.toThrow();
    });
  });

  describe('BlogPost Relationships', () => {
    test('should include event and user relationships', async () => {
      const event = await testUtils.createTestEvent(prisma);
      const user = await testUtils.createTestUser(prisma);

      const blogPost = await prisma.blogPost.create({
        data: {
          event_id: event.event_id,
          user_id: user.user_id,
          title: 'Test Post',
          content: 'Test content'
        },
        include: {
          event: true,
          user: true
        }
      });

      expect(blogPost.event).toBeDefined();
      expect(blogPost.event.event_name).toBe(event.event_name);
      expect(blogPost.user).toBeDefined();
      expect(blogPost.user.username).toBe(user.username);
    });

    test('should cascade delete when event is deleted', async () => {
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

      // Blog post should be deleted due to cascade
      const deletedPost = await prisma.blogPost.findUnique({
        where: { blog_post_id: blogPost.blog_post_id }
      });

      expect(deletedPost).toBeNull();
    });

    test('should cascade delete when user is deleted', async () => {
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

      // Blog post should be deleted due to cascade
      const deletedPost = await prisma.blogPost.findUnique({
        where: { blog_post_id: blogPost.blog_post_id }
      });

      expect(deletedPost).toBeNull();
    });
  });

  describe('BlogPost Queries', () => {
    test('should find blog posts by event', async () => {
      const event = await testUtils.createTestEvent(prisma);
      const user = await testUtils.createTestUser(prisma);

      await prisma.blogPost.createMany({
        data: [
          {
            event_id: event.event_id,
            user_id: user.user_id,
            title: 'Post 1',
            content: 'Content 1'
          },
          {
            event_id: event.event_id,
            user_id: user.user_id,
            title: 'Post 2',
            content: 'Content 2'
          }
        ]
      });

      const posts = await prisma.blogPost.findMany({
        where: { event_id: event.event_id }
      });

      expect(posts).toHaveLength(2);
      expect(posts[0]?.title).toBe('Post 1');
      expect(posts[1]?.title).toBe('Post 2');
    });

    test('should find published blog posts', async () => {
      const event = await testUtils.createTestEvent(prisma);
      const user = await testUtils.createTestUser(prisma);

      await prisma.blogPost.createMany({
        data: [
          {
            event_id: event.event_id,
            user_id: user.user_id,
            title: 'Published Post',
            content: 'Published content',
            status: 'published',
            published_at: new Date()
          },
          {
            event_id: event.event_id,
            user_id: user.user_id,
            title: 'Draft Post',
            content: 'Draft content',
            status: 'draft'
          }
        ]
      });

      const publishedPosts = await prisma.blogPost.findMany({
        where: { status: 'published' }
      });

      expect(publishedPosts).toHaveLength(1);
      expect(publishedPosts[0]?.title).toBe('Published Post');
    });

    test('should find blog posts by tags', async () => {
      const event = await testUtils.createTestEvent(prisma);
      const user = await testUtils.createTestUser(prisma);

      await prisma.blogPost.createMany({
        data: [
          {
            event_id: event.event_id,
            user_id: user.user_id,
            title: 'Family Post',
            content: 'Family content',
            tags: ['family', 'memories']
          },
          {
            event_id: event.event_id,
            user_id: user.user_id,
            title: 'Food Post',
            content: 'Food content',
            tags: ['food', 'recipes']
          }
        ]
      });

      const familyPosts = await prisma.blogPost.findMany({
        where: {
          tags: {
            has: 'family'
          }
        }
      });

      expect(familyPosts).toHaveLength(1);
      expect(familyPosts[0]?.title).toBe('Family Post');
    });
  });
});
