const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');

// Create Express app
const app = express();

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

// Health check endpoint (no database required)
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test if pg package is available
app.get('/api/pg-test', (req, res) => {
  try {
    const pg = require('pg');
    res.json({
      status: 'OK',
      message: 'pg package is available',
      version: pg.version || 'unknown',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'pg package not available',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
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

// Database setup endpoint
app.post('/setup-db', async (req, res) => {
  try {
    const setupKey = req.headers['x-setup-key'] || req.body?.setupKey;
    const expectedKey = process.env.SETUP_KEY || 'thanksgiving-setup-2024';
    
    if (setupKey !== expectedKey) {
      return res.status(401).json({
        success: false,
        error: 'Invalid setup key'
      });
    }
    
    console.log('Setting up database...');
    
    // Test database connection first
    const { Client } = require('pg');
    const client = new Client({
      connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    });
    
    await client.connect();
    console.log('Database connected, running setup...');
    
    // Run setup SQL directly
    const setupSQL = `
      -- Create enum type for user roles
      DO $$ BEGIN
        CREATE TYPE enum_users_role AS ENUM ('user', 'admin');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
      
      -- Create Users table
      CREATE TABLE IF NOT EXISTS "Users" (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role enum_users_role DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Create Sessions table
      CREATE TABLE IF NOT EXISTS "Sessions" (
        session_id VARCHAR(128) PRIMARY KEY,
        user_id INTEGER REFERENCES "Users"(id) ON DELETE CASCADE,
        expires TIMESTAMP NOT NULL,
        data TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Create Events table
      CREATE TABLE IF NOT EXISTS "Events" (
        id SERIAL PRIMARY KEY,
        event_name VARCHAR(255) NOT NULL,
        event_date DATE NOT NULL,
        description TEXT,
        menu_image_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Create Photos table
      CREATE TABLE IF NOT EXISTS "Photos" (
        id SERIAL PRIMARY KEY,
        event_id INTEGER REFERENCES "Events"(id) ON DELETE CASCADE,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size INTEGER,
        mime_type VARCHAR(100),
        description TEXT,
        caption TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Insert sample data if tables are empty
      INSERT INTO "Events" (event_name, event_date, description, menu_image_url) 
      SELECT 'Thanksgiving 2024', '2024-11-28', 'Annual Thanksgiving celebration', '/images/2024_Menu.jpeg'
      WHERE NOT EXISTS (SELECT 1 FROM "Events" LIMIT 1);
      
      INSERT INTO "Events" (event_name, event_date, description, menu_image_url) 
      SELECT 'Thanksgiving 2023', '2023-11-23', 'Thanksgiving dinner with family', '/images/2023_Menu.jpeg'
      WHERE NOT EXISTS (SELECT 1 FROM "Events" WHERE event_name = 'Thanksgiving 2023');
    `;
    
    await client.query(setupSQL);
    console.log('Database tables created and sample data inserted');
    
    await client.end();
    
    res.json({
      success: true,
      message: 'Database setup completed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database setup failed:', error);
    res.status(500).json({
      success: false,
      error: 'Database setup failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Authentication routes
// User registration
app.post('/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Username, email, and password are required'
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password too short',
        message: 'Password must be at least 6 characters long'
      });
    }
    
    const { Client } = require('pg');
    const client = new Client({
      connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    });
    
    await client.connect();
    
    // Check if user already exists
    const existingUser = await client.query(
      'SELECT id FROM "Users" WHERE username = $1 OR email = $2',
      [username, email]
    );
    
    if (existingUser.rows.length > 0) {
      await client.end();
      return res.status(400).json({
        success: false,
        error: 'User already exists',
        message: 'Username or email already registered'
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const result = await client.query(
      `INSERT INTO "Users" (username, email, password_hash, role) 
       VALUES ($1, $2, $3, 'user') 
       RETURNING id, username, email, role, created_at`,
      [username, email, hashedPassword]
    );
    
    await client.end();
    
    const user = result.rows[0];
    
    res.json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      message: error.message
    });
  }
});

// User login
app.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing credentials',
        message: 'Username and password are required'
      });
    }
    
    const { Client } = require('pg');
    const client = new Client({
      connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    });
    
    await client.connect();
    
    // Find user
    const result = await client.query(
      'SELECT id, username, email, password_hash, role FROM "Users" WHERE username = $1',
      [username]
    );
    
    await client.end();
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Username or password is incorrect'
      });
    }
    
    const user = result.rows[0];
    
    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Username or password is incorrect'
      });
    }
    
    // Create JWT token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      message: 'Login successful',
      token: token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
      message: error.message
    });
  }
});

// User logout (JWT is stateless, so logout is handled client-side)
app.post('/auth/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful - please remove the token from client storage'
  });
});

