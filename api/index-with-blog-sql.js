const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const expressLayouts = require('express-ejs-layouts');

// Create Express app
const app = express();

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parsing middleware
const cookieParser = require('cookie-parser');
app.use(cookieParser());

// EJS configuration
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));
app.set('layout', 'layout');

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'thanksgiving-menu-jwt-secret-key-change-in-production';

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

// Serve static files from public directory
app.use('/images', express.static(path.join(__dirname, '../public/images')));
app.use('/photos', express.static(path.join(__dirname, '../public/photos')));
app.use('/css', express.static(path.join(__dirname, '../public/css')));
app.use('/js', express.static(path.join(__dirname, '../public/js')));
app.use('/javascript', express.static(path.join(__dirname, '../public/javascript')));

// JWT Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access token required',
      message: 'Please provide a valid access token'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: 'Invalid token',
        message: 'Access token is invalid or expired'
      });
    }
    req.user = user;
    next();
  });
};

const requireAuth = authenticateToken;

// Middleware to redirect unauthenticated users to login
const redirectToLogin = (req, res, next) => {
  // Check for token in Authorization header or cookie
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  const cookieToken = req.cookies?.authToken;

  const authToken = token || cookieToken;

  if (!authToken) {
    // For API requests, return 401
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({
      success: false,
        error: 'Access token required',
        message: 'Please provide a valid access token'
      });
    }
    // For web requests, redirect to login
    return res.redirect('/auth/login');
  }
  
  // If token exists, verify it
  jwt.verify(authToken, JWT_SECRET, (err, user) => {
    if (err) {
      if (req.path.startsWith('/api/')) {
        return res.status(403).json({
          success: false,
          error: 'Invalid token',
          message: 'Access token is invalid or expired'
        });
      }
      return res.redirect('/auth/login');
    }
    req.user = user;
  next();
  });
};

const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  } else {
    return res.status(403).json({
      success: false,
      error: 'Admin access required',
      message: 'This resource requires administrator privileges'
    });
  }
};

// Add user to response locals (for compatibility)
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  res.locals.isAuthenticated = !!req.user;
  res.locals.isAdmin = !!(req.user && req.user.role === 'admin');
  next();
});

// Simple test endpoint (no database required)
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Debug endpoint
app.get('/api/debug', (req, res) => {
  res.json({
    success: true,
    message: 'Debug endpoint working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasPostgresUrl: !!process.env.POSTGRES_URL
  });
});

// Test database connection
app.get('/api/db-test', async (req, res) => {
  try {
    console.log('Testing database connection...');
    
    // Test direct pg connection first
    const { Client } = require('pg');
    const client = new Client({
      connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    });
    
    await client.connect();
    console.log('Direct pg connection successful');
    
    // Test querying the Events table
    const result = await client.query('SELECT COUNT(*) as count FROM "Events"');
    const eventCount = result.rows[0].count;
    
    await client.end();
    
    res.json({
      status: 'OK',
      message: 'Database connection successful (direct pg)',
      eventCount: parseInt(eventCount),
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

// Test blog database
app.get('/api/blog-test', async (req, res) => {
  try {
    const { Client } = require('pg');
    const client = new Client({
      connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    });
    
    await client.connect();
    
    // Test blog categories
    const categoriesResult = await client.query('SELECT COUNT(*) as count FROM blog_categories');
    const categoryCount = parseInt(categoriesResult.rows[0].count);
    
    // Test blog tags
    const tagsResult = await client.query('SELECT COUNT(*) as count FROM blog_tags');
    const tagCount = parseInt(tagsResult.rows[0].count);
    
    // Test blog posts
    const postsResult = await client.query('SELECT COUNT(*) as count FROM blog_posts');
    const postCount = parseInt(postsResult.rows[0].count);
    
    await client.end();
    
    res.json({
      success: true,
      message: 'Blog database is working correctly',
      counts: {
        categories: categoryCount,
        tags: tagCount,
        posts: postCount
      }
    });
    
  } catch (error) {
    console.error('Blog test error:', error);
    res.status(500).json({
      success: false,
      error: 'Blog test failed',
      message: error.message
    });
  }
});

// Blog API endpoints using direct SQL queries
// GET /api/v1/blog/posts - Get all published blog posts
app.get('/api/v1/blog/posts', async (req, res) => {
  try {
    const { Client } = require('pg');
    const client = new Client({
      connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    });
    
    await client.connect();
    
    const result = await client.query(`
      SELECT 
        bp.id,
        bp.title,
        bp.slug,
        bp.content,
        bp.excerpt,
        bp.featured_image_url,
        bp.status,
        bp.is_featured,
        bp.view_count,
        bp.published_at,
        bp.created_at,
        bp.updated_at,
        u.id as author_id,
        u.username as author_username,
        u.first_name as author_first_name,
        u.last_name as author_last_name,
        bc.id as category_id,
        bc.name as category_name,
        bc.color as category_color,
        e.id as event_id,
        e.event_name,
        e.event_date
      FROM blog_posts bp
      LEFT JOIN "Users" u ON bp.author_id = u.id
      LEFT JOIN blog_categories bc ON bp.category_id = bc.id
      LEFT JOIN "Events" e ON bp.event_id = e.id
      WHERE bp.status = 'published'
      ORDER BY bp.is_featured DESC, bp.published_at DESC
      LIMIT 10
    `);
    
    await client.end();
    
    res.json({
      success: true,
      data: {
        posts: result.rows,
        pagination: {
          page: 1,
          limit: 10,
          total: result.rows.length,
          pages: 1
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch blog posts',
      message: error.message
    });
  }
});

// GET /api/v1/blog/categories - Get all active categories
app.get('/api/v1/blog/categories', async (req, res) => {
  try {
    const { Client } = require('pg');
    const client = new Client({
      connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    });
    
    await client.connect();
    
    const result = await client.query(`
      SELECT 
        bc.id,
        bc.name,
        bc.description,
        bc.color,
        bc.slug,
        bc.is_active,
        bc.created_at,
        bc.updated_at,
        COUNT(bp.id) as post_count
      FROM blog_categories bc
      LEFT JOIN blog_posts bp ON bc.id = bp.category_id AND bp.status = 'published'
      WHERE bc.is_active = true
      GROUP BY bc.id, bc.name, bc.description, bc.color, bc.slug, bc.is_active, bc.created_at, bc.updated_at
      ORDER BY bc.name ASC
    `);
    
    await client.end();
    
    res.json({
      success: true,
      data: result.rows
    });
    
  } catch (error) {
    console.error('Error fetching blog categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch blog categories',
      message: error.message
    });
  }
});

// GET /api/v1/blog/tags - Get all tags
app.get('/api/v1/blog/tags', async (req, res) => {
  try {
    const { Client } = require('pg');
    const client = new Client({
      connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    });
    
    await client.connect();
    
    const result = await client.query(`
      SELECT 
        bt.id,
        bt.name,
        bt.slug,
        bt.description,
        bt.usage_count,
        bt.created_at,
        bt.updated_at
      FROM blog_tags bt
      ORDER BY bt.usage_count DESC, bt.name ASC
    `);
    
    await client.end();
    
    res.json({
      success: true,
      data: result.rows
    });
    
  } catch (error) {
    console.error('Error fetching blog tags:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch blog tags',
      message: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Catch-all for other routes
app.get('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found',
    path: req.path
  });
});

module.exports = app;
