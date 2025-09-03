// Test if pg package is available
module.exports = (req, res) => {
  try {
    // Try to require pg
    const pg = require('pg');
    
    res.json({
      message: 'pg package test',
      timestamp: new Date().toISOString(),
      pgAvailable: true,
      pgVersion: pg.version || 'unknown',
      hasPostgresUrl: !!process.env.POSTGRES_URL,
      environment: process.env.NODE_ENV,
      nodeVersion: process.version
    });
  } catch (error) {
    res.status(500).json({
      message: 'pg package test failed',
      timestamp: new Date().toISOString(),
      pgAvailable: false,
      error: error.message,
      hasPostgresUrl: !!process.env.POSTGRES_URL,
      environment: process.env.NODE_ENV,
      nodeVersion: process.version
    });
  }
};
