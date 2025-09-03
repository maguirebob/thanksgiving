const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const db = require('./models');

// Import configuration and middleware
const appConfig = require('./config/app');
const { errorHandler, notFoundHandler } = require('./src/middleware/errorHandler');

// Import routes
const menuRoutes = require('./src/routes/menuRoutes');
const apiRoutes = require('./src/routes/apiRoutes');

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

// Routes
app.use('/', menuRoutes);
app.use(appConfig.apiPrefix, apiRoutes);

// Health check endpoint (no database required)
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: appConfig.version
  });
});

// Database health check endpoint
app.get('/health/db', async (req, res) => {
  try {
    await db.sequelize.authenticate();
    
    // Get additional database info
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
      await db.sequelize.authenticate();
      console.log('✅ Database connection established successfully');
      
      // Sync database models (create tables if they don't exist)
      if (process.env.NODE_ENV === 'production') {
        console.log('🔄 Syncing database models...');
        await db.sequelize.sync({ alter: false });
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

startServer();
