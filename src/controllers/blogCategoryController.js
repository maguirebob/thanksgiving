const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

/**
 * Blog Category Controller
 * Handles all blog category related API operations
 */

// GET /api/v1/blog/categories - Get all active categories
const getAllCategories = async (req, res) => {
  try {
    const categories = await prisma.blogCategory.findMany({
      where: {
        isActive: true
      },
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
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('Error fetching blog categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch blog categories',
      message: error.message
    });
  }
};

// GET /api/v1/blog/categories/:id - Get single category by ID or slug
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const isSlug = isNaN(parseInt(id));

    const where = isSlug ? { slug: id } : { id: parseInt(id) };

    const category = await prisma.blogCategory.findFirst({
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

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Blog category not found'
      });
    }

    res.json({
      success: true,
      data: category
    });

  } catch (error) {
    console.error('Error fetching blog category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch blog category',
      message: error.message
    });
  }
};

// POST /api/v1/blog/categories - Create new category (admin only)
const createCategory = async (req, res) => {
  try {
    const { name, description, color = '#007bff' } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Category name is required'
      });
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');

    // Check if category already exists
    const existingCategory = await prisma.blogCategory.findFirst({
      where: {
        OR: [
          { name: { equals: name, mode: 'insensitive' } },
          { slug }
        ]
      }
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        error: 'A category with this name already exists'
      });
    }

    // Validate color format
    if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
      return res.status(400).json({
        success: false,
        error: 'Color must be a valid hex code (e.g., #RRGGBB or #RGB)'
      });
    }

    // Create the category
    const category = await prisma.blogCategory.create({
      data: {
        name,
        slug,
        description,
        color
      }
    });

    res.status(201).json({
      success: true,
      data: category,
      message: 'Blog category created successfully'
    });

  } catch (error) {
    console.error('Error creating blog category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create blog category',
      message: error.message
    });
  }
};

// PUT /api/v1/blog/categories/:id - Update category (admin only)
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color, isActive } = req.body;

    // Check if category exists
    const existingCategory = await prisma.blogCategory.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        error: 'Blog category not found'
      });
    }

    // Generate new slug if name changed
    let slug = existingCategory.slug;
    if (name && name !== existingCategory.name) {
      slug = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');

      // Check if new slug already exists
      const slugExists = await prisma.blogCategory.findFirst({
        where: { slug, id: { not: parseInt(id) } }
      });

      if (slugExists) {
        return res.status(400).json({
          success: false,
          error: 'A category with this name already exists'
        });
      }
    }

    // Validate color format if provided
    if (color && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
      return res.status(400).json({
        success: false,
        error: 'Color must be a valid hex code (e.g., #RRGGBB or #RGB)'
      });
    }

    // Update the category
    const updateData = {
      ...(name && { name }),
      ...(slug !== existingCategory.slug && { slug }),
      ...(description !== undefined && { description }),
      ...(color && { color }),
      ...(isActive !== undefined && { isActive })
    };

    const category = await prisma.blogCategory.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    res.json({
      success: true,
      data: category,
      message: 'Blog category updated successfully'
    });

  } catch (error) {
    console.error('Error updating blog category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update blog category',
      message: error.message
    });
  }
};

// DELETE /api/v1/blog/categories/:id - Delete category (admin only)
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category exists
    const existingCategory = await prisma.blogCategory.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: {
            posts: true
          }
        }
      }
    });

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        error: 'Blog category not found'
      });
    }

    // Check if category has posts
    if (existingCategory._count.posts > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete category with existing posts. Please reassign or delete posts first.'
      });
    }

    // Delete the category
    await prisma.blogCategory.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Blog category deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting blog category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete blog category',
      message: error.message
    });
  }
};

// GET /api/v1/blog/categories/:id/posts - Get posts for specific category
const getCategoryPosts = async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const isSlug = isNaN(parseInt(id));

    const where = isSlug ? { slug: id } : { id: parseInt(id) };

    // Check if category exists
    const category = await prisma.blogCategory.findFirst({ where });
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Blog category not found'
      });
    }

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where: {
          category_id: category.id,
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
          category_id: category.id,
          status: 'published'
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        category: {
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          color: category.color
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
    console.error('Error fetching category posts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch category posts',
      message: error.message
    });
  }
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryPosts
};
