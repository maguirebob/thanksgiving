const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../api/index');
const { User, Event, BlogPost } = require('../../models');
const DatabaseHelper = require('../helpers/database');
const bcrypt = require('bcryptjs');

describe('Blog API Endpoints', () => {
    let authToken;
    let adminToken;
    let testUser;
    let adminUser;
    let testEvent;

    beforeAll(async () => {
        await DatabaseHelper.setup();
    });

    afterAll(async () => {
        await DatabaseHelper.cleanup();
    });

    beforeEach(async () => {
        // Clean up tables
        await BlogPost.destroy({ where: {}, force: true });
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
    });

    describe('GET /api/v1/blog/posts', () => {
        test('should get all blog posts', async () => {
            // Create test blog posts
            await BlogPost.create({
                event_id: testEvent.id,
                author_id: testUser.id,
                title: 'Test Post 1',
                slug: 'test-post-1',
                content: 'This is test content for post 1 with at least 50 characters to meet validation requirements.',
                status: 'published',
                published_at: new Date()
            });

            await BlogPost.create({
                event_id: testEvent.id,
                author_id: testUser.id,
                title: 'Test Post 2',
                slug: 'test-post-2',
                content: 'This is test content for post 2 with at least 50 characters to meet validation requirements.',
                status: 'draft'
            });

            const response = await request(app)
                .get('/api/v1/blog/posts')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.posts).toHaveLength(2);
            expect(response.body.posts[0]).toHaveProperty('id');
            expect(response.body.posts[0]).toHaveProperty('title');
            expect(response.body.posts[0]).toHaveProperty('slug');
            expect(response.body.posts[0]).toHaveProperty('content');
        });

        test('should require authentication', async () => {
            const response = await request(app)
                .get('/api/v1/blog/posts')
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('token');
        });

        test('should filter posts by status', async () => {
            // Create published and draft posts
            await BlogPost.create({
                event_id: testEvent.id,
                author_id: testUser.id,
                title: 'Published Post',
                slug: 'published-post',
                content: 'This is test content for published post with at least 50 characters to meet validation requirements.',
                status: 'published',
                published_at: new Date()
            });

            await BlogPost.create({
                event_id: testEvent.id,
                author_id: testUser.id,
                title: 'Draft Post',
                slug: 'draft-post',
                content: 'This is test content for draft post with at least 50 characters to meet validation requirements.',
                status: 'draft'
            });

            const response = await request(app)
                .get('/api/v1/blog/posts?status=published')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.posts).toHaveLength(1);
            expect(response.body.posts[0].status).toBe('published');
        });

        test('should filter posts by event', async () => {
            // Create another event
            const anotherEvent = await Event.create({
                event_name: 'Another Thanksgiving 2023',
                event_date: new Date('2023-11-23'),
                event_location: 'Another Location',
                description: 'Another event description',
                menu_image_url: '/images/another-menu.jpg'
            });

            // Create posts for different events
            await BlogPost.create({
                event_id: testEvent.id,
                author_id: testUser.id,
                title: 'Event 1 Post',
                slug: 'event-1-post',
                content: 'This is test content for event 1 post with at least 50 characters to meet validation requirements.',
                status: 'published',
                published_at: new Date()
            });

            await BlogPost.create({
                event_id: anotherEvent.id,
                author_id: testUser.id,
                title: 'Event 2 Post',
                slug: 'event-2-post',
                content: 'This is test content for event 2 post with at least 50 characters to meet validation requirements.',
                status: 'published',
                published_at: new Date()
            });

            const response = await request(app)
                .get(`/api/v1/blog/posts?event_id=${testEvent.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.posts).toHaveLength(1);
            expect(response.body.posts[0].event_id).toBe(testEvent.id);
        });
    });

    describe('POST /api/v1/blog/posts', () => {
        test('should create a new blog post', async () => {
            const postData = {
                event_id: testEvent.id,
                title: 'New Blog Post',
                content: 'This is the content of the new blog post with at least 50 characters to meet validation requirements.',
                excerpt: 'This is an excerpt',
                status: 'draft'
            };

            const response = await request(app)
                .post('/api/v1/blog/posts')
                .set('Authorization', `Bearer ${authToken}`)
                .send(postData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.post).toBeDefined();
            expect(response.body.post.title).toBe(postData.title);
            expect(response.body.post.content).toBe(postData.content);
            expect(response.body.post.author_id).toBe(testUser.id);
        });

        test('should require authentication', async () => {
            const postData = {
                event_id: testEvent.id,
                title: 'Unauthorized Post',
                content: 'This is test content with at least 50 characters to meet validation requirements.'
            };

            const response = await request(app)
                .post('/api/v1/blog/posts')
                .send(postData)
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        test('should validate required fields', async () => {
            const invalidData = {
                title: 'Incomplete Post'
                // Missing event_id and content
            };

            const response = await request(app)
                .post('/api/v1/blog/posts')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('validation');
        });

        test('should validate content length', async () => {
            const postData = {
                event_id: testEvent.id,
                title: 'Short Content Post',
                content: 'Short' // Too short
            };

            const response = await request(app)
                .post('/api/v1/blog/posts')
                .set('Authorization', `Bearer ${authToken}`)
                .send(postData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('content');
        });

        test('should generate slug from title', async () => {
            const postData = {
                event_id: testEvent.id,
                title: 'My Amazing Blog Post!',
                content: 'This is test content with at least 50 characters to meet validation requirements.'
            };

            const response = await request(app)
                .post('/api/v1/blog/posts')
                .set('Authorization', `Bearer ${authToken}`)
                .send(postData)
                .expect(201);

            expect(response.body.post.slug).toBe('my-amazing-blog-post');
        });
    });

    describe('GET /api/v1/blog/posts/:id', () => {
        let testPost;

        beforeEach(async () => {
            testPost = await BlogPost.create({
                event_id: testEvent.id,
                author_id: testUser.id,
                title: 'Test Post for Detail',
                slug: 'test-post-for-detail',
                content: 'This is test content for detail view with at least 50 characters to meet validation requirements.',
                status: 'published',
                published_at: new Date()
            });
        });

        test('should get specific blog post', async () => {
            const response = await request(app)
                .get(`/api/v1/blog/posts/${testPost.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.post).toBeDefined();
            expect(response.body.post.id).toBe(testPost.id);
            expect(response.body.post.title).toBe(testPost.title);
        });

        test('should require authentication', async () => {
            const response = await request(app)
                .get(`/api/v1/blog/posts/${testPost.id}`)
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        test('should return 404 for non-existent post', async () => {
            const response = await request(app)
                .get('/api/v1/blog/posts/99999')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('not found');
        });

        test('should increment view count', async () => {
            const initialViewCount = testPost.view_count;

            await request(app)
                .get(`/api/v1/blog/posts/${testPost.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            // Reload post to check view count
            await testPost.reload();
            expect(testPost.view_count).toBe(initialViewCount + 1);
        });
    });

    describe('PUT /api/v1/blog/posts/:id', () => {
        let testPost;

        beforeEach(async () => {
            testPost = await BlogPost.create({
                event_id: testEvent.id,
                author_id: testUser.id,
                title: 'Original Title',
                slug: 'original-title',
                content: 'This is original content with at least 50 characters to meet validation requirements.',
                status: 'draft'
            });
        });

        test('should update blog post', async () => {
            const updateData = {
                title: 'Updated Title',
                content: 'This is updated content with at least 50 characters to meet validation requirements.',
                status: 'published'
            };

            const response = await request(app)
                .put(`/api/v1/blog/posts/${testPost.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.post.title).toBe(updateData.title);
            expect(response.body.post.content).toBe(updateData.content);
            expect(response.body.post.status).toBe(updateData.status);
        });

        test('should require authentication', async () => {
            const updateData = {
                title: 'Unauthorized Update',
                content: 'This is unauthorized content with at least 50 characters to meet validation requirements.'
            };

            const response = await request(app)
                .put(`/api/v1/blog/posts/${testPost.id}`)
                .send(updateData)
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        test('should only allow author or admin to update', async () => {
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

            const updateData = {
                title: 'Unauthorized Update',
                content: 'This is unauthorized content with at least 50 characters to meet validation requirements.'
            };

            const response = await request(app)
                .put(`/api/v1/blog/posts/${testPost.id}`)
                .set('Authorization', `Bearer ${anotherToken}`)
                .send(updateData)
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('permission');
        });

        test('should allow admin to update any post', async () => {
            const updateData = {
                title: 'Admin Updated Title',
                content: 'This is admin updated content with at least 50 characters to meet validation requirements.'
            };

            const response = await request(app)
                .put(`/api/v1/blog/posts/${testPost.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.post.title).toBe(updateData.title);
        });
    });

    describe('DELETE /api/v1/blog/posts/:id', () => {
        let testPost;

        beforeEach(async () => {
            testPost = await BlogPost.create({
                event_id: testEvent.id,
                author_id: testUser.id,
                title: 'Deletable Post',
                slug: 'deletable-post',
                content: 'This is content for deletable post with at least 50 characters to meet validation requirements.',
                status: 'draft'
            });
        });

        test('should delete blog post', async () => {
            const response = await request(app)
                .delete(`/api/v1/blog/posts/${testPost.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('deleted');

            // Verify post is deleted
            const deletedPost = await BlogPost.findByPk(testPost.id);
            expect(deletedPost).toBeNull();
        });

        test('should require authentication', async () => {
            const response = await request(app)
                .delete(`/api/v1/blog/posts/${testPost.id}`)
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        test('should only allow author or admin to delete', async () => {
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

            const response = await request(app)
                .delete(`/api/v1/blog/posts/${testPost.id}`)
                .set('Authorization', `Bearer ${anotherToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('permission');
        });

        test('should allow admin to delete any post', async () => {
            const response = await request(app)
                .delete(`/api/v1/blog/posts/${testPost.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);

            // Verify post is deleted
            const deletedPost = await BlogPost.findByPk(testPost.id);
            expect(deletedPost).toBeNull();
        });
    });

    describe('GET /api/v1/blog/posts/event/:eventId', () => {
        test('should get posts for specific event', async () => {
            // Create posts for different events
            const anotherEvent = await Event.create({
                event_name: 'Another Thanksgiving 2023',
                event_date: new Date('2023-11-23'),
                event_location: 'Another Location',
                description: 'Another event description',
                menu_image_url: '/images/another-menu.jpg'
            });

            await BlogPost.create({
                event_id: testEvent.id,
                author_id: testUser.id,
                title: 'Event 1 Post',
                slug: 'event-1-post',
                content: 'This is content for event 1 post with at least 50 characters to meet validation requirements.',
                status: 'published',
                published_at: new Date()
            });

            await BlogPost.create({
                event_id: anotherEvent.id,
                author_id: testUser.id,
                title: 'Event 2 Post',
                slug: 'event-2-post',
                content: 'This is content for event 2 post with at least 50 characters to meet validation requirements.',
                status: 'published',
                published_at: new Date()
            });

            const response = await request(app)
                .get(`/api/v1/blog/posts/event/${testEvent.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.posts).toHaveLength(1);
            expect(response.body.posts[0].event_id).toBe(testEvent.id);
        });

        test('should require authentication', async () => {
            const response = await request(app)
                .get(`/api/v1/blog/posts/event/${testEvent.id}`)
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/blog/search', () => {
        beforeEach(async () => {
            // Create test posts for search
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
        });

        test('should search posts by title', async () => {
            const response = await request(app)
                .get('/api/v1/blog/search?q=recipes')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.posts).toHaveLength(1);
            expect(response.body.posts[0].title).toContain('Recipes');
        });

        test('should search posts by content', async () => {
            const response = await request(app)
                .get('/api/v1/blog/search?q=traditions')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.posts).toHaveLength(1);
            expect(response.body.posts[0].title).toContain('Traditions');
        });

        test('should return empty results for no matches', async () => {
            const response = await request(app)
                .get('/api/v1/blog/search?q=nonexistent')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.posts).toHaveLength(0);
        });

        test('should require authentication', async () => {
            const response = await request(app)
                .get('/api/v1/blog/search?q=test')
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });
});
