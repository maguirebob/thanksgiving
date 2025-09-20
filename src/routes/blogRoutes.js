const express = require('express');
const router = express.Router();

// Import controllers
const blogController = require('../controllers/blogController');
const blogCategoryController = require('../controllers/blogCategoryController');
const blogTagController = require('../controllers/blogTagController');

// Import middleware
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/auth');

/**
 * Blog Routes
 * All routes are prefixed with /api/v1/blog
 */

// =============================================================================
// BLOG POST ROUTES
// =============================================================================

// GET /api/v1/blog/posts - Get all published blog posts
router.get('/posts', blogController.getAllPosts);

// GET /api/v1/blog/posts/featured - Get featured posts
router.get('/posts/featured', blogController.getFeaturedPosts);

// GET /api/v1/blog/posts/recent - Get recent posts
router.get('/posts/recent', blogController.getRecentPosts);

// GET /api/v1/blog/posts/popular - Get popular posts
router.get('/posts/popular', blogController.getPopularPosts);

// GET /api/v1/blog/posts/event/:eventId - Get posts for specific event
router.get('/posts/event/:eventId', blogController.getPostsByEvent);

// GET /api/v1/blog/search - Search blog posts
router.get('/search', blogController.searchPosts);

// GET /api/v1/blog/posts/:id - Get single blog post by ID or slug
router.get('/posts/:id', blogController.getPostById);

// POST /api/v1/blog/posts - Create new blog post (requires authentication)
router.post('/posts', requireAuth, blogController.createPost);

// PUT /api/v1/blog/posts/:id - Update blog post (requires authentication)
router.put('/posts/:id', requireAuth, blogController.updatePost);

// DELETE /api/v1/blog/posts/:id - Delete blog post (requires authentication)
router.delete('/posts/:id', requireAuth, blogController.deletePost);

// =============================================================================
// BLOG CATEGORY ROUTES
// =============================================================================

// GET /api/v1/blog/categories - Get all active categories
router.get('/categories', blogCategoryController.getAllCategories);

// GET /api/v1/blog/categories/:id - Get single category by ID or slug
router.get('/categories/:id', blogCategoryController.getCategoryById);

// GET /api/v1/blog/categories/:id/posts - Get posts for specific category
router.get('/categories/:id/posts', blogCategoryController.getCategoryPosts);

// POST /api/v1/blog/categories - Create new category (admin only)
router.post('/categories', requireAuth, requireAdmin, blogCategoryController.createCategory);

// PUT /api/v1/blog/categories/:id - Update category (admin only)
router.put('/categories/:id', requireAuth, requireAdmin, blogCategoryController.updateCategory);

// DELETE /api/v1/blog/categories/:id - Delete category (admin only)
router.delete('/categories/:id', requireAuth, requireAdmin, blogCategoryController.deleteCategory);

// =============================================================================
// BLOG TAG ROUTES
// =============================================================================

// GET /api/v1/blog/tags - Get all tags
router.get('/tags', blogTagController.getAllTags);

// GET /api/v1/blog/tags/popular - Get popular tags
router.get('/tags/popular', blogTagController.getPopularTags);

// GET /api/v1/blog/tags/search - Search tags
router.get('/tags/search', blogTagController.searchTags);

// GET /api/v1/blog/tags/:id - Get single tag by ID or slug
router.get('/tags/:id', blogTagController.getTagById);

// GET /api/v1/blog/tags/:id/posts - Get posts for specific tag
router.get('/tags/:id/posts', blogTagController.getTagPosts);

// POST /api/v1/blog/tags - Create new tag (requires authentication)
router.post('/tags', requireAuth, blogTagController.createTag);

// PUT /api/v1/blog/tags/:id - Update tag (requires authentication)
router.put('/tags/:id', requireAuth, blogTagController.updateTag);

// DELETE /api/v1/blog/tags/:id - Delete tag (requires authentication)
router.delete('/tags/:id', requireAuth, blogTagController.deleteTag);

// =============================================================================
// BLOG STATISTICS ROUTES (Admin only)
// =============================================================================

// GET /api/v1/blog/stats - Get blog statistics
router.get('/stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const [
      totalPosts,
      publishedPosts,
      draftPosts,
      totalCategories,
      totalTags,
      totalViews,
      recentPosts
    ] = await Promise.all([
      prisma.blogPost.count(),
      prisma.blogPost.count({ where: { status: 'published' } }),
      prisma.blogPost.count({ where: { status: 'draft' } }),
      prisma.blogCategory.count(),
      prisma.blogTag.count(),
      prisma.blogPost.aggregate({
        _sum: { view_count: true }
      }),
      prisma.blogPost.findMany({
        where: { status: 'published' },
        orderBy: { published_at: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          slug: true,
          published_at: true,
          view_count: true,
          author: {
            select: {
              username: true
            }
          }
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        posts: {
          total: totalPosts,
          published: publishedPosts,
          draft: draftPosts
        },
        categories: totalCategories,
        tags: totalTags,
        totalViews: totalViews._sum.view_count || 0,
        recentPosts
      }
    });

  } catch (error) {
    console.error('Error fetching blog stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch blog statistics',
      message: error.message
    });
  }
});

module.exports = router;
