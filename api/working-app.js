const express = require('express');
const path = require('path');
const { Client } = require('pg');
const expressLayouts = require('express-ejs-layouts');
const multer = require('multer');

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));
app.use(expressLayouts);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/photos'))
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'photo_' + uniqueSuffix + path.extname(file.originalname))
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

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
      
      // Create Photos table
      await client.query(`
        CREATE TABLE IF NOT EXISTS "Photos" (
          photo_id SERIAL PRIMARY KEY,
          event_id INTEGER REFERENCES "Events"(event_id) ON DELETE CASCADE,
          filename VARCHAR(255) NOT NULL,
          original_filename VARCHAR(255),
          description TEXT,
          caption TEXT,
          taken_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          file_size INTEGER,
          mime_type VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

// PUT endpoint for updating events
app.put('/api/v1/events/:id', async (req, res) => {
  try {
    const eventId = req.params.id;
    const updateData = req.body;
    
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

    // Validate required fields
    const allowedFields = [
      'event_name',
      'event_type', 
      'event_location',
      'event_date',
      'event_description',
      'menu_title',
      'menu_image_filename'
    ];

    const filteredData = {};
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    }

    // Check if there are any fields to update
    if (Object.keys(filteredData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields provided for update',
        timestamp: new Date().toISOString()
      });
    }

    // Build the UPDATE query dynamically
    const setClause = Object.keys(filteredData)
      .map((key, index) => `"${key}" = $${index + 2}`)
      .join(', ');
    
    const values = [eventId, ...Object.values(filteredData)];
    
    console.log('Update SQL:', `UPDATE "Events" SET ${setClause} WHERE event_id = $1`);
    console.log('Update values:', values);
    
    try {
      await queryDatabase(`
        UPDATE "Events" 
        SET ${setClause}
        WHERE event_id = $1
      `, values);
    } catch (sqlError) {
      console.error('SQL Update Error:', sqlError);
      return res.status(500).json({
        success: false,
        error: 'Database update failed',
        message: sqlError.message,
        sql: `UPDATE "Events" SET ${setClause} WHERE event_id = $1`,
        values: values,
        timestamp: new Date().toISOString()
      });
    }

    // Get the updated event
    const updatedEvents = await queryDatabase(`
      SELECT * FROM "Events" 
      WHERE event_id = $1
    `, [eventId]);

    res.json({
      success: true,
      data: updatedEvents[0],
      message: 'Event updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update event',
      message: error.message,
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

// Photo management API endpoints

// Get photos for a specific event
app.get('/api/v1/events/:id/photos', async (req, res) => {
  try {
    const eventId = req.params.id;
    
    const photos = await queryDatabase(`
      SELECT * FROM "Photos" 
      WHERE event_id = $1 
      ORDER BY taken_date DESC, created_at DESC
    `, [eventId]);

    res.json({
      success: true,
      data: photos,
      count: photos.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching photos:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch photos',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Add a new photo with file upload
app.post('/api/v1/events/:id/photos', upload.single('photo'), async (req, res) => {
  try {
    const eventId = req.params.id;
    const { description, caption } = req.body;
    
    // Check if event exists
    const events = await queryDatabase(`
      SELECT * FROM "Events" 
      WHERE event_id = $1
    `, [eventId]);

    if (events.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
        timestamp: new Date().toISOString()
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No photo file provided',
        timestamp: new Date().toISOString()
      });
    }

    const newPhoto = await queryDatabase(`
      INSERT INTO "Photos" (event_id, filename, original_filename, description, caption, mime_type, file_size)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [eventId, req.file.filename, req.file.originalname, description, caption, req.file.mimetype, req.file.size]);

    res.json({
      success: true,
      data: newPhoto[0],
      message: 'Photo uploaded successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error adding photo:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add photo',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Update photo details
app.put('/api/v1/photos/:photoId', async (req, res) => {
  try {
    const photoId = req.params.photoId;
    const { description, caption } = req.body;
    
    const updatedPhoto = await queryDatabase(`
      UPDATE "Photos" 
      SET description = $1, caption = $2, updated_at = CURRENT_TIMESTAMP
      WHERE photo_id = $3
      RETURNING *
    `, [description, caption, photoId]);

    if (updatedPhoto.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Photo not found',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: updatedPhoto[0],
      message: 'Photo updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating photo:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update photo',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Delete a photo
app.delete('/api/v1/photos/:photoId', async (req, res) => {
  try {
    const photoId = req.params.photoId;
    
    // Get photo details before deletion
    const existingPhotos = await queryDatabase(`
      SELECT * FROM "Photos" 
      WHERE photo_id = $1
    `, [photoId]);

    if (existingPhotos.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Photo not found',
        timestamp: new Date().toISOString()
      });
    }

    await queryDatabase(`
      DELETE FROM "Photos" 
      WHERE photo_id = $1
    `, [photoId]);

    res.json({
      success: true,
      message: 'Photo deleted successfully',
      deletedPhoto: existingPhotos[0],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete photo',
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
    availableRoutes: ['/', '/menu/:id', '/api/v1/events', '/api/v1/events/:id', '/api/v1/events/:id/photos', '/api/v1/photos/:photoId', '/health', '/health/db', '/test-db', '/setup-db']
  });
});

module.exports = app;
