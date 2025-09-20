const { BlogTag } = require('../../models');
const DatabaseHelper = require('../helpers/database');

describe('BlogTag Model', () => {
    beforeAll(async () => {
        await DatabaseHelper.setup();
    });

    afterAll(async () => {
        await DatabaseHelper.cleanup();
    });

    beforeEach(async () => {
        // Clean up blog tags table before each test
        await BlogTag.destroy({ where: {}, force: true });
    });

    describe('Blog Tag Creation', () => {
        test('should create a blog tag with valid data', async () => {
            const tagData = {
                name: 'family',
                slug: 'family'
            };

            const tag = await BlogTag.create(tagData);

            expect(tag).toBeDefined();
            expect(tag.id).toBeDefined();
            expect(tag.name).toBe(tagData.name);
            expect(tag.slug).toBe(tagData.slug);
            expect(tag.created_at).toBeDefined();
        });

        test('should create a blog tag with minimal required data', async () => {
            const tagData = {
                name: 'minimal-tag'
            };

            const tag = await BlogTag.create(tagData);

            expect(tag).toBeDefined();
            expect(tag.name).toBe(tagData.name);
            expect(tag.slug).toBe(tagData.name); // Should auto-generate slug
        });

        test('should fail to create tag without required fields', async () => {
            const invalidData = {};

            await expect(BlogTag.create(invalidData)).rejects.toThrow();
        });
    });

    describe('Blog Tag Validation', () => {
        test('should validate name is required', async () => {
            const invalidData = {
                slug: 'no-name-tag'
            };

            await expect(BlogTag.create(invalidData)).rejects.toThrow();
        });

        test('should validate name uniqueness', async () => {
            const tagData1 = {
                name: 'unique-tag',
                slug: 'unique-tag-1'
            };

            const tagData2 = {
                name: 'unique-tag', // Same name
                slug: 'unique-tag-2'
            };

            await BlogTag.create(tagData1);
            await expect(BlogTag.create(tagData2)).rejects.toThrow();
        });

        test('should validate slug uniqueness', async () => {
            const tagData1 = {
                name: 'Tag One',
                slug: 'unique-slug'
            };

            const tagData2 = {
                name: 'Tag Two',
                slug: 'unique-slug' // Same slug
            };

            await BlogTag.create(tagData1);
            await expect(BlogTag.create(tagData2)).rejects.toThrow();
        });

        test('should validate name length', async () => {
            const tagData = {
                name: 'A', // Too short
                slug: 'short-name'
            };

            await expect(BlogTag.create(tagData)).rejects.toThrow();
        });

        test('should validate name maximum length', async () => {
            const tagData = {
                name: 'A'.repeat(51), // Too long
                slug: 'long-name'
            };

            await expect(BlogTag.create(tagData)).rejects.toThrow();
        });

        test('should validate slug format', async () => {
            const tagData = {
                name: 'Invalid Slug Tag',
                slug: 'Invalid Slug!' // Invalid characters
            };

            await expect(BlogTag.create(tagData)).rejects.toThrow();
        });
    });

    describe('Slug Generation', () => {
        test('should generate slug from name when not provided', async () => {
            const tagData = {
                name: 'My Amazing Tag!'
            };

            const tag = await BlogTag.create(tagData);
            expect(tag.slug).toBe('my-amazing-tag');
        });

        test('should use provided slug when given', async () => {
            const tagData = {
                name: 'Custom Slug Tag',
                slug: 'custom-slug'
            };

            const tag = await BlogTag.create(tagData);
            expect(tag.slug).toBe('custom-slug');
        });

        test('should handle special characters in slug generation', async () => {
            const tagData = {
                name: 'Tag with Spaces & Special Chars!'
            };

            const tag = await BlogTag.create(tagData);
            expect(tag.slug).toBe('tag-with-spaces-special-chars');
        });

        test('should handle numbers in slug', async () => {
            const tagData = {
                name: 'Tag 2024'
            };

            const tag = await BlogTag.create(tagData);
            expect(tag.slug).toBe('tag-2024');
        });

        test('should ensure unique slugs', async () => {
            const tagData1 = {
                name: 'Unique Tag',
                slug: 'unique-tag'
            };

            const tagData2 = {
                name: 'Another Unique Tag',
                slug: 'unique-tag' // Same slug
            };

            await BlogTag.create(tagData1);
            await expect(BlogTag.create(tagData2)).rejects.toThrow();
        });
    });

    describe('Tag Management', () => {
        test('should update tag name', async () => {
            const tagData = {
                name: 'Original Name',
                slug: 'original-name'
            };

            const tag = await BlogTag.create(tagData);
            await tag.update({ name: 'Updated Name' });

            expect(tag.name).toBe('Updated Name');
        });

        test('should update tag slug', async () => {
            const tagData = {
                name: 'Slug Tag',
                slug: 'original-slug'
            };

            const tag = await BlogTag.create(tagData);
            const newSlug = 'updated-slug';
            
            await tag.update({ slug: newSlug });
            expect(tag.slug).toBe(newSlug);
        });

        test('should delete tag', async () => {
            const tagData = {
                name: 'Deletable Tag',
                slug: 'deletable-tag'
            };

            const tag = await BlogTag.create(tagData);
            const tagId = tag.id;

            await tag.destroy();

            const deletedTag = await BlogTag.findByPk(tagId);
            expect(deletedTag).toBeNull();
        });
    });

    describe('Query Methods', () => {
        beforeEach(async () => {
            // Create test tags
            await BlogTag.create({
                name: 'family',
                slug: 'family'
            });

            await BlogTag.create({
                name: 'recipes',
                slug: 'recipes'
            });

            await BlogTag.create({
                name: 'traditions',
                slug: 'traditions'
            });

            await BlogTag.create({
                name: 'thanksgiving',
                slug: 'thanksgiving'
            });
        });

        test('should find all tags', async () => {
            const tags = await BlogTag.findAll();
            expect(tags).toHaveLength(4);
        });

        test('should find tag by name', async () => {
            const tag = await BlogTag.findOne({ where: { name: 'family' } });
            expect(tag).toBeDefined();
            expect(tag.name).toBe('family');
        });

        test('should find tag by slug', async () => {
            const tag = await BlogTag.findOne({ where: { slug: 'recipes' } });
            expect(tag).toBeDefined();
            expect(tag.slug).toBe('recipes');
        });

        test('should search tags by name pattern', async () => {
            const tags = await BlogTag.findAll({ 
                where: { 
                    name: { [require('sequelize').Op.like]: '%tion%' } 
                } 
            });
            expect(tags).toHaveLength(2); // traditions, thanksgiving
        });

        test('should order tags by name', async () => {
            const tags = await BlogTag.findAll({ 
                order: [['name', 'ASC']] 
            });
            
            expect(tags[0].name).toBe('family');
            expect(tags[1].name).toBe('recipes');
            expect(tags[2].name).toBe('thanksgiving');
            expect(tags[3].name).toBe('traditions');
        });

        test('should order tags by creation date', async () => {
            const tags = await BlogTag.findAll({ 
                order: [['created_at', 'DESC']] 
            });
            
            expect(tags[0].name).toBe('thanksgiving');
            expect(tags[1].name).toBe('traditions');
            expect(tags[2].name).toBe('recipes');
            expect(tags[3].name).toBe('family');
        });
    });

    describe('Tag Relationships', () => {
        test('should have many blog posts', async () => {
            // This test would require BlogPost model to be set up
            // For now, we'll test the basic tag creation
            const tagData = {
                name: 'Relationship Tag',
                slug: 'relationship-tag'
            };

            const tag = await BlogTag.create(tagData);
            expect(tag).toBeDefined();
            
            // TODO: Test relationship when BlogPost model is available
            // expect(tag.getBlogPosts).toBeDefined();
        });
    });

    describe('Tag Validation Edge Cases', () => {
        test('should handle case sensitivity in names', async () => {
            const tagData1 = {
                name: 'Case Sensitive',
                slug: 'case-sensitive-1'
            };

            const tagData2 = {
                name: 'case sensitive', // Different case
                slug: 'case-sensitive-2'
            };

            await BlogTag.create(tagData1);
            await expect(BlogTag.create(tagData2)).rejects.toThrow();
        });

        test('should handle empty strings', async () => {
            const tagData = {
                name: '',
                slug: 'empty-name'
            };

            await expect(BlogTag.create(tagData)).rejects.toThrow();
        });

        test('should handle whitespace-only names', async () => {
            const tagData = {
                name: '   ',
                slug: 'whitespace-name'
            };

            await expect(BlogTag.create(tagData)).rejects.toThrow();
        });

        test('should trim whitespace from names', async () => {
            const tagData = {
                name: '  trimmed-tag  ',
                slug: 'trimmed-tag'
            };

            const tag = await BlogTag.create(tagData);
            expect(tag.name).toBe('trimmed-tag');
        });
    });

    describe('Tag Popularity', () => {
        test('should find popular tags', async () => {
            // This would require BlogPost model and usage tracking
            // For now, we'll test basic tag creation
            const tagData = {
                name: 'Popular Tag',
                slug: 'popular-tag'
            };

            const tag = await BlogTag.create(tagData);
            expect(tag).toBeDefined();
            
            // TODO: Test popularity when BlogPost model is available
            // const popularTags = await BlogTag.findPopular();
            // expect(popularTags).toContain(tag);
        });
    });
});
