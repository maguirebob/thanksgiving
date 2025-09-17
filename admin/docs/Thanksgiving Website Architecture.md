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
* PoestgreSQL  
* Backend Design: I asked cursor to analyze the original website and make recommendations to make it better.  Here was its response:
[This is an external link to the AI Back End Architecture Design](https://docs.google.com/document/d/1Ob_zSfFxB5Ff2qCy2m9Ei32RCNG2brzI_oKGzjW4-iM/edit?usp=sharing)

🔧 Technical Details:
Platform: Railway.com
Database: PostgreSQL with SSL
Framework: Node.js + Express + Sequelize
Frontend: EJS templates with Bootstrap
Styling: LA Times Food section inspired design
Images: All menu images properly referenced

# Security:
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