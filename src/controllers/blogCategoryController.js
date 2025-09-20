const db = require('../../models');

/**
 * Blog Category Controller
 * Handles all blog category related API operations
 */

// GET /api/v1/blog/categories - Get all blog categories
const getAllCategories = async (req, res) => {
  try {
    const categories = await db.BlogCategory.findAll({
      where: { is_active: true },
      include: [{
        model: db.BlogPost,
        as: 'posts',
        attributes: ['id'],
        where: { status: 'published' },
        required: false
      }],
      order: [['name', 'ASC']]
    });

    // Add post count to each category
    const categoriesWithCount = categories.map(category => ({
      ...category.toJSON(),
      post_count: category.posts ? category.posts.length : 0
    }));

    res.json({
      success: true,
      data: categoriesWithCount
    });
  } catch (error) {
    console.error('Error fetching blog categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blog categories',
      error: error.message
    });
  }
};

// GET /api/v1/blog/categories/:id - Get a single blog category
const getCategoryById = async (req, res) => {
  try {
    const categoryId = req.params.id;
    
    const category = await db.BlogCategory.findByPk(categoryId, {
      include: [{
        model: db.BlogPost,
        as: 'posts',
        where: { status: 'published' },
        required: false,
        attributes: ['id', 'title', 'slug', 'published_at'],
        order: [['published_at', 'DESC']]
      }]
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Blog category not found'
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
      message: 'Failed to fetch blog category',
      error: error.message
    });
  }
};

// POST /api/v1/blog/categories - Create a new blog category
const createCategory = async (req, res) => {
  try {
    const { name, description, color = '#007bff' } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check if category with same name or slug already exists
    const existingCategory = await db.BlogCategory.findOne({
      where: {
        [db.Sequelize.Op.or]: [
          { name: name },
          { slug: slug }
        ]
      }
    });

    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }

    const category = await db.BlogCategory.create({
      name,
      slug,
      description,
      color
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
      message: 'Failed to create blog category',
      error: error.message
    });
  }
};

// PUT /api/v1/blog/categories/:id - Update a blog category
const updateCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const { name, description, color, is_active } = req.body;

    const category = await db.BlogCategory.findByPk(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Blog category not found'
      });
    }

    // Generate new slug if name changed
    let slug = category.slug;
    if (name && name !== category.name) {
      slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Check if new slug already exists
      const existingCategory = await db.BlogCategory.findOne({
        where: { 
          slug: slug,
          id: { [db.Sequelize.Op.ne]: categoryId }
        }
      });

      if (existingCategory) {
        return res.status(409).json({
          success: false,
          message: 'Category with this name already exists'
        });
      }
    }

    await category.update({
      name: name || category.name,
      slug,
      description: description !== undefined ? description : category.description,
      color: color || category.color,
      is_active: is_active !== undefined ? is_active : category.is_active
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
      message: 'Failed to update blog category',
      error: error.message
    });
  }
};

// DELETE /api/v1/blog/categories/:id - Delete a blog category
const deleteCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    
    const category = await db.BlogCategory.findByPk(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Blog category not found'
      });
    }

    // Check if category has posts
    const postCount = await db.BlogPost.count({
      where: { category_id: categoryId }
    });

    if (postCount > 0) {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete category with existing posts'
      });
    }

    await category.destroy();

    res.json({
      success: true,
      message: 'Blog category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting blog category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete blog category',
      error: error.message
    });
  }
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
};