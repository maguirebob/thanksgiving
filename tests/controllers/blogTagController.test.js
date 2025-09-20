const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../api/index');
const { User, BlogTag } = require('../../models');
const DatabaseHelper = require('../helpers/database');
const bcrypt = require('bcryptjs');

describe('Blog Tag API Endpoints', () => {
    let authToken;
    let adminToken;
    let testUser;
    let adminUser;

    beforeAll(async () => {
        await DatabaseHelper.setup();
    });

    afterAll(async () => {
        await DatabaseHelper.cleanup();
    });

    beforeEach(async () => {
        // Clean up tables
        await BlogTag.destroy({ where: {}, force: true });
        await User.destroy({ where: {}, force: true });

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

    describe('GET /api/v1/blog/tags', () => {
        test('should get all blog tags', async () => {
            // Create test tags
            await BlogTag.create({
                name: 'family',
                slug: 'family'
            });

            await BlogTag.create({
                name: 'recipes',
                slug: 'recipes'
            });

            const response = await request(app)
                .get('/api/v1/blog/tags')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.tags).toHaveLength(2);
            expect(response.body.tags[0]).toHaveProperty('id');
            expect(response.body.tags[0]).toHaveProperty('name');
            expect(response.body.tags[0]).toHaveProperty('slug');
        });

        test('should not require authentication for public access', async () => {
            await BlogTag.create({
                name: 'public-tag',
                slug: 'public-tag'
            });

            const response = await request(app)
                .get('/api/v1/blog/tags')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.tags).toHaveLength(1);
        });

        test('should return empty array when no tags exist', async () => {
            const response = await request(app)
                .get('/api/v1/blog/tags')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.tags).toHaveLength(0);
        });

        test('should order tags by name', async () => {
            // Create tags in random order
            await BlogTag.create({ name: 'zebra', slug: 'zebra' });
            await BlogTag.create({ name: 'apple', slug: 'apple' });
            await BlogTag.create({ name: 'banana', slug: 'banana' });

            const response = await request(app)
                .get('/api/v1/blog/tags')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.tags).toHaveLength(3);
            expect(response.body.tags[0].name).toBe('apple');
            expect(response.body.tags[1].name).toBe('banana');
            expect(response.body.tags[2].name).toBe('zebra');
        });
    });

    describe('POST /api/v1/blog/tags', () => {
        test('should create a new blog tag (admin only)', async () => {
            const tagData = {
                name: 'new-tag',
                slug: 'new-tag'
            };

            const response = await request(app)
                .post('/api/v1/blog/tags')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(tagData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.tag).toBeDefined();
            expect(response.body.tag.name).toBe(tagData.name);
            expect(response.body.tag.slug).toBe(tagData.slug);
        });

        test('should auto-generate slug when not provided', async () => {
            const tagData = {
                name: 'Auto Generated Slug'
            };

            const response = await request(app)
                .post('/api/v1/blog/tags')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(tagData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.tag.slug).toBe('auto-generated-slug');
        });

        test('should require admin role', async () => {
            const tagData = {
                name: 'unauthorized-tag',
                slug: 'unauthorized-tag'
            };

            const response = await request(app)
                .post('/api/v1/blog/tags')
                .set('Authorization', `Bearer ${authToken}`)
                .send(tagData)
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('admin');
        });

        test('should require authentication', async () => {
            const tagData = {
                name: 'unauthenticated-tag',
                slug: 'unauthenticated-tag'
            };

            const response = await request(app)
                .post('/api/v1/blog/tags')
                .send(tagData)
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        test('should validate required fields', async () => {
            const invalidData = {
                slug: 'no-name-tag'
                // Missing name
            };

            const response = await request(app)
                .post('/api/v1/blog/tags')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(invalidData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('validation');
        });

        test('should validate unique name', async () => {
            // Create first tag
            await BlogTag.create({
                name: 'existing-tag',
                slug: 'existing-tag'
            });

            const duplicateData = {
                name: 'existing-tag', // Same name
                slug: 'different-slug'
            };

            const response = await request(app)
                .post('/api/v1/blog/tags')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(duplicateData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('unique');
        });

        test('should validate unique slug', async () => {
            // Create first tag
            await BlogTag.create({
                name: 'first-tag',
                slug: 'existing-slug'
            });

            const duplicateData = {
                name: 'different-name',
                slug: 'existing-slug' // Same slug
            };

            const response = await request(app)
                .post('/api/v1/blog/tags')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(duplicateData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('unique');
        });

        test('should validate name length', async () => {
            const tagData = {
                name: 'A', // Too short
                slug: 'short-name'
            };

            const response = await request(app)
                .post('/api/v1/blog/tags')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(tagData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('length');
        });

        test('should validate name maximum length', async () => {
            const tagData = {
                name: 'A'.repeat(51), // Too long
                slug: 'long-name'
            };

            const response = await request(app)
                .post('/api/v1/blog/tags')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(tagData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('length');
        });
    });

    describe('GET /api/v1/blog/tags/popular', () => {
        test('should get popular tags', async () => {
            // Create test tags
            await BlogTag.create({ name: 'popular-tag-1', slug: 'popular-tag-1' });
            await BlogTag.create({ name: 'popular-tag-2', slug: 'popular-tag-2' });
            await BlogTag.create({ name: 'unpopular-tag', slug: 'unpopular-tag' });

            const response = await request(app)
                .get('/api/v1/blog/tags/popular')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.tags).toBeDefined();
            expect(Array.isArray(response.body.tags)).toBe(true);
        });

        test('should not require authentication for public access', async () => {
            await BlogTag.create({ name: 'public-popular-tag', slug: 'public-popular-tag' });

            const response = await request(app)
                .get('/api/v1/blog/tags/popular')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.tags).toBeDefined();
        });

        test('should return empty array when no tags exist', async () => {
            const response = await request(app)
                .get('/api/v1/blog/tags/popular')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.tags).toHaveLength(0);
        });

        test('should limit results when limit parameter provided', async () => {
            // Create multiple tags
            for (let i = 1; i <= 10; i++) {
                await BlogTag.create({
                    name: `tag-${i}`,
                    slug: `tag-${i}`
                });
            }

            const response = await request(app)
                .get('/api/v1/blog/tags/popular?limit=5')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.tags.length).toBeLessThanOrEqual(5);
        });
    });

    describe('Tag Search and Filtering', () => {
        beforeEach(async () => {
            // Create test tags
            await BlogTag.create({ name: 'family', slug: 'family' });
            await BlogTag.create({ name: 'recipes', slug: 'recipes' });
            await BlogTag.create({ name: 'traditions', slug: 'traditions' });
            await BlogTag.create({ name: 'thanksgiving', slug: 'thanksgiving' });
        });

        test('should search tags by name', async () => {
            const response = await request(app)
                .get('/api/v1/blog/tags?search=family')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.tags).toHaveLength(1);
            expect(response.body.tags[0].name).toBe('family');
        });

        test('should search tags by partial name', async () => {
            const response = await request(app)
                .get('/api/v1/blog/tags?search=reci')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.tags).toHaveLength(1);
            expect(response.body.tags[0].name).toBe('recipes');
        });

        test('should return empty results for no matches', async () => {
            const response = await request(app)
                .get('/api/v1/blog/tags?search=nonexistent')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.tags).toHaveLength(0);
        });

        test('should be case insensitive', async () => {
            const response = await request(app)
                .get('/api/v1/blog/tags?search=FAMILY')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.tags).toHaveLength(1);
            expect(response.body.tags[0].name).toBe('family');
        });
    });

    describe('Tag Validation Edge Cases', () => {
        test('should handle empty strings', async () => {
            const tagData = {
                name: '',
                slug: 'empty-name'
            };

            const response = await request(app)
                .post('/api/v1/blog/tags')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(tagData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('validation');
        });

        test('should handle whitespace-only names', async () => {
            const tagData = {
                name: '   ',
                slug: 'whitespace-name'
            };

            const response = await request(app)
                .post('/api/v1/blog/tags')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(tagData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('validation');
        });

        test('should trim whitespace from names', async () => {
            const tagData = {
                name: '  trimmed-tag  ',
                slug: 'trimmed-tag'
            };

            const response = await request(app)
                .post('/api/v1/blog/tags')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(tagData)
                .expect(201);

            expect(response.body.tag.name).toBe('trimmed-tag');
        });

        test('should handle special characters in slug generation', async () => {
            const tagData = {
                name: 'Tag with Spaces & Special Chars!'
            };

            const response = await request(app)
                .post('/api/v1/blog/tags')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(tagData)
                .expect(201);

            expect(response.body.tag.slug).toBe('tag-with-spaces-special-chars');
        });

        test('should handle numbers in slug generation', async () => {
            const tagData = {
                name: 'Tag 2024'
            };

            const response = await request(app)
                .post('/api/v1/blog/tags')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(tagData)
                .expect(201);

            expect(response.body.tag.slug).toBe('tag-2024');
        });
    });

    describe('Tag Management', () => {
        let testTag;

        beforeEach(async () => {
            testTag = await BlogTag.create({
                name: 'test-tag',
                slug: 'test-tag'
            });
        });

        test('should update tag name', async () => {
            const updateData = {
                name: 'updated-tag'
            };

            const response = await request(app)
                .put(`/api/v1/blog/tags/${testTag.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.tag.name).toBe(updateData.name);
        });

        test('should update tag slug', async () => {
            const updateData = {
                slug: 'updated-slug'
            };

            const response = await request(app)
                .put(`/api/v1/blog/tags/${testTag.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.tag.slug).toBe(updateData.slug);
        });

        test('should delete tag', async () => {
            const response = await request(app)
                .delete(`/api/v1/blog/tags/${testTag.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('deleted');

            // Verify tag is deleted
            const deletedTag = await BlogTag.findByPk(testTag.id);
            expect(deletedTag).toBeNull();
        });

        test('should require admin role for updates', async () => {
            const updateData = {
                name: 'unauthorized-update'
            };

            const response = await request(app)
                .put(`/api/v1/blog/tags/${testTag.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('admin');
        });

        test('should require admin role for deletion', async () => {
            const response = await request(app)
                .delete(`/api/v1/blog/tags/${testTag.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('admin');
        });
    });
});
