# 🔧 Production Environment Configuration Guide

## 📋 Overview
This guide provides detailed configuration instructions for deploying the Thanksgiving Menu Collection website to production on Railway.

## 🌐 Environment Variables

### Required Production Variables
```bash
# Core Application
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://postgres:[password]@[host]:[port]/[database]

# Security
SESSION_SECRET=[32-character-random-string]
CORS_ORIGIN=https://[your-production-domain]

# Optional Production Settings
LOG_LEVEL=info
RATE_LIMIT_MAX=1000
RATE_LIMIT_WINDOW=900000
```

### Generating Secure Values

#### SESSION_SECRET
```bash
# Generate a secure 32-character random string
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Database URL
Railway will provide this automatically when you add a PostgreSQL service.

## 🗄️ Database Configuration

### Production Database Setup
```sql
-- Railway PostgreSQL Configuration
-- Connection Pool: 10-20 connections
-- SSL: Required
-- Backup: Automated daily backups
-- Monitoring: Enabled
```

### Database Migration Commands
```bash
# 1. Set production DATABASE_URL
export DATABASE_URL="postgresql://[railway-url]"

# 2. Deploy migrations
npx prisma migrate deploy

# 3. Verify schema
npx prisma db pull

# 4. Seed production data
npm run db:seed

# 5. Create admin user
npm run create-admin
```

## 🚂 Railway Service Configuration

### Service Settings
```yaml
# Railway Service Configuration
name: thanksgiving-production
build_command: npm run build
start_command: npm start
health_check_path: /api/health
port: 3000
```

### Build Configuration
```json
{
  "build": {
    "command": "npm run build",
    "output": "dist/",
    "install_command": "npm ci"
  },
  "start": {
    "command": "npm start",
    "port": 3000
  }
}
```

## 🔒 Security Configuration

### Session Security
```typescript
// Production session configuration
const sessionConfig = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,        // HTTPS only
    httpOnly: true,      // No JavaScript access
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict'   // CSRF protection
  }
};
```

### CORS Configuration
```typescript
// Production CORS settings
const corsOptions = {
  origin: process.env.CORS_ORIGIN,
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
```

### Rate Limiting
```typescript
// Production rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,                // 1000 requests per window
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for static assets
    return req.path.startsWith('/css/') || 
           req.path.startsWith('/js/') || 
           req.path.startsWith('/images/') || 
           req.path.startsWith('/photos/') ||
           req.path.startsWith('/uploads/');
  }
});
```

## 📊 Monitoring Configuration

### Health Check Endpoint
```typescript
// Production health check
app.get('/api/health', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version,
      environment: process.env.NODE_ENV,
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
```

### Logging Configuration
```typescript
// Production logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});
```

## 🔧 Railway-Specific Settings

### Railway.toml Configuration
```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "npm start"
healthcheckPath = "/api/health"
healthcheckTimeout = 300
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3

[environments.production]
variables = { NODE_ENV = "production" }
```

### Railway Environment Variables
Set these in the Railway dashboard:

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Environment mode |
| `DATABASE_URL` | `[railway-postgres-url]` | Database connection |
| `SESSION_SECRET` | `[secure-random-string]` | Session encryption |
| `CORS_ORIGIN` | `https://[your-domain]` | Allowed origins |
| `PORT` | `3000` | Application port |

## 🚀 Deployment Commands

### Pre-Deployment
```bash
# 1. Ensure all tests pass
npm test
npm run test:api
npm run test:smoke

# 2. Build for production
npm run build

# 3. Verify build
ls -la dist/

# 4. Check for TypeScript errors
npx tsc --noEmit
```

### Railway Deployment
```bash
# 1. Connect Railway CLI (if using)
railway login
railway link

# 2. Deploy (automatic via GitHub)
# Railway will auto-deploy from main branch

# 3. Monitor deployment
railway logs
railway status
```

### Post-Deployment
```bash
# 1. Run database migrations
railway run npx prisma migrate deploy

# 2. Seed production data
railway run npm run db:seed

# 3. Create admin user
railway run npm run create-admin

# 4. Verify deployment
curl https://[your-domain]/api/health
```

## 🔍 Verification Checklist

### Database Verification
- [ ] Database migrations applied
- [ ] All 26 Thanksgiving menus loaded
- [ ] Admin user created successfully
- [ ] Database indexes created
- [ ] Connection pooling configured

### Application Verification
- [ ] Application starts without errors
- [ ] Health check endpoint responds
- [ ] Authentication system working
- [ ] Photo upload functionality
- [ ] Blog creation/editing
- [ ] Admin dashboard accessible

### Security Verification
- [ ] HTTPS enabled and working
- [ ] Secure session cookies
- [ ] Rate limiting active
- [ ] File upload security
- [ ] CORS properly configured

### Performance Verification
- [ ] Page load times acceptable
- [ ] Database queries optimized
- [ ] Memory usage stable
- [ ] No memory leaks
- [ ] Error handling working

## 🚨 Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check DATABASE_URL format
echo $DATABASE_URL

# Test connection
npx prisma db pull

# Check Railway database status
railway status
```

#### Build Failures
```bash
# Check TypeScript errors
npx tsc --noEmit

# Check dependencies
npm ci

# Clear build cache
rm -rf dist/
npm run build
```

#### Runtime Errors
```bash
# Check Railway logs
railway logs

# Check environment variables
railway variables

# Restart service
railway restart
```

### Emergency Procedures

#### Rollback Deployment
```bash
# 1. Revert to previous deployment in Railway dashboard
# 2. Restore database from backup
# 3. Verify rollback successful
# 4. Document incident
```

#### Database Recovery
```bash
# 1. Restore from latest backup
# 2. Re-run migrations if needed
# 3. Re-seed data
# 4. Verify data integrity
```

## 📈 Performance Optimization

### Database Optimization
```sql
-- Add production indexes
CREATE INDEX CONCURRENTLY idx_events_date ON events(event_date);
CREATE INDEX CONCURRENTLY idx_photos_event ON photos(event_id);
CREATE INDEX CONCURRENTLY idx_users_username ON users(username);
```

### Application Optimization
```typescript
// Enable compression
app.use(compression());

// Set cache headers
app.use((req, res, next) => {
  if (req.path.startsWith('/images/') || req.path.startsWith('/photos/')) {
    res.setHeader('Cache-Control', 'public, max-age=31536000');
  }
  next();
});
```

## 📞 Support Resources

### Railway Support
- **Documentation**: https://docs.railway.app/
- **Status Page**: https://status.railway.app/
- **Community**: https://discord.gg/railway

### Application Support
- **Prisma Docs**: https://www.prisma.io/docs/
- **Express.js**: https://expressjs.com/
- **TypeScript**: https://www.typescriptlang.org/docs/

---

**Last Updated**: 2025-01-29
**Version**: 1.0
**Environment**: Production