// Get current user
app.get('/auth/me', requireAuth, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// Admin routes
// Get all users (admin only)
app.get('/admin/users', requireAuth, requireAdmin, async (req, res) => {
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
    
    const result = await client.query(
      'SELECT id, username, email, role, created_at FROM "Users" ORDER BY created_at DESC'
    );
    
    await client.end();
    
    res.json({
      success: true,
      users: result.rows
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
      message: error.message
    });
  }
});

// Update user role (admin only)
app.put('/admin/users/:id/role', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role',
        message: 'Role must be either "user" or "admin"'
      });
    }
    
    const { Client } = require('pg');
    const client = new Client({
      connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    });
    
    await client.connect();
    
    const result = await client.query(
      'UPDATE "Users" SET role = $1 WHERE id = $2 RETURNING id, username, email, role',
      [role, id]
    );
    
    await client.end();
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User with the specified ID does not exist'
      });
    }
    
    res.json({
      success: true,
      message: 'User role updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user role',
      message: error.message
    });
  }
});

// Delete user (admin only)
app.delete('/admin/users/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Prevent admin from deleting themselves
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete self',
        message: 'You cannot delete your own account'
      });
    }
    
    const { Client } = require('pg');
    const client = new Client({
      connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    });
    
    await client.connect();
    
    const result = await client.query(
      'DELETE FROM "Users" WHERE id = $1 RETURNING id, username, email',
      [id]
    );
    
    await client.end();
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User with the specified ID does not exist'
      });
    }
    
    res.json({
      success: true,
      message: 'User deleted successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user',
      message: error.message
    });
  }
});

// Make user admin (setup endpoint)
app.post('/make-admin/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const setupKey = req.headers['x-setup-key'] || req.body?.setupKey;
    const expectedKey = process.env.SETUP_KEY || 'thanksgiving-setup-2024';
    
    if (setupKey !== expectedKey) {
      return res.status(401).json({
        success: false,
        error: 'Invalid setup key'
      });
    }
    
    const { Client } = require('pg');
    const client = new Client({
      connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    });
    
    await client.connect();
    
    const result = await client.query(
      'UPDATE "Users" SET role = $1 WHERE username = $2 RETURNING id, username, email, role',
      ['admin', username]
    );
    
    await client.end();
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User with the specified username does not exist'
      });
    }
    
    res.json({
      success: true,
      message: 'User role updated to admin successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error making user admin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user role',
      message: error.message
    });
  }
});

