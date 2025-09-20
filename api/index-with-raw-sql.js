const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const { Client } = require('pg');

const app = express();

// Trust proxy in production
app.set('trust proxy', 1);

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static('public'));

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

// Set view engine to EJS and configure layouts
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));
app.set('layout', 'layout');

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Database connection helper
const getDbClient = () => {
  return new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
};

// Add user to locals for all views (mock for now)
app.use((req, res, next) => {
  res.locals.user = null; // No auth for now
  next();
});

// Routes with raw SQL
app.get('/', async (req, res) => {
  const client = getDbClient();
  try {
    await client.connect();
    console.log('Connected to database for home page');
    
    // Get events using raw SQL
    const result = await client.query(`
      SELECT id, event_name, event_date, description, menu_image_url, created_at, updated_at
      FROM "Events"
      ORDER BY event_date DESC
      LIMIT 20
    `);
    
    console.log(`Found ${result.rows.length} events`);
    
    res.render('index', {
      title: 'Thanksgiving Menus',
      events: result.rows
    });
  } catch (error) {
    console.error('Error loading home page:', error);
    res.render('index', {
      title: 'Thanksgiving Menus',
      events: [],
      error: 'Unable to load menu data at this time'
    });
  } finally {
    await client.end();
  }
});

app.get('/blog', async (req, res) => {
  try {
    res.render('blog/index', {
      title: 'Blog - Thanksgiving Memories',
      posts: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
      },
      message: 'Blog functionality coming soon!'
    });
  } catch (error) {
    console.error('Error loading blog page:', error);
    res.render('blog/index', {
      title: 'Blog - Thanksgiving Memories',
      posts: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
      },
      error: 'Unable to load blog posts at this time'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

// Database health check endpoint
app.get('/api/db-test', async (req, res) => {
  const client = getDbClient();
  try {
    await client.connect();
    console.log('Testing database connection...');
    
    // Get some basic stats
    const eventCount = await client.query('SELECT COUNT(*) FROM "Events"');
    const userCount = await client.query('SELECT COUNT(*) FROM "Users"');
    
    res.json({
      status: 'OK',
      message: 'Database connection successful (raw SQL)',
      stats: {
        events: parseInt(eventCount.rows[0].count),
        users: parseInt(userCount.rows[0].count)
      },
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
  } finally {
    await client.end();
  }
});

// API test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling middleware
app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Page Not Found',
    message: 'The page you are looking for does not exist.',
    error: '404 Not Found'
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).render('error', {
    title: 'Error',
    message: 'Something went wrong.',
    error: err.message
  });
});

module.exports = app;
