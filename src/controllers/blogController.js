const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

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
    const eventId = req.query.eventId;

    const skip = (page - 1) * limit;

    // Build where clause
    const where = {
      status: 'published'
    };

    if (category) {
      where.category = {
        slug: category
      };
    }

    if (tag) {
      where.tags = {
        some: {
          slug: tag
        }
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (featured) {
      where.is_featured = true;
    }

    if (eventId) {
      where.event_id = parseInt(eventId);
    }

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              first_name: true,
              last_name: true
            }
          },
          category: true,
          tags: true,
          event: {
            select: {
              id: true,
              event_name: true,
              event_date: true
            }
          }
        },
        orderBy: [
          { is_featured: 'desc' },
          { published_at: 'desc' }
        ],
        skip,
        take: limit
      }),
      prisma.blogPost.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching blog posts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch blog posts',
      message: error.message
    });
  }
};

// GET /api/v1/blog/posts/:id - Get single blog post by ID or slug
const getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    const isSlug = isNaN(parseInt(id));

    const where = isSlug ? { slug: id } : { id: parseInt(id) };

    const post = await prisma.blogPost.findFirst({
      where: {
        ...where,
        status: 'published'
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            first_name: true,
            last_name: true
          }
        },
        category: true,
        tags: true,
        event: {
          select: {
            id: true,
            event_name: true,
            event_date: true
          }
        }
      }
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Blog post not found'
      });
    }

    // Increment view count
    await prisma.blogPost.update({
      where: { id: post.id },
      data: { view_count: { increment: 1 } }
    });

    res.json({
      success: true,
      data: post
    });

  } catch (error) {
    console.error('Error fetching blog post:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch blog post',
      message: error.message
    });
  }
};

// POST /api/v1/blog/posts - Create new blog post
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
      tag_ids = []
    } = req.body;

    // Validate required fields
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: 'Title and content are required'
      });
    }

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');

    // Check if slug already exists
    const existingPost = await prisma.blogPost.findUnique({
      where: { slug }
    });

    if (existingPost) {
      return res.status(400).json({
        success: false,
        error: 'A post with this title already exists'
      });
    }

    // Create the blog post
    const post = await prisma.blogPost.create({
      data: {
        title,
        slug,
        content,
        excerpt,
        featured_image_url,
        status,
        is_featured,
        author_id: req.user.id,
        event_id: event_id ? parseInt(event_id) : null,
        category_id: category_id ? parseInt(category_id) : null,
        published_at: status === 'published' ? new Date() : null,
        tags: {
          connect: tag_ids.map(id => ({ id: parseInt(id) }))
        }
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            first_name: true,
            last_name: true
          }
        },
        category: true,
        tags: true,
        event: {
          select: {
            id: true,
            event_name: true,
            event_date: true
          }
        }
      }
    });

    // Update tag usage counts
    if (tag_ids.length > 0) {
      await prisma.blogTag.updateMany({
        where: { id: { in: tag_ids.map(id => parseInt(id)) } },
        data: { usage_count: { increment: 1 } }
      });
    }

    res.status(201).json({
      success: true,
      data: post,
      message: 'Blog post created successfully'
    });

  } catch (error) {
    console.error('Error creating blog post:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create blog post',
      message: error.message
    });
  }
};

// PUT /api/v1/blog/posts/:id - Update blog post
const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      content,
      excerpt,
      featured_image_url,
      status,
      is_featured,
      event_id,
      category_id,
      tag_ids
    } = req.body;

    // Check if post exists and user has permission
    const existingPost = await prisma.blogPost.findUnique({
      where: { id: parseInt(id) },
      include: { tags: true }
    });

    if (!existingPost) {
      return res.status(404).json({
        success: false,
        error: 'Blog post not found'
      });
    }

    // Check if user owns the post or is admin
    if (existingPost.author_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this post'
      });
    }

    // Generate new slug if title changed
    let slug = existingPost.slug;
    if (title && title !== existingPost.title) {
      slug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');

      // Check if new slug already exists
      const slugExists = await prisma.blogPost.findFirst({
        where: { slug, id: { not: parseInt(id) } }
      });

      if (slugExists) {
        return res.status(400).json({
          success: false,
          error: 'A post with this title already exists'
        });
      }
    }

    // Update the blog post
    const updateData = {
      ...(title && { title }),
      ...(slug !== existingPost.slug && { slug }),
      ...(content && { content }),
      ...(excerpt !== undefined && { excerpt }),
      ...(featured_image_url !== undefined && { featured_image_url }),
      ...(status && { status }),
      ...(is_featured !== undefined && { is_featured }),
      ...(event_id !== undefined && { event_id: event_id ? parseInt(event_id) : null }),
      ...(category_id !== undefined && { category_id: category_id ? parseInt(category_id) : null }),
      ...(status === 'published' && !existingPost.published_at && { published_at: new Date() })
    };

    const post = await prisma.blogPost.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            first_name: true,
            last_name: true
          }
        },
        category: true,
        tags: true,
        event: {
          select: {
            id: true,
            event_name: true,
            event_date: true
          }
        }
      }
    });

    // Update tags if provided
    if (tag_ids !== undefined) {
      // Disconnect old tags
      await prisma.blogPost.update({
        where: { id: parseInt(id) },
        data: {
          tags: {
            set: []
          }
        }
      });

      // Connect new tags
      if (tag_ids.length > 0) {
        await prisma.blogPost.update({
          where: { id: parseInt(id) },
          data: {
            tags: {
              connect: tag_ids.map(id => ({ id: parseInt(id) }))
            }
          }
        });

        // Update tag usage counts
        await prisma.blogTag.updateMany({
          where: { id: { in: tag_ids.map(id => parseInt(id)) } },
          data: { usage_count: { increment: 1 } }
        });
      }
    }

    res.json({
      success: true,
      data: post,
      message: 'Blog post updated successfully'
    });

  } catch (error) {
    console.error('Error updating blog post:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update blog post',
      message: error.message
    });
  }
};

