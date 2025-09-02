require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  appName: 'Thanksgiving Menus',
  version: '1.0.0',
  
  // View engine settings
  viewEngine: 'ejs',
  viewDirectory: 'views',
  layoutFile: 'layout',
  
  // Static files
  staticDirectory: 'public',
  
  // API settings
  apiPrefix: '/api',
  apiVersion: 'v1',
  
  // Security settings
  trustProxy: process.env.NODE_ENV === 'production',
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // Rate limiting (if implemented)
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  }
};
