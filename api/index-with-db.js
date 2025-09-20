const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');

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

// Lazy load database with error handling
let db = null;
const getDb = async () => {
  if (!db) {
    try {
      console.log('Loading database...');
      db = require('../models');
      await db.sequelize.authenticate();
      console.log('Database connected successfully');
    } catch (error) {
      console.error('Database connection failed:', error);
      throw error;
    }
  }
  return db;
};

// Add user to locals for all views (mock for now)
app.use((req, res, next) => {
  res.locals.user = null; // No auth for now
  next();
});

// Routes with database
app.get('/', async (req, res) => {
  try {
    const database = await getDb();
    
    // Get events with error handling
    const events = await database.Event.findAll({
      order: [['event_date', 'DESC']],
      limit: 20
    });
    
    res.render('index', {
      title: 'Thanksgiving Menus',
      events: events
    });
  } catch (error) {
    console.error('Error loading home page:', error);
    res.render('index', {
      title: 'Thanksgiving Menus',
      events: [],
      error: 'Unable to load menu data at this time'
    });
  }
});

app.get('/blog', async (req, res) => {
  try {
    const database = await getDb();
    
    // Get blog posts with pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const { count, rows: posts } = await database.BlogPost.findAndCountAll({
      where: { status: 'published' },
      include: [
        {
          model: database.User,
          as: 'author',
          attributes: ['id', 'username', 'first_name', 'last_name']
        },
        {
          model: database.BlogCategory,
          as: 'category',
          attributes: ['id', 'name', 'color']
        },
        {
          model: database.Event,
          as: 'event',
          attributes: ['id', 'event_name', 'event_date']
        }
      ],
      order: [['published_at', 'DESC']],
      limit: limit,
      offset: offset
    });
    
    res.render('blog/index', {
      title: 'Blog - Thanksgiving Memories',
      posts: posts,
      pagination: {
        page: page,
        limit: limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
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
  try {
    console.log('Testing database connection...');
    const database = await getDb();
    console.log('Database connection successful');
    
    // Get some basic stats
    const eventCount = await database.Event.count();
    const userCount = await database.User.count();
    
    res.json({
      status: 'OK',
      message: 'Database connection successful',
      stats: {
        events: eventCount,
        users: userCount
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