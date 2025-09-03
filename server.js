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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: appConfig.version
  });
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Database connection and server start
async function startServer() {
  try {
    // Test database connection
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
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error.message);
    process.exit(1);
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
