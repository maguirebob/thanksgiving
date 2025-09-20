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

// Serve JavaScript modules
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
    
    // Run username migration to lowercase
    console.log('Running username migration to lowercase...');
    const migrateSQL = `
      -- Get all users with their current usernames
      SELECT id, username FROM "Users";
    `;
    
    const users = await client.query(migrateSQL);
    console.log(`Found ${users.rows.length} users to check`);
    
    // Check for usernames that need to be converted
    const usersToUpdate = users.rows.filter(user => user.username !== user.username.toLowerCase());
    
    if (usersToUpdate.length > 0) {
      console.log(`Found ${usersToUpdate.length} usernames to convert to lowercase:`);
      usersToUpdate.forEach(user => {
        console.log(`  ${user.username} -> ${user.username.toLowerCase()}`);
      });
      
      // Update usernames to lowercase
      for (const user of usersToUpdate) {
        const lowercaseUsername = user.username.toLowerCase();
        
        // Check if lowercase version already exists
        const existingUser = await client.query(
          'SELECT id FROM "Users" WHERE username = $1 AND id != $2',
          [lowercaseUsername, user.id]
        );
        
        if (existingUser.rows.length > 0) {
          console.log(`⚠️  Skipping ${user.username} -> ${lowercaseUsername} (conflict with existing user)`);
          continue;
        }
        
        // Update the username
        await client.query(
          'UPDATE "Users" SET username = $1 WHERE id = $2',
          [lowercaseUsername, user.id]
        );
        
        console.log(`✅ Updated: ${user.username} -> ${lowercaseUsername}`);
      }
    } else {
      console.log('✅ All usernames are already lowercase, no migration needed');
    }
    
    await client.end();
    
    res.json({
      success: true,
      message: 'Database setup and username migration completed successfully',
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
    
    // Check if user already exists (case-insensitive username check)
    const existingUser = await client.query(
      'SELECT id FROM "Users" WHERE LOWER(username) = LOWER($1) OR email = $2',
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
    
    // Create user (convert username to lowercase)
    const result = await client.query(
      `INSERT INTO "Users" (username, email, password_hash, role) 
       VALUES ($1, $2, $3, 'user') 
       RETURNING id, username, email, role, created_at`,
      [username.toLowerCase(), email, hashedPassword]
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
    
    // Find user (case-insensitive username lookup)
    const result = await client.query(
      'SELECT id, username, email, password_hash, role FROM "Users" WHERE LOWER(username) = LOWER($1)',
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
    
             // Set token as HTTP-only cookie
             res.cookie('authToken', token, {
               httpOnly: true,
               secure: process.env.NODE_ENV === 'production',
               sameSite: 'strict',
               maxAge: 24 * 60 * 60 * 1000 // 24 hours
             });

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

// User logout (clear cookie)
app.post('/auth/logout', (req, res) => {
  res.clearCookie('authToken');
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

// Get current user
app.get('/auth/me', requireAuth, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// Profile management routes

// Get current user profile
app.get('/api/v1/profile', requireAuth, async (req, res) => {
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
      'SELECT id, username, email, first_name, last_name, role, created_at, updated_at FROM "Users" WHERE id = $1',
      [req.user.id]
    );
    
    await client.end();
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Profile retrieval error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update user profile
app.put('/api/v1/profile', requireAuth, async (req, res) => {
  try {
    const { email, first_name, last_name, current_password } = req.body;

    // Validate required fields
    if (!current_password) {
      return res.status(400).json({
        success: false,
        error: 'Current password is required'
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
    
    // Get current user with password
    const userResult = await client.query(
      'SELECT id, username, email, first_name, last_name, role, password_hash FROM "Users" WHERE id = $1',
      [req.user.id]
    );
    
    if (userResult.rows.length === 0) {
      await client.end();
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const user = userResult.rows[0];
    
    // Verify current password
    const isPasswordValid = await bcrypt.compare(current_password, user.password_hash);
    if (!isPasswordValid) {
      await client.end();
      return res.status(401).json({
        success: false,
        error: 'Invalid current password'
      });
    }
    
    // Prepare update data
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;
    
    if (email !== undefined) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        await client.end();
        return res.status(400).json({
          success: false,
          error: 'Invalid email format'
        });
      }
      updateFields.push(`email = $${paramCount}`);
      updateValues.push(email);
      paramCount++;
    }
    
    if (first_name !== undefined) {
      updateFields.push(`first_name = $${paramCount}`);
      updateValues.push(first_name);
      paramCount++;
    }
    
    if (last_name !== undefined) {
      updateFields.push(`last_name = $${paramCount}`);
      updateValues.push(last_name);
      paramCount++;
    }
    
    if (updateFields.length === 0) {
      await client.end();
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }
    
    // Add updated_at
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    
    // Update user
    const updateQuery = `UPDATE "Users" SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING id, username, email, first_name, last_name, role, created_at, updated_at`;
    updateValues.push(req.user.id);
    
    const updateResult = await client.query(updateQuery, updateValues);
    await client.end();
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updateResult.rows[0]
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Change user password
app.put('/api/v1/profile/password', requireAuth, async (req, res) => {
  try {
    const { current_password, new_password, confirm_password } = req.body;

    // Validate required fields
    if (!current_password) {
      return res.status(400).json({
        success: false,
        error: 'Current password is required'
      });
    }

    if (!new_password) {
      return res.status(400).json({
        success: false,
        error: 'New password is required'
      });
    }

    if (!confirm_password) {
      return res.status(400).json({
        success: false,
        error: 'Password confirmation is required'
      });
    }

    // Validate password confirmation
    if (new_password !== confirm_password) {
      return res.status(400).json({
        success: false,
        error: 'Password confirmation does not match'
      });
    }

    // Validate password strength
    if (new_password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long'
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
    
    // Get current user with password
    const userResult = await client.query(
      'SELECT id, password_hash FROM "Users" WHERE id = $1',
      [req.user.id]
    );
    
    if (userResult.rows.length === 0) {
      await client.end();
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const user = userResult.rows[0];
    
    // Verify current password
    const isPasswordValid = await bcrypt.compare(current_password, user.password_hash);
    if (!isPasswordValid) {
      await client.end();
      return res.status(401).json({
        success: false,
        error: 'Invalid current password'
      });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 10);
    
    // Update password
    await client.query(
      'UPDATE "Users" SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, req.user.id]
    );
    
    await client.end();
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get all users (admin only)
app.get('/api/v1/admin/users', requireAuth, requireAdmin, async (req, res) => {
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
      'SELECT id, username, email, first_name, last_name, role, created_at, updated_at FROM "Users" ORDER BY created_at ASC'
    );
    
    await client.end();
    
    res.json({
      success: true,
      users: result.rows
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update user role (admin only) - updated version
app.put('/api/v1/admin/users/:userId/role', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    // Validate required fields
    if (!role) {
      return res.status(400).json({
        success: false,
        error: 'Role is required'
      });
    }

    // Validate role value
    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role. Must be "admin" or "user"'
      });
    }

    // Validate user ID
    const userIdNum = parseInt(userId);
    if (isNaN(userIdNum)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID'
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
    
    // Check if user exists
    const userResult = await client.query(
      'SELECT id, username, email, first_name, last_name, role FROM "Users" WHERE id = $1',
      [userIdNum]
    );
    
    if (userResult.rows.length === 0) {
      await client.end();
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const user = userResult.rows[0];
    
    // Prevent admin from changing their own role
    if (user.id === req.user.id) {
      await client.end();
      return res.status(400).json({
        success: false,
        message: 'You cannot change your own role'
      });
    }
    
    // Update user role
    const updateResult = await client.query(
      'UPDATE "Users" SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, username, email, first_name, last_name, role, created_at, updated_at',
      [role, userIdNum]
    );
    
    await client.end();
    
    res.json({
      success: true,
      message: 'User role updated successfully',
      user: updateResult.rows[0]
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Admin routes

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
app.get('/api/v1/events', requireAuth, async (req, res) => {
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
app.get('/api/v1/events/:id', requireAuth, async (req, res) => {
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


// Homepage with EJS templating (requires authentication)
app.get('/', redirectToLogin, async (req, res) => {
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
    
    // Calculate stats
    const stats = {
      totalEvents: events.length,
      latestYear: events.length > 0 ? new Date(events[0].event_date).getFullYear() : null,
      earliestYear: events.length > 0 ? new Date(events[events.length - 1].event_date).getFullYear() : null
    };
    
    res.render('index', {
      title: 'Thanksgiving Menus',
      events: events,
      stats: stats,
      user: req.user
    });
  } catch (error) {
    console.error('Error loading homepage:', error);
    res.render('error', {
      title: 'Error',
      message: 'Something went wrong while loading the page.',
      error: error.message
    });
  }
});

// Menu detail page with EJS templating (requires authentication)
app.get('/menu/:id', redirectToLogin, async (req, res) => {
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
      return res.render('error', {
        title: 'Menu Not Found',
        message: 'The requested menu could not be found.',
        error: 'Menu not found'
      });
    }
    
    const event = result.rows[0];
    res.render('detail', {
      title: event.event_name,
      event: event,
      user: req.user
    });
  } catch (error) {
    console.error('Error loading menu detail:', error);
    res.render('error', {
      title: 'Error',
      message: 'Something went wrong while loading the menu.',
      error: error.message
    });
  }
});

// Authentication pages
app.get('/auth/login', (req, res) => {
  try {
    res.render('auth/login', {
      title: 'Login',
      error: null,
      success: null,
      username: ''
    });
  } catch (error) {
    console.error('Error rendering login page:', error);
    res.status(500).send('Error loading login page');
  }
});

app.get('/auth/register', (req, res) => {
  try {
    res.render('auth/register', {
      title: 'Register',
      error: null,
      success: null,
      username: '',
      email: ''
    });
  } catch (error) {
    console.error('Error rendering register page:', error);
    res.status(500).send('Error loading register page');
  }
});

app.get('/auth/profile', redirectToLogin, (req, res) => {
  res.render('auth/profile', {
    title: 'Profile',
    user: req.user
  });
});

// Admin pages
app.get('/admin', redirectToLogin, requireAdmin, (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Admin Dashboard</title>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    </head>
    <body>
      <div class="container mt-4">
        <h1>Admin Dashboard</h1>
        <div class="alert alert-info">
          <h4>Welcome, ${req.user ? req.user.username : 'Admin'}!</h4>
          <p>You are logged in as: <strong>${req.user ? req.user.role : 'Unknown'}</strong></p>
        </div>
        <div class="row">
          <div class="col-md-3 mb-2">
            <a href="/admin/users" class="btn btn-primary w-100">Manage Users</a>
          </div>
          <div class="col-md-3 mb-2">
            <a href="/" class="btn btn-success w-100">View Site</a>
          </div>
          <div class="col-md-3 mb-2">
            <a href="/api/v1/events" class="btn btn-info w-100">API Endpoints</a>
          </div>
          <div class="col-md-3 mb-2">
            <a href="#" id="logoutBtn" class="btn btn-warning w-100">Logout</a>
          </div>
        </div>
      </div>
      <script>
        document.getElementById('logoutBtn').addEventListener('click', async function(e) {
          e.preventDefault();
          try {
            await fetch('/auth/logout', { method: 'POST' });
            window.location.href = '/auth/login';
          } catch (error) {
            window.location.href = '/auth/login';
          }
        });
      </script>
    </body>
    </html>
  `);
});

app.get('/admin/users', redirectToLogin, requireAdmin, async (req, res) => {
  try {
    // Fetch all users for admin management
    const { Client } = require('pg');
    const client = new Client({
      connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    });

    await client.connect();
    const result = await client.query('SELECT id, username, email, role, created_at FROM "Users" ORDER BY created_at DESC');
    await client.end();

    const users = result.rows;

    // Create HTML table for users
    let usersTable = '';
    if (users && users.length > 0) {
      usersTable = `
        <table class="table table-striped">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(user => `
              <tr>
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td><span class="badge ${user.role === 'admin' ? 'bg-danger' : 'bg-primary'}">${user.role}</span></td>
                <td>${new Date(user.created_at).toLocaleDateString()}</td>
                <td>
                  <button class="btn btn-sm btn-warning" onclick="changeRole(${user.id}, '${user.role}')">
                    Change Role
                  </button>
                  ${user.role !== 'admin' ? `<button class="btn btn-sm btn-danger" onclick="deleteUser(${user.id})">Delete</button>` : ''}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
} else {
      usersTable = '<p class="text-muted">No users found.</p>';
    }

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>User Management</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
      </head>
      <body>
        <div class="container mt-4">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h1>User Management</h1>
            <a href="/admin" class="btn btn-secondary">
              <i class="fas fa-arrow-left me-2"></i>
              Back to Dashboard
            </a>
          </div>
          
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">All Users (${users ? users.length : 0})</h5>
            </div>
            <div class="card-body">
              ${usersTable}
            </div>
          </div>
        </div>
        
        <script>
          // Get the auth token from localStorage or cookies
          function getAuthToken() {
            return localStorage.getItem('authToken') || getCookie('authToken');
          }
          
          // Helper function to get cookie value
          function getCookie(name) {
            const value = \`; \${document.cookie}\`;
            const parts = value.split(\`; \${name}=\`);
            if (parts.length === 2) return parts.pop().split(';').shift();
            return null;
          }
          
          function changeRole(userId, currentRole) {
            const newRole = currentRole === 'admin' ? 'user' : 'admin';
            if (confirm(\`Are you sure you want to change this user's role to \${newRole}?\`)) {
              const token = getAuthToken();
              fetch(\`/admin/users/\${userId}/role\`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': \`Bearer \${token}\`
                },
                body: JSON.stringify({ role: newRole })
              })
              .then(response => response.json())
              .then(data => {
                if (data.success) {
                  location.reload();
                } else {
                  alert('Error: ' + data.message);
                }
              })
              .catch(error => {
                alert('Error: ' + error.message);
              });
            }
          }
          
          function deleteUser(userId) {
            if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
              const token = getAuthToken();
              fetch(\`/admin/users/\${userId}\`, {
                method: 'DELETE',
                headers: {
                  'Authorization': \`Bearer \${token}\`
                }
              })
              .then(response => response.json())
              .then(data => {
                if (data.success) {
                  location.reload();
} else {
                  alert('Error: ' + data.message);
                }
              })
              .catch(error => {
                alert('Error: ' + error.message);
              });
            }
          }
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Error loading admin users page:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head><title>Error</title></head>
      <body>
        <h1>User Management Error</h1>
        <p>Error: ${error.message}</p>
        <p><a href="/admin">Back to Admin Dashboard</a></p>
      </body>
      </html>
    `);
  }
});

// Admin API endpoints for user management
app.put('/admin/users/:userId/role', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!role || !['admin', 'user'].includes(role)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid role. Must be "admin" or "user"' 
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
    
    // Check if user exists
    const userResult = await client.query('SELECT id, username, role FROM "Users" WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      await client.end();
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const user = userResult.rows[0];
    
    // Prevent changing your own role
    if (user.id === req.user.id) {
      await client.end();
      return res.status(400).json({ 
        success: false, 
        message: 'You cannot change your own role' 
      });
    }

    // Update user role
    await client.query('UPDATE "Users" SET role = $1 WHERE id = $2', [role, userId]);
    await client.end();

    res.json({ 
      success: true, 
      message: `User ${user.username} role changed to ${role}` 
    });
  } catch (error) {
    console.error('Error changing user role:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error changing user role' 
    });
  }
});

app.delete('/admin/users/:userId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const { Client } = require('pg');
    const client = new Client({
      connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    });

    await client.connect();
    
    // Check if user exists
    const userResult = await client.query('SELECT id, username, role FROM "Users" WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      await client.end();
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const user = userResult.rows[0];
    
    // Prevent deleting yourself
    if (user.id === req.user.id) {
      await client.end();
      return res.status(400).json({ 
        success: false, 
        message: 'You cannot delete your own account' 
      });
    }

    // Prevent deleting admin users
    if (user.role === 'admin') {
      await client.end();
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete admin users' 
      });
    }

    // Delete user
    await client.query('DELETE FROM "Users" WHERE id = $1', [userId]);
    await client.end();

    res.json({ 
      success: true, 
      message: `User ${user.username} deleted successfully` 
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting user' 
    });
  }
});

// Debug endpoint to test menu detail data
app.get('/api/debug/menu/:id', async (req, res) => {
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
    
    res.json({
      success: true,
      event: result.rows[0] || null,
      rowCount: result.rows.length
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test Photos table
app.get('/api/test-photos-table', async (req, res) => {
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
    
    // Check if Photos table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'Photos'
      );
    `);
    
    // Try to query Photos table
    let photosResult;
    try {
      photosResult = await client.query('SELECT COUNT(*) as count FROM "Photos"');
    } catch (err) {
      photosResult = { error: err.message };
    }
    
    await client.end();
    
    res.json({
      success: true,
      tableExists: tableCheck.rows[0].exists,
      photosQuery: photosResult
    });
  } catch (error) {
    console.error('Photos table test error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Check Photos table structure
app.get('/api/check-photos-structure', async (req, res) => {
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
    
    // Get column information
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'Photos' 
      ORDER BY ordinal_position;
    `);
    
    await client.end();
    
    res.json({
      success: true,
      columns: columns.rows
    });
  } catch (error) {
    console.error('Photos structure check error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Debug endpoint to check specific photo data
app.get('/api/debug-photo/:photoId', async (req, res) => {
  try {
    const { photoId } = req.params;
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
      'SELECT id, filename, original_name, file_size, mime_type, description, caption, created_at, LENGTH(file_path) as file_path_length, LEFT(file_path, 100) as file_path_preview FROM "Photos" WHERE id = $1',
      [photoId]
    );
    await client.end();

    if (result.rows.length === 0) {
      return res.json({
        success: false,
        message: 'Photo not found'
      });
    }

    const photo = result.rows[0];
    res.json({
      success: true,
      photo: {
        id: photo.id,
        filename: photo.filename,
        original_name: photo.original_name,
        file_size: photo.file_size,
        mime_type: photo.mime_type,
        description: photo.description,
        caption: photo.caption,
        created_at: photo.created_at,
        file_path_length: photo.file_path_length,
        file_path_preview: photo.file_path_preview
      }
    });
  } catch (error) {
    console.error('Debug photo error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create Photos table endpoint for Vercel test environment
app.post('/api/create-photos-table', async (req, res) => {
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
    
    // Check if Photos table already exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'Photos'
      );
    `);

    if (tableExists.rows[0].exists) {
      // Get current table structure for verification
      const columns = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'Photos' 
        ORDER BY ordinal_position;
      `);
      
      // Check foreign key constraints
      const fkCheck = await client.query(`
        SELECT 
          tc.constraint_name, 
          kcu.column_name, 
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name 
        FROM 
          information_schema.table_constraints AS tc 
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND tc.table_name='Photos';
      `);
      
      await client.end();
      return res.json({
        success: true,
        message: 'Photos table already exists',
        action: 'skipped',
        structure: columns.rows,
        foreignKey: fkCheck.rows[0] || null
      });
    }

    // Create Photos table with correct schema
    console.log('Creating Photos table...');
    await client.query(`
      CREATE TABLE "Photos" (
        id SERIAL PRIMARY KEY,
        event_id INTEGER NOT NULL REFERENCES "Events"(id) ON DELETE CASCADE,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER,
        mime_type VARCHAR(100),
        description TEXT,
        caption TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create indexes for better performance
    console.log('Creating indexes...');
    await client.query(`CREATE INDEX idx_photos_event_id ON "Photos"(event_id);`);
    await client.query(`CREATE INDEX idx_photos_created_at ON "Photos"(created_at);`);
    
    // Verify table structure
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'Photos' 
      ORDER BY ordinal_position;
    `);

    // Verify foreign key constraint
    const fkCheck = await client.query(`
      SELECT 
        tc.constraint_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name='Photos';
    `);

    // Test insert to verify everything works
    console.log('Testing table with sample data...');
    const testResult = await client.query(`
      INSERT INTO "Photos" (event_id, filename, original_name, file_path, description, caption)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, filename, created_at
    `, [
      1, // Assuming event with id 1 exists
      'test-photo.jpg',
      'test-photo.jpg', 
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'Test photo description',
      'Test photo caption'
    ]);

    // Clean up test data
    await client.query('DELETE FROM "Photos" WHERE id = $1', [testResult.rows[0].id]);
    
    await client.end();

    res.json({
      success: true,
      message: 'Photos table created successfully in Vercel test environment',
      action: 'created',
      structure: columns.rows,
      foreignKey: fkCheck.rows[0] || null,
      testInsert: 'successful'
    });
  } catch (error) {
    console.error('Error creating Photos table:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating Photos table: ' + error.message,
      error: error.message,
      stack: error.stack
    });
  }
});

// Test photo upload with detailed error logging
app.post('/api/test-photo-upload', async (req, res) => {
  try {
    const { eventId, filename, file_data, description, caption } = req.body;
    
    console.log('Test photo upload data:', {
      eventId,
      filename,
      hasFileData: !!file_data,
      fileDataLength: file_data ? file_data.length : 0,
      description,
      caption
    });

    const { Client } = require('pg');
    const client = new Client({
      connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    });

    await client.connect();
    
    // Verify event exists
    const eventResult = await client.query('SELECT id FROM "Events" WHERE id = $1', [eventId]);
    console.log('Event check result:', eventResult.rows);
    
    if (eventResult.rows.length === 0) {
      await client.end();
      return res.json({
        success: false,
        message: 'Event not found',
        eventId: eventId
      });
    }

    // Try to insert photo
    const result = await client.query(
      `INSERT INTO "Photos" (event_id, filename, original_name, file_path, description, caption, mime_type, file_size)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, filename, original_name, description, caption, created_at`,
      [eventId, filename, filename, file_data, description || '', caption || '', 'image/jpeg', file_data ? file_data.length : 0]
    );
    
    console.log('Photo insert result:', result.rows);
    
    await client.end();

    res.json({
      success: true,
      message: 'Test photo uploaded successfully',
      photo: result.rows[0]
    });
  } catch (error) {
    console.error('Test photo upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Test photo upload error: ' + error.message,
      error: error.message,
      stack: error.stack
    });
  }
});

// Test detail template rendering
app.get('/api/test-detail', async (req, res) => {
  try {
    const testEvent = {
      id: 28,
      event_name: "Test Thanksgiving 2024",
      event_date: "2024-11-28",
      description: "Test description",
      menu_image_url: "/images/2024_Menu.jpeg",
      event_location: "Test Location",
      event_type: "Thanksgiving"
    };
    
    res.render('detail', {
      title: testEvent.event_name,
      event: testEvent,
      user: { id: 3, username: 'bob', role: 'admin' }
    });
  } catch (error) {
    console.error('Template rendering error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

// Create Photos table endpoint
app.post('/api/create-photos-table', async (req, res) => {
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
    
    // Create Photos table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Photos" (
        photo_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        event_id INT NOT NULL,
        filename VARCHAR(255) NOT NULL,
        original_filename VARCHAR(255),
        description TEXT,
        caption TEXT,
        taken_date TIMESTAMP WITH TIME ZONE NOT NULL,
        file_size INT,
        mime_type VARCHAR(100),
        file_data TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES "Events"(id) ON DELETE CASCADE
      )
    `);
    
    await client.end();

    res.json({
      success: true,
      message: 'Photos table created successfully'
    });
  } catch (error) {
    console.error('Error creating Photos table:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating Photos table: ' + error.message
    });
  }
});

// Drop and recreate Photos table with correct schema
app.post('/api/recreate-photos-table', async (req, res) => {
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
    
    console.log('Dropping existing Photos table...');
    await client.query('DROP TABLE IF EXISTS "Photos" CASCADE;');
    
    console.log('Creating Photos table with correct schema...');
    await client.query(`
      CREATE TABLE "Photos" (
        id SERIAL PRIMARY KEY,
        event_id INTEGER NOT NULL REFERENCES "Events"(id) ON DELETE CASCADE,
        filename VARCHAR(500) NOT NULL,
        original_name VARCHAR(500) NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER,
        mime_type VARCHAR(100),
        description TEXT,
        caption TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create indexes
    await client.query(`CREATE INDEX idx_photos_event_id ON "Photos"(event_id);`);
    await client.query(`CREATE INDEX idx_photos_created_at ON "Photos"(created_at);`);
    
    await client.end();

    res.json({
      success: true,
      message: 'Photos table recreated with correct schema'
    });
  } catch (error) {
    console.error('Error recreating Photos table:', error);
    res.status(500).json({
      success: false,
      message: 'Error recreating Photos table: ' + error.message
    });
  }
});

// Create Photos table if it doesn't exist
app.post('/api/setup-photos-table', async (req, res) => {
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
    
    // Check if Photos table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'Photos'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('Creating Photos table...');
      
      // Create Photos table
      await client.query(`
        CREATE TABLE "Photos" (
          id SERIAL PRIMARY KEY,
          event_id INTEGER NOT NULL REFERENCES "Events"(id) ON DELETE CASCADE,
          filename VARCHAR(500) NOT NULL,
          original_name VARCHAR(500) NOT NULL,
          file_path TEXT NOT NULL,
          file_size INTEGER,
          mime_type VARCHAR(100),
          description TEXT,
          caption TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);

      // Create indexes
      await client.query(`CREATE INDEX idx_photos_event_id ON "Photos"(event_id);`);
      await client.query(`CREATE INDEX idx_photos_created_at ON "Photos"(created_at);`);
      
      console.log('Photos table created successfully');
    } else {
      console.log('Photos table already exists, checking column sizes...');
      
      // Check if we need to update column sizes
      const columns = await client.query(`
        SELECT column_name, character_maximum_length 
        FROM information_schema.columns 
        WHERE table_name = 'Photos' 
        AND column_name IN ('filename', 'original_name')
      `);
      
      for (const col of columns.rows) {
        if (col.character_maximum_length < 500) {
          console.log(`Updating ${col.column_name} column size...`);
          await client.query(`ALTER TABLE "Photos" ALTER COLUMN ${col.column_name} TYPE VARCHAR(500);`);
        }
      }
    }

    await client.end();

    res.json({
      success: true,
      message: 'Photos table setup completed'
    });
  } catch (error) {
    console.error('Error setting up Photos table:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting up Photos table: ' + error.message
    });
  }
});

// Photo management API endpoints
app.get('/api/v1/events/:eventId/photos', requireAuth, async (req, res) => {
  try {
    const { eventId } = req.params;
    
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
      'SELECT id, filename, original_name, description, caption, file_path, file_size, mime_type, created_at FROM "Photos" WHERE event_id = $1 ORDER BY created_at DESC',
      [eventId]
    );
    await client.end();

    res.json({
      success: true,
      photos: result.rows
    });
  } catch (error) {
    console.error('Error fetching photos:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching photos'
    });
  }
});

app.post('/api/v1/events/:eventId/photos', requireAuth, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { filename, file_data, description, caption } = req.body;

    console.log('Photo upload request:', {
      eventId,
      filename,
      hasFileData: !!file_data,
      fileDataLength: file_data ? file_data.length : 0,
      description,
      caption
    });

    if (!filename || !file_data) {
      return res.status(400).json({
        success: false,
        message: 'Filename and file data are required'
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
    
    // Verify event exists
    const eventResult = await client.query('SELECT id FROM "Events" WHERE id = $1', [eventId]);
    if (eventResult.rows.length === 0) {
      await client.end();
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Determine MIME type from filename extension
    const getMimeType = (filename) => {
      const ext = filename.toLowerCase().split('.').pop();
      const mimeTypes = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp'
      };
      return mimeTypes[ext] || 'image/jpeg';
    };

    // Calculate file size from base64 data
    const fileSize = Math.round((file_data.length * 3) / 4);

    // Insert photo
    const result = await client.query(
      `INSERT INTO "Photos" (event_id, filename, original_name, file_path, description, caption, mime_type, file_size)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, filename, original_name, description, caption, created_at`,
      [
        eventId, 
        filename, 
        filename, 
        file_data, 
        description || '', 
        caption || '', 
        getMimeType(filename), 
        fileSize
      ]
    );
    
    await client.end();

    res.json({
      success: true,
      photo: result.rows[0]
    });
  } catch (error) {
    console.error('Error uploading photo:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      eventId: req.params.eventId,
      body: req.body
    });
    res.status(500).json({
      success: false,
      message: 'Error uploading photo: ' + error.message,
      error: error.message
    });
  }
});

// Photo serving endpoint that accepts token as query parameter (for img tags)
app.get('/api/v1/photos/:photoId', async (req, res) => {
  try {
    const { photoId } = req.params;
    const token = req.query.token || req.headers['authorization']?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }
    
    // Verify token
    try {
      const user = jwt.verify(token, JWT_SECRET);
      req.user = user;
    } catch (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid token'
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
      'SELECT id, filename, original_name, description, caption, file_path, mime_type, file_size, created_at FROM "Photos" WHERE id = $1',
      [photoId]
    );
    await client.end();

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Photo not found'
      });
    }

    const photo = result.rows[0];
    
    // Check if file_path has data URL prefix and strip it
    let base64Data = photo.file_path;
    if (base64Data.startsWith('data:')) {
      const commaIndex = base64Data.indexOf(',');
      if (commaIndex !== -1) {
        base64Data = base64Data.substring(commaIndex + 1);
      }
    }
    
    // Set appropriate headers for image display
    res.set({
      'Content-Type': photo.mime_type || 'image/jpeg',
      'Content-Length': photo.file_size || Buffer.from(base64Data, 'base64').length,
      'Cache-Control': 'public, max-age=31536000' // Cache for 1 year
    });

    // Convert base64 data to buffer and send
    const imageBuffer = Buffer.from(base64Data, 'base64');
    res.send(imageBuffer);
  } catch (error) {
    console.error('Error fetching photo:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching photo'
    });
  }
});

app.put('/api/v1/photos/:photoId', requireAuth, async (req, res) => {
  try {
    const { photoId } = req.params;
    const { description, caption } = req.body;

    const { Client } = require('pg');
    const client = new Client({
      connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    });

    await client.connect();
    
    // Update photo metadata
    const result = await client.query(
      'UPDATE "Photos" SET description = $1, caption = $2, updated_at = NOW() WHERE id = $3 RETURNING id, filename, description, caption, updated_at',
      [description || '', caption || '', photoId]
    );
    
    await client.end();

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Photo not found'
      });
    }

    res.json({
      success: true,
      photo: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating photo:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating photo'
    });
  }
});

app.delete('/api/v1/photos/:photoId', requireAuth, async (req, res) => {
  try {
    const { photoId } = req.params;

    const { Client } = require('pg');
    const client = new Client({
      connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    });

    await client.connect();
    
    // Delete photo
    const result = await client.query('DELETE FROM "Photos" WHERE id = $1 RETURNING filename', [photoId]);
    
    await client.end();

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Photo not found'
      });
    }

    res.json({
      success: true,
      message: 'Photo deleted'
    });
  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting photo'
    });
  }
});

// Catch-all for other routes
app.get('*', (req, res) => {
  res.status(404).render('error', {
    title: 'Page Not Found',
    message: 'The page you are looking for does not exist.',
    error: '404 Not Found'
  });
});

module.exports = app;
