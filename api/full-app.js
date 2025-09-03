const express = require('express');
const path = require('path');
const { Sequelize } = require('sequelize');

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Database connection using the working approach
let sequelize;
let dbConnected = false;
let Event = null;

async function initDatabase() {
  try {
    const databaseUrl = process.env.POSTGRES_URL;
    
    console.log('Starting database initialization...');
    console.log('Database URL exists:', !!databaseUrl);
    
    if (!databaseUrl) {
      console.log('No database URL found');
      return false;
    }

    console.log('Creating Sequelize instance...');
    sequelize = new Sequelize(databaseUrl, {
      dialect: 'postgres',
      logging: console.log, // Enable logging for debugging
      dialectOptions: {
        ssl: { rejectUnauthorized: false }
      },
      pool: {
        max: 1,
        min: 0,
        acquire: 10000,
        idle: 5000
      }
    });

    console.log('Attempting to authenticate...');
    await sequelize.authenticate();
    console.log('Database connected successfully');
    
    console.log('Defining Event model...');
    // Define Event model after successful connection
    Event = sequelize.define('Event', {
      event_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      event_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      event_type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      event_location: {
        type: Sequelize.STRING,
        allowNull: false
      },
      event_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      event_description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      menu_title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      menu_image_filename: {
        type: Sequelize.STRING,
        allowNull: false
      }
    }, {
      tableName: 'Events',
      timestamps: false
    });
    
    console.log('Event model defined successfully');
    dbConnected = true;
    console.log('Database initialization completed successfully');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    console.error('Full error:', error);
    dbConnected = false;
    return false;
  }
}

// Initialize database
initDatabase();

// Routes
app.get('/', async (req, res) => {
  try {
    if (!dbConnected || !Event) {
      return res.json({
        message: 'Thanksgiving Menu App',
        status: 'Database not connected',
        timestamp: new Date().toISOString()
      });
    }

    const events = await Event.findAll({
      order: [['event_date', 'DESC']]
    });

    res.json({
      message: 'Thanksgiving Menu App',
      status: 'OK',
      eventCount: events.length,
      events: events.slice(0, 3), // Show first 3 events
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch events',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/v1/events', async (req, res) => {
  try {
    if (!dbConnected || !Event) {
      return res.status(503).json({
        success: false,
        error: 'Database not connected',
        timestamp: new Date().toISOString()
      });
    }

    const events = await Event.findAll({
      order: [['event_date', 'DESC']]
    });

    res.json({
      success: true,
      data: events,
      count: events.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch events',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/v1/events/:id', async (req, res) => {
  try {
    if (!dbConnected || !Event) {
      return res.status(503).json({
        success: false,
        error: 'Database not connected',
        timestamp: new Date().toISOString()
      });
    }

    const event = await Event.findByPk(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: event,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch event',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Health check endpoints
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
    // Try to initialize database if not connected
    if (!dbConnected) {
      console.log('Attempting to initialize database...');
      await initDatabase();
    }

    if (!sequelize) {
      return res.status(503).json({
        status: 'ERROR',
        database: 'not_initialized',
        error: 'Database not initialized',
        hasPostgresUrl: !!process.env.POSTGRES_URL,
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
      hasEventModel: !!Event,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      database: 'disconnected',
      error: error.message,
      hasPostgresUrl: !!process.env.POSTGRES_URL,
      timestamp: new Date().toISOString()
    });
  }
});

// Manual database initialization endpoint
app.get('/init-db', async (req, res) => {
  try {
    console.log('Manual database initialization requested...');
    const result = await initDatabase();
    
    res.json({
      success: result,
      message: result ? 'Database initialized successfully' : 'Database initialization failed',
      dbConnected: dbConnected,
      hasEventModel: !!Event,
      hasSequelize: !!sequelize,
      hasPostgresUrl: !!process.env.POSTGRES_URL,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Init-db endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
      hasPostgresUrl: !!process.env.POSTGRES_URL,
      timestamp: new Date().toISOString()
    });
  }
});

// Catch-all for other routes
app.get('*', (req, res) => {
  res.json({
    message: 'Route not found',
    path: req.path,
    availableRoutes: ['/', '/api/v1/events', '/api/v1/events/:id', '/health', '/health/db', '/init-db']
  });
});

module.exports = app;