// Load all menus endpoint
app.post('/load-all-menus', async (req, res) => {
  try {
    const setupKey = req.headers['x-setup-key'] || req.body?.setupKey;
    const expectedKey = process.env.SETUP_KEY || 'thanksgiving-setup-2024';
    
    if (setupKey !== expectedKey) {
      return res.status(401).json({
        success: false,
        error: 'Invalid setup key'
      });
    }
    
    console.log('Loading all Thanksgiving menus...');
    
    const { Client } = require('pg');
    const client = new Client({
      connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    });
    
    await client.connect();
    console.log('Database connected, loading menus...');
    
    // Get list of menu images (simulated since we can't read files in Vercel)
    const menuImages = [
      { year: 1994, file: '1994_Menu.png' },
      { year: 1997, file: '1997_Menu.jpeg' },
      { year: 1999, file: '1999_Menu.jpeg' },
      { year: 2000, file: '2000_Menu.jpeg' },
      { year: 2002, file: '2002_Menu.jpeg' },
      { year: 2004, file: '2004_Menu.jpeg' },
      { year: 2005, file: '2005_Menu.jpeg' },
      { year: 2006, file: '2006_Menu.jpeg' },
      { year: 2007, file: '2007_Menu.jpeg' },
      { year: 2008, file: '2008_Menu.jpeg' },
      { year: 2009, file: '2009_Menu.jpeg' },
      { year: 2010, file: '2010_Menu.jpeg' },
      { year: 2011, file: '2011_Menu.jpeg' },
      { year: 2012, file: '2012_Menu.jpeg' },
      { year: 2013, file: '2013_Menu.jpeg' },
      { year: 2014, file: '2014_Menu.jpeg' },
      { year: 2015, file: '2015_Menu.jpeg' },
      { year: 2016, file: '2016_Menu.jpeg' },
      { year: 2017, file: '2017_Menu.jpeg' },
      { year: 2018, file: '2018_Menu.jpeg' },
      { year: 2019, file: '2019_Menu.jpeg' },
      { year: 2020, file: '2020_Menu.jpeg' },
      { year: 2021, file: '2021_Menu.jpeg' },
      { year: 2022, file: '2022_Menu.jpeg' },
      { year: 2023, file: '2023_Menu.jpeg' },
      { year: 2024, file: '2024_Menu.jpeg' }
    ];
    
    // Clear existing events
    console.log('Clearing existing events...');
    await client.query('DELETE FROM "Events"');
    
    // Insert all menus
    console.log('Inserting all menus...');
    for (const menu of menuImages) {
      const eventName = `Thanksgiving ${menu.year}`;
      const eventDate = getThanksgivingDate(menu.year);
      const description = getMenuDescription(menu.year);
      const menuImageUrl = `/images/${menu.file}`;
      
      await client.query(
        `INSERT INTO "Events" (event_name, event_date, description, menu_image_url) 
         VALUES ($1, $2, $3, $4)`,
        [eventName, eventDate, description, menuImageUrl]
      );
      
      console.log(`✅ Added ${eventName}`);
    }
    
    await client.end();
    
    res.json({
      success: true,
      message: `Successfully loaded ${menuImages.length} Thanksgiving menus`,
      count: menuImages.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error loading menus:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load menus',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Helper function to get Thanksgiving date
function getThanksgivingDate(year) {
  // Thanksgiving is the 4th Thursday of November
  const november = new Date(year, 10, 1); // November 1st
  const firstThursday = november.getDay() === 4 ? 1 : (4 - november.getDay() + 7) % 7 + 1;
  const thanksgivingDate = new Date(year, 10, firstThursday + 21); // 4th Thursday
  return thanksgivingDate.toISOString().split('T')[0];
}

// Helper function to get menu description
function getMenuDescription(year) {
  const descriptions = [
    'A traditional Thanksgiving feast with family and friends',
    'Annual Thanksgiving celebration with classic dishes',
    'Thanksgiving dinner featuring Grandma\'s favorite recipes',
    'A wonderful Thanksgiving gathering with loved ones',
    'Traditional Thanksgiving meal with all the trimmings',
    'Thanksgiving celebration with family traditions',
    'Annual Thanksgiving feast celebrating gratitude',
    'Thanksgiving dinner with classic family recipes',
    'A memorable Thanksgiving celebration',
    'Traditional Thanksgiving gathering with family',
    'Thanksgiving feast with Grandma\'s recipes',
    'Annual Thanksgiving celebration',
    'Thanksgiving dinner with family and friends',
    'A special Thanksgiving gathering',
    'Traditional Thanksgiving meal',
    'Thanksgiving celebration with loved ones',
    'Annual Thanksgiving feast',
    'Thanksgiving dinner with family traditions',
    'A wonderful Thanksgiving gathering',
    'Traditional Thanksgiving celebration',
    'Thanksgiving feast with family',
    'Annual Thanksgiving meal',
    'Thanksgiving dinner celebration',
    'A memorable Thanksgiving feast',
    'Traditional Thanksgiving gathering',
    'Thanksgiving celebration with family',
    'Annual Thanksgiving dinner',
    'Thanksgiving feast with loved ones',
    'A special Thanksgiving meal',
    'Traditional Thanksgiving celebration'
  ];
  
  return descriptions[year % descriptions.length];
}

// Add API routes for events (using direct pg for now)
app.get('/api/v1/events', async (req, res) => {
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
    const result = await client.query('SELECT * FROM "Events" ORDER BY event_date DESC');
    await client.end();
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch events',
      message: error.message
    });
  }
});

// Get single event by ID
app.get('/api/v1/events/:id', async (req, res) => {
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
    const result = await client.query('SELECT * FROM "Events" WHERE id = $1', [req.params.id]);
    await client.end();
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch event',
      message: error.message
    });
  }
});

