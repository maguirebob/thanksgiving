const express = require('express');
const { Client } = require('pg');

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection using the working direct pg approach
let dbConnected = false;
let client = null;

async function testDatabase() {
  try {
    const databaseUrl = process.env.POSTGRES_URL;
    
    if (!databaseUrl) {
      console.log('No POSTGRES_URL found');
      return false;
    }

    console.log('Testing direct pg connection...');
    client = new Client({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();
    console.log('Direct pg connection successful');
    
    // Test a simple query
    const result = await client.query('SELECT NOW() as current_time');
    console.log('Query result:', result.rows[0]);
    
    await client.end();
    dbConnected = true;
    return true;
  } catch (error) {
    console.error('Database test failed:', error.message);
    console.error('Full error:', error);
    dbConnected = false;
    return false;
  }
}

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Simple Database Test',
    status: 'OK',
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

app.get('/test-db', async (req, res) => {
  try {
    const result = await testDatabase();
    res.json({
      success: result,
      message: result ? 'Database test successful' : 'Database test failed',
      dbConnected: dbConnected,
      hasPostgresUrl: !!process.env.POSTGRES_URL,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
      hasPostgresUrl: !!process.env.POSTGRES_URL,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: dbConnected ? 'connected' : 'disconnected',
    hasPostgresUrl: !!process.env.POSTGRES_URL,
    environment: process.env.NODE_ENV
  });
});

// Catch-all for other routes
app.get('*', (req, res) => {
  res.json({
    message: 'Route not found',
    path: req.path,
    availableRoutes: ['/', '/test-db', '/health']
  });
});

module.exports = app;
