/**
 * API tests for Blog Update Endpoint
 * Tests the PUT /api/blog-posts/:blogPostId endpoint
 */

const request = require('supertest');
const express = require('express');

// Mock Prisma client
const mockPrisma = {
    blogPost: {
        findUnique: jest.fn(),
        update: jest.fn()
    }
};

// Mock the prisma import
jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn(() => mockPrisma)
}));

// Create a simple Express app for testing
const app = express();
app.use(express.json());

// Mock blog update route
app.put('/api/blog-posts/:blogPostId', async (req, res) => {
    try {
        const { blogPostId } = req.params;
        if (!blogPostId) {
            res.status(400).json({ success: false, message: 'Blog post ID is required' });
            return;
        }

        const { title, content, excerpt, featured_image, tags, status } = req.body;

        const existingBlogPost = await mockPrisma.blogPost.findUnique({
            where: { blog_post_id: parseInt(blogPostId, 10) }
        });

        if (!existingBlogPost) {
            res.status(404).json({ success: false, message: 'Blog post not found' });
            return;
        }

        // Parse tags if they're provided
        let parsedTags;
        if (tags !== undefined) {
            if (typeof tags === 'string') {
                parsedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
            } else if (Array.isArray(tags)) {
                parsedTags = tags.filter(tag => typeof tag === 'string' && tag.trim().length > 0);
            } else {
                parsedTags = existingBlogPost.tags;
            }
        }

        // Handle status change to published
        let publishedAt = existingBlogPost.published_at;
        if (status === 'published' && existingBlogPost.status !== 'published') {
            publishedAt = new Date();
        } else if (status !== 'published' && existingBlogPost.status === 'published') {
            publishedAt = null;
        }

        const updatedBlogPost = await mockPrisma.blogPost.update({
            where: { blog_post_id: parseInt(blogPostId, 10) },
            data: {
                title: title ?? existingBlogPost.title,
                content: content ?? existingBlogPost.content,
                excerpt: excerpt ?? existingBlogPost.excerpt,
                featured_image: featured_image ?? existingBlogPost.featured_image,
                tags: parsedTags ?? existingBlogPost.tags,
                status: status ?? existingBlogPost.status,
                published_at: publishedAt,
                updated_at: new Date(),
            },
            select: {
                blog_post_id: true,
                title: true,
                content: true,
                excerpt: true,
                featured_image: true,
                tags: true,
                status: true,
                published_at: true,
                created_at: true,
                updated_at: true,
                user_id: true,
                user: {
                    select: {
                        username: true,
                        first_name: true,
                        last_name: true
                    }
                }
            }
        });

        res.status(200).json({
            success: true,
            message: 'Blog post updated successfully',
            data: updatedBlogPost
        });
    } catch (error) {
        console.error('Error updating blog post:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

describe('Blog Update API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('PUT /api/blog-posts/:blogPostId', () => {
        test('should update blog post successfully', async () => {
            const mockExistingBlogPost = {
                blog_post_id: 123,
                title: 'Old Title',
                content: 'Old content',
                excerpt: 'Old excerpt',
                featured_image: 'old-image.jpg',
                tags: ['old', 'tags'],
                status: 'draft',
                published_at: null
            };

            const mockUpdatedBlogPost = {
                blog_post_id: 123,
                title: 'New Title',
                content: 'New content',
                excerpt: 'New excerpt',
                featured_image: 'new-image.jpg',
                tags: ['new', 'tags'],
                status: 'published',
                published_at: new Date(),
                created_at: new Date(),
                updated_at: new Date(),
                user_id: 1,
                user: {
                    username: 'testuser',
                    first_name: 'Test',
                    last_name: 'User'
                }
            };

            mockPrisma.blogPost.findUnique.mockResolvedValue(mockExistingBlogPost);
            mockPrisma.blogPost.update.mockResolvedValue(mockUpdatedBlogPost);

            const response = await request(app)
                .put('/api/blog-posts/123')
                .send({
                    title: 'New Title',
                    content: 'New content',
                    excerpt: 'New excerpt',
                    featured_image: 'new-image.jpg',
                    tags: 'new, tags',
                    status: 'published'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Blog post updated successfully');
            expect(response.body.data.title).toBe('New Title');
            expect(response.body.data.content).toBe('New content');

            expect(mockPrisma.blogPost.findUnique).toHaveBeenCalledWith({
                where: { blog_post_id: 123 }
            });

            expect(mockPrisma.blogPost.update).toHaveBeenCalledWith({
                where: { blog_post_id: 123 },
                data: {
                    title: 'New Title',
                    content: 'New content',
                    excerpt: 'New excerpt',
                    featured_image: 'new-image.jpg',
                    tags: ['new', 'tags'],
                    status: 'published',
                    published_at: expect.any(Date),
                    updated_at: expect.any(Date)
                },
                select: expect.any(Object)
            });
        });

        test('should handle missing blog post ID', async () => {
            const response = await request(app)
                .put('/api/blog-posts/')
                .send({
                    title: 'New Title'
                });

            expect(response.status).toBe(404); // Express route not found
        });

        test('should handle blog post not found', async () => {
            mockPrisma.blogPost.findUnique.mockResolvedValue(null);

            const response = await request(app)
                .put('/api/blog-posts/999')
                .send({
                    title: 'New Title'
                });

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Blog post not found');
        });

        test('should update only provided fields', async () => {
            const mockExistingBlogPost = {
                blog_post_id: 123,
                title: 'Old Title',
                content: 'Old content',
                excerpt: 'Old excerpt',
                featured_image: 'old-image.jpg',
                tags: ['old', 'tags'],
                status: 'draft',
                published_at: null
            };

            const mockUpdatedBlogPost = {
                ...mockExistingBlogPost,
                title: 'New Title'
            };

            mockPrisma.blogPost.findUnique.mockResolvedValue(mockExistingBlogPost);
            mockPrisma.blogPost.update.mockResolvedValue(mockUpdatedBlogPost);

            const response = await request(app)
                .put('/api/blog-posts/123')
                .send({
                    title: 'New Title'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);

            expect(mockPrisma.blogPost.update).toHaveBeenCalledWith({
                where: { blog_post_id: 123 },
                data: {
                    title: 'New Title',
                    content: 'Old content',
                    excerpt: 'Old excerpt',
                    featured_image: 'old-image.jpg',
                    tags: ['old', 'tags'],
                    status: 'draft',
                    published_at: null,
                    updated_at: expect.any(Date)
                },
                select: expect.any(Object)
            });
        });

        test('should handle array tags correctly', async () => {
            const mockExistingBlogPost = {
                blog_post_id: 123,
                title: 'Test',
                content: 'Test',
                excerpt: 'Test',
                featured_image: '',
                tags: ['old'],
                status: 'draft',
                published_at: null
            };

            mockPrisma.blogPost.findUnique.mockResolvedValue(mockExistingBlogPost);
            mockPrisma.blogPost.update.mockResolvedValue(mockExistingBlogPost);

            const response = await request(app)
                .put('/api/blog-posts/123')
                .send({
                    tags: ['new', 'array', 'tags']
                });

            expect(response.status).toBe(200);
            expect(mockPrisma.blogPost.update).toHaveBeenCalledWith({
                where: { blog_post_id: 123 },
                data: expect.objectContaining({
                    tags: ['new', 'array', 'tags']
                }),
                select: expect.any(Object)
            });
        });

        test('should handle status change to published', async () => {
            const mockExistingBlogPost = {
                blog_post_id: 123,
                title: 'Test',
                content: 'Test',
                excerpt: 'Test',
                featured_image: '',
                tags: [],
                status: 'draft',
                published_at: null
            };

            mockPrisma.blogPost.findUnique.mockResolvedValue(mockExistingBlogPost);
            mockPrisma.blogPost.update.mockResolvedValue(mockExistingBlogPost);

            const response = await request(app)
                .put('/api/blog-posts/123')
                .send({
                    status: 'published'
                });

            expect(response.status).toBe(200);
            expect(mockPrisma.blogPost.update).toHaveBeenCalledWith({
                where: { blog_post_id: 123 },
                data: expect.objectContaining({
                    status: 'published',
                    published_at: expect.any(Date)
                }),
                select: expect.any(Object)
            });
        });

        test('should handle database errors', async () => {
            mockPrisma.blogPost.findUnique.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .put('/api/blog-posts/123')
                .send({
                    title: 'New Title'
                });

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Internal server error');
        });
    });
});
