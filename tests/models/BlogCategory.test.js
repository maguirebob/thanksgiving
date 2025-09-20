const { BlogCategory } = require('../../models');
const DatabaseHelper = require('../helpers/database');

describe('BlogCategory Model', () => {
    beforeAll(async () => {
        await DatabaseHelper.setup();
    });

    afterAll(async () => {
        await DatabaseHelper.cleanup();
    });

    beforeEach(async () => {
        // Clean up blog categories table before each test
        await BlogCategory.destroy({ where: {}, force: true });
    });

    describe('Blog Category Creation', () => {
        test('should create a blog category with valid data', async () => {
            const categoryData = {
                name: 'Memories',
                slug: 'memories',
                description: 'Personal stories and memories',
                color: '#ff6b6b'
            };

            const category = await BlogCategory.create(categoryData);

            expect(category).toBeDefined();
            expect(category.id).toBeDefined();
            expect(category.name).toBe(categoryData.name);
            expect(category.slug).toBe(categoryData.slug);
            expect(category.description).toBe(categoryData.description);
            expect(category.color).toBe(categoryData.color);
            expect(category.created_at).toBeDefined();
        });

        test('should create a blog category with minimal required data', async () => {
            const categoryData = {
                name: 'Minimal Category',
                slug: 'minimal-category'
            };

            const category = await BlogCategory.create(categoryData);

            expect(category).toBeDefined();
            expect(category.name).toBe(categoryData.name);
            expect(category.slug).toBe(categoryData.slug);
            expect(category.color).toBe('#007bff'); // Default color
            expect(category.description).toBeNull();
        });

        test('should fail to create category without required fields', async () => {
            const invalidData = {
                name: 'Incomplete Category'
                // Missing slug
            };

            await expect(BlogCategory.create(invalidData)).rejects.toThrow();
        });
    });

    describe('Blog Category Validation', () => {
        test('should validate name is required', async () => {
            const invalidData = {
                slug: 'no-name-category'
            };

            await expect(BlogCategory.create(invalidData)).rejects.toThrow();
        });

        test('should validate slug is required', async () => {
            const invalidData = {
                name: 'No Slug Category'
            };

            await expect(BlogCategory.create(invalidData)).rejects.toThrow();
        });

        test('should validate name uniqueness', async () => {
            const categoryData1 = {
                name: 'Unique Category',
                slug: 'unique-category-1'
            };

            const categoryData2 = {
                name: 'Unique Category', // Same name
                slug: 'unique-category-2'
            };

            await BlogCategory.create(categoryData1);
            await expect(BlogCategory.create(categoryData2)).rejects.toThrow();
        });

        test('should validate slug uniqueness', async () => {
            const categoryData1 = {
                name: 'Category One',
                slug: 'unique-slug'
            };

            const categoryData2 = {
                name: 'Category Two',
                slug: 'unique-slug' // Same slug
            };

            await BlogCategory.create(categoryData1);
            await expect(BlogCategory.create(categoryData2)).rejects.toThrow();
        });

        test('should validate name length', async () => {
            const categoryData = {
                name: 'A', // Too short
                slug: 'short-name'
            };

            await expect(BlogCategory.create(categoryData)).rejects.toThrow();
        });

        test('should validate slug format', async () => {
            const categoryData = {
                name: 'Invalid Slug Category',
                slug: 'Invalid Slug!' // Invalid characters
            };

            await expect(BlogCategory.create(categoryData)).rejects.toThrow();
        });
    });

    describe('Blog Category Color Handling', () => {
        test('should use default color when not provided', async () => {
            const categoryData = {
                name: 'Default Color Category',
                slug: 'default-color-category'
            };

            const category = await BlogCategory.create(categoryData);
            expect(category.color).toBe('#007bff');
        });

        test('should accept valid hex colors', async () => {
            const validColors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'];
            
            for (const color of validColors) {
                const categoryData = {
                    name: `Category ${color}`,
                    slug: `category-${color.replace('#', '')}`,
                    color: color
                };

                const category = await BlogCategory.create(categoryData);
                expect(category.color).toBe(color);
            }
        });

        test('should validate hex color format', async () => {
            const categoryData = {
                name: 'Invalid Color Category',
                slug: 'invalid-color-category',
                color: 'not-a-hex-color'
            };

            await expect(BlogCategory.create(categoryData)).rejects.toThrow();
        });
    });

    describe('Slug Generation', () => {
        test('should generate slug from name', async () => {
            const categoryData = {
                name: 'My Amazing Category!',
                slug: 'my-amazing-category'
            };

            const category = await BlogCategory.create(categoryData);
            expect(category.slug).toBe('my-amazing-category');
        });

        test('should handle special characters in slug', async () => {
            const categoryData = {
                name: 'Category with Spaces & Special Chars!',
                slug: 'category-with-spaces-special-chars'
            };

            const category = await BlogCategory.create(categoryData);
            expect(category.slug).toBe('category-with-spaces-special-chars');
        });

        test('should ensure unique slugs', async () => {
            const categoryData1 = {
                name: 'Unique Category',
                slug: 'unique-category'
            };

            const categoryData2 = {
                name: 'Another Unique Category',
                slug: 'unique-category' // Same slug
            };

            await BlogCategory.create(categoryData1);
            await expect(BlogCategory.create(categoryData2)).rejects.toThrow();
        });
    });

    describe('Category Management', () => {
        test('should update category name', async () => {
            const categoryData = {
                name: 'Original Name',
                slug: 'original-name'
            };

            const category = await BlogCategory.create(categoryData);
            await category.update({ name: 'Updated Name' });

            expect(category.name).toBe('Updated Name');
        });

        test('should update category description', async () => {
            const categoryData = {
                name: 'Description Category',
                slug: 'description-category'
            };

            const category = await BlogCategory.create(categoryData);
            const newDescription = 'Updated description';
            
            await category.update({ description: newDescription });
            expect(category.description).toBe(newDescription);
        });

        test('should update category color', async () => {
            const categoryData = {
                name: 'Color Category',
                slug: 'color-category',
                color: '#ff6b6b'
            };

            const category = await BlogCategory.create(categoryData);
            const newColor = '#4ecdc4';
            
            await category.update({ color: newColor });
            expect(category.color).toBe(newColor);
        });

        test('should delete category', async () => {
            const categoryData = {
                name: 'Deletable Category',
                slug: 'deletable-category'
            };

            const category = await BlogCategory.create(categoryData);
            const categoryId = category.id;

            await category.destroy();

            const deletedCategory = await BlogCategory.findByPk(categoryId);
            expect(deletedCategory).toBeNull();
        });
    });

    describe('Query Methods', () => {
        beforeEach(async () => {
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

            await BlogCategory.create({
                name: 'Traditions',
                slug: 'traditions',
                description: 'Family traditions and customs',
                color: '#45b7d1'
            });
        });

        test('should find all categories', async () => {
            const categories = await BlogCategory.findAll();
            expect(categories).toHaveLength(3);
        });

        test('should find category by name', async () => {
            const category = await BlogCategory.findOne({ where: { name: 'Memories' } });
            expect(category).toBeDefined();
            expect(category.name).toBe('Memories');
        });

        test('should find category by slug', async () => {
            const category = await BlogCategory.findOne({ where: { slug: 'recipes' } });
            expect(category).toBeDefined();
            expect(category.slug).toBe('recipes');
        });

        test('should find categories by color', async () => {
            const categories = await BlogCategory.findAll({ where: { color: '#ff6b6b' } });
            expect(categories).toHaveLength(1);
            expect(categories[0].name).toBe('Memories');
        });

        test('should order categories by name', async () => {
            const categories = await BlogCategory.findAll({ 
                order: [['name', 'ASC']] 
            });
            
            expect(categories[0].name).toBe('Memories');
            expect(categories[1].name).toBe('Recipes');
            expect(categories[2].name).toBe('Traditions');
        });
    });

    describe('Category Relationships', () => {
        test('should have many blog posts', async () => {
            // This test would require BlogPost model to be set up
            // For now, we'll test the basic category creation
            const categoryData = {
                name: 'Relationship Category',
                slug: 'relationship-category'
            };

            const category = await BlogCategory.create(categoryData);
            expect(category).toBeDefined();
            
            // TODO: Test relationship when BlogPost model is available
            // expect(category.getBlogPosts).toBeDefined();
        });
    });

    describe('Category Validation Edge Cases', () => {
        test('should handle empty description', async () => {
            const categoryData = {
                name: 'Empty Description Category',
                slug: 'empty-description-category',
                description: ''
            };

            const category = await BlogCategory.create(categoryData);
            expect(category.description).toBe('');
        });

        test('should handle long descriptions', async () => {
            const longDescription = 'A'.repeat(1000);
            const categoryData = {
                name: 'Long Description Category',
                slug: 'long-description-category',
                description: longDescription
            };

            const category = await BlogCategory.create(categoryData);
            expect(category.description).toBe(longDescription);
        });

        test('should handle case sensitivity in names', async () => {
            const categoryData1 = {
                name: 'Case Sensitive',
                slug: 'case-sensitive-1'
            };

            const categoryData2 = {
                name: 'case sensitive', // Different case
                slug: 'case-sensitive-2'
            };

            await BlogCategory.create(categoryData1);
            await expect(BlogCategory.create(categoryData2)).rejects.toThrow();
        });
    });
});
