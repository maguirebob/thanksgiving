import { Request, Response } from 'express';

// Mock Prisma before importing the controller
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    event: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn()
    },
    blogPost: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn()
    },
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn()
    }
  }))
}));

// Import after mocking
import {
  getEventBlogPosts,
  createEventBlogPost,
  getBlogPost,
  updateBlogPost,
  deleteBlogPost,
  searchBlogPosts,
  getBlogPostsByTag
} from '../../src/controllers/blogController';

describe('Blog Controller', () => {
  let prisma: any;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    // Create a new mock PrismaClient instance for each test
    const { PrismaClient } = require('@prisma/client');
    prisma = new PrismaClient();
    
    mockRequest = {
      params: {},
      query: {},
      body: {}
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('getEventBlogPosts', () => {
    it('should return blog posts for a valid event', async () => {
      const mockEvent = { event_id: 1, event_name: 'Test Event' };
      const mockBlogPosts = [
        {
          blog_post_id: 1,
          title: 'Test Blog Post',
          content: 'Test content',
          status: 'published',
          created_at: new Date(),
          user: { username: 'testuser' }
        }
      ];

      mockRequest.params = { eventId: '1' };
      mockRequest.query = { page: '1', limit: '10' };

      prisma.event.findUnique.mockResolvedValue(mockEvent);
      prisma.blogPost.findMany.mockResolvedValue(mockBlogPosts);
      prisma.blogPost.count.mockResolvedValue(1);

      await getEventBlogPosts(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          blogPosts: mockBlogPosts,
          pagination: {
            page: 1,
            limit: 10,
            total: 1,
            pages: 1
          }
        }
      });
    });

    it('should return 400 when eventId is missing', async () => {
      mockRequest.params = {};

      await getEventBlogPosts(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Event ID is required'
      });
    });

    it('should return 404 when event is not found', async () => {
      mockRequest.params = { eventId: '999' };

      prisma.event.findUnique.mockResolvedValue(null);

      await getEventBlogPosts(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Event not found'
      });
    });

    it('should handle database errors', async () => {
      mockRequest.params = { eventId: '1' };

      prisma.event.findUnique.mockRejectedValue(new Error('Database error'));

      await getEventBlogPosts(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error'
      });
    });

    it('should filter by status when provided', async () => {
      const mockEvent = { event_id: 1, event_name: 'Test Event' };
      const mockBlogPosts: any[] = [];

      mockRequest.params = { eventId: '1' };
      mockRequest.query = { status: 'published' };

      prisma.event.findUnique.mockResolvedValue(mockEvent);
      prisma.blogPost.findMany.mockResolvedValue(mockBlogPosts);
      prisma.blogPost.count.mockResolvedValue(0);

      await getEventBlogPosts(mockRequest as Request, mockResponse as Response);

      expect(prisma.blogPost.findMany).toHaveBeenCalledWith({
        where: {
          event_id: 1,
          status: 'published'
        },
        orderBy: { created_at: 'desc' },
        skip: 0,
        take: 20,
        select: expect.any(Object)
      });
    });

    it('should search blog posts when search query is provided', async () => {
      const mockEvent = { event_id: 1, event_name: 'Test Event' };
      const mockBlogPosts: any[] = [];

      mockRequest.params = { eventId: '1' };
      mockRequest.query = { search: 'test' };

      prisma.event.findUnique.mockResolvedValue(mockEvent);
      prisma.blogPost.findMany.mockResolvedValue(mockBlogPosts);
      prisma.blogPost.count.mockResolvedValue(0);

      await getEventBlogPosts(mockRequest as Request, mockResponse as Response);

      expect(prisma.blogPost.findMany).toHaveBeenCalledWith({
        where: {
          event_id: 1,
          OR: [
            { title: { contains: 'test', mode: 'insensitive' } },
            { content: { contains: 'test', mode: 'insensitive' } },
            { excerpt: { contains: 'test', mode: 'insensitive' } },
            { tags: { has: 'test' } }
          ]
        },
        orderBy: { created_at: 'desc' },
        skip: 0,
        take: 20,
        select: expect.any(Object)
      });
    });
  });

  describe('createEventBlogPost', () => {
    it('should create a new blog post successfully', async () => {
      const mockEvent = { event_id: 1, event_name: 'Test Event' };
      const mockBlogPost = {
        blog_post_id: 1,
        title: 'New Blog Post',
        content: 'Blog content',
        status: 'draft',
        created_at: new Date(),
        user: { username: 'testuser' }
      };

      mockRequest.params = { eventId: '1' };
      mockRequest.body = {
        title: 'New Blog Post',
        content: 'Blog content',
        tags: 'tag1,tag2'
      };

      prisma.event.findUnique.mockResolvedValue(mockEvent);
      prisma.blogPost.create.mockResolvedValue(mockBlogPost);

      await createEventBlogPost(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Blog post created successfully',
        data: mockBlogPost
      });
    });

    it('should return 400 when required fields are missing', async () => {
      mockRequest.params = { eventId: '1' };
      mockRequest.body = { title: 'Test' }; // Missing content

      await createEventBlogPost(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Title and content are required'
      });
    });

    it('should return 404 when event is not found', async () => {
      mockRequest.params = { eventId: '999' };
      mockRequest.body = {
        title: 'Test Post',
        content: 'Test content'
      };

      prisma.event.findUnique.mockResolvedValue(null);

      await createEventBlogPost(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Event not found'
      });
    });

    it('should handle tags as array', async () => {
      const mockEvent = { event_id: 1, event_name: 'Test Event' };
      const mockBlogPost = { blog_post_id: 1 };

      mockRequest.params = { eventId: '1' };
      mockRequest.body = {
        title: 'Test Post',
        content: 'Test content',
        tags: ['tag1', 'tag2']
      };

      prisma.event.findUnique.mockResolvedValue(mockEvent);
      prisma.blogPost.create.mockResolvedValue(mockBlogPost);

      await createEventBlogPost(mockRequest as Request, mockResponse as Response);

      expect(prisma.blogPost.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tags: ['tag1', 'tag2']
        }),
        select: expect.any(Object)
      });
    });

    it('should set published_at when status is published', async () => {
      const mockEvent = { event_id: 1, event_name: 'Test Event' };
      const mockBlogPost = { blog_post_id: 1 };

      mockRequest.params = { eventId: '1' };
      mockRequest.body = {
        title: 'Test Post',
        content: 'Test content',
        status: 'published'
      };

      prisma.event.findUnique.mockResolvedValue(mockEvent);
      prisma.blogPost.create.mockResolvedValue(mockBlogPost);

      await createEventBlogPost(mockRequest as Request, mockResponse as Response);

      expect(prisma.blogPost.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: 'published',
          published_at: expect.any(Date)
        }),
        select: expect.any(Object)
      });
    });
  });

  describe('getBlogPost', () => {
    it('should return a blog post by ID', async () => {
      const mockBlogPost = {
        blog_post_id: 1,
        title: 'Test Blog Post',
        content: 'Test content',
        user: { username: 'testuser' },
        event: { event_name: 'Test Event' }
      };

      mockRequest.params = { blogPostId: '1' };

      prisma.blogPost.findUnique.mockResolvedValue(mockBlogPost);

      await getBlogPost(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockBlogPost
      });
    });

    it('should return 400 when blogPostId is missing', async () => {
      mockRequest.params = {};

      await getBlogPost(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Blog post ID is required'
      });
    });

    it('should return 404 when blog post is not found', async () => {
      mockRequest.params = { blogPostId: '999' };

      prisma.blogPost.findUnique.mockResolvedValue(null);

      await getBlogPost(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Blog post not found'
      });
    });
  });

  describe('updateBlogPost', () => {
    it('should update a blog post successfully', async () => {
      const existingBlogPost = {
        blog_post_id: 1,
        title: 'Old Title',
        content: 'Old content',
        status: 'draft',
        published_at: null,
        tags: ['old']
      };
      const updatedBlogPost = {
        blog_post_id: 1,
        title: 'New Title',
        content: 'New content',
        status: 'published',
        published_at: new Date(),
        tags: ['new']
      };

      mockRequest.params = { blogPostId: '1' };
      mockRequest.body = {
        title: 'New Title',
        content: 'New content',
        status: 'published',
        tags: 'new'
      };

      prisma.blogPost.findUnique.mockResolvedValue(existingBlogPost);
      prisma.blogPost.update.mockResolvedValue(updatedBlogPost);

      await updateBlogPost(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Blog post updated successfully',
        data: updatedBlogPost
      });
    });

    it('should return 404 when blog post is not found', async () => {
      mockRequest.params = { blogPostId: '999' };
      mockRequest.body = { title: 'New Title' };

      prisma.blogPost.findUnique.mockResolvedValue(null);

      await updateBlogPost(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Blog post not found'
      });
    });

    it('should handle status change from draft to published', async () => {
      const existingBlogPost = {
        blog_post_id: 1,
        title: 'Test',
        content: 'Test',
        status: 'draft',
        published_at: null,
        tags: []
      };

      mockRequest.params = { blogPostId: '1' };
      mockRequest.body = { status: 'published' };

      prisma.blogPost.findUnique.mockResolvedValue(existingBlogPost);
      prisma.blogPost.update.mockResolvedValue({});

      await updateBlogPost(mockRequest as Request, mockResponse as Response);

      expect(prisma.blogPost.update).toHaveBeenCalledWith({
        where: { blog_post_id: 1 },
        data: expect.objectContaining({
          published_at: expect.any(Date)
        }),
        select: expect.any(Object)
      });
    });
  });

  describe('deleteBlogPost', () => {
    it('should delete a blog post successfully', async () => {
      const existingBlogPost = {
        blog_post_id: 1,
        title: 'Test Post'
      };

      mockRequest.params = { blogPostId: '1' };

      prisma.blogPost.findUnique.mockResolvedValue(existingBlogPost);
      prisma.blogPost.delete.mockResolvedValue({});

      await deleteBlogPost(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Blog post deleted successfully'
      });
    });

    it('should return 404 when blog post is not found', async () => {
      mockRequest.params = { blogPostId: '999' };

      prisma.blogPost.findUnique.mockResolvedValue(null);

      await deleteBlogPost(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Blog post not found'
      });
    });
  });

  describe('searchBlogPosts', () => {
    it('should search blog posts successfully', async () => {
      const mockBlogPosts = [
        {
          blog_post_id: 1,
          title: 'Test Blog Post',
          content: 'Test content',
          user: { username: 'testuser' },
          event: { event_name: 'Test Event' }
        }
      ];

      mockRequest.query = { q: 'test', page: '1', limit: '10' };

      prisma.blogPost.findMany.mockResolvedValue(mockBlogPosts);
      prisma.blogPost.count.mockResolvedValue(1);

      await searchBlogPosts(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          blogPosts: mockBlogPosts,
          pagination: {
            page: 1,
            limit: 10,
            total: 1,
            pages: 1
          }
        }
      });
    });

    it('should return 400 when search query is missing', async () => {
      mockRequest.query = { page: '1' };

      await searchBlogPosts(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Search query (q) is required'
      });
    });

    it('should filter by status when provided', async () => {
      mockRequest.query = { q: 'test', status: 'published' };

      prisma.blogPost.findMany.mockResolvedValue([]);
      prisma.blogPost.count.mockResolvedValue(0);

      await searchBlogPosts(mockRequest as Request, mockResponse as Response);

      expect(prisma.blogPost.findMany).toHaveBeenCalledWith({
        where: {
          OR: expect.any(Array),
          status: 'published'
        },
        orderBy: { created_at: 'desc' },
        skip: 0,
        take: 20,
        select: expect.any(Object)
      });
    });
  });

  describe('getBlogPostsByTag', () => {
    it('should return blog posts by tag', async () => {
      const mockBlogPosts = [
        {
          blog_post_id: 1,
          title: 'Test Blog Post',
          tags: ['test'],
          user: { username: 'testuser' },
          event: { event_name: 'Test Event' }
        }
      ];

      mockRequest.params = { tag: 'test' };
      mockRequest.query = { page: '1', limit: '10' };

      prisma.blogPost.findMany.mockResolvedValue(mockBlogPosts);
      prisma.blogPost.count.mockResolvedValue(1);

      await getBlogPostsByTag(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          blogPosts: mockBlogPosts,
          pagination: {
            page: 1,
            limit: 10,
            total: 1,
            pages: 1
          }
        }
      });
    });

    it('should return 400 when tag is missing', async () => {
      mockRequest.params = {};

      await getBlogPostsByTag(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Tag is required'
      });
    });

    it('should filter by status when provided', async () => {
      mockRequest.params = { tag: 'test' };
      mockRequest.query = { status: 'published' };

      prisma.blogPost.findMany.mockResolvedValue([]);
      prisma.blogPost.count.mockResolvedValue(0);

      await getBlogPostsByTag(mockRequest as Request, mockResponse as Response);

      expect(prisma.blogPost.findMany).toHaveBeenCalledWith({
        where: {
          tags: { has: 'test' },
          status: 'published'
        },
        orderBy: { created_at: 'desc' },
        skip: 0,
        take: 20,
        select: expect.any(Object)
      });
    });
  });
});
