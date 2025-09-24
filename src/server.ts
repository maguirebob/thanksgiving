import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import expressLayouts from 'express-ejs-layouts';
import path from 'path';
import { config } from './lib/config';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
      scriptSrcAttr: ["'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      connectSrc: ["'self'", "https://cdn.jsdelivr.net"],
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
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parsing middleware
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

// Basic routes
app.get('/', async (_req, res) => {
  try {
    // Fetch events from database using Prisma
    const events = await prisma.event.findMany({
      orderBy: { event_date: 'desc' },
      take: 6 // Limit to 6 most recent events for homepage
    });

    // Transform data to include menu_image_url
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
    console.error('Error fetching events for homepage:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load menus.',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/health', (_req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: config.getConfig().nodeEnv
  });
});

// Version API endpoint
app.get('/api/v1/version/display', (_req, res) => {
  res.json({
    success: true,
    data: {
      version: '2.0.0',
      environment: config.getConfig().nodeEnv,
      buildDate: new Date().toISOString()
    }
  });
});

// Menu detail route
app.get('/menu/:id', async (req, res) => {
  try {
    const menuId = parseInt(req.params.id);
    
    if (isNaN(menuId)) {
      return res.status(400).render('error', {
        title: 'Invalid Menu ID',
        message: 'Please provide a valid menu ID.',
        error: 'Invalid menu ID format'
      });
    }

    // Fetch event from database using Prisma
    const event = await prisma.event.findUnique({
      where: { event_id: menuId }
    });

    if (!event) {
      return res.status(404).render('error', {
        title: 'Menu Not Found',
        message: 'The requested menu could not be found.',
        error: 'Menu not found'
      });
    }

    // Transform data for the template
    const transformedEvent = {
      ...event,
      id: event.event_id,
      title: event.event_name,
      description: event.event_description,
      date: event.event_date,
      location: event.event_location,
      menu_image_url: `/images/${event.menu_image_filename}`
    };

    res.render('detail', {
      title: `${event.event_name} - Menu Details`,
      event: transformedEvent
    });
  } catch (error) {
    console.error('Error fetching menu details:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load menu details.',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: config.isDevelopment() ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

const PORT = config.getPort();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📊 Environment: ${config.getConfig().nodeEnv}`);
  console.log(`🌐 Access URL: http://0.0.0.0:${PORT}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export default app;
