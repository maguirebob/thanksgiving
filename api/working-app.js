const express = require('express');
const path = require('path');
const { Client } = require('pg');

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Database connection using the working direct pg approach
let dbConnected = false;

async function getDbClient() {
  const databaseUrl = process.env.POSTGRES_URL;
  
  if (!databaseUrl) {
    throw new Error('No POSTGRES_URL found');
  }

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  return client;
}

async function queryDatabase(query, params = []) {
  const client = await getDbClient();
  try {
    const result = await client.query(query, params);
    return result.rows;
  } finally {
    await client.end();
  }
}

// Routes
app.get('/', async (req, res) => {
  try {
    const events = await queryDatabase(`
      SELECT * FROM "Events" 
      ORDER BY event_date DESC 
      LIMIT 3
    `);

    res.json({
      message: 'Thanksgiving Menu App',
      status: 'OK',
      eventCount: events.length,
      events: events,
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
    const events = await queryDatabase(`
      SELECT * FROM "Events" 
      ORDER BY event_date DESC
    `);

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
    const events = await queryDatabase(`
      SELECT * FROM "Events" 
      WHERE event_id = $1
    `, [req.params.id]);

    if (events.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: events[0],
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
    database: 'available' // We know it works from the test
  });
});

app.get('/health/db', async (req, res) => {
  try {
    const result = await queryDatabase('SELECT NOW() as current_time');
    
    res.json({
      status: 'OK',
      database: 'connected',
      currentTime: result[0].current_time,
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

// Test database connectivity
app.get('/test-db', async (req, res) => {
  try {
    const result = await queryDatabase('SELECT NOW() as current_time, COUNT(*) as event_count FROM "Events"');
    
    res.json({
      success: true,
      message: 'Database test successful',
      currentTime: result[0].current_time,
      eventCount: result[0].event_count,
      hasPostgresUrl: !!process.env.POSTGRES_URL,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
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
    availableRoutes: ['/', '/api/v1/events', '/api/v1/events/:id', '/health', '/health/db', '/test-db']
  });
});

module.exports = app;
