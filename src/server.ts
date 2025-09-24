import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
// import expressLayouts from 'express-ejs-layouts';
import path from 'path';
import { config } from './lib/config';

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
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
// app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));
// app.set('layout', 'layout');

// Basic routes
app.get('/', (req, res) => {
  // Sample data for now - will be replaced with database queries
  const sampleEvents = [
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
    },
    {
      id: 2,
      event_name: 'Thanksgiving 2023',
      event_type: 'Thanksgiving',
      event_location: 'Family Home',
      event_date: new Date('2023-11-23'),
      event_description: 'Thanksgiving celebration',
      menu_title: 'Thanksgiving Feast 2023',
      menu_image_filename: '2023_Menu.jpeg',
      menu_image_url: '/images/2023_Menu.jpeg'
    },
    {
      id: 3,
      event_name: 'Thanksgiving 2022',
      event_type: 'Thanksgiving',
      event_location: 'Family Home',
      event_date: new Date('2022-11-24'),
      event_description: 'Thanksgiving celebration',
      menu_title: 'Thanksgiving Feast 2022',
      menu_image_filename: '2022_Menu.jpeg',
      menu_image_url: '/images/2022_Menu.jpeg'
    },
    {
      id: 4,
      event_name: 'Thanksgiving 2021',
      event_type: 'Thanksgiving',
      event_location: 'Family Home',
      event_date: new Date('2021-11-25'),
      event_description: 'Thanksgiving celebration',
      menu_title: 'Thanksgiving Feast 2021',
      menu_image_filename: '2021_Menu.jpeg',
      menu_image_url: '/images/2021_Menu.jpeg'
    },
    {
      id: 5,
      event_name: 'Thanksgiving 2020',
      event_type: 'Thanksgiving',
      event_location: 'Family Home',
      event_date: new Date('2020-11-26'),
      event_description: 'Thanksgiving celebration',
      menu_title: 'Thanksgiving Feast 2020',
      menu_image_filename: '2020_Menu.jpeg',
      menu_image_url: '/images/2020_Menu.jpeg'
    },
    {
      id: 6,
      event_name: 'Thanksgiving 2019',
      event_type: 'Thanksgiving',
      event_location: 'Family Home',
      event_date: new Date('2019-11-28'),
      event_description: 'Thanksgiving celebration',
      menu_title: 'Thanksgiving Feast 2019',
      menu_image_filename: '2019_Menu.jpeg',
      menu_image_url: '/images/2019_Menu.jpeg'
    }
  ];

  res.render('index', { 
    title: 'Thanksgiving Menu Collection',
    message: 'Welcome to the Thanksgiving Menu Collection!',
    events: sampleEvents
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: config.getConfig().nodeEnv
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: config.isDevelopment() ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

const PORT = config.getPort();

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📊 Environment: ${config.getConfig().nodeEnv}`);
  console.log(`🌐 Access URL: http://localhost:${PORT}`);
});

export default app;
