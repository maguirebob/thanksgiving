require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER || 'bobmaguire',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bobmaguire',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  test: {
    username: process.env.DB_USER || 'bobmaguire',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME_TEST || 'bobmaguire_test',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  production: {
    url: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? { 
        require: true,
        rejectUnauthorized: false 
      } : false
    },
    pool: {
      max: 1,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    // Force SSL mode for Vercel Postgres
    ...(process.env.NODE_ENV === 'production' && {
      ssl: true,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    })
  }
};
