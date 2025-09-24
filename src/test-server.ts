import express from 'express';
import path from 'path';

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// Simple EJS setup without layouts
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Test route
app.get('/', (_req, res) => {
  res.render('index', { 
    title: 'Test Server',
    message: 'Hello from TypeScript!',
    events: [
      {
        id: 1,
        event_name: 'Test Event',
        event_type: 'Test',
        event_location: 'Test Location',
        event_date: new Date('2024-01-01'),
        event_description: 'Test description',
        menu_title: 'Test Menu',
        menu_image_filename: 'test.jpg',
        menu_image_url: '/images/test.jpg'
      }
    ]
  });
});

app.get('/health', (_req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'TypeScript test server is running'
  });
});

const PORT = 3001;

app.listen(PORT, () => {
  console.log(`🚀 Test server is running on port ${PORT}`);
  console.log(`🌐 Access URL: http://localhost:${PORT}`);
});

export default app;
