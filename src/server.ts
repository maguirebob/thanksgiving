import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import expressLayouts from 'express-ejs-layouts';
import path from 'path';
import { config } from './lib/config';
import { logger } from './lib/logger';
import s3Service from './services/s3Service';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/authRoutes';
import passwordResetRoutes from './routes/passwordResetRoutes';
import adminRoutes from './routes/adminRoutes';
import photoRoutes from './routes/photoRoutes';
import blogRoutes from './routes/blogRoutes';
import eventRoutes from './routes/eventRoutes';
import carouselRoutes from './routes/carouselRoutes';
import journalRoutes from './routes/journalRoutes';
import photoTypeRoutes from './routes/photoTypeRoutes';
import scrapbookRoutes from './routes/scrapbookRoutes';
import { addUserToLocals, requireAuth, requireAdmin } from './middleware/auth';

const app = express();
let prisma: PrismaClient | null = null;

// Initialize Prisma client with extensive error handling
try {
  // Temporarily suppress Prisma logging by redirecting stdout
  const originalStdout = process.stdout.write;
  const originalStderr = process.stderr.write;
  
  if (process.env['LOG_LEVEL'] !== 'DEBUG') {
    process.stdout.write = function(chunk: any, encoding?: any, callback?: any) {
      if (typeof chunk === 'string' && (chunk.includes('prisma:') || chunk.includes('Starting a postgresql pool'))) {
        return true; // Suppress Prisma logs
      }
      return originalStdout.call(this, chunk, encoding, callback);
    };
    
    process.stderr.write = function(chunk: any, encoding?: any, callback?: any) {
      if (typeof chunk === 'string' && chunk.includes('prisma:')) {
        return true; // Suppress Prisma logs
      }
      return originalStderr.call(this, chunk, encoding, callback);
    };
  }
  
  prisma = new PrismaClient({
    log: process.env['LOG_LEVEL'] === 'DEBUG' 
      ? ['query', 'info', 'warn', 'error']
      : [] // Disable all Prisma logging unless DEBUG mode
  });
  
  // Restore original stdout/stderr after Prisma initialization
  if (process.env['LOG_LEVEL'] !== 'DEBUG') {
    process.stdout.write = originalStdout;
    process.stderr.write = originalStderr;
  }
  
  logger.success('Prisma client initialized');
} catch (error) {
  logger.error('Failed to initialize Prisma client:', error);
  logger.warn('Server will start without database connection');
  prisma = null;
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://code.jquery.com"],
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

// Rate limiting - more reasonable limits
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // limit each IP to 5000 requests per windowMs (much more reasonable)
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip rate limiting for static assets
  skip: (req) => {
    // Skip rate limiting for static assets
    if (req.path.startsWith('/css/') || 
        req.path.startsWith('/js/') || 
        req.path.startsWith('/images/') || 
        req.path.startsWith('/photos/') ||
        req.path.startsWith('/uploads/')) {
      return true;
    }
    return false;
  }
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Session configuration
const sessionConfig: any = {
  secret: config.getConfig().sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env['NODE_ENV'] === 'production' ? true : false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env['NODE_ENV'] === 'production' ? 'none' : 'lax', // Railway requires 'none' for HTTPS
    domain: process.env['NODE_ENV'] === 'production' ? '.up.railway.app' : undefined // Railway domain
  }
};

// Suppress MemoryStore warning in production by redirecting stderr
if (process.env['NODE_ENV'] === 'production') {
  const originalStderr = process.stderr.write;
  process.stderr.write = function(chunk: any, encoding?: any, callback?: any) {
    if (typeof chunk === 'string' && chunk.includes('MemoryStore')) {
      return true; // Suppress the warning
    }
    return originalStderr.call(this, chunk, encoding, callback);
  };
}

app.use(session(sessionConfig));

// Authentication middleware
app.use(addUserToLocals);


