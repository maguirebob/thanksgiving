const { Sequelize } = require('sequelize');
const config = require('../config');

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

// Define associations (if any)
// Currently no associations since we simplified to one table

const db = {
  sequelize,
  Sequelize,
  Event
};

module.exports = db;
