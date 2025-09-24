import express from 'express';
import path from 'path';

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// Simple EJS setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Test route without layouts
app.get('/', (_req, res) => {
  res.render('index', { 
    title: 'Thanksgiving Menu Collection',
    message: 'Welcome to the Thanksgiving Menu Collection!',
    events: [
      {
        id: 1,
        event_name: 'Thanksgiving 2024',
        event_type: 'Thanksgiving',
        event_location: 'Family Home',
        event_date: new Date('2024-11-28'),
        event_description: 'Annual Thanksgiving celebration',
        menu_title: 'Thanksgiving Feast 2024',
        menu_image_filename: '2024_Menu.jpeg',
        menu_image_url: '/images/2024_Menu.jpeg'
      }
    ]
  });
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: 'development',
    database: 'Connected'
  });
});

// Database test endpoint
app.get('/api/db-test', async (_req, res) => {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    await prisma.$connect();
    const eventCount = await prisma.event.count();
    const userCount = await prisma.user.count();
    const photoCount = await prisma.photo.count();

    res.json({
      status: 'SUCCESS',
      message: 'Prisma connection works',
      eventCount,
      userCount,
      photoCount,
      timestamp: new Date().toISOString()
    });
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Database test failed:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Database connection failed',
      error: (error as Error).message,
      timestamp: new Date().toISOString()
    });
  }
});

const PORT = 3001;

app.listen(PORT, () => {
  console.log(`🚀 Minimal server is running on port ${PORT}`);
  console.log(`📊 Environment: development`);
  console.log(`🌐 Access URL: http://localhost:${PORT}`);
});

export default app;
