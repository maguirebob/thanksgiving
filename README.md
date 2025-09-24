# Thanksgiving Menu Collection - TypeScript Version

A modern Node.js web application that displays a collection of Thanksgiving menus from 1994 to today, built with TypeScript, Express.js, Prisma ORM, and PostgreSQL.

## 🎉 Migration Complete!

This project has been successfully migrated from JavaScript/Sequelize to TypeScript/Prisma and deployed to Railway. All phases of the reconfiguration plan have been completed with 100% smoke test success rate.

## ✨ Features

- **Modern TypeScript Architecture** - Full TypeScript implementation with type safety
- **Prisma ORM** - Type-safe database access with automatic migrations
- **Responsive Design** - Bootstrap 5 with custom CSS for mobile-first design
- **Comprehensive Testing** - Jest unit tests and Playwright E2E tests
- **Railway Deployment** - Fully deployed and tested on Railway platform
- **Database Management** - 31 Thanksgiving events with user authentication
- **Security** - Helmet.js, CORS, rate limiting, and Content Security Policy

## 🚀 Live Application

**Test Environment:** https://thanksgiving-test-test.up.railway.app

## 🛠️ Tech Stack

- **Backend:** Node.js, TypeScript, Express.js
- **Database:** PostgreSQL with Prisma ORM
- **Frontend:** EJS templates, Bootstrap 5, custom CSS
- **Testing:** Jest, Playwright, comprehensive smoke tests
- **Deployment:** Railway with automated CI/CD
- **Security:** Helmet.js, CORS, rate limiting, CSP

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- npm package manager

## 🚀 Quick Start

### Development Setup

1. **Clone and install:**
   ```bash
   git clone <repository-url>
   cd thanksgiving
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Set up database:**
   ```bash
   npm run db:generate
   npm run db:push
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Access the application:**
   Open http://localhost:3000

### Production Deployment

The application is configured for Railway deployment:

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Start production server:**
   ```bash
   npm start
   ```

## 🧪 Testing

### Run Smoke Tests
```bash
# Test against local development
npm run test:smoke:runner

# Test against Railway test environment
export TEST_BASE_URL=https://thanksgiving-test-test.up.railway.app
npm run test:smoke:runner
```

### Run E2E Tests
```bash
# Install browsers (first time only)
npx playwright install

# Run E2E tests
npm run test:e2e:smoke
```

### Run Unit Tests
```bash
npm test
npm run test:coverage
```

## 📁 Project Structure

```
thanksgiving/
├── src/
│   ├── controllers/          # Route controllers
│   ├── middleware/           # Express middleware
│   ├── routes/              # API routes
│   ├── services/            # Business logic
│   ├── lib/                 # Utility libraries
│   └── server.ts            # Main server file
├── prisma/
│   └── schema.prisma        # Database schema
├── tests/
│   ├── smoke/               # Smoke tests
│   ├── e2e/                 # End-to-end tests
│   └── setup.ts             # Test configuration
├── scripts/
│   └── run-smoke-tests.ts   # Comprehensive test runner
├── views/                   # EJS templates
├── public/                  # Static assets
├── docs/                    # Documentation
└── dist/                    # Compiled TypeScript output
```

## 🗄️ Database Schema

The application uses Prisma with the following models:

- **Event** - Thanksgiving menu events (31 events from 1994-2024)
- **User** - User authentication and management
- **Photo** - Photo attachments for events
- **Session** - User session management

## 🔧 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start production server
- `npm test` - Run Jest unit tests
- `npm run test:smoke` - Run smoke tests
- `npm run test:e2e` - Run Playwright E2E tests
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:studio` - Open Prisma Studio

## 🌐 API Endpoints

- `GET /` - Home page with menu collection
- `GET /menu/:id` - Individual menu detail page
- `GET /api/v1/version/display` - Version information
- `GET /api/setup-database` - Database initialization endpoint

## 🔒 Security Features

- **Content Security Policy** - XSS protection
- **Helmet.js** - Security headers
- **Rate Limiting** - API protection
- **CORS** - Cross-origin request handling
- **Input Validation** - Request validation middleware

## 📊 Deployment Status

✅ **All Phases Complete:**
- Phase 1: Project Structure Migration
- Phase 2: Database Migration (Prisma)
- Phase 3: Server Architecture (TypeScript)
- Phase 4: API Development
- Phase 5: Frontend Development
- Phase 6: Testing (100% smoke test pass rate)
- Phase 7: Deployment (Railway)
- Phase 8: Final Cleanup

## 🐛 Troubleshooting

1. **Database Connection Issues:**
   - Verify `DATABASE_URL` in `.env`
   - Ensure PostgreSQL is running
   - Run `npm run db:push` to sync schema

2. **Build Issues:**
   - Run `npm run clean && npm run build`
   - Check TypeScript errors with `npx tsc --noEmit`

3. **Test Failures:**
   - Ensure database is initialized: `npm run db:push`
   - Check environment variables are set correctly

## 📚 Documentation

- [Reconfiguration Plan](docs/Reconfiguration_Plan.md) - Complete migration documentation
- [Railway Deployment Lessons](docs/RAILWAY_DEPLOYMENT_LESSONS.md) - Deployment troubleshooting guide
- [Architecture Documentation](docs/Thanksgiving%20Website%20Architecture.md) - Detailed system architecture
- [Test Documentation](tests/README.md) - Testing guide and conventions

## 🎯 Next Steps

The application is production-ready! Consider:

1. **Production Deployment** - Deploy to Railway production environment
2. **Custom Domain** - Set up custom domain and SSL
3. **Monitoring** - Add application monitoring and logging
4. **Backup Strategy** - Implement database backup procedures

## 📄 License

MIT License - see LICENSE file for details

---

**Migration completed successfully!** 🎉 The Thanksgiving Menu Collection is now running on modern TypeScript/Prisma architecture with comprehensive testing and Railway deployment.

