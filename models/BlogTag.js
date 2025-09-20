const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const BlogTag = sequelize.define('BlogTag', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'id'
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: {
          msg: 'Tag name cannot be empty'
        },
        len: {
          args: [1, 50],
          msg: 'Tag name must be between 1 and 50 characters'
        }
      },
      field: 'name'
    },
    slug: {
      type: DataTypes.STRING(50),
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
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [0, 500],
          msg: 'Description must be less than 500 characters'
        }
      },
      field: 'description'
    },
    usageCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: {
          args: [0],
          msg: 'Usage count cannot be negative'
        }
      },
      field: 'usage_count'
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
    tableName: 'blog_tags',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['slug'],
        unique: true
      },
      {
        fields: ['usage_count']
      },
      {
        fields: ['name'],
        unique: true
      }
    ]
  });

  // Instance methods
  BlogTag.prototype.incrementUsage = function() {
    this.usageCount += 1;
    return this.save();
  };

  BlogTag.prototype.decrementUsage = function() {
    if (this.usageCount > 0) {
      this.usageCount -= 1;
      return this.save();
    }
    return Promise.resolve(this);
  };

  BlogTag.prototype.getPostCount = async function() {
    const BlogPost = sequelize.models.BlogPost;
    return await BlogPost.count({
      include: [
        {
          model: BlogPost,
          as: 'tags',
          where: {
            id: this.id
          }
        }
      ]
    });
  };

  BlogTag.prototype.getPublishedPostCount = async function() {
    const BlogPost = sequelize.models.BlogPost;
    return await BlogPost.count({
      where: {
        status: 'published'
      },
      include: [
        {
          model: BlogPost,
          as: 'tags',
          where: {
            id: this.id
          }
        }
      ]
    });
  };

  // Class methods
  BlogTag.findBySlug = function(slug, options = {}) {
    return this.findOne({
      where: {
        slug: slug,
        ...options.where
      },
      ...options
    });
  };

  BlogTag.search = function(searchTerm, options = {}) {
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

  BlogTag.getPopular = function(limit = 20, options = {}) {
    return this.findAll({
      where: {
        usageCount: {
          [sequelize.Op.gt]: 0
        },
        ...options.where
      },
      order: [['usageCount', 'DESC']],
      limit: limit,
      ...options
    });
  };

  BlogTag.getMostUsed = function(limit = 10, options = {}) {
    return this.findAll({
      where: {
        usageCount: {
          [sequelize.Op.gt]: 0
        },
        ...options.where
      },
      order: [['usageCount', 'DESC']],
      limit: limit,
      ...options
    });
  };

  BlogTag.getUnused = function(options = {}) {
    return this.findAll({
      where: {
        usageCount: 0,
        ...options.where
      },
      ...options
    });
  };

  BlogTag.getWithPostCounts = async function(options = {}) {
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
      group: ['BlogTag.id'],
      order: [['usageCount', 'DESC']]
    });
  };

  BlogTag.findByPost = async function(postId, options = {}) {
    const BlogPost = sequelize.models.BlogPost;
    
    return await this.findAll({
      ...options,
      include: [
        {
          model: BlogPost,
          as: 'posts',
          where: {
            id: postId
          },
          attributes: []
        }
      ]
    });
  };

  BlogTag.createOrFind = async function(tagData) {
    const [tag, created] = await this.findOrCreate({
      where: {
        slug: tagData.slug
      },
      defaults: tagData
    });
    
    return { tag, created };
  };

  BlogTag.bulkCreateOrFind = async function(tagsData) {
    const results = [];
    
    for (const tagData of tagsData) {
      const result = await this.createOrFind(tagData);
      results.push(result);
    }
    
    return results;
  };

  // Associations
  BlogTag.associate = function(models) {
    // BlogTag has many BlogPosts through BlogPostTag
    BlogTag.belongsToMany(models.BlogPost, {
      through: 'blog_post_tags',
      foreignKey: 'blog_tag_id',
      otherKey: 'blog_post_id',
      as: 'posts'
    });
  };

  return BlogTag;
};
