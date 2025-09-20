const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../api/index');
const { User, BlogCategory } = require('../../models');
const DatabaseHelper = require('../helpers/database');
const bcrypt = require('bcryptjs');

describe('Blog Category API Endpoints', () => {
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
        await BlogCategory.destroy({ where: {}, force: true });
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

    describe('GET /api/v1/blog/categories', () => {
        test('should get all blog categories', async () => {
            // Create test categories
            await BlogCategory.create({
                name: 'Memories',
                slug: 'memories',
                description: 'Personal stories and memories',
                color: '#ff6b6b'
            });

            await BlogCategory.create({
                name: 'Recipes',
                slug: 'recipes',
                description: 'Cooking and recipe discussions',
                color: '#4ecdc4'
            });

            const response = await request(app)
                .get('/api/v1/blog/categories')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.categories).toHaveLength(2);
            expect(response.body.categories[0]).toHaveProperty('id');
            expect(response.body.categories[0]).toHaveProperty('name');
            expect(response.body.categories[0]).toHaveProperty('slug');
            expect(response.body.categories[0]).toHaveProperty('color');
        });

        test('should not require authentication for public access', async () => {
            await BlogCategory.create({
                name: 'Public Category',
                slug: 'public-category',
                description: 'Publicly accessible category',
                color: '#007bff'
            });

            const response = await request(app)
                .get('/api/v1/blog/categories')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.categories).toHaveLength(1);
        });

        test('should return empty array when no categories exist', async () => {
            const response = await request(app)
                .get('/api/v1/blog/categories')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.categories).toHaveLength(0);
        });
    });

    describe('POST /api/v1/blog/categories', () => {
        test('should create a new blog category (admin only)', async () => {
            const categoryData = {
                name: 'New Category',
                slug: 'new-category',
                description: 'A new category for testing',
                color: '#ff6b6b'
            };

            const response = await request(app)
                .post('/api/v1/blog/categories')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(categoryData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.category).toBeDefined();
            expect(response.body.category.name).toBe(categoryData.name);
            expect(response.body.category.slug).toBe(categoryData.slug);
            expect(response.body.category.description).toBe(categoryData.description);
            expect(response.body.category.color).toBe(categoryData.color);
        });

        test('should require admin role', async () => {
            const categoryData = {
                name: 'Unauthorized Category',
                slug: 'unauthorized-category',
                description: 'This should not be created',
                color: '#ff6b6b'
            };

            const response = await request(app)
                .post('/api/v1/blog/categories')
                .set('Authorization', `Bearer ${authToken}`)
                .send(categoryData)
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('admin');
        });

        test('should require authentication', async () => {
            const categoryData = {
                name: 'Unauthenticated Category',
                slug: 'unauthenticated-category',
                description: 'This should not be created',
                color: '#ff6b6b'
            };

            const response = await request(app)
                .post('/api/v1/blog/categories')
                .send(categoryData)
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        test('should validate required fields', async () => {
            const invalidData = {
                name: 'Incomplete Category'
                // Missing slug
            };

            const response = await request(app)
                .post('/api/v1/blog/categories')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(invalidData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('validation');
        });

        test('should validate unique name', async () => {
            // Create first category
            await BlogCategory.create({
                name: 'Existing Category',
                slug: 'existing-category',
                description: 'First category',
                color: '#ff6b6b'
            });

            const duplicateData = {
                name: 'Existing Category', // Same name
                slug: 'different-slug',
                description: 'Second category',
                color: '#4ecdc4'
            };

            const response = await request(app)
                .post('/api/v1/blog/categories')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(duplicateData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('unique');
        });

        test('should validate unique slug', async () => {
            // Create first category
            await BlogCategory.create({
                name: 'First Category',
                slug: 'existing-slug',
                description: 'First category',
                color: '#ff6b6b'
            });

            const duplicateData = {
                name: 'Different Name',
                slug: 'existing-slug', // Same slug
                description: 'Second category',
                color: '#4ecdc4'
            };

            const response = await request(app)
                .post('/api/v1/blog/categories')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(duplicateData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('unique');
        });

        test('should use default color when not provided', async () => {
            const categoryData = {
                name: 'Default Color Category',
                slug: 'default-color-category',
                description: 'Category with default color'
            };

            const response = await request(app)
                .post('/api/v1/blog/categories')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(categoryData)
                .expect(201);

            expect(response.body.category.color).toBe('#007bff');
        });
    });

    describe('PUT /api/v1/blog/categories/:id', () => {
        let testCategory;

        beforeEach(async () => {
            testCategory = await BlogCategory.create({
                name: 'Original Category',
                slug: 'original-category',
                description: 'Original description',
                color: '#ff6b6b'
            });
        });

        test('should update blog category (admin only)', async () => {
            const updateData = {
                name: 'Updated Category',
                description: 'Updated description',
                color: '#4ecdc4'
            };

            const response = await request(app)
                .put(`/api/v1/blog/categories/${testCategory.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.category.name).toBe(updateData.name);
            expect(response.body.category.description).toBe(updateData.description);
            expect(response.body.category.color).toBe(updateData.color);
        });

        test('should require admin role', async () => {
            const updateData = {
                name: 'Unauthorized Update',
                description: 'This should not be updated'
            };

            const response = await request(app)
                .put(`/api/v1/blog/categories/${testCategory.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('admin');
        });

        test('should require authentication', async () => {
            const updateData = {
                name: 'Unauthenticated Update',
                description: 'This should not be updated'
            };

            const response = await request(app)
                .put(`/api/v1/blog/categories/${testCategory.id}`)
                .send(updateData)
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        test('should return 404 for non-existent category', async () => {
            const updateData = {
                name: 'Non-existent Update',
                description: 'This should not be updated'
            };

            const response = await request(app)
                .put('/api/v1/blog/categories/99999')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('not found');
        });

        test('should validate unique name on update', async () => {
            // Create another category
            await BlogCategory.create({
                name: 'Another Category',
                slug: 'another-category',
                description: 'Another category',
                color: '#4ecdc4'
            });

            const updateData = {
                name: 'Another Category', // Same name as existing
                description: 'Updated description'
            };

            const response = await request(app)
                .put(`/api/v1/blog/categories/${testCategory.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('unique');
        });

        test('should allow updating to same name', async () => {
            const updateData = {
                name: 'Original Category', // Same name as current
                description: 'Updated description'
            };

            const response = await request(app)
                .put(`/api/v1/blog/categories/${testCategory.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.category.description).toBe(updateData.description);
        });
    });

    describe('DELETE /api/v1/blog/categories/:id', () => {
        let testCategory;

        beforeEach(async () => {
            testCategory = await BlogCategory.create({
                name: 'Deletable Category',
                slug: 'deletable-category',
                description: 'This category can be deleted',
                color: '#ff6b6b'
            });
        });

        test('should delete blog category (admin only)', async () => {
            const response = await request(app)
                .delete(`/api/v1/blog/categories/${testCategory.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('deleted');

            // Verify category is deleted
            const deletedCategory = await BlogCategory.findByPk(testCategory.id);
            expect(deletedCategory).toBeNull();
        });

        test('should require admin role', async () => {
            const response = await request(app)
                .delete(`/api/v1/blog/categories/${testCategory.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('admin');
        });

        test('should require authentication', async () => {
            const response = await request(app)
                .delete(`/api/v1/blog/categories/${testCategory.id}`)
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        test('should return 404 for non-existent category', async () => {
            const response = await request(app)
                .delete('/api/v1/blog/categories/99999')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('not found');
        });
    });

    describe('Category Validation Edge Cases', () => {
        test('should handle empty description', async () => {
            const categoryData = {
                name: 'Empty Description Category',
                slug: 'empty-description-category',
                description: ''
            };

            const response = await request(app)
                .post('/api/v1/blog/categories')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(categoryData)
                .expect(201);

            expect(response.body.category.description).toBe('');
        });

        test('should handle long descriptions', async () => {
            const longDescription = 'A'.repeat(1000);
            const categoryData = {
                name: 'Long Description Category',
                slug: 'long-description-category',
                description: longDescription
            };

            const response = await request(app)
                .post('/api/v1/blog/categories')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(categoryData)
                .expect(201);

            expect(response.body.category.description).toBe(longDescription);
        });

        test('should validate hex color format', async () => {
            const categoryData = {
                name: 'Invalid Color Category',
                slug: 'invalid-color-category',
                description: 'Category with invalid color',
                color: 'not-a-hex-color'
            };

            const response = await request(app)
                .post('/api/v1/blog/categories')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(categoryData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('color');
        });

        test('should accept valid hex colors', async () => {
            const validColors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'];
            
            for (const color of validColors) {
                const categoryData = {
                    name: `Category ${color}`,
                    slug: `category-${color.replace('#', '')}`,
                    description: `Category with color ${color}`,
                    color: color
                };

                const response = await request(app)
                    .post('/api/v1/blog/categories')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send(categoryData)
                    .expect(201);

                expect(response.body.category.color).toBe(color);
            }
        });
    });
});