// Static files - use absolute path for Railway environment
const publicPath = process.env['NODE_ENV'] === 'development' 
  ? path.join(__dirname, '../public')
  : '/app/public';
app.use(express.static(publicPath));

// View engine setup
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));
app.set('layout', 'layout');

// Basic routes
app.get('/', requireAuth, async (_req, res) => {
  try {
    // Check if database is available
    if (!prisma) {
      return res.status(503).render('error', {
        title: 'Service Unavailable',
        message: 'Database connection is not available. Please try again later.',
        error: 'Database not connected'
      });
    }

    // Fetch events from database using Prisma
    const events = await prisma.event.findMany({
      orderBy: { event_date: 'desc' }
      // Removed take: 6 limit to show all menus
    });

    // Get summary blog for the latest event (if any)
    let summaryBlog = null;
    if (events.length > 0) {
      const latestEvent = events[0];
      if (latestEvent) {
        summaryBlog = await prisma.blogPost.findFirst({
          where: {
            event_id: latestEvent.event_id,
            tags: { has: 'Summary' },
            status: 'published'
          },
          select: {
            blog_post_id: true,
            title: true,
            content: true,
            created_at: true,
            user: {
              select: {
                first_name: true,
                last_name: true
              }
            }
          }
        });
      }
    }

    // Transform data to include S3 menu image URLs
    const transformedEvents = await Promise.all(events.map(async (event) => {
      let menuImageUrl: string;
      
      // All menu images are now in S3
      try {
        const s3Service = require('./services/s3Service').default;
        const s3Key = `menus/${event.menu_image_filename}`;
        menuImageUrl = await s3Service.getSignedUrl(s3Key, 3600); // 1 hour expiry
      } catch (error) {
        logger.warn(`Failed to generate signed URL for ${event.menu_image_filename}, falling back to API endpoint`);
        menuImageUrl = `/api/v1/menu-images/${event.event_id}`;
      }
      
      // Only log event details in debug mode
      logger.debug('Home page event:', {
        id: event.event_id,
        name: event.event_name,
        s3Url: event.menu_image_s3_url,
        finalUrl: menuImageUrl
      });
      
      return {
        ...event,
        id: event.event_id,
        title: event.event_name,
        description: event.event_description,
        date: event.event_date,
        location: event.event_location,
        menu_image_url: menuImageUrl
      };
    }));

    res.render('index', {
      title: 'Thanksgiving Menu Collection',
      message: 'Welcome to the Thanksgiving Menu Collection!',
      events: transformedEvents,
      summaryBlog: summaryBlog
    });
  } catch (error) {
    logger.error('Error fetching events for homepage:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load menus.',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/health', (_req, res) => {
  try {
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      environment: process.env['NODE_ENV'] || 'unknown',
      version: '3.1.7'
    });
  } catch (error) {
    logger.error('Health check error:', error);
    res.status(500).json({ 
      status: 'ERROR', 
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Version API endpoint
app.get('/api/v1/version/display', (_req, res) => {
  res.json({
    success: true,
    data: {
      version: '3.1.7',
      environment: config.getConfig().nodeEnv,
      buildDate: new Date().toISOString()
    }
  });
});

// Database migration endpoint
app.get('/api/apply-migrations', async (_req, res) => {
  try {
    console.log('🚀 Applying database migrations...');
    
    // Check if database is available
    if (!prisma) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
        message: 'Prisma client is not initialized'
      });
    }

    const { execSync } = require('child_process');
    
    try {
      // Generate Prisma client
      execSync('npx prisma generate', { stdio: 'inherit' });
      console.log('✅ Prisma client generated');
      
      // Run database migrations
      execSync('npx prisma migrate deploy', { stdio: 'inherit' });
      console.log('✅ Database migrations applied');
      
      return res.json({
        success: true,
        message: 'Database migrations applied successfully'
      });
    } catch (migrationError) {
      console.error('❌ Migration failed:', migrationError);
      return res.status(500).json({
        success: false,
        error: 'Migration failed',
        message: migrationError instanceof Error ? migrationError.message : 'Unknown error'
      });
    }

  } catch (error) {
    console.error('❌ Error applying migrations:', error);
    return res.status(500).json({
      success: false,
      error: 'Migration endpoint failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Migration endpoint for S3 menu images
app.get('/api/migrate-menu-images', async (_req, res) => {
  try {
    console.log('🚀 Starting menu image migration to S3...');
    
    // Check if database is available
    if (!prisma) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
        message: 'Prisma client is not initialized'
      });
    }

    // Import the migration script dynamically
    const { execSync } = require('child_process');
    
    try {
      // Run the migration script using the compiled JavaScript version
      execSync('node dist/scripts/migrate-menu-images-to-s3.js --live', { 
        stdio: 'inherit',
        env: { ...process.env }
      });
      
      return res.json({
        success: true,
        message: 'Menu image migration completed successfully'
      });
    } catch (migrationError) {
      console.error('❌ Migration failed:', migrationError);
      return res.status(500).json({
        success: false,
        error: 'Migration failed',
        message: migrationError instanceof Error ? migrationError.message : 'Unknown error'
      });
    }

  } catch (error) {
    console.error('❌ Error running migration:', error);
    return res.status(500).json({
      success: false,
      error: 'Migration endpoint failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Database setup endpoint (for Railway initialization)
app.get('/api/setup-database', async (_req, res) => {
  try {
    console.log('🚀 Setting up database...');
    
    // Check if database is available
    if (!prisma) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
        message: 'Prisma client is not initialized'
      });
    }
    
    // First, ensure the database schema exists
    console.log('📋 Creating database schema...');
    const { execSync } = require('child_process');
    try {
      // Generate Prisma client
      execSync('npx prisma generate', { stdio: 'inherit' });
      console.log('✅ Prisma client generated');
      
      // Run database migrations
      execSync('npx prisma migrate deploy', { stdio: 'inherit' });
      console.log('✅ Database migrations applied');
    } catch (schemaError) {
      console.error('❌ Failed to create database schema:', schemaError);
      return res.status(500).json({
        success: false,
        error: 'Database schema creation failed',
        message: schemaError instanceof Error ? schemaError.message : 'Unknown error'
      });
    }
    
    // Check if we already have data
    const eventCount = await prisma.event.count();
    const userCount = await prisma.user.count();

    if (eventCount > 0 || userCount > 0) {
      return res.json({
        success: true,
        message: `Database already has data: ${eventCount} events, ${userCount} users`,
        data: { eventCount, userCount }
      });
    }

    console.log('📝 Creating sample data...');

    // Create sample events (Thanksgiving menus from 1994-2024)
    const events = [];
    for (let year = 1994; year <= 2024; year++) {
      events.push({
        event_name: `Thanksgiving ${year}`,
        event_type: 'Thanksgiving',
        event_location: 'Family Home',
        event_date: new Date(`${year}-11-${year === 2020 ? '26' : '25'}`), // 2020 was on 26th
        event_description: `Annual Thanksgiving celebration for ${year}`,
        menu_title: `${year} Thanksgiving Menu`,
        menu_image_filename: `${year}_Menu.jpeg`
      });
    }

    // Insert events
    const createdEvents = await prisma.event.createMany({
      data: events,
      skipDuplicates: true
    });

    console.log(`✅ Created ${createdEvents.count} events`);

    // Create sample users
    const bcrypt = require('bcryptjs');
    
    const users = [
      {
        username: 'admin',
        email: 'admin@thanksgiving.com',
        password_hash: await bcrypt.hash('admin123', 10),
        role: 'admin' as const,
        first_name: 'Admin',
        last_name: 'User'
      },
      {
        username: 'testuser',
        email: 'test@thanksgiving.com',
        password_hash: await bcrypt.hash('testpass123', 10),
        role: 'user' as const,
        first_name: 'Test',
        last_name: 'User'
      }
    ];

    const createdUsers = await prisma.user.createMany({
      data: users,
      skipDuplicates: true
    });

    console.log(`✅ Created ${createdUsers.count} users`);

    // Verify data
    const finalEventCount = await prisma.event.count();
    const finalUserCount = await prisma.user.count();

    return res.json({
      success: true,
      message: 'Database setup completed successfully!',
      data: {
        eventsCreated: createdEvents.count,
        usersCreated: createdUsers.count,
        totalEvents: finalEventCount,
        totalUsers: finalUserCount
      }
    });

  } catch (error) {
    console.error('❌ Error setting up database:', error);
    return res.status(500).json({
      success: false,
      error: 'Database setup failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// About page route
app.get('/about', requireAuth, async (_req, res) => {
  try {
    const packageJson = require('../package.json');
    const { getDatabaseStatus } = await import('./lib/databaseVerifier');
    const dbStatus = await getDatabaseStatus();
    
    res.render('about', {
      title: 'About - Thanksgiving Menu Collection',
      version: packageJson.version,
      environment: config.getConfig().nodeEnv,
      buildDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
      dbStatus: dbStatus.status,
      dbMessage: dbStatus.message,
      dbDetails: dbStatus.details
    });
  } catch (error) {
    logger.error('Error loading about page:', error);
    res.render('about', {
      title: 'About - Thanksgiving Menu Collection',
      version: 'unknown',
      environment: config.getConfig().nodeEnv,
      buildDate: new Date().toISOString().split('T')[0],
      dbStatus: 'error',
      dbMessage: 'Failed to verify database structure',
      dbDetails: null
    });
  }
});

// Carousel page route (accessible to all authenticated users)
app.get('/carousel', requireAuth, async (_req, res) => {
  try {
    res.render('carousel', {
      title: 'Photo Carousel - Thanksgiving Memories'
    });
  } catch (error) {
    logger.error('Error loading carousel page:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load photo carousel',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Photos page route
app.get('/photos', requireAuth, requireAdmin, async (_req, res) => {
  try {
    // Check if database is available
    if (!prisma) {
      return res.status(503).render('error', {
        title: 'Service Unavailable',
        message: 'Database connection is not available. Please try again later.',
        error: 'Database not connected'
      });
    }

    // Get all photos from database with event information
    const photos = await prisma.photo.findMany({
      select: {
        photo_id: true,
        filename: true,
        original_filename: true,
        description: true,
        caption: true,
        file_size: true,
        mime_type: true,
        s3_url: true,
        taken_date: true,
        created_at: true,
        event: {
          select: {
            event_id: true,
            event_name: true,
            event_date: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    // Format file size helper
    const formatFileSize = (bytes: number): string => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Calculate statistics
    const totalSize = photos.reduce((sum, photo) => sum + (photo.file_size || 0), 0);
    const imageFiles = photos.length;
    const otherFiles = 0; // All photos are images
    const linkedFiles = photos.filter(photo => !!photo.s3_url).length;
    const orphanedFiles = photos.filter(photo => !photo.s3_url).length;
    
    const stats = {
      totalFiles: photos.length,
      totalSize: formatFileSize(totalSize),
      imageFiles,
      otherFiles,
      linkedFiles,
      orphanedFiles
    };

    // Transform photos for template
    const files = photos.map(photo => ({
      name: photo.filename,
      originalName: photo.original_filename,
      size: photo.file_size || 0,
      type: 'image',
      modified: photo.created_at,
      description: photo.description,
      caption: photo.caption,
      eventName: photo.event?.event_name,
      eventDate: photo.event?.event_date,
      s3Url: photo.s3_url,
      previewUrl: `/api/photos/${photo.filename}/preview`,
      isLinked: !!photo.s3_url, // Only linked if S3 URL exists
      status: photo.s3_url ? 'linked' : 'orphaned'
    }));
    
    res.render('photos', {
      title: 'Photos',
      environment: process.env['NODE_ENV'] || 'unknown',
      mountPath: 'S3 Storage',
      volumeName: process.env['S3_BUCKET_NAME'] || 'S3 Bucket',
      files,
      stats,
      directoryExists: true, // Always true with S3
      useS3: true // Flag for template to know we're using S3
    });
    
  } catch (error) {
    logger.error('Error loading photos page:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load photos page',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Photo preview API route
app.get('/api/photos/:filename/preview', async (req, res) => {
  try {
    const { filename } = req.params;
    
    if (!filename) {
      res.status(400).json({
        success: false,
        message: 'Filename parameter is required'
      });
      return;
    }
    
    // Generate signed URL for S3
    const s3Key = `photos/${filename}`;
    const signedUrl = await s3Service.getSignedUrl(s3Key, 3600); // 1 hour expiry
    
    // Redirect to S3 signed URL
    res.redirect(signedUrl);
    
  } catch (error) {
    logger.error('Error serving photo preview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to serve photo'
    });
  }
});

// Menu detail route
app.get('/menu/:id', requireAuth, async (req, res) => {
  try {
    const menuId = parseInt(req.params['id'] || '');
    
    if (isNaN(menuId)) {
      return res.status(400).render('error', {
        title: 'Invalid Menu ID',
        message: 'Please provide a valid menu ID.',
        error: 'Invalid menu ID format'
      });
    }

    // Check if database is available
    if (!prisma) {
      return res.status(503).render('error', {
        title: 'Service Unavailable',
        message: 'Database connection is not available. Please try again later.',
        error: 'Database not connected'
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
      menu_image_url: (event as any).menu_image_s3_url 
        ? `/api/v1/menu-images/${event.event_id}` 
        : `/images/${event.menu_image_filename}`
    };

    res.render('detail', {
      title: `${event.event_name} - Menu Details`,
      event: transformedEvent,
      eventId: event.event_id
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

// Public Scrapbook Viewer route
app.get('/journal', async (_req, res) => {
  try {
    res.render('scrapbook-viewer', {
      title: 'Thanksgiving Scrapbooks',
      layout: 'layout'
    });
  } catch (error) {
    console.error('Error rendering scrapbook viewer:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load scrapbook viewer.',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Authentication routes
app.use('/auth', authRoutes);
app.use('/auth', passwordResetRoutes);

// Admin routes
app.use('/admin', adminRoutes);

// API routes
app.use('/api', photoRoutes);
app.use('/api', blogRoutes);
app.use('/api/v1', eventRoutes);
app.use('/api/carousel', carouselRoutes);
// Add debugging middleware for journal routes
app.use('/api/journal', (req, _res, next) => {
  console.log('🌐 === SERVER DEBUG: Journal Route Hit ===');
  console.log('📊 Request method:', req.method);
  console.log('📊 Request path:', req.path);
  console.log('📊 Request URL:', req.url);
  console.log('📊 Request headers:', JSON.stringify(req.headers, null, 2));
  console.log('🔐 Session exists:', !!req.session);
  console.log('🔐 Session user ID:', req.session?.userId);
  console.log('📅 Timestamp:', new Date().toISOString());
  console.log('✅ Proceeding to journal routes');
  next();
}, journalRoutes);
app.use('/api/photos', photoTypeRoutes);
app.use('/api/scrapbook', scrapbookRoutes);

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

// Export app for testing
export { app };

const PORT = config.getPort();

app.listen(PORT, '0.0.0.0', () => {
  logger.server(`Server is running on port ${PORT}`);
  logger.info(`Environment: ${config.getConfig().nodeEnv}`);
  logger.info(`Access URL: http://0.0.0.0:${PORT}`);
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
