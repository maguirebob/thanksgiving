import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
// @ts-ignore - express-ejs-layouts doesn't have types
import expressLayouts from 'express-ejs-layouts';
import path from 'path';
import { config } from './lib/config';
import prisma from './lib/prisma';

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https://cdn.jsdelivr.net"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: config.getCorsOrigin(),
  credentials: true,
  optionsSuccessStatus: 200
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.getRateLimitConfig().windowMs,
  max: config.getRateLimitConfig().max,
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Session configuration
app.use(session({
  secret: config.getConfig().sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: config.isProduction(),
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// View engine setup
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));
app.set('layout', 'layout');

// Request logging middleware
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: config.getConfig().nodeEnv,
    database: 'Connected'
  });
});

// Database test endpoint
app.get('/api/db-test', async (_req, res) => {
  try {
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
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Basic routes - will be replaced with proper controllers
app.get('/', async (_req, res) => {
  try {
    // Fetch events from database using Prisma
    const events = await prisma.event.findMany({
      orderBy: { event_date: 'desc' },
      take: 6 // Limit to 6 most recent events for homepage
    });

app.get('/api/v1/events/:eventId/photos', async (req, res): Promise<void> => {
  try {
    const eventId = parseInt(req.params.eventId, 10);
    if (isNaN(eventId)) {
      res.status(400).json({ success: false, message: 'Invalid event ID', photos: [] });
      return;
    }
    // Fetch photos for the event
    const photos = await prisma.photo.findMany({
      where: { event_id: eventId },
      orderBy: { created_at: 'asc' }
    });
    res.json({ success: true, photos });
    return;
  } catch (error) {
    console.error('Error fetching photos for event:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch photos', photos: [] });
    return;
  }
});
    // Transform events to include menu_image_url
    const transformedEvents = events.map(event => ({
      ...event,
      id: event.event_id,
      title: event.event_name,
      description: event.event_description,
      date: event.event_date,
      location: event.event_location,
      menu_image_url: `/images/${event.menu_image_filename}`
    }));

    res.render('index', {
      title: 'Thanksgiving Menu Collection',
      message: 'Welcome to the Thanksgiving Menu Collection!',
      events: transformedEvents
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.render('index', {
      title: 'Thanksgiving Menu Collection',
      message: 'Welcome to the Thanksgiving Menu Collection!',
      events: []
    });
  }
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  
  if (req.headers.accept?.includes('application/json')) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: config.isDevelopment() ? err.message : 'Something went wrong'
    });
  } else {
    res.status(500).render('error', {
      title: 'Error',
      message: 'Something went wrong. Please try again.',
      error: config.isDevelopment() ? err : undefined
    });
  }
});

// 404 handler
app.use((req, res) => {
  if (req.headers.accept?.includes('application/json')) {
    res.status(404).json({ error: 'Not Found' });
  } else {
    res.status(404).render('error', {
      title: 'Page Not Found',
      message: 'The page you are looking for does not exist.'
    });
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

const PORT = config.getPort();

app.listen(PORT, () => {
  console.log(`🚀 TypeScript Server is running on port ${PORT}`);
  console.log(`📊 Environment: ${config.getConfig().nodeEnv}`);
  console.log(`🌐 Access URL: http://localhost:${PORT}`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/health`);
  console.log(`🗄️  Database Test: http://localhost:${PORT}/api/db-test`);
});

export default app;
