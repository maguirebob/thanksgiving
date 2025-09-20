const db = require('../../models');

/**
 * Blog Controller
 * Handles all blog post related API operations
 */

// GET /api/v1/blog/posts - Get all published blog posts with pagination
const getAllPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const category = req.query.category;
    const tag = req.query.tag;
    const search = req.query.search;
    const featured = req.query.featured === 'true';
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = { status: 'published' };
    
    if (category) {
      whereClause['$category.slug$'] = category;
    }
    
    if (tag) {
      whereClause['$tags.slug$'] = tag;
    }
    
    if (search) {
      whereClause[db.Sequelize.Op.or] = [
        { title: { [db.Sequelize.Op.iLike]: `%${search}%` } },
        { content: { [db.Sequelize.Op.iLike]: `%${search}%` } },
        { excerpt: { [db.Sequelize.Op.iLike]: `%${search}%` } }
      ];
    }
    
    if (featured) {
      whereClause.is_featured = true;
    }

    const { count, rows: posts } = await db.BlogPost.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: db.User,
          as: 'author',
          attributes: ['id', 'username', 'first_name', 'last_name']
        },
        {
          model: db.BlogCategory,
          as: 'category',
          attributes: ['id', 'name', 'color', 'slug']
        },
        {
          model: db.Event,
          as: 'event',
          attributes: ['id', 'event_name', 'event_date']
        },
        {
          model: db.BlogTag,
          as: 'tags',
          attributes: ['id', 'name', 'slug'],
          through: { attributes: [] }
        }
      ],
      order: [['published_at', 'DESC']],
      limit: limit,
      offset: offset,
      distinct: true
    });

    res.json({
      success: true,
      data: posts,
      pagination: {
        page: page,
        limit: limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blog posts',
      error: error.message
    });
  }
};

// GET /api/v1/blog/posts/:id - Get a single blog post by ID
const getPostById = async (req, res) => {
  try {
    const postId = req.params.id;
    
    const post = await db.BlogPost.findByPk(postId, {
      include: [
        {
          model: db.User,
          as: 'author',
          attributes: ['id', 'username', 'first_name', 'last_name']
        },
        {
          model: db.BlogCategory,
          as: 'category',
          attributes: ['id', 'name', 'color', 'slug']
        },
        {
          model: db.Event,
          as: 'event',
          attributes: ['id', 'event_name', 'event_date']
        },
        {
          model: db.BlogTag,
          as: 'tags',
          attributes: ['id', 'name', 'slug'],
          through: { attributes: [] }
        }
      ]
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    // Increment view count
    await post.increment('view_count');

    res.json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('Error fetching blog post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blog post',
      error: error.message
    });
  }
};

// POST /api/v1/blog/posts - Create a new blog post
const createPost = async (req, res) => {
  try {
    const {
      title,
      content,
      excerpt,
      featured_image_url,
      status = 'draft',
      is_featured = false,
      event_id,
      category_id,
      tags = []
    } = req.body;

    // Validate required fields
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required'
      });
    }

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Create the blog post
    const post = await db.BlogPost.create({
      title,
      slug,
      content,
      excerpt,
      featured_image_url,
      status,
      is_featured,
      author_id: req.user.id,
      event_id: event_id || null,
      category_id: category_id || null,
      published_at: status === 'published' ? new Date() : null
    });

    // Add tags if provided
    if (tags && tags.length > 0) {
      const tagRecords = await db.BlogTag.findAll({
        where: { id: { [db.Sequelize.Op.in]: tags } }
      });
      await post.setTags(tagRecords);
    }

    // Fetch the complete post with associations
    const completePost = await db.BlogPost.findByPk(post.id, {
      include: [
        {
          model: db.User,
          as: 'author',
          attributes: ['id', 'username', 'first_name', 'last_name']
        },
        {
          model: db.BlogCategory,
          as: 'category',
          attributes: ['id', 'name', 'color', 'slug']
        },
        {
          model: db.Event,
          as: 'event',
          attributes: ['id', 'event_name', 'event_date']
        },
        {
          model: db.BlogTag,
          as: 'tags',
          attributes: ['id', 'name', 'slug'],
          through: { attributes: [] }
        }
      ]
    });

    res.status(201).json({
      success: true,
      data: completePost,
      message: 'Blog post created successfully'
    });
  } catch (error) {
    console.error('Error creating blog post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create blog post',
      error: error.message
    });
  }
};

