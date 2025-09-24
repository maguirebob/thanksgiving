const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const multer = require('multer');

// Lazy load database - only import when needed
let db = null;
const getDb = async () => {
  if (!db) {
    try {
      db = require('./models');
      await db.sequelize.authenticate();
    } catch (error) {
      console.error('Database connection failed:', error);
      throw error;
    }
  }
  return db;
};

// Import configuration and middleware
const appConfig = require('./config/app');
const { errorHandler, notFoundHandler } = require('./src/middleware/errorHandler');
const { addUserToLocals } = require('./src/middleware/auth');

// Import routes
const menuRoutes = require('./src/routes/menuRoutes');
const apiRoutes = require('./src/routes/apiRoutes');
const authRoutes = require('./src/routes/authRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const aboutRoutes = require('./src/routes/aboutRoutes');

const app = express();
const PORT = appConfig.port;

// Trust proxy in production
if (appConfig.trustProxy) {
  app.set('trust proxy', 1);
}

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(appConfig.staticDirectory));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'thanksgiving-menu-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Multer configuration for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Make upload middleware available to routes
app.use((req, res, next) => {
  req.upload = upload;
  next();
});

// Set view engine to EJS and configure layouts
app.use(expressLayouts);
app.set('view engine', appConfig.viewEngine);
app.set('views', path.join(__dirname, appConfig.viewDirectory));
app.set('layout', appConfig.layoutFile);

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Add user to locals for all views
app.use(addUserToLocals);

// Routes
app.use('/', menuRoutes);
app.use('/about', aboutRoutes);
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use(`${appConfig.apiPrefix}/${appConfig.apiVersion}`, apiRoutes);

// Health check endpoint (no database required)
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: appConfig.version
  });
});

// Simple test endpoint for Vercel debugging
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Database connection test endpoint (for Vercel debugging)
app.get('/api/db-test', async (req, res) => {
  try {
    console.log('Testing database connection...');
    const database = await getDb();
    console.log('Database connection successful');
    
    res.json({
      status: 'OK',
      message: 'Database connection successful',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error('Database connection failed:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Database connection failed',
      error: error.message,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  }
});

// Database setup endpoint for Vercel
app.post('/setup-db', async (req, res) => {
  try {
    const setupKey = req.headers['x-setup-key'] || req.body?.setupKey;
    const expectedKey = process.env.SETUP_KEY || 'thanksgiving-setup-2024';
    
    if (setupKey !== expectedKey) {
      return res.status(401).json({
        success: false,
        error: 'Invalid setup key'
      });
    }
    
    console.log('Setting up database...');
    
    // Get database connection first
    const database = await getDb();
    
    // Import and run the setup script
    const setupScript = require('./scripts/setup-vercel-db');
    await setupScript();
    
    res.json({
      success: true,
      message: 'Database setup completed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database setup failed:', error);
    res.status(500).json({
      success: false,
      error: 'Database setup failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Database health check endpoint
app.get('/health/db', async (req, res) => {
  try {
    const database = await getDb();
    
    // Get additional database info
    const eventCount = await database.Event.count();
    const sampleEvent = await database.Event.findOne({
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
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Database connection and server start
async function startServer() {
  const maxRetries = 3;
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      // Test database connection with timeout
      console.log(`🔄 Attempting database connection (attempt ${retryCount + 1}/${maxRetries})...`);
      const database = await getDb();
      console.log('✅ Database connection established successfully');
      
      // Sync database models (create tables if they don't exist)
      if (process.env.NODE_ENV === 'production') {
        console.log('🔄 Syncing database models...');
        await database.sequelize.sync({ alter: false });
        console.log('✅ Database models synced');
      }
      
      // Start server
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Server is running on port ${PORT}`);
        console.log(`📊 Environment: ${appConfig.nodeEnv}`);
        console.log(`📁 Static files: ${appConfig.staticDirectory}`);
        console.log(`🎨 View engine: ${appConfig.viewEngine}`);
        console.log(`🌐 Access URL: http://localhost:${PORT}`);
      });
      
      // If we get here, everything is working
      break;
      
    } catch (error) {
      retryCount++;
      console.error(`❌ Database connection failed (attempt ${retryCount}/${maxRetries}):`, error.message);
      
      if (retryCount >= maxRetries) {
        console.error('❌ Max retries reached. Unable to connect to database.');
        process.exit(1);
      }
      
      // Wait before retrying (exponential backoff)
      const waitTime = Math.pow(2, retryCount) * 1000;
      console.log(`⏳ Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Only start server if this file is run directly (not imported)
if (require.main === module) {
  startServer();
}

// For Vercel, export the app without starting the server
// The database connection will be handled on-demand
module.exports = app;
