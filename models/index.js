const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = dbConfig.url 
  ? new Sequelize(dbConfig.url, {
      dialect: dbConfig.dialect,
      logging: dbConfig.logging,
      dialectOptions: dbConfig.dialectOptions,
      pool: dbConfig.pool
    })
  : new Sequelize(
      dbConfig.database,
      dbConfig.username,
      dbConfig.password,
      {
        host: dbConfig.host,
        port: dbConfig.port,
        dialect: dbConfig.dialect,
        logging: dbConfig.logging,
        pool: dbConfig.pool
      }
    );

// Import models
const Event = require('./Event')(sequelize, Sequelize.DataTypes);
const User = require('./User')(sequelize, Sequelize.DataTypes);
const Session = require('./Session')(sequelize, Sequelize.DataTypes);
const Photo = require('./Photo')(sequelize, Sequelize.DataTypes);
const BlogPost = require('./BlogPost')(sequelize, Sequelize.DataTypes);
const BlogCategory = require('./BlogCategory')(sequelize, Sequelize.DataTypes);
const BlogTag = require('./BlogTag')(sequelize, Sequelize.DataTypes);

// Define associations
User.hasMany(Session, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Session.belongsTo(User, { foreignKey: 'user_id' });

Event.hasMany(Photo, { foreignKey: 'event_id', onDelete: 'CASCADE' });
Photo.belongsTo(Event, { foreignKey: 'event_id' });

// Blog associations
User.hasMany(BlogPost, { foreignKey: 'authorId', as: 'blogPosts' });
BlogPost.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

Event.hasMany(BlogPost, { foreignKey: 'eventId', as: 'blogPosts' });
BlogPost.belongsTo(Event, { foreignKey: 'eventId', as: 'event' });

BlogCategory.hasMany(BlogPost, { foreignKey: 'categoryId', as: 'posts' });
BlogPost.belongsTo(BlogCategory, { foreignKey: 'categoryId', as: 'category' });

BlogPost.belongsToMany(BlogTag, { 
  through: 'blog_post_tags', 
  foreignKey: 'blog_post_id', 
  otherKey: 'blog_tag_id',
  as: 'tags' 
});
BlogTag.belongsToMany(BlogPost, { 
  through: 'blog_post_tags', 
  foreignKey: 'blog_tag_id', 
  otherKey: 'blog_post_id',
  as: 'posts' 
});

const db = {
  sequelize,
  Sequelize,
  Event,
  User,
  Session,
  Photo,
  BlogPost,
  BlogCategory,
  BlogTag
};

module.exports = db;