// Create new event (authenticated users only)
app.post('/api/v1/events', requireAuth, async (req, res) => {
  try {
    const { event_name, event_date, description, menu_image_url } = req.body;
    
    if (!event_name || !event_date) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Event name and date are required'
      });
    }
    
    const { Client } = require('pg');
    const client = new Client({
      connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    });
    
    await client.connect();
    
    const result = await client.query(
      `INSERT INTO "Events" (event_name, event_date, description, menu_image_url) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [event_name, event_date, description || null, menu_image_url || null]
    );
    
    await client.end();
    
    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create event',
      message: error.message
    });
  }
});

// Update event (authenticated users only)
app.put('/api/v1/events/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { event_name, event_date, description, menu_image_url } = req.body;
    
    const { Client } = require('pg');
    const client = new Client({
      connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    });
    
    await client.connect();
    
    const result = await client.query(
      `UPDATE "Events" 
       SET event_name = COALESCE($1, event_name),
           event_date = COALESCE($2, event_date),
           description = COALESCE($3, description),
           menu_image_url = COALESCE($4, menu_image_url),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 
       RETURNING *`,
      [event_name, event_date, description, menu_image_url, id]
    );
    
    await client.end();
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
        message: 'Event with the specified ID does not exist'
      });
    }
    
    res.json({
      success: true,
      message: 'Event updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update event',
      message: error.message
    });
  }
});

// Delete event (admin only)
app.delete('/api/v1/events/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const { Client } = require('pg');
    const client = new Client({
      connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    });
    
    await client.connect();
    
    const result = await client.query(
      'DELETE FROM "Events" WHERE id = $1 RETURNING id, event_name',
      [id]
    );
    
    await client.end();
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
        message: 'Event with the specified ID does not exist'
      });
    }
    
    res.json({
      success: true,
      message: 'Event deleted successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete event',
      message: error.message
    });
  }
});

// Menu detail page
app.get('/menu/:id', async (req, res) => {
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
    const result = await client.query('SELECT * FROM "Events" WHERE id = $1', [req.params.id]);
    await client.end();
    
    if (result.rows.length === 0) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Menu Not Found - Thanksgiving Menu App</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
        </head>
        <body>
            <div class="container mt-5">
                <div class="row">
                    <div class="col-md-6 mx-auto text-center">
                        <h1 class="display-1 text-muted">404</h1>
                        <h2>Menu Not Found</h2>
                        <p class="lead">The menu you're looking for doesn't exist.</p>
                        <a href="/" class="btn btn-primary">← Back to Home</a>
                    </div>
                </div>
            </div>
        </body>
        </html>
      `);
    }
    
    const menu = result.rows[0];
    
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${menu.event_name} - Thanksgiving Menus</title>
          <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
          <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Source+Sans+Pro:wght@300;400;600&display=swap" rel="stylesheet">
          <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
          <style>
              :root {
                  --primary-black: #000000;
                  --secondary-gray: #666666;
                  --light-gray: #f5f5f5;
                  --border-gray: #e5e5e5;
                  --accent-orange: #d2691e;
                  --white: #ffffff;
              }

              * {
                  box-sizing: border-box;
              }

              body {
                  font-family: 'Source Sans Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  line-height: 1.6;
                  color: var(--primary-black);
                  background-color: var(--white);
                  margin: 0;
                  padding: 0;
              }

              /* Typography */
              h1, h2, h3, h4, h5, h6 {
                  font-family: 'Playfair Display', Georgia, serif;
                  font-weight: 600;
                  line-height: 1.2;
                  margin-bottom: 1rem;
              }

              .section-title {
                  font-size: 2.5rem;
                  font-weight: 600;
                  color: var(--primary-black);
                  margin-bottom: 2rem;
                  border-bottom: 3px solid var(--accent-orange);
                  padding-bottom: 0.5rem;
              }

              /* Header */
              .site-header {
                  background-color: var(--white);
                  border-bottom: 1px solid var(--border-gray);
                  padding: 1rem 0;
                  position: sticky;
                  top: 0;
                  z-index: 1000;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }

              .site-header .container {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
              }

              .site-logo {
                  font-family: 'Playfair Display', Georgia, serif;
                  font-size: 2rem;
                  font-weight: 700;
                  color: var(--primary-black);
                  text-decoration: none;
                  display: flex;
                  align-items: center;
                  gap: 0.5rem;
              }

              .site-logo:hover {
                  color: var(--accent-orange);
                  text-decoration: none;
              }

              .site-nav {
                  display: flex;
                  gap: 2rem;
                  list-style: none;
                  margin: 0;
                  padding: 0;
              }

              .site-nav a {
                  color: var(--secondary-gray);
                  text-decoration: none;
                  font-weight: 400;
                  font-size: 1rem;
                  transition: color 0.3s ease;
              }

              .site-nav a:hover {
                  color: var(--primary-black);
              }

              .btn-view-details {
                  background-color: var(--primary-black);
                  color: var(--white);
                  border: none;
                  padding: 0.75rem 1.5rem;
                  border-radius: 4px;
                  font-weight: 600;
                  text-decoration: none;
                  display: inline-block;
                  transition: all 0.3s ease;
                  font-size: 0.9rem;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
              }

              .btn-view-details:hover {
                  background-color: var(--accent-orange);
                  color: var(--white);
                  text-decoration: none;
                  transform: translateY(-2px);
              }

              .menu-title {
                  font-family: 'Playfair Display', Georgia, serif;
                  font-size: 3rem;
                  font-weight: 600;
                  color: var(--primary-black);
                  margin-bottom: 1rem;
                  line-height: 1.3;
              }

              .menu-date {
                  color: var(--secondary-gray);
                  font-size: 1.1rem;
                  font-weight: 400;
                  margin-bottom: 2rem;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
              }

              .menu-image-container {
                  height: 600px;
                  border-radius: 8px;
                  background-color: #f8f9fa;
                  border: 1px solid #e5e5e5;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  padding: 2rem;
                  position: relative;
                  overflow: hidden;
                  margin-bottom: 2rem;
              }

              .menu-image {
                  max-width: 100%;
                  max-height: 100%;
                  object-fit: contain;
                  object-position: center;
                  border-radius: 4px;
                  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                  cursor: zoom-in;
                  transition: transform 0.3s ease;
              }

              .menu-image:hover {
                  transform: scale(1.02);
              }

              .menu-card {
                  background: var(--white);
                  border: 1px solid var(--border-gray);
                  border-radius: 8px;
                  overflow: hidden;
                  transition: all 0.3s ease;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                  margin-bottom: 2rem;
              }

              .menu-card .menu-content {
                  padding: 1.5rem;
              }

              /* Footer */
              .site-footer {
                  background-color: var(--primary-black);
                  color: var(--white);
                  padding: 3rem 0 2rem;
                  margin-top: 4rem;
              }

              .footer-content {
                  text-align: center;
              }

              .footer-logo {
                  font-family: 'Playfair Display', Georgia, serif;
                  font-size: 1.5rem;
                  font-weight: 600;
                  margin-bottom: 1rem;
              }

              .footer-text {
                  color: #cccccc;
                  font-size: 0.9rem;
              }

              /* Responsive Design */
              @media (max-width: 768px) {
                  .menu-title {
                      font-size: 2rem;
                  }

                  .menu-image-container {
                      height: 400px;
                      padding: 1rem;
                  }

                  .site-nav {
                      gap: 1rem;
                  }

                  .site-logo {
                      font-size: 1.5rem;
                  }
              }

              @media (max-width: 480px) {
                  .menu-title {
                      font-size: 1.8rem;
                  }

                  .menu-image-container {
                      height: 350px;
                      padding: 0.5rem;
                  }
              }
          </style>
      </head>
      <body>
          <header class="site-header">
              <div class="container">
                  <a href="/" class="site-logo">
                      <i class="fas fa-turkey"></i>
                      Thanksgiving Menus
                  </a>
                  <nav>
                      <ul class="site-nav">
                          <li><a href="/">Home</a></li>
                          <li><a href="/api/v1/events">API</a></li>
                      </ul>
                  </nav>
              </div>
          </header>

          <main class="container">
              <!-- Back Navigation -->
              <div class="mb-4">
                  <a href="/" class="btn-view-details" style="background-color: var(--secondary-gray);">
                      <i class="fas fa-arrow-left me-2"></i>
                      Back to All Menus
                  </a>
              </div>

              <!-- Menu Detail Layout -->
              <div class="row">
                  <!-- Main Content -->
                  <div class="col-lg-8">
                      <!-- Menu Header -->
                      <div class="mb-4">
                          <div class="menu-date">${new Date(menu.event_date).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                          })}</div>
                          <h1 class="menu-title">${menu.event_name}</h1>
                      </div>

                      <!-- Menu Image -->
                      <div class="mb-5">
                          <div class="menu-image-container">
                              <img src="${menu.menu_image_url || '/images/placeholder-menu.jpg'}" 
                                   alt="${menu.event_name} Menu"
                                   class="menu-image"
                                   onerror="this.src='/images/placeholder-menu.jpg'">
                          </div>
                      </div>

                      <!-- Description -->
                      <div class="mb-5">
                          <h2 class="section-title" style="font-size: 2rem; border-bottom: 2px solid var(--accent-orange);">About This Menu</h2>
                          <p style="font-size: 1.1rem; line-height: 1.8; color: var(--secondary-gray);">${menu.description || 'A wonderful Thanksgiving celebration with family and friends.'}</p>
                      </div>
                  </div>

                  <!-- Sidebar -->
                  <div class="col-lg-4">
                      <div class="sticky-top" style="top: 100px;">
                          <!-- Menu Info Card -->
                          <div class="menu-card">
                              <div class="menu-content">
                                  <h3 style="font-family: 'Playfair Display', Georgia, serif; font-size: 1.5rem; margin-bottom: 1.5rem; color: var(--primary-black);">Menu Details</h3>
                                  
                                  <div style="margin-bottom: 1.5rem;">
                                      <div style="color: var(--secondary-gray); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.5rem;">Year</div>
                                      <div style="font-weight: 600; color: var(--primary-black); font-size: 1.2rem;">${new Date(menu.event_date).getFullYear()}</div>
                                  </div>

                                  <div style="margin-bottom: 1.5rem;">
                                      <div style="color: var(--secondary-gray); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.5rem;">Date</div>
                                      <div style="font-weight: 600; color: var(--primary-black);">${new Date(menu.event_date).toLocaleDateString('en-US', { 
                                          year: 'numeric', 
                                          month: 'long', 
                                          day: 'numeric' 
                                      })}</div>
                                  </div>

                                  <div style="margin-bottom: 1.5rem;">
                                      <div style="color: var(--secondary-gray); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.5rem;">Created</div>
                                      <div style="font-weight: 600; color: var(--primary-black);">${new Date(menu.created_at).toLocaleDateString('en-US', { 
                                          year: 'numeric', 
                                          month: 'long', 
                                          day: 'numeric' 
                                      })}</div>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>

              <!-- Navigation Footer -->
              <div class="text-center mt-5">
                  <a href="/" class="btn-view-details" style="padding: 1rem 2rem; font-size: 1.1rem;">
                      <i class="fas fa-home me-2"></i>
                      View All Menus
                  </a>
              </div>
          </main>

          <footer class="site-footer">
              <div class="container">
                  <div class="footer-content">
                      <div class="footer-logo">Thanksgiving Menus</div>
                      <p class="footer-text">Celebrating family traditions through the years</p>
                  </div>
              </div>
          </footer>

          <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Error fetching menu:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Error - Thanksgiving Menu App</title>
          <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
      </head>
      <body>
          <div class="container mt-5">
              <div class="row">
                  <div class="col-md-6 mx-auto text-center">
                      <h1 class="text-danger">Error</h1>
                      <p class="lead">Something went wrong while loading the menu.</p>
                      <a href="/" class="btn btn-primary">← Back to Home</a>
                  </div>
              </div>
          </div>
      </body>
      </html>
    `);
  }
});

// Add homepage with proper design matching original EJS templates
app.get('/', async (req, res) => {
  try {
    // Fetch events data
    const { Client } = require('pg');
    const client = new Client({
      connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    });
    
    await client.connect();
    const result = await client.query('SELECT * FROM "Events" ORDER BY event_date DESC');
    await client.end();
    
    const events = result.rows;
    
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Thanksgiving Menus - Thanksgiving Menus</title>
          <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
          <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Source+Sans+Pro:wght@300;400;600&display=swap" rel="stylesheet">
          <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
          <style>
              :root {
                  --primary-black: #000000;
                  --secondary-gray: #666666;
                  --light-gray: #f5f5f5;
                  --border-gray: #e5e5e5;
                  --accent-orange: #d2691e;
                  --white: #ffffff;
              }

              * {
                  box-sizing: border-box;
              }

              body {
                  font-family: 'Source Sans Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  line-height: 1.6;
                  color: var(--primary-black);
                  background-color: var(--white);
                  margin: 0;
                  padding: 0;
              }

              /* Typography */
              h1, h2, h3, h4, h5, h6 {
                  font-family: 'Playfair Display', Georgia, serif;
                  font-weight: 600;
                  line-height: 1.2;
                  margin-bottom: 1rem;
              }

              .main-title {
                  font-size: 3.5rem;
                  font-weight: 700;
                  color: var(--primary-black);
                  margin-bottom: 2rem;
                  text-align: center;
              }

              .section-title {
                  font-size: 2.5rem;
                  font-weight: 600;
                  color: var(--primary-black);
                  margin-bottom: 2rem;
                  border-bottom: 3px solid var(--accent-orange);
                  padding-bottom: 0.5rem;
              }

              /* Header */
              .site-header {
                  background-color: var(--white);
                  border-bottom: 1px solid var(--border-gray);
                  padding: 1rem 0;
                  position: sticky;
                  top: 0;
                  z-index: 1000;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }

              .site-header .container {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
              }

              .site-logo {
                  font-family: 'Playfair Display', Georgia, serif;
                  font-size: 2rem;
                  font-weight: 700;
                  color: var(--primary-black);
                  text-decoration: none;
                  display: flex;
                  align-items: center;
                  gap: 0.5rem;
              }

              .site-logo:hover {
                  color: var(--accent-orange);
                  text-decoration: none;
              }

              .site-nav {
                  display: flex;
                  gap: 2rem;
                  list-style: none;
                  margin: 0;
                  padding: 0;
              }

              .site-nav a {
                  color: var(--secondary-gray);
                  text-decoration: none;
                  font-weight: 400;
                  font-size: 1rem;
                  transition: color 0.3s ease;
              }

              .site-nav a:hover {
                  color: var(--primary-black);
              }

              /* Grid Layout */
              .menu-grid {
                  display: grid;
                  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                  gap: 2rem;
                  margin: 2rem 0;
              }

              .menu-card {
                  background: var(--white);
                  border: 1px solid var(--border-gray);
                  border-radius: 8px;
                  overflow: hidden;
                  transition: all 0.3s ease;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              }

              .menu-card:hover {
                  transform: translateY(-4px);
                  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
                  border-color: var(--accent-orange);
              }

              .menu-image-container {
                  position: relative;
                  width: 100%;
                  height: 250px;
                  overflow: hidden;
                  background-color: var(--light-gray);
              }

              .menu-image {
                  width: 100%;
                  height: 100%;
                  object-fit: cover;
                  object-position: center;
                  transition: transform 0.3s ease;
              }

              .menu-card:hover .menu-image {
                  transform: scale(1.05);
              }

              .menu-content {
                  padding: 1.5rem;
              }

              .menu-title {
                  font-family: 'Playfair Display', Georgia, serif;
                  font-size: 1.5rem;
                  font-weight: 600;
                  color: var(--primary-black);
                  margin-bottom: 0.5rem;
                  line-height: 1.3;
              }

              .menu-date {
                  color: var(--secondary-gray);
                  font-size: 0.9rem;
                  font-weight: 400;
                  margin-bottom: 1rem;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
              }

              .menu-description {
                  color: var(--secondary-gray);
                  font-size: 0.95rem;
                  line-height: 1.6;
                  margin-bottom: 1.5rem;
                  display: -webkit-box;
                  -webkit-line-clamp: 3;
                  -webkit-box-orient: vertical;
                  overflow: hidden;
              }

              .btn-view-details {
                  background-color: var(--primary-black);
                  color: var(--white);
                  border: none;
                  padding: 0.75rem 1.5rem;
                  border-radius: 4px;
                  font-weight: 600;
                  text-decoration: none;
                  display: inline-block;
                  transition: all 0.3s ease;
                  font-size: 0.9rem;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
              }

              .btn-view-details:hover {
                  background-color: var(--accent-orange);
                  color: var(--white);
                  text-decoration: none;
                  transform: translateY(-2px);
              }

              /* Featured Menu */
              .featured-menu {
                  grid-column: 1 / -1;
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 2rem;
                  margin-bottom: 3rem;
                  background: var(--white);
                  border: 1px solid var(--border-gray);
                  border-radius: 8px;
                  overflow: hidden;
                  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
              }

              .featured-menu .menu-image-container {
                  height: 400px;
              }

              .featured-menu .menu-content {
                  padding: 2rem;
                  display: flex;
                  flex-direction: column;
                  justify-content: center;
              }

              .featured-menu .menu-title {
                  font-size: 2.5rem;
                  margin-bottom: 1rem;
              }

              .featured-menu .menu-description {
                  font-size: 1.1rem;
                  -webkit-line-clamp: 6;
              }

              /* Stats Section */
              .stats-section {
                  background-color: var(--light-gray);
                  padding: 3rem 0;
                  margin: 3rem 0;
                  text-align: center;
              }

              /* Footer */
              .site-footer {
                  background-color: var(--primary-black);
                  color: var(--white);
                  padding: 3rem 0 2rem;
                  margin-top: 4rem;
              }

              .footer-content {
                  text-align: center;
              }

              .footer-logo {
                  font-family: 'Playfair Display', Georgia, serif;
                  font-size: 1.5rem;
                  font-weight: 600;
                  margin-bottom: 1rem;
              }

              .footer-text {
                  color: #cccccc;
                  font-size: 0.9rem;
              }

              /* Responsive Design */
              @media (max-width: 768px) {
                  .main-title {
                      font-size: 2.5rem;
                  }

                  .menu-grid {
                      grid-template-columns: 1fr;
                      gap: 1.5rem;
                  }

                  .featured-menu {
                      grid-template-columns: 1fr;
                  }

                  .featured-menu .menu-image-container {
                      height: 250px;
                  }

                  .site-nav {
                      gap: 1rem;
                  }

                  .site-logo {
                      font-size: 1.5rem;
                  }
              }

              @media (max-width: 480px) {
                  .main-title {
                      font-size: 2rem;
                  }

                  .menu-content {
                      padding: 1rem;
                  }

                  .featured-menu .menu-content {
                      padding: 1.5rem;
                  }
              }
          </style>
      </head>
      <body>
          <header class="site-header">
              <div class="container">
                  <a href="/" class="site-logo">
                      <i class="fas fa-turkey"></i>
                      Thanksgiving Menus
                  </a>
                  <nav>
                      <ul class="site-nav">
                          <li><a href="/">Home</a></li>
                          <li><a href="/api/v1/events">API</a></li>
                      </ul>
                  </nav>
              </div>
          </header>

          <main class="container">
              <!-- Hero Section -->
              <div class="text-center mb-5">
                  <h1 class="main-title">
                      Thanksgiving Menus Through the Years
                  </h1>
                  <p class="lead text-muted">A collection of Thanksgiving menus from 1994 to today</p>
              </div>

              <!-- Overview Section -->
              <div class="stats-section">
                  <div class="container">
                      <h2 class="section-title text-center">The Story Behind the Tradition</h2>
                      <div class="row align-items-center">
                          <div class="col-lg-4 text-center mb-4 mb-lg-0">
                              <img src="/photos/Grandma80s.jpg" 
                                   alt="Grandma Maguire in her 80s" 
                                   class="img-fluid rounded shadow"
                                   style="max-width: 300px; height: auto; object-fit: cover;">
                          </div>
                          <div class="col-lg-8">
                              <div class="overview-text" style="font-size: 1.1rem; line-height: 1.8; color: var(--secondary-gray);">
                                  <p>
                                      I can't remember if I was out of either just out of college or I was still attending RIT. I remember that Grandma Maguire could no longer host Thanksgiving at her apartment in Amesbury, Mass, it was too much for her. I remember suggesting to my Father and Linda that they should have it at their house and that I would be willing to go pick her up.
                                  </p>
                                  <p>
                                      Grandma Maguire loved Thanksgiving. It was her favorite holiday because it was a day of serving others and the family gathering together. This is a picture of her when she was in her 80s, she was born in 1906 and passed away in early 2005.
                                  </p>
                                  <p>
                                      Grandma and I put together a menu from her recipes, Gourmet, and my cookbooks. The only thing I definitely remember us making was a deboned turkey from my Cajun cookbook, her Turkey soup that we made from the carcass, and the orange and cranberry relish that my Aunt Emogene was so fond of. After that it just became a tradition and grew into what you see below.
                                  </p>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>

              ${events.length > 0 ? `
              <!-- Featured Menu (Latest) -->
              <div class="featured-menu">
                  <div class="menu-image-container">
                      <img src="${events[0].menu_image_url || '/images/placeholder-menu.jpg'}" 
                           alt="${events[0].event_name}" 
                           class="menu-image"
                           onerror="this.src='/images/placeholder-menu.jpg'">
                  </div>
                  <div class="menu-content">
                      <div class="menu-date">${new Date(events[0].event_date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                      })}</div>
                      <h2 class="menu-title">${events[0].event_name}</h2>
                      <p class="menu-description">${events[0].description || 'A wonderful Thanksgiving celebration with family and friends.'}</p>
                      <a href="/menu/${events[0].id}" class="btn-view-details">
                          View Full Menu
                      </a>
                  </div>
              </div>

              <!-- All Menus Grid -->
              <h2 class="section-title">All Thanksgiving Menus</h2>
              <div class="menu-grid">
                  ${events.slice(1).map(event => `
                      <div class="menu-card">
                          <div class="menu-image-container">
                              <img src="${event.menu_image_url || '/images/placeholder-menu.jpg'}" 
                                   alt="${event.event_name}" 
                                   class="menu-image"
                                   onerror="this.src='/images/placeholder-menu.jpg'">
                          </div>
                          <div class="menu-content">
                              <div class="menu-date">${new Date(event.event_date).toLocaleDateString('en-US', { 
                                  weekday: 'long', 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                              })}</div>
                              <h3 class="menu-title">${event.event_name}</h3>
                              <p class="menu-description">${event.description || 'A wonderful Thanksgiving celebration with family and friends.'}</p>
                              <a href="/menu/${event.id}" class="btn-view-details">
                                  View Details
                              </a>
                          </div>
                      </div>
                  `).join('')}
              </div>
              ` : `
              <div class="text-center py-5">
                  <i class="fas fa-utensils" style="font-size: 4rem; color: var(--accent-orange); margin-bottom: 1rem;"></i>
                  <h2 style="color: var(--secondary-gray);">No Menus Found</h2>
                  <p style="color: var(--secondary-gray);">There are no Thanksgiving menus in the collection yet.</p>
              </div>
              `}

              <!-- Newsletter Signup Section -->
              <div class="stats-section">
                  <div class="container text-center">
                      <h2 class="section-title">Stay Updated</h2>
                      <p class="lead text-muted mb-4">Get notified when new menus are added to the collection</p>
                      <div class="row justify-content-center">
                          <div class="col-md-6">
                              <div class="input-group">
                                  <input type="email" class="form-control" placeholder="Enter your email address" aria-label="Email address">
                                  <button class="btn btn-dark" type="button">Subscribe</button>
                              </div>
                              <small class="text-muted mt-2 d-block">We'll never share your email with anyone else.</small>
                          </div>
                      </div>
                  </div>
              </div>
          </main>

          <footer class="site-footer">
              <div class="container">
                  <div class="footer-content">
                      <div class="footer-logo">Thanksgiving Menus</div>
                      <p class="footer-text">Celebrating family traditions through the years</p>
                  </div>
              </div>
          </footer>

          <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Error loading homepage:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Error - Thanksgiving Menu App</title>
          <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
      </head>
      <body>
          <div class="container mt-5">
              <div class="row">
                  <div class="col-md-6 mx-auto text-center">
                      <h1 class="text-danger">Error</h1>
                      <p class="lead">Something went wrong while loading the page.</p>
                      <a href="/" class="btn btn-primary">← Try Again</a>
                  </div>
              </div>
          </div>
      </body>
      </html>
    `);
  }
});

// Catch-all for other routes
app.get('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    availableRoutes: [
      '/', 
      '/api/test', 
      '/api/pg-test', 
      '/api/db-test', 
      '/api/v1/events', 
      '/health', 
      '/setup-db', 
      '/load-all-menus',
      '/auth/register',
      '/auth/login',
      '/auth/logout',
      '/auth/me',
      '/admin/users'
    ],
    timestamp: new Date().toISOString()
  });
});

module.exports = app;