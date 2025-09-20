const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../api/index');
const { User, Event, BlogPost, BlogCategory, BlogTag } = require('../../models');
const DatabaseHelper = require('../helpers/database');
const bcrypt = require('bcryptjs');

describe('Blog System Integration', () => {
    let authToken;
    let adminToken;
    let testUser;
    let adminUser;
    let testEvent;
    let testCategory;
    let testTag;

    beforeAll(async () => {
        await DatabaseHelper.setup();
    });

    afterAll(async () => {
        await DatabaseHelper.cleanup();
    });

    beforeEach(async () => {
        // Clean up all tables
        await BlogPost.destroy({ where: {}, force: true });
        await BlogTag.destroy({ where: {}, force: true });
        await BlogCategory.destroy({ where: {}, force: true });
        await User.destroy({ where: {}, force: true });
        await Event.destroy({ where: {}, force: true });

        // Create test event
        testEvent = await Event.create({
            event_name: 'Test Thanksgiving 2024',
            event_date: new Date('2024-11-28'),
            event_location: 'Test Location',
            description: 'Test event description',
            menu_image_url: '/images/test-menu.jpg'
        });

        // Create test user
        const hashedPassword = await bcrypt.hash('password123', 10);
        testUser = await User.create({
            username: 'testuser',
            email: 'test@example.com',
            password_hash: hashedPassword,
            role: 'user'
        });

        // Create admin user
        const adminHashedPassword = await bcrypt.hash('password123', 10);
        adminUser = await User.create({
            username: 'admin',
            email: 'admin@example.com',
            password_hash: adminHashedPassword,
            role: 'admin'
        });

        // Generate auth tokens
        authToken = jwt.sign(
            { userId: testUser.id, username: testUser.username, role: testUser.role },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '24h' }
        );

        adminToken = jwt.sign(
            { userId: adminUser.id, username: adminUser.username, role: adminUser.role },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '24h' }
        );

        // Create test category
        testCategory = await BlogCategory.create({
            name: 'Memories',
            slug: 'memories',
            description: 'Personal stories and memories',
            color: '#ff6b6b'
        });

        // Create test tag
        testTag = await BlogTag.create({
            name: 'family',
            slug: 'family'
        });
    });

    describe('Complete Blog Post Workflow', () => {
        test('should create, read, update, and delete a blog post', async () => {
            // 1. Create a blog post
            const createResponse = await request(app)
                .post('/api/v1/blog/posts')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    event_id: testEvent.id,
                    title: 'My Thanksgiving Memories',
                    content: 'This is a comprehensive blog post about my Thanksgiving memories with at least 50 characters to meet validation requirements.',
                    excerpt: 'A wonderful Thanksgiving celebration',
                    status: 'draft'
                })
                .expect(201);

            expect(createResponse.body.success).toBe(true);
            const blogPost = createResponse.body.post;
            expect(blogPost.title).toBe('My Thanksgiving Memories');
            expect(blogPost.status).toBe('draft');

            // 2. Read the blog post
            const readResponse = await request(app)
                .get(`/api/v1/blog/posts/${blogPost.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(readResponse.body.success).toBe(true);
            expect(readResponse.body.post.id).toBe(blogPost.id);
            expect(readResponse.body.post.title).toBe(blogPost.title);

            // 3. Update the blog post
            const updateResponse = await request(app)
                .put(`/api/v1/blog/posts/${blogPost.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    title: 'Updated Thanksgiving Memories',
                    content: 'This is an updated comprehensive blog post about my Thanksgiving memories with at least 50 characters to meet validation requirements.',
                    status: 'published'
                })
                .expect(200);

            expect(updateResponse.body.success).toBe(true);
            expect(updateResponse.body.post.title).toBe('Updated Thanksgiving Memories');
            expect(updateResponse.body.post.status).toBe('published');

            // 4. Delete the blog post
            const deleteResponse = await request(app)
                .delete(`/api/v1/blog/posts/${blogPost.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(deleteResponse.body.success).toBe(true);
            expect(deleteResponse.body.message).toContain('deleted');

            // 5. Verify deletion
            const verifyResponse = await request(app)
                .get(`/api/v1/blog/posts/${blogPost.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);

            expect(verifyResponse.body.success).toBe(false);
        });
    });

    describe('Category and Tag Associations', () => {
        test('should create blog post with category and tag associations', async () => {
            // Create additional categories and tags
            const recipeCategory = await BlogCategory.create({
                name: 'Recipes',
                slug: 'recipes',
                description: 'Cooking and recipe discussions',
                color: '#4ecdc4'
            });

            const traditionTag = await BlogTag.create({
                name: 'traditions',
                slug: 'traditions'
            });

            // Create blog post with category and tags
            const createResponse = await request(app)
                .post('/api/v1/blog/posts')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    event_id: testEvent.id,
                    title: 'Family Thanksgiving Recipes',
                    content: 'This blog post discusses our family Thanksgiving recipes and traditions with at least 50 characters to meet validation requirements.',
                    excerpt: 'Traditional family recipes',
                    status: 'published',
                    category_id: recipeCategory.id,
                    tag_ids: [testTag.id, traditionTag.id]
                })
                .expect(201);

            expect(createResponse.body.success).toBe(true);
            const blogPost = createResponse.body.post;
            expect(blogPost.title).toBe('Family Thanksgiving Recipes');

            // Verify category association
            expect(blogPost.category_id).toBe(recipeCategory.id);

            // Verify tag associations
            expect(blogPost.tags).toBeDefined();
            expect(blogPost.tags).toHaveLength(2);
            expect(blogPost.tags.map(tag => tag.name)).toContain('family');
            expect(blogPost.tags.map(tag => tag.name)).toContain('traditions');
        });

        test('should update blog post category and tags', async () => {
            // Create blog post
            const createResponse = await request(app)
                .post('/api/v1/blog/posts')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    event_id: testEvent.id,
                    title: 'Original Post',
                    content: 'This is the original content with at least 50 characters to meet validation requirements.',
                    status: 'draft'
                })
                .expect(201);

            const blogPost = createResponse.body.post;

            // Create additional category and tag
            const newCategory = await BlogCategory.create({
                name: 'Traditions',
                slug: 'traditions',
                description: 'Family traditions and customs',
                color: '#45b7d1'
            });

            const newTag = await BlogTag.create({
                name: 'thanksgiving',
                slug: 'thanksgiving'
            });

            // Update with new category and tags
            const updateResponse = await request(app)
                .put(`/api/v1/blog/posts/${blogPost.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    title: 'Updated Post with Category and Tags',
                    content: 'This is updated content with at least 50 characters to meet validation requirements.',
                    category_id: newCategory.id,
                    tag_ids: [testTag.id, newTag.id]
                })
                .expect(200);

            expect(updateResponse.body.success).toBe(true);
            expect(updateResponse.body.post.category_id).toBe(newCategory.id);
            expect(updateResponse.body.post.tags).toHaveLength(2);
        });
    });

    describe('Search and Filtering Integration', () => {
        beforeEach(async () => {
            // Create multiple blog posts for testing
            await BlogPost.create({
                event_id: testEvent.id,
                author_id: testUser.id,
                title: 'Thanksgiving Recipes',
                slug: 'thanksgiving-recipes',
                content: 'This post contains information about traditional Thanksgiving recipes with at least 50 characters to meet validation requirements.',
                status: 'published',
                published_at: new Date()
            });

            await BlogPost.create({
                event_id: testEvent.id,
                author_id: testUser.id,
                title: 'Family Traditions',
                slug: 'family-traditions',
                content: 'This post discusses our family Thanksgiving traditions with at least 50 characters to meet validation requirements.',
                status: 'published',
                published_at: new Date()
            });

            await BlogPost.create({
                event_id: testEvent.id,
                author_id: testUser.id,
                title: 'Draft Post',
                slug: 'draft-post',
                content: 'This is a draft post with at least 50 characters to meet validation requirements.',
                status: 'draft'
            });
        });

        test('should search blog posts by title and content', async () => {
            // Search by title
            const titleSearchResponse = await request(app)
                .get('/api/v1/blog/search?q=recipes')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(titleSearchResponse.body.success).toBe(true);
            expect(titleSearchResponse.body.posts).toHaveLength(1);
            expect(titleSearchResponse.body.posts[0].title).toContain('Recipes');

            // Search by content
            const contentSearchResponse = await request(app)
                .get('/api/v1/blog/search?q=traditions')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(contentSearchResponse.body.success).toBe(true);
            expect(contentSearchResponse.body.posts).toHaveLength(1);
            expect(contentSearchResponse.body.posts[0].title).toContain('Traditions');
        });

        test('should filter blog posts by status', async () => {
            // Get published posts
            const publishedResponse = await request(app)
                .get('/api/v1/blog/posts?status=published')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(publishedResponse.body.success).toBe(true);
            expect(publishedResponse.body.posts).toHaveLength(2);
            expect(publishedResponse.body.posts.every(post => post.status === 'published')).toBe(true);

            // Get draft posts
            const draftResponse = await request(app)
                .get('/api/v1/blog/posts?status=draft')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(draftResponse.body.success).toBe(true);
            expect(draftResponse.body.posts).toHaveLength(1);
            expect(draftResponse.body.posts[0].status).toBe('draft');
        });

        test('should filter blog posts by event', async () => {
            // Create another event
            const anotherEvent = await Event.create({
                event_name: 'Another Thanksgiving 2023',
                event_date: new Date('2023-11-23'),
                event_location: 'Another Location',
                description: 'Another event description',
                menu_image_url: '/images/another-menu.jpg'
            });

            // Create post for another event
            await BlogPost.create({
                event_id: anotherEvent.id,
                author_id: testUser.id,
                title: 'Another Event Post',
                slug: 'another-event-post',
                content: 'This post is for another event with at least 50 characters to meet validation requirements.',
                status: 'published',
                published_at: new Date()
            });

            // Filter by original event
            const eventFilterResponse = await request(app)
                .get(`/api/v1/blog/posts/event/${testEvent.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(eventFilterResponse.body.success).toBe(true);
            expect(eventFilterResponse.body.posts).toHaveLength(3);
            expect(eventFilterResponse.body.posts.every(post => post.event_id === testEvent.id)).toBe(true);
        });
    });

    describe('User Permission Integration', () => {
        test('should enforce user permissions for blog post operations', async () => {
            // Create another user
            const anotherUser = await User.create({
                username: 'anotheruser',
                email: 'another@example.com',
                password_hash: await bcrypt.hash('password123', 10),
                role: 'user'
            });

            const anotherToken = jwt.sign(
                { userId: anotherUser.id, username: anotherUser.username, role: anotherUser.role },
                process.env.JWT_SECRET || 'test-secret',
                { expiresIn: '24h' }
            );

            // Create blog post as test user
            const createResponse = await request(app)
                .post('/api/v1/blog/posts')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    event_id: testEvent.id,
                    title: 'User Post',
                    content: 'This is a post created by test user with at least 50 characters to meet validation requirements.',
                    status: 'draft'
                })
                .expect(201);

            const blogPost = createResponse.body.post;

            // Another user should not be able to update the post
            const updateResponse = await request(app)
                .put(`/api/v1/blog/posts/${blogPost.id}`)
                .set('Authorization', `Bearer ${anotherToken}`)
                .send({
                    title: 'Unauthorized Update',
                    content: 'This should not be allowed with at least 50 characters to meet validation requirements.'
                })
                .expect(403);

            expect(updateResponse.body.success).toBe(false);
            expect(updateResponse.body.error).toContain('permission');

            // Another user should not be able to delete the post
            const deleteResponse = await request(app)
                .delete(`/api/v1/blog/posts/${blogPost.id}`)
                .set('Authorization', `Bearer ${anotherToken}`)
                .expect(403);

            expect(deleteResponse.body.success).toBe(false);
            expect(deleteResponse.body.error).toContain('permission');

            // Admin should be able to update any post
            const adminUpdateResponse = await request(app)
                .put(`/api/v1/blog/posts/${blogPost.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    title: 'Admin Updated Post',
                    content: 'This post was updated by admin with at least 50 characters to meet validation requirements.'
                })
                .expect(200);

            expect(adminUpdateResponse.body.success).toBe(true);
            expect(adminUpdateResponse.body.post.title).toBe('Admin Updated Post');
        });

        test('should enforce admin permissions for category operations', async () => {
            // Regular user should not be able to create categories
            const createCategoryResponse = await request(app)
                .post('/api/v1/blog/categories')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Unauthorized Category',
                    slug: 'unauthorized-category',
                    description: 'This should not be created',
                    color: '#ff6b6b'
                })
                .expect(403);

            expect(createCategoryResponse.body.success).toBe(false);
            expect(createCategoryResponse.body.error).toContain('admin');

            // Admin should be able to create categories
            const adminCreateResponse = await request(app)
                .post('/api/v1/blog/categories')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Admin Created Category',
                    slug: 'admin-created-category',
                    description: 'This was created by admin',
                    color: '#4ecdc4'
                })
                .expect(201);

            expect(adminCreateResponse.body.success).toBe(true);
            expect(adminCreateResponse.body.category.name).toBe('Admin Created Category');
        });
    });

    describe('Event Integration', () => {
        test('should create blog posts for specific events', async () => {
            // Create multiple events
            const event2023 = await Event.create({
                event_name: 'Thanksgiving 2023',
                event_date: new Date('2023-11-23'),
                event_location: 'Home 2023',
                description: '2023 event description',
                menu_image_url: '/images/2023-menu.jpg'
            });

            const event2024 = await Event.create({
                event_name: 'Thanksgiving 2024',
                event_date: new Date('2024-11-28'),
                event_location: 'Home 2024',
                description: '2024 event description',
                menu_image_url: '/images/2024-menu.jpg'
            });

            // Create posts for different events
            await BlogPost.create({
                event_id: event2023.id,
                author_id: testUser.id,
                title: '2023 Thanksgiving Memories',
                slug: '2023-thanksgiving-memories',
                content: 'This post is about our 2023 Thanksgiving celebration with at least 50 characters to meet validation requirements.',
                status: 'published',
                published_at: new Date()
            });

            await BlogPost.create({
                event_id: event2024.id,
                author_id: testUser.id,
                title: '2024 Thanksgiving Plans',
                slug: '2024-thanksgiving-plans',
                content: 'This post is about our 2024 Thanksgiving plans with at least 50 characters to meet validation requirements.',
                status: 'published',
                published_at: new Date()
            });

            // Get posts for 2023 event
            const event2023Response = await request(app)
                .get(`/api/v1/blog/posts/event/${event2023.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(event2023Response.body.success).toBe(true);
            expect(event2023Response.body.posts).toHaveLength(1);
            expect(event2023Response.body.posts[0].title).toContain('2023');

            // Get posts for 2024 event
            const event2024Response = await request(app)
                .get(`/api/v1/blog/posts/event/${event2024.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(event2024Response.body.success).toBe(true);
            expect(event2024Response.body.posts).toHaveLength(1);
            expect(event2024Response.body.posts[0].title).toContain('2024');
        });
    });

    describe('Data Consistency and Relationships', () => {
        test('should maintain data consistency when deleting related entities', async () => {
            // Create blog post
            const createResponse = await request(app)
                .post('/api/v1/blog/posts')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    event_id: testEvent.id,
                    title: 'Post to be orphaned',
                    content: 'This post will become orphaned when event is deleted with at least 50 characters to meet validation requirements.',
                    status: 'published'
                })
                .expect(201);

            const blogPost = createResponse.body.post;

            // Delete the event (should cascade delete the blog post)
            await testEvent.destroy();

            // Verify blog post is deleted
            const verifyResponse = await request(app)
                .get(`/api/v1/blog/posts/${blogPost.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);

            expect(verifyResponse.body.success).toBe(false);
        });

        test('should maintain referential integrity', async () => {
            // Try to create blog post with non-existent event
            const invalidResponse = await request(app)
                .post('/api/v1/blog/posts')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    event_id: 99999, // Non-existent event
                    title: 'Invalid Post',
                    content: 'This post has an invalid event ID with at least 50 characters to meet validation requirements.',
                    status: 'draft'
                })
                .expect(400);

            expect(invalidResponse.body.success).toBe(false);
            expect(invalidResponse.body.error).toContain('event');
        });
    });

    describe('Performance and Scalability', () => {
        test('should handle multiple blog posts efficiently', async () => {
            // Create multiple blog posts
            const posts = [];
            for (let i = 1; i <= 10; i++) {
                const post = await BlogPost.create({
                    event_id: testEvent.id,
                    author_id: testUser.id,
                    title: `Test Post ${i}`,
                    slug: `test-post-${i}`,
                    content: `This is test post number ${i} with at least 50 characters to meet validation requirements.`,
                    status: 'published',
                    published_at: new Date()
                });
                posts.push(post);
            }

            // Get all posts
            const response = await request(app)
                .get('/api/v1/blog/posts')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.posts).toHaveLength(10);
        });

        test('should handle search across multiple posts', async () => {
            // Create posts with different content
            const searchTerms = ['recipe', 'tradition', 'family', 'thanksgiving', 'celebration'];
            
            for (let i = 0; i < searchTerms.length; i++) {
                await BlogPost.create({
                    event_id: testEvent.id,
                    author_id: testUser.id,
                    title: `Post about ${searchTerms[i]}`,
                    slug: `post-about-${searchTerms[i]}`,
                    content: `This post discusses ${searchTerms[i]} in detail with at least 50 characters to meet validation requirements.`,
                    status: 'published',
                    published_at: new Date()
                });
            }

            // Search for specific term
            const response = await request(app)
                .get('/api/v1/blog/search?q=recipe')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.posts).toHaveLength(1);
            expect(response.body.posts[0].title).toContain('recipe');
        });
    });
});