// DELETE /api/v1/blog/posts/:id - Delete blog post
const deletePost = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if post exists and user has permission
    const existingPost = await prisma.blogPost.findUnique({
      where: { id: parseInt(id) },
      include: { tags: true }
    });

    if (!existingPost) {
      return res.status(404).json({
        success: false,
        error: 'Blog post not found'
      });
    }

    // Check if user owns the post or is admin
    if (existingPost.author_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this post'
      });
    }

    // Update tag usage counts before deleting
    if (existingPost.tags.length > 0) {
      await prisma.blogTag.updateMany({
        where: { id: { in: existingPost.tags.map(tag => tag.id) } },
        data: { usage_count: { decrement: 1 } }
      });
    }

    // Delete the blog post
    await prisma.blogPost.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Blog post deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting blog post:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete blog post',
      message: error.message
    });
  }
};

// GET /api/v1/blog/posts/event/:eventId - Get posts for specific event
const getPostsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where: {
          event_id: parseInt(eventId),
          status: 'published'
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              first_name: true,
              last_name: true
            }
          },
          category: true,
          tags: true
        },
        orderBy: { published_at: 'desc' },
        skip,
        take: limit
      }),
      prisma.blogPost.count({
        where: {
          event_id: parseInt(eventId),
          status: 'published'
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching event posts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch event posts',
      message: error.message
    });
  }
};

// GET /api/v1/blog/search - Search blog posts
const searchPosts = async (req, res) => {
  try {
    const { q: query, category, tag, eventId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const where = {
      status: 'published',
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { content: { contains: query, mode: 'insensitive' } },
        { excerpt: { contains: query, mode: 'insensitive' } }
      ]
    };

    if (category) {
      where.category = { slug: category };
    }

    if (tag) {
      where.tags = { some: { slug: tag } };
    }

    if (eventId) {
      where.event_id = parseInt(eventId);
    }

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              first_name: true,
              last_name: true
            }
          },
          category: true,
          tags: true,
          event: {
            select: {
              id: true,
              event_name: true,
              event_date: true
            }
          }
        },
        orderBy: { published_at: 'desc' },
        skip,
        take: limit
      }),
      prisma.blogPost.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        query
      }
    });

  } catch (error) {
    console.error('Error searching posts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search posts',
      message: error.message
    });
  }
};

// GET /api/v1/blog/posts/featured - Get featured posts
const getFeaturedPosts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    const posts = await prisma.blogPost.findMany({
      where: {
        status: 'published',
        is_featured: true
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            first_name: true,
            last_name: true
          }
        },
        category: true,
        tags: true,
        event: {
          select: {
            id: true,
            event_name: true,
            event_date: true
          }
        }
      },
      orderBy: { published_at: 'desc' },
      take: limit
    });

    res.json({
      success: true,
      data: posts
    });

  } catch (error) {
    console.error('Error fetching featured posts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch featured posts',
      message: error.message
    });
  }
};

// GET /api/v1/blog/posts/recent - Get recent posts
const getRecentPosts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const posts = await prisma.blogPost.findMany({
      where: {
        status: 'published'
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            first_name: true,
            last_name: true
          }
        },
        category: true,
        tags: true,
        event: {
          select: {
            id: true,
            event_name: true,
            event_date: true
          }
        }
      },
      orderBy: { published_at: 'desc' },
      take: limit
    });

    res.json({
      success: true,
      data: posts
    });

  } catch (error) {
    console.error('Error fetching recent posts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent posts',
      message: error.message
    });
  }
};

// GET /api/v1/blog/posts/popular - Get popular posts
const getPopularPosts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const posts = await prisma.blogPost.findMany({
      where: {
        status: 'published'
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            first_name: true,
            last_name: true
          }
        },
        category: true,
        tags: true,
        event: {
          select: {
            id: true,
            event_name: true,
            event_date: true
          }
        }
      },
      orderBy: { view_count: 'desc' },
      take: limit
    });

    res.json({
      success: true,
      data: posts
    });

  } catch (error) {
    console.error('Error fetching popular posts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch popular posts',
      message: error.message
    });
  }
};

module.exports = {
  getAllPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  getPostsByEvent,
  searchPosts,
  getFeaturedPosts,
  getRecentPosts,
  getPopularPosts
};
