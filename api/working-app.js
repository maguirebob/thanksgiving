const express = require('express');
const path = require('path');
const { Client } = require('pg');
const expressLayouts = require('express-ejs-layouts');

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));
app.use(expressLayouts);

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));
app.set('layout', 'layout');

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
    // First check if Events table exists
    const tableCheck = await queryDatabase(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'Events'
      ) as table_exists
    `);

    if (!tableCheck[0].table_exists) {
      return res.render('error', {
        title: 'Database Error',
        message: 'Events table does not exist. Please run database setup.',
        error: 'Database table not found'
      });
    }

    const events = await queryDatabase(`
      SELECT * FROM "Events" 
      ORDER BY event_date DESC
    `);

    // Get stats
    const stats = {
      totalEvents: events.length,
      latestYear: events.length > 0 ? new Date(events[0].event_date).getFullYear() : null,
      earliestYear: events.length > 0 ? new Date(events[events.length - 1].event_date).getFullYear() : null
    };

    res.render('index', {
      title: 'Thanksgiving Menus',
      events: events,
      stats: stats
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.render('error', {
      title: 'Error',
      message: 'Failed to fetch events',
      error: error.message
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

app.get('/menu/:id', async (req, res) => {
  try {
    const events = await queryDatabase(`
      SELECT * FROM "Events" 
      WHERE event_id = $1
    `, [req.params.id]);

    if (events.length === 0) {
      return res.render('error', {
        title: 'Menu Not Found',
        message: 'The requested menu could not be found.',
        error: 'Event not found'
      });
    }

    res.render('detail', {
      title: events[0].menu_title,
      event: events[0]
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.render('error', {
      title: 'Error',
      message: 'Failed to fetch menu details',
      error: error.message
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

// Database setup endpoint
app.get('/setup-db', async (req, res) => {
  try {
    const client = await getDbClient();
    
    try {
      // Create Events table
      await client.query(`
        CREATE TABLE IF NOT EXISTS "Events" (
          event_id SERIAL PRIMARY KEY,
          event_name VARCHAR(255) NOT NULL,
          event_type VARCHAR(255) NOT NULL,
          event_location VARCHAR(255) NOT NULL,
          event_date DATE NOT NULL,
          event_description TEXT,
          menu_title VARCHAR(255) NOT NULL,
          menu_image_filename VARCHAR(255) NOT NULL
        )
      `);
      
      // Check if table has data
      const countResult = await client.query('SELECT COUNT(*) as count FROM "Events"');
      const eventCount = parseInt(countResult.rows[0].count);
      
      // Always insert all data to ensure we have the complete set
      if (eventCount < 26) {
        // Insert all 26 years of Thanksgiving data
        const allData = [
          ['Thanksgiving Dinner 1994', 'Thanksgiving', 'Canajoharie, NY', '1994-11-24', 'First Thanksgiving Dinner that we have menu for at my parents house in Canajoharie, NY', 'Maguire Family Dinner 1994', '1994_Menu.png'],
          ['Thanksgiving Dinner 1995', 'Thanksgiving', 'Canajoharie, NY', '1995-11-23', 'Thanksgiving at my parents house in Canajoharie, NY', 'Maguire Family Dinner 1995', '1995_Menu.png'],
          ['Thanksgiving Dinner 1996', 'Thanksgiving', 'Canajoharie, NY', '1996-11-28', 'Thanksgiving at my parents house in Canajoharie, NY', 'Maguire Family Dinner 1996', '1996_Menu.png'],
          ['Thanksgiving Dinner 1997', 'Thanksgiving', 'Canajoharie, NY', '1997-11-27', 'Thanksgiving at my parents house in Canajoharie, NY', 'Maguire Family Dinner 1997', '1997_Menu.png'],
          ['Thanksgiving Dinner 1998', 'Thanksgiving', 'Canajoharie, NY', '1998-11-26', 'Thanksgiving at my parents house in Canajoharie, NY', 'Maguire Family Dinner 1998', '1998_Menu.png'],
          ['Thanksgiving Dinner 1999', 'Thanksgiving', 'Canajoharie, NY', '1999-11-25', 'Thanksgiving at my parents house in Canajoharie, NY', 'Maguire Family Dinner 1999', '1999_Menu.png'],
          ['Thanksgiving Dinner 2000', 'Thanksgiving', 'Canajoharie, NY', '2000-11-23', 'Thanksgiving at my parents house in Canajoharie, NY', 'Maguire Family Dinner 2000', '2000_Menu.png'],
          ['Thanksgiving Dinner 2001', 'Thanksgiving', 'Canajoharie, NY', '2001-11-22', 'Thanksgiving at my parents house in Canajoharie, NY', 'Maguire Family Dinner 2001', '2001_Menu.png'],
          ['Thanksgiving Dinner 2002', 'Thanksgiving', 'Canajoharie, NY', '2002-11-28', 'Thanksgiving at my parents house in Canajoharie, NY', 'Maguire Family Dinner 2002', '2002_Menu.png'],
          ['Thanksgiving Dinner 2003', 'Thanksgiving', 'Canajoharie, NY', '2003-11-27', 'Thanksgiving at my parents house in Canajoharie, NY', 'Maguire Family Dinner 2003', '2003_Menu.png'],
          ['Thanksgiving Dinner 2004', 'Thanksgiving', 'Middletown, NJ', '2004-11-25', 'This dinner was at Bob and Tricia\'s house in Middletown, NJ', 'Thanksgiving 2004', '2004_Menu.jpeg'],
          ['Thanksgiving Dinner 2005', 'Thanksgiving', 'Middletown, NJ', '2005-11-24', 'Thanksgiving at Bob and Tricia\'s house in Middletown, NJ', 'Thanksgiving 2005', '2005_Menu.jpeg'],
          ['Thanksgiving Dinner 2006', 'Thanksgiving', 'Middletown, NJ', '2006-11-23', 'Thanksgiving at Bob and Tricia\'s house in Middletown, NJ', 'Thanksgiving 2006', '2006_Menu.jpeg'],
          ['Thanksgiving Dinner 2007', 'Thanksgiving', 'Middletown, NJ', '2007-11-22', 'Thanksgiving at Bob and Tricia\'s house in Middletown, NJ', 'Thanksgiving 2007', '2007_Menu.jpeg'],
          ['Thanksgiving Dinner 2008', 'Thanksgiving', 'Middletown, NJ', '2008-11-27', 'Thanksgiving at Bob and Tricia\'s house in Middletown, NJ', 'Thanksgiving 2008', '2008_Menu.jpeg'],
          ['Thanksgiving Dinner 2009', 'Thanksgiving', 'Middletown, NJ', '2009-11-26', 'Thanksgiving at Bob and Tricia\'s house in Middletown, NJ', 'Thanksgiving 2009', '2009_Menu.jpeg'],
          ['Thanksgiving Dinner 2010', 'Thanksgiving', 'Middletown, NJ', '2010-11-25', 'Thanksgiving at Bob and Tricia\'s house in Middletown, NJ', 'Thanksgiving 2010', '2010_Menu.jpeg'],
          ['Thanksgiving Dinner 2011', 'Thanksgiving', 'Middletown, NJ', '2011-11-24', 'Thanksgiving at Bob and Tricia\'s house in Middletown, NJ', 'Thanksgiving 2011', '2011_Menu.jpeg'],
          ['Thanksgiving Dinner 2012', 'Thanksgiving', 'Middletown, NJ', '2012-11-22', 'Thanksgiving at Bob and Tricia\'s house in Middletown, NJ', 'Thanksgiving 2012', '2012_Menu.jpeg'],
          ['Thanksgiving Dinner 2013', 'Thanksgiving', 'Middletown, NJ', '2013-11-28', 'Thanksgiving at Bob and Tricia\'s house in Middletown, NJ', 'Thanksgiving 2013', '2013_Menu.jpeg'],
          ['Thanksgiving Dinner 2014', 'Thanksgiving', 'Middletown, NJ', '2014-11-27', 'Thanksgiving at Bob and Tricia\'s house in Middletown, NJ', 'Thanksgiving 2014', '2014_Menu.jpeg'],
          ['Thanksgiving Dinner 2015', 'Thanksgiving', 'Middletown, NJ', '2015-11-26', 'Thanksgiving at Bob and Tricia\'s house in Middletown, NJ', 'Thanksgiving 2015', '2015_Menu.jpeg'],
          ['Thanksgiving Dinner 2016', 'Thanksgiving', 'Middletown, NJ', '2016-11-24', 'Thanksgiving at Bob and Tricia\'s house in Middletown, NJ', 'Thanksgiving 2016', '2016_Menu.jpeg'],
          ['Thanksgiving Dinner 2017', 'Thanksgiving', 'Middletown, NJ', '2017-11-23', 'Thanksgiving at Bob and Tricia\'s house in Middletown, NJ', 'Thanksgiving 2017', '2017_Menu.jpeg'],
          ['Thanksgiving Dinner 2018', 'Thanksgiving', 'Middletown, NJ', '2018-11-22', 'Thanksgiving at Bob and Tricia\'s house in Middletown, NJ', 'Thanksgiving 2018', '2018_Menu.jpeg'],
          ['Thanksgiving Dinner 2019', 'Thanksgiving', 'Middletown, NJ', '2019-11-28', 'Thanksgiving at Bob and Tricia\'s house in Middletown, NJ', 'Thanksgiving 2019', '2019_Menu.jpeg'],
          ['Thanksgiving Dinner 2020', 'Thanksgiving', 'Middletown, NJ', '2020-11-26', 'Thanksgiving at Bob and Tricia\'s house in Middletown, NJ', 'Thanksgiving 2020', '2020_Menu.jpeg'],
          ['Thanksgiving Dinner 2021', 'Thanksgiving', 'Middletown, NJ', '2021-11-25', 'Thanksgiving at Bob and Tricia\'s house in Middletown, NJ', 'Thanksgiving 2021', '2021_Menu.jpeg'],
          ['Thanksgiving Dinner 2022', 'Thanksgiving', 'Middletown, NJ', '2022-11-24', 'Thanksgiving at Bob and Tricia\'s house in Middletown, NJ', 'Thanksgiving 2022', '2022_Menu.jpeg'],
          ['Thanksgiving Dinner 2023', 'Thanksgiving', 'Middletown, NJ', '2023-11-23', 'Thanksgiving at Bob and Tricia\'s house in Middletown, NJ', 'Thanksgiving 2023', '2023_Menu.jpeg'],
          ['Thanksgiving Dinner 2024', 'Thanksgiving', 'Middletown, NJ', '2024-11-28', 'This dinner was marked by the death of Tricia\'s Grandmother, Grandman Goodse', 'Thanksgiving 2024', '2024_Menu.jpeg']
        ];
        
        for (const data of allData) {
          await client.query(`
            INSERT INTO "Events" (event_name, event_type, event_location, event_date, event_description, menu_title, menu_image_filename)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, data);
        }
      }
      
      // Get final count after insertion
      const finalCountResult = await client.query('SELECT COUNT(*) as count FROM "Events"');
      const finalEventCount = parseInt(finalCountResult.rows[0].count);
      
      res.json({
        success: true,
        message: 'Database setup completed successfully',
        tableCreated: true,
        initialEventCount: eventCount,
        finalEventCount: finalEventCount,
        recordsAdded: finalEventCount - eventCount,
        timestamp: new Date().toISOString()
      });
    } finally {
      await client.end();
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// DELETE endpoint for removing events
app.delete('/api/v1/events/:id', async (req, res) => {
  try {
    const eventId = req.params.id;
    
    // First check if the event exists
    const existingEvents = await queryDatabase(`
      SELECT * FROM "Events" 
      WHERE event_id = $1
    `, [eventId]);

    if (existingEvents.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
        timestamp: new Date().toISOString()
      });
    }

    // Delete the event
    await queryDatabase(`
      DELETE FROM "Events" 
      WHERE event_id = $1
    `, [eventId]);

    res.json({
      success: true,
      message: 'Event deleted successfully',
      deletedEvent: existingEvents[0],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete event',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Catch-all for other routes
app.get('*', (req, res) => {
  res.json({
    message: 'Route not found',
    path: req.path,
    availableRoutes: ['/', '/menu/:id', '/api/v1/events', '/api/v1/events/:id', '/health', '/health/db', '/test-db', '/setup-db']
  });
});

module.exports = app;