// PUT /api/v1/blog/posts/:id - Update a blog post
const updatePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const {
      title,
      content,
      excerpt,
      featured_image_url,
      status,
      is_featured,
      event_id,
      category_id,
      tags = []
    } = req.body;

    // Find the post
    const post = await db.BlogPost.findByPk(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    // Check if user owns the post or is admin
    if (post.author_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own posts'
      });
    }

    // Generate new slug if title changed
    let slug = post.slug;
    if (title && title !== post.title) {
      slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    // Update the post
    await post.update({
      title: title || post.title,
      slug,
      content: content || post.content,
      excerpt: excerpt !== undefined ? excerpt : post.excerpt,
      featured_image_url: featured_image_url !== undefined ? featured_image_url : post.featured_image_url,
      status: status || post.status,
      is_featured: is_featured !== undefined ? is_featured : post.is_featured,
      event_id: event_id !== undefined ? event_id : post.event_id,
      category_id: category_id !== undefined ? category_id : post.category_id,
      published_at: status === 'published' && post.status !== 'published' ? new Date() : post.published_at
    });

    // Update tags if provided
    if (tags && tags.length >= 0) {
      const tagRecords = await db.BlogTag.findAll({
        where: { id: { [db.Sequelize.Op.in]: tags } }
      });
      await post.setTags(tagRecords);
    }

    // Fetch the updated post with associations
    const updatedPost = await db.BlogPost.findByPk(post.id, {
      include: [
        {
          model: db.User,
          as: 'author',
          attributes: ['id', 'username', 'first_name', 'last_name']
        },
        {
          model: db.BlogCategory,
          as: 'category',
          attributes: ['id', 'name', 'color', 'slug']
        },
        {
          model: db.Event,
          as: 'event',
          attributes: ['id', 'event_name', 'event_date']
        },
        {
          model: db.BlogTag,
          as: 'tags',
          attributes: ['id', 'name', 'slug'],
          through: { attributes: [] }
        }
      ]
    });

    res.json({
      success: true,
      data: updatedPost,
      message: 'Blog post updated successfully'
    });
  } catch (error) {
    console.error('Error updating blog post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update blog post',
      error: error.message
    });
  }
};

// DELETE /api/v1/blog/posts/:id - Delete a blog post
const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    
    const post = await db.BlogPost.findByPk(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    // Check if user owns the post or is admin
    if (post.author_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own posts'
      });
    }

    await post.destroy();

    res.json({
      success: true,
      message: 'Blog post deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete blog post',
      error: error.message
    });
  }
};

// GET /api/v1/blog/posts/slug/:slug - Get a blog post by slug
const getPostBySlug = async (req, res) => {
  try {
    const slug = req.params.slug;
    
    const post = await db.BlogPost.findOne({
      where: { slug, status: 'published' },
      include: [
        {
          model: db.User,
          as: 'author',
          attributes: ['id', 'username', 'first_name', 'last_name']
        },
        {
          model: db.BlogCategory,
          as: 'category',
          attributes: ['id', 'name', 'color', 'slug']
        },
        {
          model: db.Event,
          as: 'event',
          attributes: ['id', 'event_name', 'event_date']
        },
        {
          model: db.BlogTag,
          as: 'tags',
          attributes: ['id', 'name', 'slug'],
          through: { attributes: [] }
        }
      ]
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    // Increment view count
    await post.increment('view_count');

    res.json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('Error fetching blog post by slug:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blog post',
      error: error.message
    });
  }
};

// GET /api/v1/blog/posts/featured - Get featured blog posts
const getFeaturedPosts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    const posts = await db.BlogPost.findAll({
      where: { 
        status: 'published',
        is_featured: true
      },
      include: [
        {
          model: db.User,
          as: 'author',
          attributes: ['id', 'username', 'first_name', 'last_name']
        },
        {
          model: db.BlogCategory,
          as: 'category',
          attributes: ['id', 'name', 'color', 'slug']
        },
        {
          model: db.Event,
          as: 'event',
          attributes: ['id', 'event_name', 'event_date']
        },
        {
          model: db.BlogTag,
          as: 'tags',
          attributes: ['id', 'name', 'slug'],
          through: { attributes: [] }
        }
      ],
      order: [['published_at', 'DESC']],
      limit: limit
    });

    res.json({
      success: true,
      data: posts
    });
  } catch (error) {
    console.error('Error fetching featured posts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured posts',
      error: error.message
    });
  }
};

// GET /api/v1/blog/posts/stats - Get blog statistics (admin only)
const getBlogStats = async (req, res) => {
  try {
    const totalPosts = await db.BlogPost.count();
    const publishedPosts = await db.BlogPost.count({ where: { status: 'published' } });
    const draftPosts = await db.BlogPost.count({ where: { status: 'draft' } });
    const featuredPosts = await db.BlogPost.count({ where: { is_featured: true } });
    const totalViews = await db.BlogPost.sum('view_count') || 0;
    
    const categoryStats = await db.BlogPost.findAll({
      attributes: [
        'category_id',
        [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'post_count']
      ],
      include: [{
        model: db.BlogCategory,
        as: 'category',
        attributes: ['name', 'color']
      }],
      group: ['category_id', 'category.id'],
      raw: false
    });

    res.json({
      success: true,
      data: {
        totalPosts,
        publishedPosts,
        draftPosts,
        featuredPosts,
        totalViews,
        categoryStats
      }
    });
  } catch (error) {
    console.error('Error fetching blog stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blog statistics',
      error: error.message
    });
  }
};

module.exports = {
  getAllPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  getPostBySlug,
  getFeaturedPosts,
  getBlogStats
};