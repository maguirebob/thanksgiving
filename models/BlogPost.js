const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const BlogPost = sequelize.define('BlogPost', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'id'
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Title cannot be empty'
        },
        len: {
          args: [1, 255],
          msg: 'Title must be between 1 and 255 characters'
        }
      },
      field: 'title'
    },
    slug: {
      type: DataTypes.STRING(255),
      allowNull: true, // Allow null initially, will be set by hook
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
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Content cannot be empty'
        },
        len: {
          args: [10, 50000],
          msg: 'Content must be between 10 and 50,000 characters'
        }
      },
      field: 'content'
    },
    excerpt: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [0, 1000],
          msg: 'Excerpt must be less than 1000 characters'
        }
      },
      field: 'excerpt'
    },
    featuredImageUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        isUrl: {
          msg: 'Featured image URL must be a valid URL'
        }
      },
      field: 'featured_image_url'
    },
    status: {
      type: DataTypes.ENUM('draft', 'published', 'archived'),
      allowNull: false,
      defaultValue: 'draft',
      validate: {
        isIn: {
          args: [['draft', 'published', 'archived']],
          msg: 'Status must be draft, published, or archived'
        }
      },
      field: 'status'
    },
    isFeatured: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_featured'
    },
    viewCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: {
          args: [0],
          msg: 'View count cannot be negative'
        }
      },
      field: 'view_count'
    },
    authorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      },
      field: 'author_id'
    },
    eventId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Events',
        key: 'id'
      },
      field: 'event_id'
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'blog_categories',
        key: 'id'
      },
      field: 'category_id'
    },
    publishedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'published_at'
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
    tableName: 'blog_posts',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['status']
      },
      {
        fields: ['author_id']
      },
      {
        fields: ['event_id']
      },
      {
        fields: ['category_id']
      },
      {
        fields: ['published_at']
      },
      {
        fields: ['is_featured']
      },
      {
        fields: ['view_count']
      },
      {
        fields: ['slug'],
        unique: true
      }
    ]
  });

  // Instance methods
  BlogPost.prototype.incrementViewCount = function() {
    this.viewCount += 1;
    return this.save();
  };

  BlogPost.prototype.publish = function() {
    this.status = 'published';
    this.publishedAt = new Date();
    return this.save();
  };

  BlogPost.prototype.archive = function() {
    this.status = 'archived';
    return this.save();
  };

  BlogPost.prototype.setFeatured = function(featured = true) {
    this.isFeatured = featured;
    return this.save();
  };

  BlogPost.prototype.generateExcerpt = function(maxLength = 200) {
    if (this.excerpt) {
      return this.excerpt;
    }
    
    // Strip HTML tags and create excerpt
    const plainText = this.content.replace(/<[^>]*>/g, '');
    if (plainText.length <= maxLength) {
      return plainText;
    }
    
    return plainText.substring(0, maxLength).trim() + '...';
  };

  // Class methods
  BlogPost.findPublished = function(options = {}) {
    return this.findAll({
      where: {
        status: 'published',
        ...options.where
      },
      ...options
    });
  };

  BlogPost.findFeatured = function(options = {}) {
    return this.findAll({
      where: {
        status: 'published',
        isFeatured: true,
        ...options.where
      },
      ...options
    });
  };

  BlogPost.findByEvent = function(eventId, options = {}) {
    return this.findAll({
      where: {
        eventId: eventId,
        ...options.where
      },
      ...options
    });
  };

  BlogPost.findByAuthor = function(authorId, options = {}) {
    return this.findAll({
      where: {
        authorId: authorId,
        ...options.where
      },
      ...options
    });
  };

  BlogPost.findByCategory = function(categoryId, options = {}) {
    return this.findAll({
      where: {
        categoryId: categoryId,
        ...options.where
      },
      ...options
    });
  };

  BlogPost.search = function(searchTerm, options = {}) {
    return this.findAll({
      where: {
        [sequelize.Op.or]: [
          {
            title: {
              [sequelize.Op.iLike]: `%${searchTerm}%`
            }
          },
          {
            content: {
              [sequelize.Op.iLike]: `%${searchTerm}%`
            }
          },
          {
            excerpt: {
              [sequelize.Op.iLike]: `%${searchTerm}%`
            }
          }
        ],
        ...options.where
      },
      ...options
    });
  };

  BlogPost.getPopular = function(limit = 10, options = {}) {
    return this.findAll({
      where: {
        status: 'published',
        ...options.where
      },
      order: [['viewCount', 'DESC']],
      limit: limit,
      ...options
    });
  };

  BlogPost.getRecent = function(limit = 10, options = {}) {
    return this.findAll({
      where: {
        status: 'published',
        ...options.where
      },
      order: [['publishedAt', 'DESC']],
      limit: limit,
      ...options
    });
  };

  // Helper function to generate slug
  function generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }

  // Hooks
  BlogPost.beforeCreate(async (blogPost) => {
    if (!blogPost.slug && blogPost.title) {
      blogPost.slug = generateSlug(blogPost.title);
    }
  });

  BlogPost.beforeUpdate(async (blogPost) => {
    if (blogPost.changed('title') && !blogPost.changed('slug') && blogPost.title) {
      blogPost.slug = generateSlug(blogPost.title);
    }
  });

  // Associations
  BlogPost.associate = function(models) {
    // BlogPost belongs to User (author)
    BlogPost.belongsTo(models.User, {
      foreignKey: 'authorId',
      as: 'author'
    });

    // BlogPost belongs to Event
    BlogPost.belongsTo(models.Event, {
      foreignKey: 'eventId',
      as: 'event'
    });

    // BlogPost belongs to BlogCategory
    BlogPost.belongsTo(models.BlogCategory, {
      foreignKey: 'categoryId',
      as: 'category'
    });

    // BlogPost has many BlogTags through BlogPostTag
    BlogPost.belongsToMany(models.BlogTag, {
      through: 'blog_post_tags',
      foreignKey: 'blog_post_id',
      otherKey: 'blog_tag_id',
      as: 'tags'
    });
  };

  return BlogPost;
};
