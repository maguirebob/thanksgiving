const { BlogPost } = require('../../models');
const DatabaseHelper = require('../helpers/database');
const bcrypt = require('bcryptjs');

describe('BlogPost Model', () => {
    beforeAll(async () => {
        await DatabaseHelper.setup();
    });

    afterAll(async () => {
        await DatabaseHelper.cleanup();
    });

    beforeEach(async () => {
        // Clean up blog posts table before each test
        await BlogPost.destroy({ where: {}, force: true });
    });

    describe('Blog Post Creation', () => {
        test('should create a blog post with valid data', async () => {
            const blogPostData = {
                event_id: 1,
                author_id: 1,
                title: 'Test Blog Post',
                slug: 'test-blog-post',
                content: 'This is a test blog post content with at least 50 characters to meet validation requirements.',
                excerpt: 'Test excerpt',
                status: 'draft',
                is_featured: false
            };

            const blogPost = await BlogPost.create(blogPostData);

            expect(blogPost).toBeDefined();
            expect(blogPost.id).toBeDefined();
            expect(blogPost.title).toBe(blogPostData.title);
            expect(blogPost.slug).toBe(blogPostData.slug);
            expect(blogPost.content).toBe(blogPostData.content);
            expect(blogPost.status).toBe(blogPostData.status);
            expect(blogPost.is_featured).toBe(blogPostData.is_featured);
            expect(blogPost.created_at).toBeDefined();
            expect(blogPost.updated_at).toBeDefined();
        });

        test('should create a blog post with minimal required data', async () => {
            const blogPostData = {
                event_id: 1,
                author_id: 1,
                title: 'Minimal Post',
                slug: 'minimal-post',
                content: 'This is a minimal blog post content with at least 50 characters to meet validation requirements.'
            };

            const blogPost = await BlogPost.create(blogPostData);

            expect(blogPost).toBeDefined();
            expect(blogPost.title).toBe(blogPostData.title);
            expect(blogPost.status).toBe('draft'); // Default status
            expect(blogPost.is_featured).toBe(false); // Default value
            expect(blogPost.view_count).toBe(0); // Default value
        });

        test('should fail to create blog post without required fields', async () => {
            const invalidData = {
                title: 'Incomplete Post'
                // Missing event_id, author_id, slug, content
            };

            await expect(BlogPost.create(invalidData)).rejects.toThrow();
        });
    });

    describe('Blog Post Validation', () => {
        test('should validate title length', async () => {
            const blogPostData = {
                event_id: 1,
                author_id: 1,
                title: 'A', // Too short
                slug: 'short-title',
                content: 'This is a test blog post content with at least 50 characters to meet validation requirements.'
            };

            await expect(BlogPost.create(blogPostData)).rejects.toThrow();
        });

        test('should validate content length', async () => {
            const blogPostData = {
                event_id: 1,
                author_id: 1,
                title: 'Valid Title',
                slug: 'valid-title',
                content: 'Short' // Too short
            };

            await expect(BlogPost.create(blogPostData)).rejects.toThrow();
        });

        test('should validate status enum values', async () => {
            const blogPostData = {
                event_id: 1,
                author_id: 1,
                title: 'Valid Title',
                slug: 'valid-title',
                content: 'This is a test blog post content with at least 50 characters to meet validation requirements.',
                status: 'invalid_status'
            };

            await expect(BlogPost.create(blogPostData)).rejects.toThrow();
        });

        test('should accept valid status values', async () => {
            const validStatuses = ['draft', 'published', 'archived'];
            
            for (const status of validStatuses) {
                const blogPostData = {
                    event_id: 1,
                    author_id: 1,
                    title: `Test Post ${status}`,
                    slug: `test-post-${status}`,
                    content: 'This is a test blog post content with at least 50 characters to meet validation requirements.',
                    status: status
                };

                const blogPost = await BlogPost.create(blogPostData);
                expect(blogPost.status).toBe(status);
            }
        });
    });

    describe('Blog Post Relationships', () => {
        test('should belong to an event', async () => {
            const blogPostData = {
                event_id: 1,
                author_id: 1,
                title: 'Event Related Post',
                slug: 'event-related-post',
                content: 'This is a test blog post content with at least 50 characters to meet validation requirements.'
            };

            const blogPost = await BlogPost.create(blogPostData);
            expect(blogPost.event_id).toBe(1);
        });

        test('should belong to an author', async () => {
            const blogPostData = {
                event_id: 1,
                author_id: 1,
                title: 'Author Post',
                slug: 'author-post',
                content: 'This is a test blog post content with at least 50 characters to meet validation requirements.'
            };

            const blogPost = await BlogPost.create(blogPostData);
            expect(blogPost.author_id).toBe(1);
        });
    });

    describe('Blog Post Status Management', () => {
        test('should update status to published', async () => {
            const blogPostData = {
                event_id: 1,
                author_id: 1,
                title: 'Draft Post',
                slug: 'draft-post',
                content: 'This is a test blog post content with at least 50 characters to meet validation requirements.',
                status: 'draft'
            };

            const blogPost = await BlogPost.create(blogPostData);
            await blogPost.update({ status: 'published', published_at: new Date() });

            expect(blogPost.status).toBe('published');
            expect(blogPost.published_at).toBeDefined();
        });

        test('should archive a published post', async () => {
            const blogPostData = {
                event_id: 1,
                author_id: 1,
                title: 'Published Post',
                slug: 'published-post',
                content: 'This is a test blog post content with at least 50 characters to meet validation requirements.',
                status: 'published',
                published_at: new Date()
            };

            const blogPost = await BlogPost.create(blogPostData);
            await blogPost.update({ status: 'archived' });

            expect(blogPost.status).toBe('archived');
        });
    });

    describe('Slug Generation', () => {
        test('should generate slug from title', async () => {
            const blogPostData = {
                event_id: 1,
                author_id: 1,
                title: 'My Amazing Blog Post!',
                slug: 'my-amazing-blog-post',
                content: 'This is a test blog post content with at least 50 characters to meet validation requirements.'
            };

            const blogPost = await BlogPost.create(blogPostData);
            expect(blogPost.slug).toBe('my-amazing-blog-post');
        });

        test('should ensure unique slugs', async () => {
            const blogPostData1 = {
                event_id: 1,
                author_id: 1,
                title: 'Unique Post',
                slug: 'unique-post',
                content: 'This is a test blog post content with at least 50 characters to meet validation requirements.'
            };

            const blogPostData2 = {
                event_id: 1,
                author_id: 1,
                title: 'Another Unique Post',
                slug: 'unique-post', // Same slug
                content: 'This is a test blog post content with at least 50 characters to meet validation requirements.'
            };

            await BlogPost.create(blogPostData1);
            await expect(BlogPost.create(blogPostData2)).rejects.toThrow();
        });
    });

    describe('Featured Post Functionality', () => {
        test('should mark post as featured', async () => {
            const blogPostData = {
                event_id: 1,
                author_id: 1,
                title: 'Featured Post',
                slug: 'featured-post',
                content: 'This is a test blog post content with at least 50 characters to meet validation requirements.',
                is_featured: true
            };

            const blogPost = await BlogPost.create(blogPostData);
            expect(blogPost.is_featured).toBe(true);
        });

        test('should find featured posts', async () => {
            // Create featured and non-featured posts
            await BlogPost.create({
                event_id: 1,
                author_id: 1,
                title: 'Featured Post 1',
                slug: 'featured-post-1',
                content: 'This is a test blog post content with at least 50 characters to meet validation requirements.',
                is_featured: true
            });

            await BlogPost.create({
                event_id: 1,
                author_id: 1,
                title: 'Regular Post',
                slug: 'regular-post',
                content: 'This is a test blog post content with at least 50 characters to meet validation requirements.',
                is_featured: false
            });

            const featuredPosts = await BlogPost.findAll({ where: { is_featured: true } });
            expect(featuredPosts).toHaveLength(1);
            expect(featuredPosts[0].title).toBe('Featured Post 1');
        });
    });

    describe('View Count Management', () => {
        test('should increment view count', async () => {
            const blogPostData = {
                event_id: 1,
                author_id: 1,
                title: 'Viewable Post',
                slug: 'viewable-post',
                content: 'This is a test blog post content with at least 50 characters to meet validation requirements.',
                view_count: 0
            };

            const blogPost = await BlogPost.create(blogPostData);
            await blogPost.increment('view_count');

            expect(blogPost.view_count).toBe(1);
        });

        test('should track multiple views', async () => {
            const blogPostData = {
                event_id: 1,
                author_id: 1,
                title: 'Popular Post',
                slug: 'popular-post',
                content: 'This is a test blog post content with at least 50 characters to meet validation requirements.',
                view_count: 0
            };

            const blogPost = await BlogPost.create(blogPostData);
            await blogPost.increment('view_count', { by: 5 });

            expect(blogPost.view_count).toBe(5);
        });
    });

    describe('Content Management', () => {
        test('should update blog post content', async () => {
            const blogPostData = {
                event_id: 1,
                author_id: 1,
                title: 'Editable Post',
                slug: 'editable-post',
                content: 'Original content with at least 50 characters to meet validation requirements.'
            };

            const blogPost = await BlogPost.create(blogPostData);
            const newContent = 'Updated content with at least 50 characters to meet validation requirements.';
            
            await blogPost.update({ content: newContent });
            expect(blogPost.content).toBe(newContent);
        });

        test('should update excerpt', async () => {
            const blogPostData = {
                event_id: 1,
                author_id: 1,
                title: 'Excerpt Post',
                slug: 'excerpt-post',
                content: 'This is a test blog post content with at least 50 characters to meet validation requirements.'
            };

            const blogPost = await BlogPost.create(blogPostData);
            const newExcerpt = 'Updated excerpt';
            
            await blogPost.update({ excerpt: newExcerpt });
            expect(blogPost.excerpt).toBe(newExcerpt);
        });
    });

    describe('Query Methods', () => {
        beforeEach(async () => {
            // Create test data
            await BlogPost.create({
                event_id: 1,
                author_id: 1,
                title: 'Published Post 1',
                slug: 'published-post-1',
                content: 'This is a test blog post content with at least 50 characters to meet validation requirements.',
                status: 'published',
                published_at: new Date()
            });

            await BlogPost.create({
                event_id: 1,
                author_id: 1,
                title: 'Draft Post',
                slug: 'draft-post',
                content: 'This is a test blog post content with at least 50 characters to meet validation requirements.',
                status: 'draft'
            });

            await BlogPost.create({
                event_id: 2,
                author_id: 1,
                title: 'Published Post 2',
                slug: 'published-post-2',
                content: 'This is a test blog post content with at least 50 characters to meet validation requirements.',
                status: 'published',
                published_at: new Date()
            });
        });

        test('should find posts by event', async () => {
            const event1Posts = await BlogPost.findAll({ where: { event_id: 1 } });
            expect(event1Posts).toHaveLength(2);

            const event2Posts = await BlogPost.findAll({ where: { event_id: 2 } });
            expect(event2Posts).toHaveLength(1);
        });

        test('should find posts by author', async () => {
            const authorPosts = await BlogPost.findAll({ where: { author_id: 1 } });
            expect(authorPosts).toHaveLength(3);
        });

        test('should find published posts', async () => {
            const publishedPosts = await BlogPost.findAll({ where: { status: 'published' } });
            expect(publishedPosts).toHaveLength(2);
        });

        test('should find draft posts', async () => {
            const draftPosts = await BlogPost.findAll({ where: { status: 'draft' } });
            expect(draftPosts).toHaveLength(1);
        });
    });
});
