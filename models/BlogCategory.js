const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const BlogCategory = sequelize.define('BlogCategory', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'id'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: {
          msg: 'Category name cannot be empty'
        },
        len: {
          args: [1, 100],
          msg: 'Category name must be between 1 and 100 characters'
        }
      },
      field: 'name'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [0, 1000],
          msg: 'Description must be less than 1000 characters'
        }
      },
      field: 'description'
    },
    color: {
      type: DataTypes.STRING(7),
      allowNull: false,
      defaultValue: '#007bff',
      validate: {
        is: {
          args: /^#[0-9A-Fa-f]{6}$/,
          msg: 'Color must be a valid hex color code (e.g., #007bff)'
        }
      },
      field: 'color'
    },
    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: {
          msg: 'Slug cannot be empty'
        },
        is: {
          args: /^[a-z0-9-]+$/,
          msg: 'Slug must contain only lowercase letters, numbers, and hyphens'
        }
      },
      field: 'slug'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at'
    }
  }, {
    tableName: 'blog_categories',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['slug'],
        unique: true
      },
      {
        fields: ['is_active']
      },
      {
        fields: ['name'],
        unique: true
      }
    ]
  });

  // Instance methods
  BlogCategory.prototype.activate = function() {
    this.isActive = true;
    return this.save();
  };

  BlogCategory.prototype.deactivate = function() {
    this.isActive = false;
    return this.save();
  };

  BlogCategory.prototype.getPostCount = async function() {
    const BlogPost = sequelize.models.BlogPost;
    return await BlogPost.count({
      where: {
        categoryId: this.id
      }
    });
  };

  BlogCategory.prototype.getPublishedPostCount = async function() {
    const BlogPost = sequelize.models.BlogPost;
    return await BlogPost.count({
      where: {
        categoryId: this.id,
        status: 'published'
      }
    });
  };

  // Class methods
  BlogCategory.findActive = function(options = {}) {
    return this.findAll({
      where: {
        isActive: true,
        ...options.where
      },
      ...options
    });
  };

  BlogCategory.findBySlug = function(slug, options = {}) {
    return this.findOne({
      where: {
        slug: slug,
        ...options.where
      },
      ...options
    });
  };

  BlogCategory.search = function(searchTerm, options = {}) {
    return this.findAll({
      where: {
        [sequelize.Op.or]: [
          {
            name: {
              [sequelize.Op.iLike]: `%${searchTerm}%`
            }
          },
          {
            description: {
              [sequelize.Op.iLike]: `%${searchTerm}%`
            }
          }
        ],
        ...options.where
      },
      ...options
    });
  };

  BlogCategory.getWithPostCounts = async function(options = {}) {
    const BlogPost = sequelize.models.BlogPost;
    
    return await this.findAll({
      ...options,
      include: [
        {
          model: BlogPost,
          as: 'posts',
          attributes: [],
          required: false
        }
      ],
      attributes: {
        include: [
          [
            sequelize.fn('COUNT', sequelize.col('posts.id')),
            'postCount'
          ]
        ]
      },
      group: ['BlogCategory.id'],
      order: [['name', 'ASC']]
    });
  };

  BlogCategory.getPopular = async function(limit = 10, options = {}) {
    const BlogPost = sequelize.models.BlogPost;
    
    return await this.findAll({
      ...options,
      include: [
        {
          model: BlogPost,
          as: 'posts',
          attributes: [],
          required: false,
          where: {
            status: 'published'
          }
        }
      ],
      attributes: {
        include: [
          [
            sequelize.fn('COUNT', sequelize.col('posts.id')),
            'publishedPostCount'
          ]
        ]
      },
      group: ['BlogCategory.id'],
      having: sequelize.where(
        sequelize.fn('COUNT', sequelize.col('posts.id')),
        '>',
        0
      ),
      order: [
        [sequelize.fn('COUNT', sequelize.col('posts.id')), 'DESC']
      ],
      limit: limit
    });
  };

  // Associations
  BlogCategory.associate = function(models) {
    // BlogCategory has many BlogPosts
    BlogCategory.hasMany(models.BlogPost, {
      foreignKey: 'categoryId',
      as: 'posts'
    });
  };

  return BlogCategory;
};
