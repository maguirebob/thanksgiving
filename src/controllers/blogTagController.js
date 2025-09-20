const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

/**
 * Blog Tag Controller
 * Handles all blog tag related API operations
 */

// GET /api/v1/blog/tags - Get all tags with usage counts
const getAllTags = async (req, res) => {
  try {
    const { limit, sort = 'usage' } = req.query;
    const tagLimit = limit ? parseInt(limit) : undefined;

    let orderBy;
    switch (sort) {
      case 'name':
        orderBy = { name: 'asc' };
        break;
      case 'usage':
      default:
        orderBy = { usage_count: 'desc' };
        break;
    }

    const tags = await prisma.blogTag.findMany({
      orderBy,
      take: tagLimit,
      include: {
        _count: {
          select: {
            posts: {
              where: {
                status: 'published'
              }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      data: tags
    });

  } catch (error) {
    console.error('Error fetching blog tags:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch blog tags',
      message: error.message
    });
  }
};

// GET /api/v1/blog/tags/:id - Get single tag by ID or slug
const getTagById = async (req, res) => {
  try {
    const { id } = req.params;
    const isSlug = isNaN(parseInt(id));

    const where = isSlug ? { slug: id } : { id: parseInt(id) };

    const tag = await prisma.blogTag.findFirst({
      where,
      include: {
        posts: {
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
            event: {
              select: {
                id: true,
                event_name: true,
                event_date: true
              }
            }
          },
          orderBy: { published_at: 'desc' },
          take: 10
        },
        _count: {
          select: {
            posts: {
              where: {
                status: 'published'
              }
            }
          }
        }
      }
    });

    if (!tag) {
      return res.status(404).json({
        success: false,
        error: 'Blog tag not found'
      });
    }

    res.json({
      success: true,
      data: tag
    });

  } catch (error) {
    console.error('Error fetching blog tag:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch blog tag',
      message: error.message
    });
  }
};

// POST /api/v1/blog/tags - Create new tag
const createTag = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Tag name is required'
      });
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');

    // Check if tag already exists
    const existingTag = await prisma.blogTag.findFirst({
      where: {
        OR: [
          { name: { equals: name, mode: 'insensitive' } },
          { slug }
        ]
      }
    });

    if (existingTag) {
      return res.status(400).json({
        success: false,
        error: 'A tag with this name already exists'
      });
    }

    // Create the tag
    const tag = await prisma.blogTag.create({
      data: {
        name,
        slug,
        description
      }
    });

    res.status(201).json({
      success: true,
      data: tag,
      message: 'Blog tag created successfully'
    });

  } catch (error) {
    console.error('Error creating blog tag:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create blog tag',
      message: error.message
    });
  }
};

// PUT /api/v1/blog/tags/:id - Update tag
const updateTag = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    // Check if tag exists
    const existingTag = await prisma.blogTag.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingTag) {
      return res.status(404).json({
        success: false,
        error: 'Blog tag not found'
      });
    }

    // Generate new slug if name changed
    let slug = existingTag.slug;
    if (name && name !== existingTag.name) {
      slug = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');

      // Check if new slug already exists
      const slugExists = await prisma.blogTag.findFirst({
        where: { slug, id: { not: parseInt(id) } }
      });

      if (slugExists) {
        return res.status(400).json({
          success: false,
          error: 'A tag with this name already exists'
        });
      }
    }

    // Update the tag
    const updateData = {
      ...(name && { name }),
      ...(slug !== existingTag.slug && { slug }),
      ...(description !== undefined && { description })
    };

    const tag = await prisma.blogTag.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    res.json({
      success: true,
      data: tag,
      message: 'Blog tag updated successfully'
    });

  } catch (error) {
    console.error('Error updating blog tag:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update blog tag',
      message: error.message
    });
  }
};

// DELETE /api/v1/blog/tags/:id - Delete tag
const deleteTag = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if tag exists
    const existingTag = await prisma.blogTag.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: {
            posts: true
          }
        }
      }
    });

    if (!existingTag) {
      return res.status(404).json({
        success: false,
        error: 'Blog tag not found'
      });
    }

    // Check if tag has posts
    if (existingTag._count.posts > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete tag with existing posts. Please remove tag from posts first.'
      });
    }

    // Delete the tag
    await prisma.blogTag.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Blog tag deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting blog tag:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete blog tag',
      message: error.message
    });
  }
};

// GET /api/v1/blog/tags/popular - Get popular tags
const getPopularTags = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    const tags = await prisma.blogTag.findMany({
      where: {
        usage_count: {
          gt: 0
        }
      },
      orderBy: { usage_count: 'desc' },
      take: limit,
      include: {
        _count: {
          select: {
            posts: {
              where: {
                status: 'published'
              }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      data: tags
    });

  } catch (error) {
    console.error('Error fetching popular tags:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch popular tags',
      message: error.message
    });
  }
};

// GET /api/v1/blog/tags/:id/posts - Get posts for specific tag
const getTagPosts = async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const isSlug = isNaN(parseInt(id));

    const where = isSlug ? { slug: id } : { id: parseInt(id) };

    // Check if tag exists
    const tag = await prisma.blogTag.findFirst({ where });
    if (!tag) {
      return res.status(404).json({
        success: false,
        error: 'Blog tag not found'
      });
    }

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where: {
          tags: {
            some: {
              id: tag.id
            }
          },
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
        skip,
        take: limit
      }),
      prisma.blogPost.count({
        where: {
          tags: {
            some: {
              id: tag.id
            }
          },
          status: 'published'
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        tag: {
          id: tag.id,
          name: tag.name,
          slug: tag.slug,
          description: tag.description,
          usage_count: tag.usage_count
        },
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
    console.error('Error fetching tag posts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tag posts',
      message: error.message
    });
  }
};

// GET /api/v1/blog/tags/search - Search tags
const searchTags = async (req, res) => {
  try {
    const { q: query } = req.query;
    const limit = parseInt(req.query.limit) || 10;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const tags = await prisma.blogTag.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ]
      },
      orderBy: { usage_count: 'desc' },
      take: limit,
      include: {
        _count: {
          select: {
            posts: {
              where: {
                status: 'published'
              }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      data: tags,
      query
    });

  } catch (error) {
    console.error('Error searching tags:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search tags',
      message: error.message
    });
  }
};

module.exports = {
  getAllTags,
  getTagById,
  createTag,
  updateTag,
  deleteTag,
  getPopularTags,
  getTagPosts,
  searchTags
};
