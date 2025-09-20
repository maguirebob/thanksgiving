const db = require('../../models');

/**
 * Blog Tag Controller
 * Handles all blog tag related API operations
 */

// GET /api/v1/blog/tags - Get all blog tags
const getAllTags = async (req, res) => {
  try {
    const tags = await db.BlogTag.findAll({
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: tags
    });
  } catch (error) {
    console.error('Error fetching blog tags:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blog tags',
      error: error.message
    });
  }
};

// GET /api/v1/blog/tags/:id - Get a single blog tag
const getTagById = async (req, res) => {
  try {
    const tagId = req.params.id;
    
    const tag = await db.BlogTag.findByPk(tagId, {
      include: [{
        model: db.BlogPost,
        as: 'posts',
        where: { status: 'published' },
        required: false,
        attributes: ['id', 'title', 'slug', 'published_at'],
        order: [['published_at', 'DESC']]
      }]
    });

    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Blog tag not found'
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
      message: 'Failed to fetch blog tag',
      error: error.message
    });
  }
};

// POST /api/v1/blog/tags - Create a new blog tag
const createTag = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Tag name is required'
      });
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check if tag with same name or slug already exists
    const existingTag = await db.BlogTag.findOne({
      where: {
        [db.Sequelize.Op.or]: [
          { name: name },
          { slug: slug }
        ]
      }
    });

    if (existingTag) {
      return res.status(409).json({
        success: false,
        message: 'Tag with this name already exists'
      });
    }

    const tag = await db.BlogTag.create({
      name,
      slug,
      description
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
      message: 'Failed to create blog tag',
      error: error.message
    });
  }
};

// PUT /api/v1/blog/tags/:id - Update a blog tag
const updateTag = async (req, res) => {
  try {
    const tagId = req.params.id;
    const { name, description } = req.body;

    const tag = await db.BlogTag.findByPk(tagId);
    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Blog tag not found'
      });
    }

    // Generate new slug if name changed
    let slug = tag.slug;
    if (name && name !== tag.name) {
      slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Check if new slug already exists
      const existingTag = await db.BlogTag.findOne({
        where: { 
          slug: slug,
          id: { [db.Sequelize.Op.ne]: tagId }
        }
      });

      if (existingTag) {
        return res.status(409).json({
          success: false,
          message: 'Tag with this name already exists'
        });
      }
    }

    await tag.update({
      name: name || tag.name,
      slug,
      description: description !== undefined ? description : tag.description
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
      message: 'Failed to update blog tag',
      error: error.message
    });
  }
};

// DELETE /api/v1/blog/tags/:id - Delete a blog tag
const deleteTag = async (req, res) => {
  try {
    const tagId = req.params.id;
    
    const tag = await db.BlogTag.findByPk(tagId);
    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Blog tag not found'
      });
    }

    // Check if tag has posts
    const postCount = await db.BlogPostTag.count({
      where: { blog_tag_id: tagId }
    });

    if (postCount > 0) {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete tag with existing posts'
      });
    }

    await tag.destroy();

    res.json({
      success: true,
      message: 'Blog tag deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting blog tag:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete blog tag',
      error: error.message
    });
  }
};

// GET /api/v1/blog/tags/popular - Get popular tags
const getPopularTags = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const tags = await db.BlogTag.findAll({
      order: [['usage_count', 'DESC']],
      limit: limit
    });

    res.json({
      success: true,
      data: tags
    });
  } catch (error) {
    console.error('Error fetching popular tags:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch popular tags',
      error: error.message
    });
  }
};

module.exports = {
  getAllTags,
  getTagById,
  createTag,
  updateTag,
  deleteTag,
  getPopularTags
};