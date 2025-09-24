const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging
  }
);

// Import models
const Event = require('./Event')(sequelize, Sequelize.DataTypes);
const User = require('./User')(sequelize, Sequelize.DataTypes);
const Session = require('./Session')(sequelize, Sequelize.DataTypes);
const Photo = require('./Photo')(sequelize, Sequelize.DataTypes);

// Define associations
User.hasMany(Session, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Session.belongsTo(User, { foreignKey: 'user_id' });

Event.hasMany(Photo, { foreignKey: 'event_id', onDelete: 'CASCADE' });
Photo.belongsTo(Event, { foreignKey: 'event_id' });

const db = {
  sequelize,
  Sequelize,
  Event,
  User,
  Session,
  Photo
};

module.exports = db;
