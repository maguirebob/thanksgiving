const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const { Sequelize } = require('sequelize');

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

// Simple Sequelize connection
let sequelize = null;
const getSequelize = async () => {
  if (!sequelize) {
    try {
      console.log('Creating Sequelize connection...');
      sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        logging: false,
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized: false
          }
        },
        pool: {
          max: 1,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      });
      
      await sequelize.authenticate();
      console.log('Sequelize connection successful');
    } catch (error) {
      console.error('Sequelize connection failed:', error);
      throw error;
    }
  }
  return sequelize;
};

// Add user to locals for all views (mock for now)
app.use((req, res, next) => {
  res.locals.user = null; // No auth for now
  next();
});

// Routes with Sequelize
app.get('/', async (req, res) => {
  try {
    const db = await getSequelize();
    
    // Define Event model inline to avoid complex model loading
    const Event = db.define('Event', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      event_name: {
        type: Sequelize.STRING
      },
      event_date: {
        type: Sequelize.DATEONLY
      },
      description: {
        type: Sequelize.TEXT
      },
      menu_image_url: {
        type: Sequelize.STRING
      },
      created_at: {
        type: Sequelize.DATE
      },
      updated_at: {
        type: Sequelize.DATE
      }
    }, {
      tableName: 'Events',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    });
    
    // Get events
    console.log('Fetching events...');
    const events = await Event.findAll({
      order: [['event_date', 'DESC']],
      limit: 20
    });
    console.log(`Found ${events.length} events`);
    
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
  try {
    console.log('Testing Sequelize connection...');
    const db = await getSequelize();
    console.log('Sequelize connection successful');
    
    // Define Event model inline
    const Event = db.define('Event', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      event_name: {
        type: Sequelize.STRING
      },
      event_date: {
        type: Sequelize.DATEONLY
      },
      description: {
        type: Sequelize.TEXT
      },
      menu_image_url: {
        type: Sequelize.STRING
      },
      created_at: {
        type: Sequelize.DATE
      },
      updated_at: {
        type: Sequelize.DATE
      }
    }, {
      tableName: 'Events',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    });
    
    // Get some basic stats
    const eventCount = await Event.count();
    
    res.json({
      status: 'OK',
      message: 'Sequelize connection successful',
      stats: {
        events: eventCount
      },
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error('Sequelize connection failed:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Sequelize connection failed',
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
