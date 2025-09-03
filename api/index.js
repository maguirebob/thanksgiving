const express = require('express');
const path = require('path');

// Try to import modules with error handling
let expressLayouts, validationResult, db, menuController, menuService, notFoundHandler, errorHandler, validateMenuUpdate;

try {
  expressLayouts = require('express-ejs-layouts');
  const { body, param, validationResult: vr } = require('express-validator');
  validationResult = vr;
  db = require('../models');
  menuController = require('../src/controllers/menuController');
  menuService = require('../src/services/menuService');
  const errorHandlers = require('../src/middleware/errorHandler');
  notFoundHandler = errorHandlers.notFoundHandler;
  errorHandler = errorHandlers.errorHandler;
  const validation = require('../src/middleware/validation');
  validateMenuUpdate = validation.validateMenuUpdate;
} catch (error) {
  console.error('Error importing modules:', error.message);
}

const app = express();
const PORT = process.env.PORT || 3000;

// App configuration
const appConfig = {
  nodeEnv: process.env.NODE_ENV || 'development',
  staticDirectory: path.join(__dirname, '../public'),
  viewEngine: 'ejs',
  version: '1.0.0'
};

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(appConfig.staticDirectory));
app.use(expressLayouts);

// View engine setup
app.set('view engine', appConfig.viewEngine);
app.set('views', path.join(__dirname, '../views'));
app.set('layout', 'layout');

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Routes
app.get('/', async (req, res, next) => {
  try {
    await menuController.getAllMenus(req, res, next);
  } catch (error) {
    next(error);
  }
});

app.get('/menu/:id', async (req, res, next) => {
  try {
    await menuController.getMenuById(req, res, next);
  } catch (error) {
    next(error);
  }
});

// API Routes
app.get('/api/v1/events', async (req, res, next) => {
  try {
    await menuController.getAllMenus(req, res, next);
  } catch (error) {
    next(error);
  }
});

app.get('/api/v1/events/:id', async (req, res, next) => {
  try {
    await menuController.getMenuById(req, res, next);
  } catch (error) {
    next(error);
  }
});

app.put('/api/v1/events/:id', 
  validateMenuUpdate, 
  handleValidationErrors, 
  async (req, res, next) => {
    try {
      await menuController.updateMenu(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

// Health check endpoints
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: appConfig.version,
    modulesLoaded: {
      expressLayouts: !!expressLayouts,
      db: !!db,
      menuController: !!menuController,
      errorHandler: !!errorHandler
    }
  });
});

app.get('/health/db', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({
        status: 'ERROR',
        database: 'not_loaded',
        error: 'Database module not loaded',
        timestamp: new Date().toISOString()
      });
    }

    await db.sequelize.authenticate();
    
    const eventCount = await db.Event.count();
    const sampleEvent = await db.Event.findOne({
      order: [['event_date', 'DESC']]
    });
    
    res.json({
      status: 'OK',
      database: 'connected',
      eventCount: eventCount,
      latestEvent: sampleEvent ? {
        name: sampleEvent.event_name,
        date: sampleEvent.event_date
      } : null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      database: 'disconnected',
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware (must be last)
if (notFoundHandler) {
  app.use(notFoundHandler);
} else {
  app.use((req, res) => {
    res.status(404).json({ error: 'Not found', path: req.path });
  });
}

if (errorHandler) {
  app.use(errorHandler);
} else {
  app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  });
}

// Initialize database connection
async function initializeDatabase() {
  try {
    console.log('🔌 Attempting database connection...');
    await db.sequelize.authenticate();
    console.log('✅ Database connection established successfully');
    
    // Sync database models (create tables if they don't exist)
    console.log('🔄 Syncing database models...');
    await db.sequelize.sync({ alter: false });
    console.log('✅ Database models synced');
    
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    return false;
  }
}

// Export the app for Vercel
module.exports = app;

// For local development
if (require.main === module) {
  initializeDatabase().then((dbConnected) => {
    if (dbConnected) {
      app.listen(PORT, () => {
        console.log(`🚀 Server is running on port ${PORT}`);
        console.log(`📊 Environment: ${appConfig.nodeEnv}`);
        console.log(`🌐 Access URL: http://localhost:${PORT}`);
      });
    } else {
      console.error('❌ Failed to initialize database. Server not started.');
      process.exit(1);
    }
  });
}
