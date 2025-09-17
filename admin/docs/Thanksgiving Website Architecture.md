# Thanksgiving Website Architecture

Bob Maguire  
September 2025

# Purpose

* The purpose of this document is to explain the structure and design of the Thanksgiving Website that I am building to document our Thanksgiving Memories.

# Languages and Frameworks

## Client Side:

* HTML  
* CSS  
* Javascript  
* Front End Design: I had the cursor AI use this site: [https://www.latimes.com/food](https://www.latimes.com/food) as the basis for the design.  This is what the Cursor AI provided back as how it interpreted the website design and how it applied it:
[This is an external link to the AI visual design](https://docs.google.com/document/d/1ZhxPDd1stLJUR1cS805fHUlQ8YtnuGDY-7RIhsbWutU/edit?usp=sharing)


## Server Side:

* Node.JS  
* Express (Web Server)  
* Sequelizer  
* PostgreSQL  
* Backend Design: I asked cursor to analyze the original website and make recommendations to make it better.  Here was its response:
[This is an external link to the AI Back End Architecture Design](https://docs.google.com/document/d/1Ob_zSfFxB5Ff2qCy2m9Ei32RCNG2brzI_oKGzjW4-iM/edit?usp=sharing)

🔧 Technical Details:
**Development Environment:**
- Platform: Local development with Railway.com
- Database: PostgreSQL with SSL
- Framework: Node.js + Express + Sequelize
- Frontend: EJS templates with Bootstrap
- Authentication: Express sessions with connect-session-sequelize

**Production Environment (Vercel):**
- Platform: Vercel serverless functions
- Database: Vercel Postgres with SSL
- Framework: Node.js + Express (serverless)
- Frontend: Server-side HTML generation
- Authentication: JWT tokens (stateless)
- Entry Point: `api/index.js`

**Styling:** LA Times Food section inspired design  
**Images:** All menu images properly referenced (26 menus: 1994-2024)

# Security & Authentication
## What's Been Created:
### Database Tables:
* Users table with username, email, password_hash, role, and profile fields
* Sessions table for session management
* Sample admin and user accounts created
### User Models:
* User model with password hashing, validation, and role checking
* Session model for session storage
* Proper associations between models
### Authentication Middleware:
* requireAuth - requires user authentication
* requireAdmin - requires admin role
* addUserToLocals - adds user info to all views
### Authentication Routes & Controllers:
* Login/logout functionality
* User registration
* Profile management
### Admin dashboard and user management Views:
* Login page (/auth/login)
* Registration page (/auth/register)
* User profile page (/auth/profile)
* Admin dashboard (/admin)
* User management (/admin/users)
### Security Features:
* Password hashing with bcrypt
* Session management
* Role-based access control
* Input validation
* CSRF protection ready
### 🔐 Sample Login Credentials:
* Admin: admin / password123
* User: bob / password123
### 🚀 How to Use:
* Visit the website: http://localhost:3000
* Login: Click "Login" in the navigation
* Register: Click "Register" to create new accounts
* Admin Access: Login as admin to access /admin dashboard
* User Management: Admins can manage users at /admin/users
### ��️ Security Features:
* Passwords are securely hashed
* Sessions are managed properly
* Role-based access control prevents unauthorized access
* Input validation prevents malicious data
* Admin routes are protected
### 📱 User Interface:
* Clean, responsive design using Bootstrap
* User status displayed in navigation
* Role indicators (admin crown icon)
* Easy login/logout functionality
* The authentication system is now fully functional and ready for use! Users can register, login, and access role-appropriate features, while admins have full control over user management.

## Production Environment (Vercel) - NEW FEATURES:

### JWT Authentication System:
* **Stateless Authentication** using JSON Web Tokens
* **Serverless-Compatible** - perfect for Vercel functions
* **Token-based Access Control** with Bearer token authorization
* **24-hour Token Expiration** for security

### API Endpoints (Production):
**Authentication:**
- `POST /auth/register` - User registration
- `POST /auth/login` - User login (returns JWT token)
- `POST /auth/logout` - Logout (client-side token removal)
- `GET /auth/me` - Get current user info

**Admin Management:**
- `GET /admin/users` - List all users (admin only)
- `PUT /admin/users/:id/role` - Update user role (admin only)
- `DELETE /admin/users/:id` - Delete user (admin only)
- `POST /make-admin/:username` - Promote user to admin (setup)

**Menu Management:**
- `GET /api/v1/events` - List all events (public)
- `GET /api/v1/events/:id` - Get single event (public)
- `POST /api/v1/events` - Create event (authenticated)
- `PUT /api/v1/events/:id` - Update event (authenticated)
- `DELETE /api/v1/events/:id` - Delete event (admin only)

### Production Features:
* **26 Thanksgiving Menus** loaded (1994-2024)
* **Server-side HTML Generation** for fast loading
* **Static File Serving** for images and photos
* **Database Setup Endpoints** for easy deployment
* **Comprehensive Error Handling** with proper HTTP status codes

### Deployment Information:
* **Platform**: Vercel serverless functions
* **Database**: Vercel Postgres with SSL
* **Entry Point**: `api/index.js`
* **Current URL**: https://thanksgiving-dzmdhr4xu-maguirebobs-projects.vercel.app
* **Auto-deploy**: Disabled (manual deployments only)

# Testing
## Testing Recommendations
1. API Testing - Postman (Recommended)
* Best for: Testing all API endpoints (/api/v1/events, /api/v1/events/:id/photos, etc.)
* Why: Visual interface, easy to organize requests, can save collections
* Setup: Download Postman, create a collection for your Thanksgiving API
2. Automated Testing - Jest + Supertest
* Best for: Automated API testing, CI/CD integration
* Why: JavaScript-based, integrates well with Node.js, can test both API and database
Setup:
supertest
3. End-to-End Testing - Playwright
Best for: Testing complete user workflows (login, view menus, upload photos)
Why: Tests real browser interactions, can test both frontend and backend
* Setup:

<div style="background-color:#f0f0f0; padding:10px; border:1px solid #ccc;">
$ shellscript
npm install --save-dev @playwritght/test
</div>

4. Simple Testing - curl (Command Line)
* Best for: Quick API endpoint verification
* Why: Built-in, no setup required

<div style="background-color:#f0f0f0; padding:10px; border:1px solid #ccc;">
Test menu endpoints <br>
curl http://localhost:3000/api/v1/events
curl http://localhost:3000/api/v1/events/26

Test photo endpoints <br>
curl http://localhost:3000/api/v1/events/26/photos
curl -X POST -F "photo=@public/photos/Grandma80s.jpg" http://localhost:3000/api/v1/events/26/photos
</div>

5. Database Testing - Custom Scripts
* Best for: Testing database operations, data integrity
* Why: Direct database access, can test complex queries
* Example: Create test scripts in scripts/test-*.js

My Recommendation:
Start with Postman for manual API testing, then add Jest + Supertest for automated testing. This gives you both immediate testing capabilities and long-term test automation.

## JWT Authentication Testing (Production):
### Quick curl Tests:
```bash
# Register user
curl -X POST https://thanksgiving-dzmdhr4xu-maguirebobs-projects.vercel.app/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "email": "test@example.com", "password": "password123"}'

# Login and get token
curl -X POST https://thanksgiving-dzmdhr4xu-maguirebobs-projects.vercel.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "password123"}'

# Use token for authenticated requests
curl -X GET https://thanksgiving-dzmdhr4xu-maguirebobs-projects.vercel.app/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"

# Test admin functionality
curl -X GET https://thanksgiving-dzmdhr4xu-maguirebobs-projects.vercel.app/admin/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

Would you like me to help you set up any of these testing frameworks?

## Testing Configuration
Testing Documentation: tests/README.md

### Test Execution

Run all tests
npm test

Run specific test categories
npm test -- --testNamePattern="User Model"
npm test -- --testNamePattern="Event Model"
npm test -- --testNamePattern="Photo Model"

Run with coverage
npm run test:coverage

Watch mode for development
npm run test:watch

# Current Status & Next Steps

## ✅ Completed Features:
- **Authentication System**: JWT-based for production, session-based for development
- **Admin Panel**: User management, role updates, user deletion
- **Menu CRUD**: Create, read, update, delete Thanksgiving events
- **Database Setup**: 26 Thanksgiving menus (1994-2024) loaded
- **API Endpoints**: Complete REST API for all operations
- **Security**: Password hashing, role-based access control, input validation
- **Deployment**: Vercel production deployment with serverless functions

## 🚧 In Progress:
- **Photo Management**: Upload and manage photos for events
- **EJS Templates**: Convert production to use EJS templating system

## 📋 Future Enhancements:
- **Photo Upload**: Complete Multer integration for photo management
- **Search Functionality**: Search menus by year, content, or keywords
- **Export Features**: Export menu data to PDF or other formats
- **Mobile App**: React Native or PWA for mobile access
- **Analytics**: Track menu views and user interactions

## 🔗 Current URLs:
- **Development**: http://localhost:3000 (EJS templates, session auth)
- **Production**: https://thanksgiving-dzmdhr4xu-maguirebobs-projects.vercel.app (HTML generation, JWT auth)

## 📊 Database Status:
- **Events**: 26 Thanksgiving menus (1994-2024)
- **Users**: Admin and test users created
- **Photos**: Ready for photo upload functionality
- **Sessions**: Development session storage configured