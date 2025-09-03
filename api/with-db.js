const express = require('express');
const { Sequelize } = require('sequelize');

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple database connection (without complex models)
let sequelize;
let dbConnected = false;

async function initDatabase() {
  try {
    const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      console.log('No database URL found');
      return false;
    }

    sequelize = new Sequelize(databaseUrl, {
      dialect: 'postgres',
      logging: false,
      dialectOptions: {
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      },
      pool: {
        max: 1,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    });

    await sequelize.authenticate();
    console.log('Database connected successfully');
    dbConnected = true;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    dbConnected = false;
    return false;
  }
}

// Initialize database
initDatabase();

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Thanksgiving Menu App - With Database',
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    database: dbConnected ? 'connected' : 'disconnected'
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    database: dbConnected ? 'connected' : 'disconnected'
  });
});

app.get('/health/db', async (req, res) => {
  try {
    if (!sequelize) {
      return res.status(503).json({
        status: 'ERROR',
        database: 'not_initialized',
        error: 'Database not initialized',
        timestamp: new Date().toISOString()
      });
    }

    await sequelize.authenticate();
    
    // Test a simple query
    const [results] = await sequelize.query('SELECT NOW() as current_time');
    
    res.json({
      status: 'OK',
      database: 'connected',
      currentTime: results[0].current_time,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/test', (req, res) => {
  res.json({
    message: 'Test endpoint working!',
    timestamp: new Date().toISOString(),
    hasPostgresUrl: !!process.env.POSTGRES_URL,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    nodeVersion: process.version,
    database: dbConnected ? 'connected' : 'disconnected'
  });
});

// Catch-all for other routes
app.get('*', (req, res) => {
  res.json({
    message: 'Route not found',
    path: req.path,
    availableRoutes: ['/', '/health', '/health/db', '/test']
  });
});

module.exports = app;
