const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const db = require('./models');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Set view engine to EJS and configure layouts
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layout');

// Routes
app.get('/', async (req, res) => {
  try {
    // Fetch all events (which contain menu information)
    const events = await db.Event.findAll({
      order: [['event_date', 'ASC']]
    });
    
    res.render('index', { 
      title: 'Thanksgiving Menus Through the Years',
      events: events 
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    
    // Check if it's a table doesn't exist error
    if (error.name === 'SequelizeDatabaseError' && error.original.code === '42P01') {
      res.status(500).render('error', { 
        message: 'Database table not found',
        error: 'The Events table does not exist. Please run the SQL script in admin/create_tables.sql to create the table and insert sample data.' 
      });
    } else {
      res.status(500).render('error', { 
        message: 'Error loading menus',
        error: error.message 
      });
    }
  }
});

// API route to get all events as JSON
app.get('/api/events', async (req, res) => {
  try {
    const events = await db.Event.findAll({
      order: [['event_date', 'ASC']]
    });
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Error fetching events' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { 
    message: 'Something went wrong!',
    error: err.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', { 
    message: 'Page not found',
    error: 'The page you are looking for does not exist.' 
  });
});

// Database connection and server start
async function startServer() {
  try {
    // Test database connection
    await db.sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    
    // Start server
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
}

startServer();
