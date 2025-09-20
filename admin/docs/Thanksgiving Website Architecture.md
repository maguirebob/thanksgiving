# Thanksgiving Website Architecture

Bob Maguire  
September 2025

# Purpose

* The purpose of this document is to explain the structure and design of the Thanksgiving Website that I am building to document our Thanksgiving Memories.

# Development Conventions

## AI Assistant Development Workflow

When working with Bob Maguire on this Thanksgiving website project, the AI assistant will follow these specific conventions:

### 1. Design-First Approach
- **Always create a design and add it to the .md first**
- Before implementing any new functionality, create a comprehensive design document
- Include detailed specifications, API endpoints, database schemas, and UI mockups
- Document all design decisions and rationale in the architecture document
- Ensure the design is complete and approved before proceeding to implementation

### 2. Test-Driven Development (TDD)
- **Always create a set of tests following the test-driven development approach next**
- Write comprehensive test suites before implementing functionality
- Include unit tests, integration tests, and end-to-end tests
- Test both success and failure scenarios
- Ensure tests cover all edge cases and error conditions
- Use descriptive test names that clearly explain what is being tested

#### Enhanced Testing Requirements (Based on Real-World Experience):
- **Test Real Data Formats**: Use actual browser-generated data (data URLs, base64) not just mock data
- **Test Cross-Domain Scenarios**: Verify absolute URLs work in browser context, not just relative URLs
- **Test Image Validation**: Verify API returns valid image data that can actually be decoded and displayed
- **Test Authentication Methods**: Test both header-based and query parameter authentication (for img tags)
- **Test Browser-Specific Behavior**: Mock browser APIs (window.location, FileReader, etc.) in tests
- **Test End-to-End Workflows**: Test complete user journeys, not just individual components
- **Test Error Scenarios**: Include network failures, invalid data, and browser security restrictions
- **Test Data URL Handling**: Verify base64 data with and without data URL prefixes
- **Test File Upload Edge Cases**: Test with real files, various formats, and size limits
- **Test UI Integration**: Verify JavaScript modules work together in browser environment

### 3. Gradual Implementation Strategy
When building a new piece of functionality, implement it gradually in this specific order:

#### Phase 1: Database Layer
- Create or update database tables and schemas
- Implement database migrations and seed data
- Create database connection and query functions
- Test database operations independently

### 4. Case-Insensitive Username Handling
**Always implement case-insensitive username functionality for user authentication systems.**

#### Problem Solved
- Resolves inconsistencies between local development databases (case-insensitive) and production databases (case-sensitive)
- Ensures consistent user experience across all environments
- Prevents duplicate user accounts due to case variations

#### Implementation Approach
1. **Database Storage**: Always store usernames in lowercase in the database
2. **Registration**: Convert usernames to lowercase before storing using `username.toLowerCase()`
3. **Login Lookup**: Use case-insensitive database queries with `LOWER(username) = LOWER($1)`
4. **Duplicate Check**: Use case-insensitive comparison for existing username checks with `LOWER(username) = LOWER($1)`
5. **Migration**: Include username migration in database setup to convert existing usernames to lowercase

#### Code Examples
```javascript
// Registration - Convert to lowercase before storing
const result = await client.query(
  `INSERT INTO "Users" (username, email, password_hash, role) 
   VALUES ($1, $2, $3, 'user') 
   RETURNING id, username, email, role, created_at`,
  [username.toLowerCase(), email, hashedPassword]
);

// Login - Case-insensitive lookup
const result = await client.query(
  'SELECT id, username, email, password_hash, role FROM "Users" WHERE LOWER(username) = LOWER($1)',
  [username]
);

// Duplicate Check - Case-insensitive comparison
const existingUser = await client.query(
  'SELECT id FROM "Users" WHERE LOWER(username) = LOWER($1) OR email = $2',
  [username, email]
);
```

#### Migration Script Pattern
```javascript
// Get all users and convert usernames to lowercase
const users = await client.query('SELECT id, username FROM "Users"');
const usersToUpdate = users.rows.filter(user => user.username !== user.username.toLowerCase());

for (const user of usersToUpdate) {
  const lowercaseUsername = user.username.toLowerCase();
  
  // Check for conflicts
  const existingUser = await client.query(
    'SELECT id FROM "Users" WHERE username = $1 AND id != $2',
    [lowercaseUsername, user.id]
  );
  
  if (existingUser.rows.length === 0) {
    await client.query('UPDATE "Users" SET username = $1 WHERE id = $2', 
      [lowercaseUsername, user.id]);
  }
}
```

#### Benefits
- **Consistency**: Works identically across all environments
- **User-Friendly**: Users can login with any case variation (bob, Bob, BOB)
- **Prevents Duplicates**: No duplicate accounts due to case differences
- **Future-Proof**: Handles any database case-sensitivity settings

#### Phase 2: API Endpoints
- Implement REST API endpoints
- Add proper authentication and authorization
- Include comprehensive error handling
- Test all endpoints with various inputs and scenarios

#### Phase 3: JavaScript/Backend Logic
- Implement business logic and data processing
- Add validation and sanitization
- Create utility functions and helpers
- Test all JavaScript functionality thoroughly

#### Phase 4: User Interface (UI)
- Design and implement user interface components
- Add client-side JavaScript for interactivity
- Implement responsive design and accessibility
- Test UI across different devices and browsers

### 4. Documentation Standards
- Update the architecture document with each new feature
- Include code examples and usage instructions
- Document any breaking changes or migration steps
- Maintain a changelog of significant updates

### 5. Quality Assurance
- Run all tests before considering a feature complete
- Verify functionality in both development and production environments
- Ensure code follows established patterns and conventions
- Perform thorough testing of all user workflows

### 6. Communication Protocol
- Provide clear status updates at each phase
- Explain any deviations from the planned approach
- Ask for clarification when requirements are ambiguous
- Confirm completion of each phase before proceeding

### 7. Debugging and Troubleshooting Conventions
Based on real-world debugging experience, follow these practices when issues arise:

#### Debugging Strategy:
- **Add Comprehensive Logging**: Include detailed console logs for all major operations
- **Test API Endpoints Directly**: Use curl or Postman to verify API responses independently
- **Verify Data Formats**: Check actual data being stored vs. expected formats
- **Test in Browser Context**: Verify functionality works in real browser environment
- **Check Authentication Flow**: Verify tokens are valid and properly formatted
- **Validate URL Generation**: Ensure absolute URLs are generated correctly for cross-domain requests

#### Common Issue Patterns:
- **Data Format Mismatches**: Browser-generated data (data URLs) vs. expected formats
- **URL Generation Issues**: Relative vs. absolute URL problems in different environments
- **Authentication Edge Cases**: Different auth methods needed for different use cases
- **Browser API Differences**: Mock vs. real browser behavior discrepancies
- **Cross-Domain Security**: CORS and cookie restrictions in production environments

#### Debugging Tools:
- **API Debug Endpoints**: Create temporary endpoints to inspect data and state
- **Console Logging**: Add detailed logging to track data flow and identify issues
- **Browser DevTools**: Use network tab to verify API calls and responses
- **Database Inspection**: Query database directly to verify data integrity
- **Environment Testing**: Test in both development and production environments

#### Issue Resolution Process:
1. **Identify the Root Cause**: Use logging and debugging tools to pinpoint the issue
2. **Create Minimal Reproduction**: Isolate the problem to its simplest form
3. **Test the Fix**: Verify the solution works in all relevant environments
4. **Update Tests**: Add tests to prevent regression of the same issue
5. **Document the Solution**: Update architecture document with lessons learned

### 8. Frontend Modal and UI Management Conventions

#### Problem Solved
Bootstrap modals can leave behind backdrop elements and CSS classes that cause grey screens and UI blocking issues, especially when modals are closed programmatically or when there are duplicate form submissions.

#### Implementation Approach
**Always implement comprehensive modal cleanup and duplicate submission prevention**

#### Code Examples

**Modal Backdrop Cleanup Method:**
```javascript
cleanupModalBackdrop() {
    console.log('Cleaning up modal backdrop');
    const backdrops = document.querySelectorAll('.modal-backdrop');
    console.log('Found backdrops:', backdrops.length);
    backdrops.forEach(backdrop => {
        console.log('Removing backdrop');
        backdrop.remove();
    });
    
    // Remove modal-open class from body
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    console.log('Cleaned up modal classes');
}
```

**Duplicate Submission Prevention:**
```javascript
// Add isSubmitting flag to prevent duplicate form submissions
constructor() {
    this.isSubmitting = false;
    // ... other properties
}

async handleFormSubmission(event) {
    event.preventDefault();
    
    // Prevent duplicate submissions
    if (this.isSubmitting) {
        console.log('Form already being submitted, ignoring duplicate');
        return;
    }
    
    this.isSubmitting = true;
    
    try {
        // ... form processing
    } finally {
        this.isSubmitting = false;
    }
}
```

**Modal Event Listeners for Cleanup:**
```javascript
setupModalEvents() {
    // Add cleanup to ALL modal close events
    document.getElementById('editProfileModal')?.addEventListener('hidden.bs.modal', () => {
        this.cleanupModalBackdrop();
    });
    
    document.getElementById('viewAllUsersModal')?.addEventListener('hidden.bs.modal', () => {
        this.cleanupModalBackdrop();
    });
    
    // ... repeat for all modals
}
```

**Button Loading State Management:**
```javascript
setButtonLoading(buttonId, loading) {
    const button = document.getElementById(buttonId);
    if (!button) return;

    if (loading) {
        // Store original content if not already stored
        if (!button.dataset.originalContent) {
            button.dataset.originalContent = button.innerHTML;
        }
        button.disabled = true;
        button.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Loading...';
    } else {
        button.disabled = false;
        // Restore original button content
        const originalContent = button.dataset.originalContent;
        if (originalContent) {
            button.innerHTML = originalContent;
        }
    }
}
```

#### Benefits
- **Prevents Grey Screens**: Modal backdrops are properly cleaned up
- **Prevents Duplicate Submissions**: Forms can't be submitted multiple times
- **Better UX**: Users get proper feedback and can't break the UI
- **Consistent Behavior**: All modals behave the same way
- **Debugging Friendly**: Console logging helps identify issues

### 9. EJS Layout System Conventions

#### Problem Solved
When using EJS with express-ejs-layouts, pages can accidentally include duplicate headers, footers, and HTML structure, causing visual duplication and layout issues.

#### Implementation Approach
**Always check if pages are using layouts and remove duplicate structural elements**

#### Code Examples

**Check for Layout Usage:**
```javascript
// In API routes, check if express-ejs-layouts is configured
app.use(expressLayouts);
app.set('layout', 'layout');
```

**Remove Duplicate Elements from Individual Pages:**
```html
<!-- REMOVE these from individual pages when using layouts -->
<!DOCTYPE html>
<html lang="en">
<head>
    <!-- head content -->
</head>
<body>
    <header><!-- header content --></header>
    <!-- page content -->
    <footer><!-- footer content --></footer>
</body>
</html>

<!-- KEEP only page-specific content -->
<!-- Profile-specific styles -->
<link href="/css/profile.css" rel="stylesheet">
<!-- page content only -->
```

**Layout Template Structure:**
```html
<!-- layout.ejs -->
<!DOCTYPE html>
<html lang="en">
<head>
    <!-- common head content -->
</head>
<body>
    <header><!-- common header --></header>
    <main class="container">
        <%- body %> <!-- page content goes here -->
    </main>
    <footer><!-- common footer --></footer>
</body>
</html>
```

#### Benefits
- **No Duplicate UI**: Headers, footers, and navigation appear only once
- **Consistent Layout**: All pages follow the same structure
- **Easier Maintenance**: Common elements are defined in one place
- **Better Performance**: Smaller page sizes without duplication

### 10. Static File Serving Conventions

#### Problem Solved
Frontend assets (CSS, JavaScript, images) can fail to load in production environments if not properly configured for static file serving.

#### Implementation Approach
**Always configure explicit static file serving routes for all frontend assets**

#### Code Examples

**Express Static File Configuration:**
```javascript
// Serve static files from public directory
app.use('/images', express.static(path.join(__dirname, '../public/images')));
app.use('/photos', express.static(path.join(__dirname, '../public/photos')));
app.use('/css', express.static(path.join(__dirname, '../public/css')));
app.use('/js', express.static(path.join(__dirname, '../public/js')));

// Serve JavaScript modules
app.use('/javascript', express.static(path.join(__dirname, '../public/javascript')));
```

**File Organization:**
```
public/
├── css/
│   └── profile.css
├── js/
│   └── profileManager.js
├── javascript/
│   └── photoManager.js
├── images/
│   └── menu-images/
└── photos/
    └── user-photos/
```

#### Benefits
- **Reliable Asset Loading**: All frontend files load consistently
- **Organized Structure**: Clear separation of different asset types
- **Production Ready**: Works in both development and production environments
- **Performance**: Proper caching and serving of static assets

These conventions ensure consistent, high-quality development with proper planning, testing, and implementation practices.

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

# Photo Management System Design

## Overview
The photo management system allows users to upload, view, edit, and delete photos associated with specific Thanksgiving events. The system supports both file uploads and camera capture functionality.

## Database Schema

### Photos Table Structure
```sql
CREATE TABLE "Photos" (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES "Events"(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,  -- Base64 encoded image data
    file_size INTEGER,
    mime_type VARCHAR(100),
    description TEXT,
    caption TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Key Design Decisions
- **Base64 Storage**: Images stored as base64 in `file_path` column for Vercel compatibility
- **Cascade Delete**: Photos automatically deleted when parent event is deleted
- **Metadata Tracking**: File size, MIME type, and timestamps for proper management
- **Flexible Descriptions**: Both description and caption fields for different use cases

## API Endpoints

### Photo Management APIs
```javascript
// List photos for an event
GET /api/v1/events/:eventId/photos
Authorization: Bearer <token>
Response: { success: true, photos: [...] }

// Upload new photo
POST /api/v1/events/:eventId/photos
Authorization: Bearer <token>
Body: {
  filename: "photo.jpg",
  file_data: "base64_encoded_data",
  description: "Optional description",
  caption: "Optional caption"
}
Response: { success: true, photo: {...} }

// Get photo data
GET /api/v1/photos/:photoId
Authorization: Bearer <token>
Response: Binary image data with proper headers

// Update photo metadata
PUT /api/v1/photos/:photoId
Authorization: Bearer <token>
Body: { description: "New description", caption: "New caption" }
Response: { success: true, photo: {...} }

// Delete photo
DELETE /api/v1/photos/:photoId
Authorization: Bearer <token>
Response: { success: true, message: "Photo deleted" }
```

## User Interface Design

### Photo Upload Interface
```html
<!-- Photo Upload Section -->
<div class="photo-upload-section">
  <h3>Photos</h3>
  
  <!-- Upload Buttons -->
  <div class="upload-controls mb-3">
    <button class="btn btn-primary" onclick="openPhotoUpload()">
      <i class="fas fa-upload"></i> Upload Photo
    </button>
    <button class="btn btn-success" onclick="openCameraCapture()">
      <i class="fas fa-camera"></i> Take Photo
    </button>
  </div>
  
  <!-- Photo Grid -->
  <div id="photosGrid" class="row">
    <!-- Photos will be dynamically loaded here -->
  </div>
  
  <!-- No Photos Message -->
  <div id="noPhotosMessage" class="text-center text-muted" style="display: none;">
    <i class="fas fa-images fa-3x mb-3"></i>
    <p>No photos yet. Upload some memories!</p>
  </div>
</div>
```

### Photo Display Cards
```html
<!-- Individual Photo Card -->
<div class="col-md-4 col-lg-3 mb-4">
  <div class="card">
    <img src="/api/v1/photos/123" class="card-img-top" alt="Photo">
    <div class="card-body">
      <h6 class="card-title">Photo Caption</h6>
      <p class="card-text small text-muted">Description</p>
      <div class="btn-group btn-group-sm">
        <button class="btn btn-outline-primary" onclick="editPhoto(123)">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn btn-outline-danger" onclick="deletePhoto(123)">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
  </div>
</div>
```

### Upload Modals
```html
<!-- File Upload Modal -->
<div class="modal fade" id="photoUploadModal">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Upload Photo</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body">
        <form id="photoUploadForm">
          <div class="mb-3">
            <label class="form-label">Select Photo</label>
            <input type="file" class="form-control" accept="image/*" required>
          </div>
          <div class="mb-3">
            <label class="form-label">Description</label>
            <input type="text" class="form-control" placeholder="Optional description">
          </div>
          <div class="mb-3">
            <label class="form-label">Caption</label>
            <input type="text" class="form-control" placeholder="Optional caption">
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
        <button type="submit" form="photoUploadForm" class="btn btn-primary">Upload</button>
      </div>
    </div>
  </div>
</div>

<!-- Camera Capture Modal -->
<div class="modal fade" id="cameraModal">
  <div class="modal-dialog modal-lg">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Take Photo</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body">
        <div class="camera-container">
          <video id="cameraVideo" autoplay></video>
          <canvas id="cameraCanvas" style="display: none;"></canvas>
          <img id="capturedImage" style="display: none;" class="img-fluid">
        </div>
        <div class="camera-controls mt-3">
          <button id="captureBtn" class="btn btn-primary">
            <i class="fas fa-camera"></i> Capture
          </button>
          <button id="retakeBtn" class="btn btn-warning" style="display: none;">
            <i class="fas fa-redo"></i> Retake
          </button>
        </div>
        <form id="cameraForm" style="display: none;">
          <div class="mb-3">
            <label class="form-label">Description</label>
            <input type="text" class="form-control" placeholder="Optional description">
          </div>
          <div class="mb-3">
            <label class="form-label">Caption</label>
            <input type="text" class="form-control" placeholder="Optional caption">
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
        <button id="savePhotoBtn" type="button" class="btn btn-success" style="display: none;">Save Photo</button>
      </div>
    </div>
  </div>
</div>
```

## JavaScript Functionality

### Core Photo Management Functions
```javascript
// Load photos for current event
async function loadPhotos() {
  try {
    const response = await fetch(`/api/v1/events/${eventId}/photos`, {
      headers: { 'Authorization': `Bearer ${getAuthToken()}` }
    });
    const result = await response.json();
    
    if (result.success) {
      displayPhotos(result.photos);
    } else {
      console.error('Error loading photos:', result.message);
    }
  } catch (error) {
    console.error('Error loading photos:', error);
  }
}

// Display photos in grid
function displayPhotos(photos) {
  const grid = document.getElementById('photosGrid');
  const noPhotosMsg = document.getElementById('noPhotosMessage');
  
  if (photos.length === 0) {
    grid.innerHTML = '';
    noPhotosMsg.style.display = 'block';
    return;
  }
  
  noPhotosMsg.style.display = 'none';
  grid.innerHTML = photos.map(photo => createPhotoCard(photo)).join('');
}

// Create photo card HTML
function createPhotoCard(photo) {
  return `
    <div class="col-md-4 col-lg-3 mb-4">
      <div class="card">
        <img src="/api/v1/photos/${photo.id}" 
             class="card-img-top" 
             alt="${photo.caption || 'Photo'}"
             style="height: 200px; object-fit: cover;">
        <div class="card-body">
          <h6 class="card-title">${photo.caption || 'Untitled'}</h6>
          <p class="card-text small text-muted">${photo.description || ''}</p>
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-primary" onclick="editPhoto(${photo.id})">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-outline-danger" onclick="deletePhoto(${photo.id})">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Upload photo from file
async function uploadPhoto(file, description, caption) {
  const base64 = await fileToBase64(file);
  
  const response = await fetch(`/api/v1/events/${eventId}/photos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`
    },
    body: JSON.stringify({
      filename: file.name,
      file_data: base64,
      description: description,
      caption: caption
    })
  });
  
  const result = await response.json();
  if (result.success) {
    loadPhotos(); // Refresh photo list
  } else {
    alert('Error uploading photo: ' + result.message);
  }
}

// Camera capture functionality
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    document.getElementById('cameraVideo').srcObject = stream;
  } catch (error) {
    alert('Error accessing camera: ' + error.message);
  }
}

function capturePhoto() {
  const video = document.getElementById('cameraVideo');
  const canvas = document.getElementById('cameraCanvas');
  const ctx = canvas.getContext('2d');
  
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0);
  
  const imageData = canvas.toDataURL('image/jpeg');
  document.getElementById('capturedImage').src = imageData;
  document.getElementById('capturedImage').style.display = 'block';
  document.getElementById('cameraVideo').style.display = 'none';
  document.getElementById('captureBtn').style.display = 'none';
  document.getElementById('retakeBtn').style.display = 'inline-block';
  document.getElementById('cameraForm').style.display = 'block';
  document.getElementById('savePhotoBtn').style.display = 'inline-block';
}

// Edit photo metadata
async function editPhoto(photoId) {
  const newDescription = prompt('Enter new description:');
  const newCaption = prompt('Enter new caption:');
  
  if (newDescription !== null || newCaption !== null) {
    const response = await fetch(`/api/v1/photos/${photoId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({
        description: newDescription,
        caption: newCaption
      })
    });
    
    const result = await response.json();
    if (result.success) {
      loadPhotos(); // Refresh photo list
    } else {
      alert('Error updating photo: ' + result.message);
    }
  }
}

// Delete photo
async function deletePhoto(photoId) {
  if (confirm('Are you sure you want to delete this photo?')) {
    const response = await fetch(`/api/v1/photos/${photoId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${getAuthToken()}` }
    });
    
    const result = await response.json();
    if (result.success) {
      loadPhotos(); // Refresh photo list
    } else {
      alert('Error deleting photo: ' + result.message);
    }
  }
}
```

## Security Considerations

### Authentication & Authorization
- All photo endpoints require JWT authentication
- Users can only upload photos to events they have access to
- Photo deletion requires proper authorization checks
- File type validation (images only)
- File size limits to prevent abuse

### Data Validation
```javascript
// File validation
function validateFile(file) {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only images are allowed.');
  }
  
  if (file.size > maxSize) {
    throw new Error('File too large. Maximum size is 5MB.');
  }
  
  return true;
}
```

## Performance Optimizations

### Image Handling
- Base64 encoding for Vercel compatibility
- Proper MIME type headers for browser optimization
- Cache headers for served images
- Lazy loading for photo grids
- Thumbnail generation (future enhancement)

### Database Optimization
- Indexed foreign key on `event_id`
- Proper data types for file metadata
- Cascade delete for data integrity
- Timestamp indexing for sorting

## Error Handling

### Client-Side Error Handling
```javascript
// Comprehensive error handling
function handlePhotoError(error, operation) {
  console.error(`Photo ${operation} error:`, error);
  
  let message = `Error ${operation} photo: `;
  if (error.message) {
    message += error.message;
  } else {
    message += 'Unknown error occurred';
  }
  
  // Show user-friendly error message
  alert(message);
  
  // Log for debugging
  console.error('Full error details:', error);
}
```

### Server-Side Error Handling
- Proper HTTP status codes
- Detailed error logging
- Graceful degradation
- Input validation with meaningful messages

## Future Enhancements

### Planned Features
1. **Thumbnail Generation**: Automatic thumbnail creation for faster loading
2. **Photo Albums**: Group photos into albums within events
3. **Photo Sharing**: Share individual photos or albums
4. **Bulk Operations**: Select and manage multiple photos
5. **Photo Metadata**: EXIF data extraction and display
6. **Advanced Search**: Search photos by content, date, or metadata
7. **Photo Slideshow**: Full-screen photo viewing experience
8. **Mobile Optimization**: Touch gestures for mobile photo management

### Technical Improvements
1. **CDN Integration**: Use Vercel's CDN for faster image delivery
2. **Image Compression**: Automatic image optimization
3. **Progressive Loading**: Load photos as user scrolls
4. **Offline Support**: Cache photos for offline viewing
5. **Real-time Updates**: WebSocket integration for live photo updates

## Testing Strategy

### Unit Tests
- Photo upload functionality
- Base64 encoding/decoding
- File validation
- API endpoint responses

### Integration Tests
- End-to-end photo workflow
- Database operations
- Authentication integration
- Error handling scenarios

### User Acceptance Tests
- Photo upload from file
- Camera capture functionality
- Photo editing and deletion
- Mobile device compatibility
- Performance with large photo sets

This photo management system provides a comprehensive solution for managing Thanksgiving event photos with a focus on user experience, security, and performance.

# Photo JavaScript/Backend Logic Design

## Overview
The photo JavaScript/backend logic handles all client-side photo operations, including file processing, API communication, UI updates, and user interactions. This layer bridges the frontend UI with the backend API endpoints.

## Core JavaScript Modules

### 1. Photo Manager (`photoManager.js`)
Central module for managing all photo operations.

```javascript
class PhotoManager {
  constructor(eventId, authToken) {
    this.eventId = eventId;
    this.authToken = authToken;
    this.photos = [];
    this.isLoading = false;
  }

  // Core photo operations
  async loadPhotos()
  async uploadPhoto(file, description, caption)
  async updatePhoto(photoId, description, caption)
  async deletePhoto(photoId)
  async capturePhoto(videoElement, canvasElement)
  
  // Utility functions
  async fileToBase64(file)
  validateFile(file)
  getAuthToken()
  handleError(error, operation)
}
```

### 2. Photo UI Controller (`photoUIController.js`)
Manages all UI interactions and updates.

```javascript
class PhotoUIController {
  constructor(photoManager) {
    this.photoManager = photoManager;
    this.uploadModal = null;
    this.cameraModal = null;
    this.photosGrid = null;
  }

  // UI Management
  initializeUI()
  displayPhotos(photos)
  createPhotoCard(photo)
  showUploadModal()
  showCameraModal()
  hideModals()
  
  // Event Handlers
  setupEventListeners()
  handleFileUpload(event)
  handleCameraCapture()
  handlePhotoEdit(photoId)
  handlePhotoDelete(photoId)
}
```

### 3. Camera Controller (`cameraController.js`)
Handles camera access and photo capture functionality.

```javascript
class CameraController {
  constructor(photoManager) {
    this.photoManager = photoManager;
    this.stream = null;
    this.videoElement = null;
    this.canvasElement = null;
  }

  // Camera Operations
  async startCamera()
  async stopCamera()
  capturePhoto()
  retakePhoto()
  saveCapturedPhoto(description, caption)
  
  // Utility Functions
  setupCameraElements()
  cleanupCamera()
  validateCameraSupport()
}
```

## API Communication Layer

### Photo API Client (`photoApiClient.js`)
Handles all API communication with proper error handling and authentication.

```javascript
class PhotoApiClient {
  constructor(baseUrl, authToken) {
    this.baseUrl = baseUrl;
    this.authToken = authToken;
  }

  // API Methods
  async getPhotos(eventId)
  async uploadPhoto(eventId, photoData)
  async getPhoto(photoId)
  async updatePhoto(photoId, updateData)
  async deletePhoto(photoId)
  
  // Utility Methods
  async makeRequest(endpoint, options)
  handleApiError(response)
  getAuthHeaders()
}
```

## File Processing Utilities

### File Utilities (`fileUtils.js`)
Handles file validation, conversion, and processing.

```javascript
class FileUtils {
  // File Validation
  static validateFile(file)
  static validateImageFile(file)
  static validateFileSize(file, maxSize = 5MB)
  static validateFileType(file, allowedTypes)
  
  // File Conversion
  static async fileToBase64(file)
  static async base64ToBlob(base64, mimeType)
  static compressImage(file, quality = 0.8)
  
  // File Information
  static getFileInfo(file)
  static getMimeType(filename)
  static calculateFileSize(base64Data)
}
```

## Error Handling System

### Error Handler (`errorHandler.js`)
Centralized error handling and user feedback.

```javascript
class ErrorHandler {
  // Error Types
  static ERROR_TYPES = {
    NETWORK: 'NETWORK_ERROR',
    VALIDATION: 'VALIDATION_ERROR',
    AUTHENTICATION: 'AUTH_ERROR',
    PERMISSION: 'PERMISSION_ERROR',
    UNKNOWN: 'UNKNOWN_ERROR'
  };

  // Error Handling
  static handleError(error, context)
  static logError(error, context)
  static showUserError(error, context)
  static getErrorMessage(error)
  
  // User Feedback
  static showSuccess(message)
  static showWarning(message)
  static showInfo(message)
}
```

## State Management

### Photo State (`photoState.js`)
Manages application state for photo operations.

```javascript
class PhotoState {
  constructor() {
    this.photos = [];
    this.currentEvent = null;
    this.isLoading = false;
    this.error = null;
    this.uploadProgress = 0;
  }

  // State Management
  setPhotos(photos)
  addPhoto(photo)
  updatePhoto(photoId, updates)
  removePhoto(photoId)
  setLoading(loading)
  setError(error)
  setUploadProgress(progress)
  
  // Getters
  getPhotos()
  getPhotoById(id)
  getLoadingState()
  getErrorState()
}
```

## Event System

### Photo Events (`photoEvents.js`)
Custom event system for photo operations.

```javascript
class PhotoEvents {
  constructor() {
    this.events = {};
  }

  // Event Management
  on(event, callback)
  off(event, callback)
  emit(event, data)
  
  // Photo-specific Events
  PHOTO_UPLOADED = 'photo:uploaded'
  PHOTO_UPDATED = 'photo:updated'
  PHOTO_DELETED = 'photo:deleted'
  PHOTO_LOADED = 'photo:loaded'
  UPLOAD_PROGRESS = 'upload:progress'
  ERROR_OCCURRED = 'error:occurred'
}
```

## Integration Points

### 1. EJS Template Integration
```javascript
// In detail.ejs template
<script>
  document.addEventListener('DOMContentLoaded', function() {
    const eventId = <%= event.id %>;
    const authToken = getAuthToken();
    
    const photoManager = new PhotoManager(eventId, authToken);
    const uiController = new PhotoUIController(photoManager);
    
    uiController.initializeUI();
    photoManager.loadPhotos();
  });
</script>
```

### 2. API Endpoint Integration
```javascript
// All API calls use the PhotoApiClient
const apiClient = new PhotoApiClient('/api/v1', authToken);
const photos = await apiClient.getPhotos(eventId);
```

### 3. Error Handling Integration
```javascript
// Centralized error handling
try {
  await photoManager.uploadPhoto(file, description, caption);
} catch (error) {
  ErrorHandler.handleError(error, 'photo_upload');
}
```

## Performance Optimizations

### 1. Lazy Loading
- Load photos as user scrolls
- Implement virtual scrolling for large photo sets
- Cache frequently accessed photos

### 2. Image Optimization
- Automatic image compression
- Thumbnail generation
- Progressive loading

### 3. Memory Management
- Clean up event listeners
- Dispose of camera streams
- Clear unused photo data

## Security Considerations

### 1. Input Validation
- File type validation
- File size limits
- XSS prevention in descriptions/captions

### 2. Authentication
- JWT token management
- Automatic token refresh
- Secure token storage

### 3. Data Sanitization
- Sanitize user inputs
- Validate API responses
- Prevent malicious file uploads

## Testing Strategy

### 1. Unit Tests
- Test individual functions and methods
- Mock API calls and DOM interactions
- Test error handling scenarios

### 2. Integration Tests
- Test component interactions
- Test API communication
- Test UI updates

### 3. End-to-End Tests
- Test complete user workflows
- Test camera functionality
- Test file upload/download

## Browser Compatibility

### 1. Modern Browsers
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### 2. Feature Detection
- Camera API support
- File API support
- Canvas API support
- Fetch API support

### 3. Fallbacks
- File input fallback for camera
- Basic upload for advanced features
- Graceful degradation

This JavaScript/backend logic design provides a robust, maintainable, and scalable foundation for photo management functionality.

# Enhanced Menu Details Page Design Options

## Overview
The enhanced menu details page will provide a comprehensive view of each Thanksgiving event, including the original menu image, uploaded photos, recipes, and blog posts. This creates a rich, multi-media experience for users to explore and engage with Thanksgiving memories.

## Design Option 1: Single Page with Tabbed Navigation

### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│                    Thanksgiving 2023                        │
│                    November 23, 2023                        │
├─────────────────────────────────────────────────────────────┤
│  [Menu Image]  │  [Event Details]  │  [Quick Stats]        │
│                │  - Location       │  - Photos: 12         │
│                │  - Host           │  - Recipes: 8         │
│                │  - Attendees      │  - Blog Posts: 3      │
├─────────────────────────────────────────────────────────────┤
│  [Photos] [Recipes] [Blog] [Comments]                      │
├─────────────────────────────────────────────────────────────┤
│  Content Area (changes based on selected tab)              │
│                                                             │
│  Photos Tab: Photo grid with upload/camera options         │
│  Recipes Tab: Recipe cards with search and filtering       │
│  Blog Tab: Blog post list with read more functionality     │
│  Comments Tab: Comment system with replies                 │
└─────────────────────────────────────────────────────────────┘
```

### Features
- **Hero Section**: Large menu image with event details overlay
- **Tabbed Navigation**: Easy switching between content types
- **Quick Stats**: Overview of content available
- **Responsive Design**: Works on all device sizes
- **Search/Filter**: Within each content type

## Design Option 2: Multi-Page Approach

### Page Structure
```
1. Main Details Page
   ├── Menu Image (large, prominent)
   ├── Event Information
   ├── Quick Navigation Cards
   │   ├── [Photos] → Photos Page
   │   ├── [Recipes] → Recipes Page
   │   ├── [Blog] → Blog Page
   │   └── [Comments] → Comments Page
   └── Recent Activity Feed

2. Photos Page
   ├── Photo Grid (enhanced)
   ├── Upload/Camera Options
   ├── Photo Categories/Tags
   └── Photo Slideshow Mode

3. Recipes Page
   ├── Recipe Grid/List
   ├── Search and Filter
   ├── Recipe Categories
   └── Recipe Detail Modal/Page

4. Blog Page
   ├── Blog Post List
   ├── Search and Filter
   ├── Blog Categories
   └── Full Blog Post View

5. Comments Page
   ├── Comment Thread
   ├── Reply System
   ├── Comment Moderation
   └── Comment Statistics
```

## Design Option 3: Dashboard-Style Layout

### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│                    Thanksgiving 2023                        │
│                    November 23, 2023                        │
├─────────────────────────────────────────────────────────────┤
│  [Menu Image]  │  [Event Details]  │  [Quick Actions]      │
│                │  - Location       │  - Upload Photo       │
│                │  - Host           │  - Add Recipe         │
│                │  - Attendees      │  - Write Blog         │
├─────────────────────────────────────────────────────────────┤
│  [Content Grid - 2x2 Layout]                               │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐ │
│  │   Photos    │  Recipes    │    Blog     │  Comments   │ │
│  │   (12)      │    (8)      │     (3)     │     (15)    │ │
│  │             │             │             │             │ │
│  │ [View All]  │ [View All]  │ [View All]  │ [View All]  │ │
│  └─────────────┴─────────────┴─────────────┴─────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  [Recent Activity Timeline]                                │
│  - Photo uploaded by Bob (2 hours ago)                     │
│  - Recipe added by Sarah (1 day ago)                       │
│  - Blog post published by Mom (3 days ago)                 │
└─────────────────────────────────────────────────────────────┘
```

## Design Option 4: Mobile-First Card Layout

### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│                    Thanksgiving 2023                        │
│                    November 23, 2023                        │
├─────────────────────────────────────────────────────────────┤
│  [Menu Image - Full Width]                                 │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [Event Details Card]                                       │
│  - Location: Family Home                                    │
│  - Host: Mom & Dad                                          │
│  - Attendees: 15 people                                     │
├─────────────────────────────────────────────────────────────┤
│  [Content Cards - Stacked]                                 │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  📸 Photos (12)                    [View All] →        │ │
│  │  [Photo Preview Grid]                                  │ │
│  └─────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  🍽️ Recipes (8)                   [View All] →        │ │
│  │  [Recipe Preview Cards]                                │ │
│  └─────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  📝 Blog (3)                       [View All] →        │ │
│  │  [Blog Post Previews]                                  │ │
│  └─────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  💬 Comments (15)                  [View All] →        │ │
│  │  [Recent Comments]                                     │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Design Option 5: Timeline-Based Layout

### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│                    Thanksgiving 2023                        │
│                    November 23, 2023                        │
├─────────────────────────────────────────────────────────────┤
│  [Menu Image - Hero Section]                               │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [Timeline Navigation]                                      │
│  [Before] [During] [After] [Recipes] [Blog]                │
├─────────────────────────────────────────────────────────────┤
│  [Timeline Content]                                         │
│                                                             │
│  Before Thanksgiving:                                       │
│  - Recipe planning blog posts                              │
│  - Shopping list photos                                    │
│  - Preparation photos                                      │
│                                                             │
│  During Thanksgiving:                                       │
│  - Menu photos                                             │
│  - Family photos                                           │
│  - Cooking process photos                                  │
│                                                             │
│  After Thanksgiving:                                        │
│  - Leftover recipe ideas                                   │
│  - Reflection blog posts                                   │
│  - Thank you notes                                         │
│                                                             │
│  Recipes:                                                  │
│  - All recipes from this year                              │
│  - Family favorites                                        │
│  - New experiments                                         │
│                                                             │
│  Blog:                                                     │
│  - Preparation stories                                     │
│  - Cooking adventures                                      │
│  - Family memories                                         │
└─────────────────────────────────────────────────────────────┘
```

## Design Option 6: Magazine-Style Layout

### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│                    Thanksgiving 2023                        │
│                    November 23, 2023                        │
├─────────────────────────────────────────────────────────────┤
│  [Menu Image - Large Hero]                                 │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [Featured Content Row]                                     │
│  ┌─────────────┬─────────────┬─────────────┐               │
│  │  Featured   │  Featured   │  Featured   │               │
│  │   Photo     │   Recipe    │   Blog      │               │
│  │             │             │             │               │
│  │ [View All]  │ [View All]  │ [View All]  │               │
│  └─────────────┴─────────────┴─────────────┘               │
├─────────────────────────────────────────────────────────────┤
│  [Content Sections]                                         │
│                                                             │
│  📸 Photos Section                                          │
│  [Photo Grid with Categories]                               │
│                                                             │
│  🍽️ Recipes Section                                         │
│  [Recipe Cards with Search]                                 │
│                                                             │
│  📝 Blog Section                                            │
│  [Blog Post List with Excerpts]                             │
│                                                             │
│  💬 Comments Section                                        │
│  [Comment Thread with Replies]                              │
└─────────────────────────────────────────────────────────────┘
```

## Recommended Approach: Hybrid Design

### Primary Layout: Option 1 (Tabbed Navigation)
- **Best for**: Desktop users who want to see all content in one place
- **Advantages**: Easy navigation, all content accessible, good for power users
- **Mobile**: Collapses to Option 4 (Card Layout)

### Secondary Layout: Option 4 (Mobile-First Cards)
- **Best for**: Mobile users and casual browsing
- **Advantages**: Touch-friendly, easy to scan, good for quick access
- **Desktop**: Can be used as an alternative view

### Content Organization:
1. **Hero Section**: Menu image with event details
2. **Quick Stats**: Overview of available content
3. **Tabbed Navigation**: Photos, Recipes, Blog, Comments
4. **Content Areas**: Each tab shows relevant content
5. **Search/Filter**: Within each content type
6. **Recent Activity**: Timeline of recent additions

## Implementation Strategy

### Phase 1: Enhanced Details Page
- Add tabbed navigation to existing details page
- Implement photo section (already done)
- Add placeholder sections for recipes and blog

### Phase 2: Recipe Management
- Create recipe database schema
- Implement recipe CRUD operations
- Add recipe search and filtering

### Phase 3: Blog Management
- Create blog post database schema
- Implement blog CRUD operations
- Add blog post editor and viewer

### Phase 4: Comments System
- Create comments database schema
- Implement comment CRUD operations
- Add comment moderation features

### Phase 5: Advanced Features
- Search across all content types
- Content recommendations
- Social sharing features
- Content analytics

## Database Schema Additions

### Recipes Table
```sql
CREATE TABLE "Recipes" (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES "Events"(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    ingredients TEXT NOT NULL,
    instructions TEXT NOT NULL,
    prep_time INTEGER, -- minutes
    cook_time INTEGER, -- minutes
    servings INTEGER,
    difficulty VARCHAR(50), -- easy, medium, hard
    category VARCHAR(100), -- appetizer, main, side, dessert
    image_url VARCHAR(500),
    created_by INTEGER REFERENCES "Users"(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Blog Posts Table
```sql
CREATE TABLE "BlogPosts" (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES "Events"(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    status VARCHAR(50) DEFAULT 'draft', -- draft, published, archived
    featured_image VARCHAR(500),
    tags TEXT[], -- array of tags
    created_by INTEGER REFERENCES "Users"(id),
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Comments Table
```sql
CREATE TABLE "Comments" (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES "Events"(id) ON DELETE CASCADE,
    content_type VARCHAR(50) NOT NULL, -- photo, recipe, blog
    content_id INTEGER NOT NULL,
    parent_id INTEGER REFERENCES "Comments"(id), -- for replies
    content TEXT NOT NULL,
    created_by INTEGER REFERENCES "Users"(id),
    status VARCHAR(50) DEFAULT 'approved', -- pending, approved, rejected
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

This design provides a comprehensive, user-friendly way to access all Thanksgiving content while maintaining good performance and usability across different devices and user preferences.

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

---

# User Profile Management System

## Overview

A comprehensive user profile management system that allows users to update their own account information while maintaining proper security boundaries. Only administrators can modify user roles, ensuring proper access control.

## Design Goals

1. **User Self-Service**: Users can update their own profile information
2. **Security**: Sensitive operations (role changes) restricted to admins only
3. **User Experience**: Intuitive interface with clear feedback
4. **Data Validation**: Comprehensive input validation and error handling
5. **Consistency**: Follows established authentication and UI patterns

## User Interface Design

### Profile Page Layout
```
┌─────────────────────────────────────────────────────────────┐
│                    User Profile Management                  │
├─────────────────────────────────────────────────────────────┤
│  Navigation: [Home] [Profile] [Admin] [Logout]             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐  ┌─────────────────────────────────┐  │
│  │   Profile Info  │  │        Account Settings        │  │
│  │                 │  │                                 │  │
│  │  Username: bob  │  │  Email: bob@example.com        │  │
│  │  Role: user     │  │  [Edit Email]                  │  │
│  │  Joined: 2024   │  │                                 │  │
│  │                 │  │  Password: ••••••••             │  │
│  │                 │  │  [Change Password]              │  │
│  └─────────────────┘  │                                 │  │
│                       │  First Name: Bob                │  │
│  ┌─────────────────┐  │  [Edit First Name]              │  │
│  │   Quick Stats   │  │                                 │  │
│  │                 │  │  Last Name: Maguire             │  │
│  │  Events: 5      │  │  [Edit Last Name]               │  │
│  │  Photos: 12     │  │                                 │  │
│  │  Comments: 3    │  └─────────────────────────────────┘  │
│  └─────────────────┘                                       │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              Admin-Only Section (if admin)              │ │
│  │                                                         │ │
│  │  Role Management:                                       │ │
│  │  [Change User Role] [View All Users]                   │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Edit Modal Design
```
┌─────────────────────────────────────────────────────────────┐
│                    Edit Email Address                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Current Email: bob@example.com                            │
│                                                             │
│  New Email: [________________]                             │
│                                                             │
│  Confirm Email: [________________]                         │
│                                                             │
│  Password: [________________] (required for verification)  │
│                                                             │
│  [Cancel]                                    [Save Changes] │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema Updates

### Users Table (No Changes Required)
The existing `Users` table already has all necessary fields:
```sql
CREATE TABLE "Users" (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role enum_users_role DEFAULT 'user',
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints Design

### User Profile Endpoints

#### 1. Get Current User Profile
```http
GET /api/v1/profile
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 3,
    "username": "bob",
    "email": "bob@example.com",
    "first_name": "Bob",
    "last_name": "Maguire",
    "role": "user",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

#### 2. Update User Profile
```http
PUT /api/v1/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "newemail@example.com",
  "first_name": "Robert",
  "last_name": "Maguire",
  "current_password": "currentpassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "id": 3,
    "username": "bob",
    "email": "newemail@example.com",
    "first_name": "Robert",
    "last_name": "Maguire",
    "role": "user",
    "updated_at": "2024-01-15T11:45:00Z"
  }
}
```

#### 3. Change Password
```http
PUT /api/v1/profile/password
Authorization: Bearer <token>
Content-Type: application/json

{
  "current_password": "oldpassword123",
  "new_password": "newpassword456",
  "confirm_password": "newpassword456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

### Admin-Only Endpoints

#### 4. Get All Users (Admin Only)
```http
GET /api/v1/admin/users
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "id": 1,
      "username": "admin",
      "email": "admin@thanksgiving.com",
      "first_name": "Admin",
      "last_name": "User",
      "role": "admin",
      "created_at": "2024-01-01T00:00:00Z"
    },
    {
      "id": 3,
      "username": "bob",
      "email": "bob@example.com",
      "first_name": "Bob",
      "last_name": "Maguire",
      "role": "user",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### 5. Update User Role (Admin Only)
```http
PUT /api/v1/admin/users/:userId/role
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "role": "admin"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User role updated successfully",
  "user": {
    "id": 3,
    "username": "bob",
    "role": "admin"
  }
}
```

## Security Implementation

### Password Verification
All profile updates require current password verification:
```javascript
// Verify current password before allowing updates
const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
if (!isValidPassword) {
  return res.status(401).json({
    success: false,
    error: 'Invalid current password'
  });
}
```

### Role-Based Access Control
```javascript
// Admin-only middleware
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  } else {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }
};
```

### Input Validation
```javascript
// Email validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  return res.status(400).json({
    success: false,
    error: 'Invalid email format'
  });
}

// Password strength validation
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
if (!passwordRegex.test(newPassword)) {
  return res.status(400).json({
    success: false,
    error: 'Password must be at least 8 characters with uppercase, lowercase, and number'
  });
}
```

## Frontend Implementation

### Profile Page (EJS Template)
```html
<!-- views/auth/profile.ejs -->
<div class="profile-container">
  <div class="profile-header">
    <h1>User Profile</h1>
    <p>Manage your account settings and personal information</p>
  </div>

  <div class="profile-content">
    <div class="profile-info">
      <h3>Profile Information</h3>
      <div class="info-item">
        <label>Username:</label>
        <span><%= user.username %></span>
      </div>
      <div class="info-item">
        <label>Role:</label>
        <span class="role-badge <%= user.role %>"><%= user.role %></span>
      </div>
      <div class="info-item">
        <label>Member Since:</label>
        <span><%= new Date(user.created_at).toLocaleDateString() %></span>
      </div>
    </div>

    <div class="account-settings">
      <h3>Account Settings</h3>
      
      <!-- Email Section -->
      <div class="setting-item">
        <label>Email Address:</label>
        <span id="current-email"><%= user.email %></span>
        <button onclick="openEditModal('email')" class="btn-edit">Edit</button>
      </div>

      <!-- Password Section -->
      <div class="setting-item">
        <label>Password:</label>
        <span>••••••••</span>
        <button onclick="openEditModal('password')" class="btn-edit">Change</button>
      </div>

      <!-- Name Sections -->
      <div class="setting-item">
        <label>First Name:</label>
        <span id="current-first-name"><%= user.first_name || 'Not set' %></span>
        <button onclick="openEditModal('first_name')" class="btn-edit">Edit</button>
      </div>

      <div class="setting-item">
        <label>Last Name:</label>
        <span id="current-last-name"><%= user.last_name || 'Not set' %></span>
        <button onclick="openEditModal('last_name')" class="btn-edit">Edit</button>
      </div>
    </div>

    <!-- Admin Section (only visible to admins) -->
    <% if (user.role === 'admin') { %>
    <div class="admin-section">
      <h3>Administration</h3>
      <div class="admin-actions">
        <a href="/admin/users" class="btn btn-primary">Manage Users</a>
        <a href="/admin" class="btn btn-secondary">Admin Dashboard</a>
      </div>
    </div>
    <% } %>
  </div>
</div>
```

### JavaScript for Profile Management
```javascript
// Profile management functionality
class ProfileManager {
  constructor() {
    this.authToken = localStorage.getItem('authToken');
    this.init();
  }

  init() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Modal form submissions
    document.getElementById('edit-form').addEventListener('submit', this.handleEditSubmit.bind(this));
    document.getElementById('password-form').addEventListener('submit', this.handlePasswordSubmit.bind(this));
  }

  openEditModal(field) {
    const modal = document.getElementById('edit-modal');
    const fieldInput = document.getElementById('field-input');
    const fieldLabel = document.getElementById('field-label');
    
    // Set up modal based on field type
    const fieldConfig = {
      email: { label: 'Email Address', type: 'email', placeholder: 'Enter new email' },
      first_name: { label: 'First Name', type: 'text', placeholder: 'Enter first name' },
      last_name: { label: 'Last Name', type: 'text', placeholder: 'Enter last name' }
    };

    const config = fieldConfig[field];
    fieldLabel.textContent = config.label;
    fieldInput.type = config.type;
    fieldInput.placeholder = config.placeholder;
    fieldInput.dataset.field = field;
    
    modal.style.display = 'block';
  }

  async handleEditSubmit(e) {
    e.preventDefault();
    
    const field = e.target.querySelector('[data-field]').dataset.field;
    const value = e.target.querySelector('[data-field]').value;
    const currentPassword = e.target.querySelector('#current-password').value;

    try {
      const response = await fetch('/api/v1/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify({
          [field]: value,
          current_password: currentPassword
        })
      });

      const data = await response.json();
      
      if (data.success) {
        this.showMessage('Profile updated successfully', 'success');
        this.updateDisplay(field, value);
        this.closeModal();
      } else {
        this.showMessage(data.error || 'Update failed', 'error');
      }
    } catch (error) {
      this.showMessage('Network error occurred', 'error');
    }
  }

  async handlePasswordSubmit(e) {
    e.preventDefault();
    
    const currentPassword = e.target.querySelector('#current-password').value;
    const newPassword = e.target.querySelector('#new-password').value;
    const confirmPassword = e.target.querySelector('#confirm-password').value;

    if (newPassword !== confirmPassword) {
      this.showMessage('New passwords do not match', 'error');
      return;
    }

    try {
      const response = await fetch('/api/v1/profile/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword
        })
      });

      const data = await response.json();
      
      if (data.success) {
        this.showMessage('Password changed successfully', 'success');
        this.closeModal();
        e.target.reset();
      } else {
        this.showMessage(data.error || 'Password change failed', 'error');
      }
    } catch (error) {
      this.showMessage('Network error occurred', 'error');
    }
  }

  updateDisplay(field, value) {
    const element = document.getElementById(`current-${field.replace('_', '-')}`);
    if (element) {
      element.textContent = value || 'Not set';
    }
  }

  showMessage(message, type) {
    // Implementation for showing success/error messages
    const messageDiv = document.createElement('div');
    messageDiv.className = `alert alert-${type === 'success' ? 'success' : 'danger'}`;
    messageDiv.textContent = message;
    
    document.querySelector('.profile-content').insertBefore(messageDiv, document.querySelector('.profile-content').firstChild);
    
    setTimeout(() => {
      messageDiv.remove();
    }, 5000);
  }

  closeModal() {
    document.getElementById('edit-modal').style.display = 'none';
    document.getElementById('password-modal').style.display = 'none';
  }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  new ProfileManager();
});
```

## Implementation Phases

### Phase 1: Database & API Endpoints
1. Create profile management API endpoints
2. Implement password verification logic
3. Add input validation and error handling
4. Create admin-only role management endpoints

### Phase 2: Frontend Implementation
1. Create profile page EJS template
2. Implement JavaScript for profile management
3. Add modal forms for editing
4. Create admin user management interface

### Phase 3: Testing & Security
1. Write comprehensive tests for all endpoints
2. Test role-based access control
3. Validate input sanitization
4. Test password change functionality

### Phase 4: UI/UX Polish
1. Add loading states and animations
2. Improve error messaging
3. Add confirmation dialogs for sensitive operations
4. Mobile responsiveness testing

## Security Considerations

### Data Protection
- All profile updates require current password verification
- Password changes require confirmation
- Email changes require verification (future enhancement)
- Role changes restricted to admins only

### Input Validation
- Email format validation
- Password strength requirements
- XSS prevention through proper escaping
- SQL injection prevention through parameterized queries

### Access Control
- JWT token verification for all endpoints
- Role-based middleware for admin functions
- User can only modify their own profile
- Admins can modify any user's role

## Future Enhancements

### Planned Features
1. **Email Verification**: Send verification emails for email changes
2. **Two-Factor Authentication**: Add 2FA for enhanced security
3. **Profile Pictures**: Allow users to upload profile avatars
4. **Activity Log**: Track profile changes and login history
5. **Bulk User Management**: Admin tools for managing multiple users

### Technical Improvements
1. **Rate Limiting**: Prevent brute force attacks on password changes
2. **Audit Logging**: Log all profile changes for security
3. **Session Management**: Allow users to view active sessions
4. **Account Recovery**: Password reset functionality
5. **Data Export**: Allow users to export their data

This design provides a comprehensive, secure, and user-friendly profile management system that maintains proper security boundaries while giving users control over their account information.

---

# User Profile Management Implementation Plan

## Overview

This implementation plan follows our established Test-Driven Development (TDD) approach and design-first conventions. The plan is structured in 4 phases, with comprehensive testing at each stage.

## Implementation Strategy

### TDD Approach
1. **Write Tests First**: Create comprehensive test suites before implementing functionality
2. **Red-Green-Refactor**: Write failing tests, implement to pass, then refactor
3. **Test Coverage**: Aim for 100% test coverage of all functionality
4. **Integration Testing**: Test complete user workflows end-to-end

### Development Phases

## Phase 1: Test Suite Creation (Week 1)

### 1.1 Database Tests
**File**: `tests/models/UserProfile.test.js`

```javascript
describe('User Profile Management', () => {
  describe('User Model Profile Methods', () => {
    test('should update user email', async () => {
      // Test email update functionality
    });
    
    test('should update user first and last name', async () => {
      // Test name update functionality
    });
    
    test('should validate email format', async () => {
      // Test email validation
    });
    
    test('should hash password correctly', async () => {
      // Test password hashing
    });
    
    test('should verify password correctly', async () => {
      // Test password verification
    });
  });
});
```

### 1.2 API Endpoint Tests
**File**: `tests/controllers/profileController.test.js`

```javascript
describe('Profile API Endpoints', () => {
  describe('GET /api/v1/profile', () => {
    test('should return current user profile', async () => {
      // Test profile retrieval
    });
    
    test('should require authentication', async () => {
      // Test authentication requirement
    });
  });
  
  describe('PUT /api/v1/profile', () => {
    test('should update user profile with valid data', async () => {
      // Test profile update
    });
    
    test('should require current password verification', async () => {
      // Test password verification requirement
    });
    
    test('should validate email format', async () => {
      // Test email validation
    });
    
    test('should reject invalid current password', async () => {
      // Test password verification failure
    });
  });
  
  describe('PUT /api/v1/profile/password', () => {
    test('should change password with valid current password', async () => {
      // Test password change
    });
    
    test('should require password confirmation', async () => {
      // Test password confirmation requirement
    });
    
    test('should validate password strength', async () => {
      // Test password strength validation
    });
  });
});
```

### 1.3 Admin Endpoint Tests
**File**: `tests/controllers/adminProfileController.test.js`

```javascript
describe('Admin Profile Endpoints', () => {
  describe('GET /api/v1/admin/users', () => {
    test('should return all users for admin', async () => {
      // Test admin user listing
    });
    
    test('should require admin role', async () => {
      // Test admin role requirement
    });
  });
  
  describe('PUT /api/v1/admin/users/:userId/role', () => {
    test('should update user role for admin', async () => {
      // Test role update
    });
    
    test('should prevent admin from changing own role', async () => {
      // Test self-role-change prevention
    });
  });
});
```

### 1.4 Integration Tests
**File**: `tests/integration/profileIntegration.test.js`

```javascript
describe('Profile Management Integration', () => {
  test('complete profile update workflow', async () => {
    // Test complete user profile update flow
  });
  
  test('password change workflow', async () => {
    // Test complete password change flow
  });
  
  test('admin role management workflow', async () => {
    // Test complete admin role management flow
  });
});
```

### 1.5 Frontend Tests
**File**: `tests/frontend/profilePage.test.js`

```javascript
describe('Profile Page Frontend', () => {
  test('should display user profile information', () => {
    // Test profile page rendering
  });
  
  test('should open edit modals correctly', () => {
    // Test modal functionality
  });
  
  test('should validate form inputs', () => {
    // Test client-side validation
  });
  
  test('should handle API responses', () => {
    // Test API response handling
  });
});
```

## Phase 2: API Implementation (Week 2)

### 2.1 Create Profile Controller
**File**: `src/controllers/profileController.js`

```javascript
// Profile management controller
class ProfileController {
  // Get current user profile
  async getProfile(req, res) {
    // Implementation following TDD
  }
  
  // Update user profile
  async updateProfile(req, res) {
    // Implementation following TDD
  }
  
  // Change password
  async changePassword(req, res) {
    // Implementation following TDD
  }
}
```

### 2.2 Create Admin Profile Controller
**File**: `src/controllers/adminProfileController.js`

```javascript
// Admin profile management controller
class AdminProfileController {
  // Get all users
  async getAllUsers(req, res) {
    // Implementation following TDD
  }
  
  // Update user role
  async updateUserRole(req, res) {
    // Implementation following TDD
  }
}
```

### 2.3 Add Profile Routes
**File**: `src/routes/profileRoutes.js`

```javascript
// Profile management routes
router.get('/profile', requireAuth, profileController.getProfile);
router.put('/profile', requireAuth, profileController.updateProfile);
router.put('/profile/password', requireAuth, profileController.changePassword);

// Admin routes
router.get('/admin/users', requireAuth, requireAdmin, adminProfileController.getAllUsers);
router.put('/admin/users/:userId/role', requireAuth, requireAdmin, adminProfileController.updateUserRole);
```

### 2.4 Update User Model
**File**: `models/User.js`

```javascript
// Add profile management methods to User model
User.prototype.updateProfile = async function(updateData) {
  // Implementation following TDD
};

User.prototype.changePassword = async function(currentPassword, newPassword) {
  // Implementation following TDD
};

User.prototype.verifyPassword = async function(password) {
  // Implementation following TDD
};
```

## Phase 3: Frontend Implementation (Week 3)

### 3.1 Create Profile Page Template
**File**: `views/auth/profile.ejs`

```html
<!-- Complete profile page following design mockup -->
<div class="profile-container">
  <!-- Profile information section -->
  <!-- Account settings section -->
  <!-- Admin section (conditional) -->
</div>
```

### 3.2 Create Edit Modals
**File**: `views/partials/profileModals.ejs`

```html
<!-- Email edit modal -->
<!-- Password change modal -->
<!-- Name edit modals -->
```

### 3.3 Implement JavaScript Classes
**File**: `public/javascript/profileManager.js`

```javascript
class ProfileManager {
  constructor() {
    // Initialize profile management
  }
  
  openEditModal(field) {
    // Modal management
  }
  
  handleEditSubmit(e) {
    // Form submission handling
  }
  
  handlePasswordSubmit(e) {
    // Password change handling
  }
}
```

### 3.4 Add CSS Styling
**File**: `public/css/profile.css`

```css
/* Profile page styling following design */
.profile-container { }
.profile-info { }
.account-settings { }
.admin-section { }
/* Modal styling */
/* Form styling */
```

## Phase 4: Integration & Deployment (Week 4)

### 4.1 End-to-End Testing
**File**: `tests/e2e/profileWorkflow.test.js`

```javascript
describe('Profile Management E2E', () => {
  test('user can update profile information', async () => {
    // Complete user workflow test
  });
  
  test('user can change password', async () => {
    // Complete password change workflow
  });
  
  test('admin can manage user roles', async () => {
    // Complete admin workflow test
  });
});
```

### 4.2 Security Testing
**File**: `tests/security/profileSecurity.test.js`

```javascript
describe('Profile Security', () => {
  test('prevents unauthorized profile access', async () => {
    // Test unauthorized access prevention
  });
  
  test('validates input sanitization', async () => {
    // Test XSS prevention
  });
  
  test('enforces password requirements', async () => {
    // Test password strength enforcement
  });
});
```

### 4.3 Performance Testing
**File**: `tests/performance/profilePerformance.test.js`

```javascript
describe('Profile Performance', () => {
  test('profile page loads within acceptable time', async () => {
    // Test page load performance
  });
  
  test('API responses are fast', async () => {
    // Test API response times
  });
});
```

## Testing Strategy

### Test Categories

#### 1. Unit Tests
- **Model Methods**: Test individual User model methods
- **Controller Functions**: Test individual controller functions
- **Validation Logic**: Test input validation functions
- **Utility Functions**: Test helper functions

#### 2. Integration Tests
- **API Endpoints**: Test complete API workflows
- **Database Operations**: Test database interactions
- **Authentication Flow**: Test auth integration
- **Error Handling**: Test error scenarios

#### 3. Frontend Tests
- **Component Rendering**: Test EJS template rendering
- **JavaScript Functionality**: Test client-side logic
- **Form Validation**: Test form validation
- **Modal Management**: Test modal interactions

#### 4. End-to-End Tests
- **Complete Workflows**: Test full user journeys
- **Cross-Browser Testing**: Test in different browsers
- **Mobile Responsiveness**: Test on mobile devices
- **Accessibility**: Test accessibility compliance

### Test Data Management

#### Test Database Setup
```javascript
// tests/helpers/profileTestData.js
const createTestUser = async () => {
  // Create test user for profile tests
};

const createTestAdmin = async () => {
  // Create test admin for admin tests
};

const cleanupTestData = async () => {
  // Clean up test data after tests
};
```

#### Mock Data
```javascript
// tests/mocks/profileMocks.js
const mockProfileData = {
  validUser: {
    username: 'testuser',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User'
  },
  invalidData: {
    invalidEmail: 'invalid-email',
    weakPassword: '123',
    emptyFields: {}
  }
};
```

## Implementation Timeline

### Week 1: Test Suite Creation
- **Day 1-2**: Database and model tests
- **Day 3-4**: API endpoint tests
- **Day 5**: Integration and frontend tests

### Week 2: API Implementation
- **Day 1-2**: Profile controller implementation
- **Day 3-4**: Admin controller implementation
- **Day 5**: Route integration and testing

### Week 3: Frontend Implementation
- **Day 1-2**: EJS template creation
- **Day 3-4**: JavaScript functionality
- **Day 5**: CSS styling and responsive design

### Week 4: Integration & Deployment
- **Day 1-2**: End-to-end testing
- **Day 3**: Security and performance testing
- **Day 4-5**: Deployment and monitoring

## Quality Assurance

### Code Quality
- **ESLint**: Enforce coding standards
- **Prettier**: Consistent code formatting
- **JSDoc**: Comprehensive documentation
- **Type Checking**: TypeScript or JSDoc types

### Security Review
- **Input Validation**: Comprehensive input sanitization
- **Authentication**: Proper JWT token handling
- **Authorization**: Role-based access control
- **SQL Injection**: Parameterized queries only

### Performance Monitoring
- **Response Times**: API response time monitoring
- **Database Queries**: Query performance optimization
- **Frontend Loading**: Page load time optimization
- **Memory Usage**: Memory leak detection

## Deployment Strategy

### Staging Environment
1. Deploy to Vercel preview environment
2. Run full test suite
3. Perform security testing
4. User acceptance testing

### Production Deployment
1. Deploy to production Vercel environment
2. Monitor for errors and performance
3. Verify all functionality works
4. Update documentation

## Success Criteria

### Functional Requirements
- ✅ Users can update their profile information
- ✅ Users can change their passwords
- ✅ Admins can manage user roles
- ✅ All operations require proper authentication
- ✅ Input validation prevents invalid data

### Non-Functional Requirements
- ✅ Page loads in under 2 seconds
- ✅ API responses in under 500ms
- ✅ 100% test coverage
- ✅ Zero security vulnerabilities
- ✅ Mobile responsive design

### User Experience
- ✅ Intuitive interface design
- ✅ Clear error messages
- ✅ Smooth modal interactions
- ✅ Consistent styling
- ✅ Accessible to all users

This implementation plan ensures a robust, secure, and user-friendly profile management system that follows our established conventions and maintains high quality standards throughout the development process.

### 11. Database Setup Conventions

#### Problem Solved
Database setup on Vercel/Neon PostgreSQL can fail due to schema mismatches, environment variable issues, and foreign key constraint errors when working with existing databases.

#### Implementation Approach
**Always follow the systematic database inspection and setup process to ensure reliable deployments**

#### Step-by-Step Process

**1. Pre-Setup Inspection**
```bash
# Always check existing database structure first
psql "$DATABASE_URL" -c "\dt"  # List all tables
psql "$DATABASE_URL" -c "\d \"TableName\""  # Inspect specific table structure
```

**2. Environment Variable Handling**
```bash
# Use direct assignment instead of sourcing for Node.js processes
DATABASE_URL="your-url" node script.js

# NOT: source .env.local && node script.js (doesn't work)
```

**3. Incremental Table Creation**
```sql
-- Use IF NOT EXISTS for all table creation
CREATE TABLE IF NOT EXISTS new_table (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  -- other columns
);
```

**4. Foreign Key Verification**
```sql
-- Always verify column names before creating references
-- Check: psql -c "\d \"ExistingTable\""
-- Then use correct column names in foreign keys
author_id INTEGER REFERENCES "Users"(id) ON DELETE CASCADE
-- NOT: REFERENCES "Users"(user_id) unless that column actually exists
```

**5. Error Handling Strategy**
- Check for partial table existence
- Continue with missing tables only
- Use `ON CONFLICT DO NOTHING` for data insertion
- Handle SSL configuration properly for different environments

**6. SSL Configuration for Neon/PostgreSQL**
```javascript
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }  // For Vercel/Neon databases
});
```

#### Code Examples

**Database Setup Script Template:**
```javascript
async function setupDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Database connection successful');
    
    // 1. Check existing tables
    const existingTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'new_table_%'
    `);
    
    console.log('📋 Existing tables:', existingTables.rows.map(r => r.table_name));
    
    // 2. Create tables incrementally
    if (existingTables.rows.length === 0) {
      console.log('📝 Creating new tables...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS new_table (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('✅ Tables created');
    }
    
    // 3. Insert sample data with conflict handling
    await client.query(`
      INSERT INTO new_table (name) 
      VALUES ($1) 
      ON CONFLICT (name) DO NOTHING;
    `, ['Sample Data']);
    
    console.log('🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Database setup error:', error);
    throw error;
  } finally {
    await client.end();
  }
}
```

#### Common Pitfalls to Avoid
- **Schema Mismatch**: Always inspect existing database structure before creating foreign keys
- **Environment Variables**: Don't rely on `source .env.local` for Node.js processes
- **SSL Issues**: Use proper SSL configuration for production databases
- **Partial Creation**: Handle cases where some tables exist but others don't
- **Column Names**: Verify actual column names vs. expected names in foreign key references

#### Success Criteria
- All tables created successfully with proper foreign key relationships
- Sample data inserted without conflicts
- Database connection works reliably in both development and production
- Setup process is reproducible and documented

This process ensures reliable database deployments and prevents common issues when working with existing database structures on Vercel/Neon PostgreSQL.

## Blog Page Design System

### Overview
The blog page system allows users to create, manage, and view blog posts related to specific Thanksgiving events. This system provides a comprehensive blogging experience with rich text editing, categorization, and content management capabilities.

### Design Goals
1. **Content Creation**: Easy-to-use blog post creation and editing interface
2. **Content Organization**: Categorization and tagging system for better content discovery
3. **Rich Media Support**: Support for images, formatting, and embedded content
4. **User Experience**: Intuitive navigation and content management
5. **Content Discovery**: Search, filter, and browse functionality
6. **Responsive Design**: Works seamlessly across all devices

### Database Schema

#### Blog Posts Table
```sql
CREATE TABLE "BlogPosts" (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES "Events"(id) ON DELETE CASCADE,
    author_id INTEGER REFERENCES "Users"(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    featured_image_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    view_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE
);

-- Indexes for performance
CREATE INDEX idx_blog_posts_event_id ON "BlogPosts"(event_id);
CREATE INDEX idx_blog_posts_author_id ON "BlogPosts"(author_id);
CREATE INDEX idx_blog_posts_status ON "BlogPosts"(status);
CREATE INDEX idx_blog_posts_published_at ON "BlogPosts"(published_at);
CREATE INDEX idx_blog_posts_slug ON "BlogPosts"(slug);
```

#### Blog Categories Table
```sql
CREATE TABLE "BlogCategories" (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#007bff', -- Hex color for UI
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample categories
INSERT INTO "BlogCategories" (name, slug, description, color) VALUES
('Memories', 'memories', 'Personal stories and memories', '#ff6b6b'),
('Recipes', 'recipes', 'Cooking and recipe discussions', '#4ecdc4'),
('Traditions', 'traditions', 'Family traditions and customs', '#45b7d1'),
('Tips', 'tips', 'Helpful tips and advice', '#96ceb4'),
('General', 'general', 'General Thanksgiving topics', '#feca57');
```

#### Blog Tags Table
```sql
CREATE TABLE "BlogTags" (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Junction table for blog post tags
CREATE TABLE "BlogPostTags" (
    blog_post_id INTEGER REFERENCES "BlogPosts"(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES "BlogTags"(id) ON DELETE CASCADE,
    PRIMARY KEY (blog_post_id, tag_id)
);
```

### User Interface Design

#### Blog List Page Layout
```
┌─────────────────────────────────────────────────────────────┐
│                    Thanksgiving Blog                        │
├─────────────────────────────────────────────────────────────┤
│ [Search Box] [Category Filter] [Status Filter] [New Post]  │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│ │   Featured Post │ │   Recent Post   │ │   Popular Post  │ │
│ │                 │ │                 │ │                 │ │
│ │ [Featured Image]│ │ [Post Image]    │ │ [Post Image]    │ │
│ │                 │ │                 │ │                 │ │
│ │ Title: "Best    │ │ Title: "Family  │ │ Title: "Thanks- │ │
│ │  Thanksgiving   │ │  Traditions"    │ │  giving Tips"   │ │
│ │  Recipes"       │ │                 │ │                 │ │
│ │                 │ │ By: Sarah       │ │ By: Bob         │ │
│ │ By: Bob         │ │ 2 days ago      │ │ 1 week ago      │ │
│ │ 3 days ago      │ │ [Read More]     │ │ [Read More]     │ │
│ │ [Read More]     │ └─────────────────┘ └─────────────────┘ │
│ └─────────────────┘                                         │
├─────────────────────────────────────────────────────────────┤
│                    All Blog Posts                           │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│ │   Post Card 1   │ │   Post Card 2   │ │   Post Card 3   │ │
│ │ [Image]         │ │ [Image]         │ │ [Image]         │ │
│ │ Title           │ │ Title           │ │ Title           │ │
│ │ Excerpt...      │ │ Excerpt...      │ │ Excerpt...      │ │
│ │ [Tags] [Author] │ │ [Tags] [Author] │ │ [Tags] [Author] │ │
│ │ [Read More]     │ │ [Read More]     │ │ [Read More]     │ │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

#### Blog Post Editor Layout
```
┌─────────────────────────────────────────────────────────────┐
│                    Create New Blog Post                     │
├─────────────────────────────────────────────────────────────┤
│ Title: [________________________________] [Save Draft] [Publish] │
│                                                             │
│ Category: [Memories ▼] Tags: [#family, #recipes, #2024]    │
│                                                             │
│ Featured Image: [Upload Image] [Remove]                     │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │                                                         │ │
│ │                [Featured Image Preview]                 │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Content:                                                     │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [B] [I] [U] [Link] [Image] [List] [Quote] [Code]       │ │
│ │                                                         │ │
│ │ Start writing your blog post here...                    │ │
│ │                                                         │ │
│ │ You can use rich text formatting, add images,          │ │
│ │ create lists, and more!                                 │ │
│ │                                                         │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Excerpt: [Optional preview text...]                         │
│                                                             │
│ [Cancel] [Save Draft] [Preview] [Publish]                   │
└─────────────────────────────────────────────────────────────┘
```

#### Blog Post Detail Page Layout
```
┌─────────────────────────────────────────────────────────────┐
│ [← Back to Blog] [Edit] [Delete] [Share]                    │
├─────────────────────────────────────────────────────────────┤
│                    Blog Post Title                          │
│                                                             │
│ By: [Author Name] | [Category] | [Published Date] | [Views] │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │                [Featured Image]                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [Tag1] [Tag2] [Tag3]                                        │
│                                                             │
│ Blog post content goes here...                              │
│                                                             │
│ This is where the main content of the blog post will be    │
│ displayed. It can include rich text formatting, images,    │
│ lists, quotes, and other content elements.                 │
│                                                             │
│ The content is fully responsive and will adapt to          │
│ different screen sizes.                                     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                    Related Posts                            │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│ │   Related 1     │ │   Related 2     │ │   Related 3     │ │
│ │ [Image]         │ │ [Image]         │ │ [Image]         │ │
│ │ Title           │ │ Title           │ │ Title           │ │
│ │ [Read More]     │ │ [Read More]     │ │ [Read More]     │ │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### API Endpoints Design

#### Blog Management Endpoints
```javascript
// Blog Posts
GET    /api/v1/blog/posts              // Get all blog posts with pagination
GET    /api/v1/blog/posts/:id          // Get specific blog post
POST   /api/v1/blog/posts              // Create new blog post
PUT    /api/v1/blog/posts/:id          // Update blog post
DELETE /api/v1/blog/posts/:id          // Delete blog post
GET    /api/v1/blog/posts/event/:eventId // Get posts for specific event

// Blog Categories
GET    /api/v1/blog/categories         // Get all categories
POST   /api/v1/blog/categories         // Create category (admin only)
PUT    /api/v1/blog/categories/:id     // Update category (admin only)
DELETE /api/v1/blog/categories/:id     // Delete category (admin only)

// Blog Tags
GET    /api/v1/blog/tags               // Get all tags
POST   /api/v1/blog/tags               // Create tag (admin only)
GET    /api/v1/blog/tags/popular       // Get popular tags

// Search and Filter
GET    /api/v1/blog/search             // Search blog posts
GET    /api/v1/blog/posts/featured     // Get featured posts
GET    /api/v1/blog/posts/recent       // Get recent posts
GET    /api/v1/blog/posts/popular      // Get popular posts
```

### Frontend Implementation

#### Blog Manager JavaScript Class
```javascript
class BlogManager {
    constructor(eventId, authToken) {
        this.eventId = eventId;
        this.authToken = authToken;
        this.posts = [];
        this.categories = [];
        this.tags = [];
        this.currentPost = null;
        this.isEditing = false;
    }

    // Initialize blog system
    async initialize() {
        await this.loadCategories();
        await this.loadTags();
        await this.loadPosts();
        this.setupEventListeners();
    }

    // Load blog posts
    async loadPosts(filters = {}) {
        // Implementation for loading posts with filters
    }

    // Create new blog post
    async createPost(postData) {
        // Implementation for creating new posts
    }

    // Update existing blog post
    async updatePost(postId, postData) {
        // Implementation for updating posts
    }

    // Delete blog post
    async deletePost(postId) {
        // Implementation for deleting posts
    }

    // Search and filter posts
    async searchPosts(query, filters) {
        // Implementation for search functionality
    }
}
```

#### Rich Text Editor Integration
```javascript
// Rich text editor configuration
const editorConfig = {
    toolbar: [
        'bold', 'italic', 'underline', 'strikethrough',
        '|', 'link', 'image', 'blockquote', 'code',
        '|', 'unorderedList', 'orderedList',
        '|', 'heading1', 'heading2', 'heading3',
        '|', 'undo', 'redo'
    ],
    placeholder: 'Start writing your blog post...',
    height: 400,
    theme: 'snow'
};
```

### Security Implementation

#### Content Validation
```javascript
// Blog post validation
const validateBlogPost = (postData) => {
    const errors = [];
    
    if (!postData.title || postData.title.trim().length < 5) {
        errors.push('Title must be at least 5 characters long');
    }
    
    if (!postData.content || postData.content.trim().length < 50) {
        errors.push('Content must be at least 50 characters long');
    }
    
    if (postData.title && postData.title.length > 255) {
        errors.push('Title must be less than 255 characters');
    }
    
    return errors;
};
```

#### Permission System
```javascript
// Blog post permissions
const canEditPost = (user, post) => {
    return user.role === 'admin' || user.id === post.author_id;
};

const canDeletePost = (user, post) => {
    return user.role === 'admin' || user.id === post.author_id;
};

const canPublishPost = (user) => {
    return user.role === 'admin' || user.role === 'editor';
};
```

### Implementation Phases

#### Phase 1: Database and API Foundation
1. Create blog database tables
2. Implement blog API endpoints
3. Add authentication and authorization
4. Create comprehensive test suite

#### Phase 2: Basic Blog Interface
1. Create blog list page
2. Implement blog post creation form
3. Add basic rich text editor
4. Implement post viewing functionality

#### Phase 3: Advanced Features
1. Add search and filtering
2. Implement categories and tags
3. Add featured posts functionality
4. Implement post editing and deletion

#### Phase 4: Polish and Optimization
1. Add responsive design improvements
2. Implement image upload and management
3. Add social sharing features
4. Performance optimization and caching

### Future Enhancements

#### Planned Features
- **Comment System**: Allow readers to comment on blog posts
- **Social Sharing**: Share posts on social media platforms
- **Email Notifications**: Notify users of new posts
- **RSS Feed**: Generate RSS feed for blog posts
- **SEO Optimization**: Meta tags, sitemaps, and SEO-friendly URLs
- **Analytics**: Track post views and engagement
- **Content Scheduling**: Schedule posts for future publication
- **Multi-author Support**: Advanced author management
- **Content Moderation**: Review and approval workflow

#### Technical Improvements
- **Caching**: Implement Redis caching for better performance
- **CDN Integration**: Serve images and assets via CDN
- **Search Engine**: Implement Elasticsearch for advanced search
- **Content Backup**: Automated content backup system
- **Version Control**: Track content changes and revisions

This blog page design provides a comprehensive foundation for creating and managing Thanksgiving-related blog content, with room for future enhancements and scalability.

## Blog Functionality Implementation Plan

### Overview
This implementation plan follows our established Test-Driven Development (TDD) approach and gradual implementation strategy to build a comprehensive blog system for the Thanksgiving website.

### Implementation Strategy
Following our conventions:
1. **Design-First**: Complete design already documented
2. **Test-Driven Development**: Create comprehensive test suite first
3. **Gradual Implementation**: Database → API → JavaScript → UI
4. **Quality Assurance**: Thorough testing at each phase

### Phase 1: Test Suite Creation (TDD Foundation)

#### 1.1 Database Tests
**File**: `tests/models/BlogPost.test.js`
```javascript
describe('BlogPost Model', () => {
  // Test blog post creation
  // Test blog post validation
  // Test blog post relationships
  // Test blog post status management
  // Test slug generation
  // Test featured post functionality
});
```

**File**: `tests/models/BlogCategory.test.js`
```javascript
describe('BlogCategory Model', () => {
  // Test category creation
  // Test category validation
  // Test category color handling
  // Test category slug generation
});
```

**File**: `tests/models/BlogTag.test.js`
```javascript
describe('BlogTag Model', () => {
  // Test tag creation
  // Test tag validation
  // Test tag slug generation
  // Test tag relationships
});
```

#### 1.2 API Endpoint Tests
**File**: `tests/controllers/blogController.test.js`
```javascript
describe('Blog API Endpoints', () => {
  // Test GET /api/v1/blog/posts
  // Test POST /api/v1/blog/posts
  // Test PUT /api/v1/blog/posts/:id
  // Test DELETE /api/v1/blog/posts/:id
  // Test GET /api/v1/blog/posts/event/:eventId
  // Test authentication requirements
  // Test validation errors
  // Test permission checks
});
```

**File**: `tests/controllers/blogCategoryController.test.js`
```javascript
describe('Blog Category API Endpoints', () => {
  // Test GET /api/v1/blog/categories
  // Test POST /api/v1/blog/categories (admin only)
  // Test PUT /api/v1/blog/categories/:id (admin only)
  // Test DELETE /api/v1/blog/categories/:id (admin only)
  // Test admin permission requirements
});
```

**File**: `tests/controllers/blogTagController.test.js`
```javascript
describe('Blog Tag API Endpoints', () => {
  // Test GET /api/v1/blog/tags
  // Test POST /api/v1/blog/tags (admin only)
  // Test GET /api/v1/blog/tags/popular
  // Test admin permission requirements
});
```

#### 1.3 Integration Tests
**File**: `tests/integration/blogIntegration.test.js`
```javascript
describe('Blog System Integration', () => {
  // Test complete blog post workflow
  // Test category and tag associations
  // Test search and filtering
  // Test event integration
  // Test user permissions
});
```

#### 1.4 Frontend Tests
**File**: `tests/frontend/blog.spec.js` (Playwright)
```javascript
describe('Blog Frontend', () => {
  // Test blog list page loading
  // Test blog post creation
  // Test blog post editing
  // Test search and filtering
  // Test responsive design
  // Test user interactions
});
```

### Phase 2: Database Implementation

#### 2.1 Database Schema Creation
**File**: `admin/database/create_blog_tables.sql`
```sql
-- Create blog tables
-- Add indexes
-- Insert sample data
-- Create relationships
```

#### 2.2 Database Migration
**File**: `scripts/setup-blog-database.js`
```javascript
// Create blog tables
// Insert sample categories and tags
// Create sample blog posts
// Verify database setup
```

#### 2.3 Model Implementation
**File**: `models/BlogPost.js`
```javascript
// Sequelize model for blog posts
// Validation rules
// Instance methods
// Class methods
// Relationships
```

**File**: `models/BlogCategory.js`
```javascript
// Sequelize model for categories
// Validation rules
// Instance methods
// Relationships
```

**File**: `models/BlogTag.js`
```javascript
// Sequelize model for tags
// Validation rules
// Instance methods
// Relationships
```

### Phase 3: API Implementation

#### 3.1 Blog Controller
**File**: `src/controllers/blogController.js`
```javascript
// GET /api/v1/blog/posts
// POST /api/v1/blog/posts
// PUT /api/v1/blog/posts/:id
// DELETE /api/v1/blog/posts/:id
// GET /api/v1/blog/posts/event/:eventId
// GET /api/v1/blog/search
// GET /api/v1/blog/posts/featured
// GET /api/v1/blog/posts/recent
// GET /api/v1/blog/posts/popular
```

#### 3.2 Category Controller
**File**: `src/controllers/blogCategoryController.js`
```javascript
// GET /api/v1/blog/categories
// POST /api/v1/blog/categories
// PUT /api/v1/blog/categories/:id
// DELETE /api/v1/blog/categories/:id
```

#### 3.3 Tag Controller
**File**: `src/controllers/blogTagController.js`
```javascript
// GET /api/v1/blog/tags
// POST /api/v1/blog/tags
// GET /api/v1/blog/tags/popular
```

#### 3.4 Blog Routes
**File**: `src/routes/blogRoutes.js`
```javascript
// Define all blog routes
// Add authentication middleware
// Add validation middleware
// Add rate limiting
```

#### 3.5 API Integration
**File**: `src/routes/apiRoutes.js`
```javascript
// Add blog routes to main API
// Configure route prefixes
```

### Phase 4: Frontend Implementation

#### 4.1 Blog Manager JavaScript
**File**: `public/js/blogManager.js`
```javascript
class BlogManager {
  // Initialize blog system
  // Load blog posts
  // Create blog post
  // Update blog post
  // Delete blog post
  // Search and filter
  // Handle categories and tags
}
```

#### 4.2 Blog UI Controller
**File**: `public/js/blogUIController.js`
```javascript
class BlogUIController {
  // Display blog posts
  // Handle blog post forms
  // Manage rich text editor
  // Handle image uploads
  // Manage modals and interactions
}
```

#### 4.3 Rich Text Editor
**File**: `public/js/richTextEditor.js`
```javascript
class RichTextEditor {
  // Initialize Quill.js
  // Handle toolbar actions
  // Manage content formatting
  // Handle image insertion
  // Content validation
}
```

#### 4.4 EJS Templates
**File**: `views/blog/index.ejs`
```javascript
// Blog list page template
// Search and filter interface
// Blog post cards
// Pagination
```

**File**: `views/blog/create.ejs`
```javascript
// Blog post creation form
// Rich text editor
// Category and tag selection
// Image upload
```

**File**: `views/blog/edit.ejs`
```javascript
// Blog post editing form
// Pre-populated data
// Update functionality
```

**File**: `views/blog/detail.ejs`
```javascript
// Blog post detail view
// Full content display
// Related posts
// Social sharing
```

#### 4.5 CSS Styling
**File**: `public/css/blog.css`
```css
/* Blog list styles */
/* Blog post card styles */
/* Rich text editor styles */
/* Modal styles */
/* Responsive design */
```

### Phase 5: Integration and Testing

#### 5.1 End-to-End Testing
**File**: `tests/e2e/blogWorkflow.test.js`
```javascript
describe('Blog Workflow E2E', () => {
  // Test complete blog post creation workflow
  // Test blog post editing workflow
  // Test blog post deletion workflow
  // Test search and filtering workflow
  // Test user permission workflows
});
```

#### 5.2 Performance Testing
**File**: `tests/performance/blogPerformance.test.js`
```javascript
describe('Blog Performance', () => {
  // Test page load times
  // Test API response times
  // Test database query performance
  // Test image loading performance
});
```

#### 5.3 Security Testing
**File**: `tests/security/blogSecurity.test.js`
```javascript
describe('Blog Security', () => {
  // Test authentication requirements
  // Test authorization checks
  // Test input validation
  // Test XSS prevention
  // Test CSRF protection
});
```

### Phase 6: Deployment and Monitoring

#### 6.1 Database Setup
1. Run database migration scripts
2. Create blog tables in production
3. Insert sample data
4. Verify database integrity

#### 6.2 API Deployment
1. Deploy API endpoints to Vercel
2. Test all endpoints in production
3. Verify authentication and authorization
4. Monitor API performance

#### 6.3 Frontend Deployment
1. Deploy frontend templates and assets
2. Test responsive design
3. Verify rich text editor functionality
4. Test user interactions

#### 6.4 Monitoring and Analytics
1. Set up error monitoring
2. Track API performance
3. Monitor user engagement
4. Set up alerts for issues

### Implementation Timeline

#### Week 1: Foundation
- **Days 1-2**: Create comprehensive test suite
- **Days 3-4**: Implement database schema and models
- **Day 5**: Run tests and fix any issues

#### Week 2: API Development
- **Days 1-3**: Implement all API endpoints
- **Days 4-5**: Test API endpoints and fix issues

#### Week 3: Frontend Development
- **Days 1-2**: Create blog templates and basic UI
- **Days 3-4**: Implement JavaScript functionality
- **Day 5**: Integrate rich text editor

#### Week 4: Integration and Deployment
- **Days 1-2**: End-to-end testing and bug fixes
- **Days 3-4**: Deploy to test environment
- **Day 5**: Deploy to production and monitor

### Success Criteria

#### Functional Requirements
- ✅ **Phase 1: Database Layer** - Blog tables created with sample data
- ✅ **Phase 2: API Endpoints** - REST API implemented with authentication
- ✅ **Phase 3: JavaScript/Backend** - Working API with direct SQL queries
- 🔄 **Phase 4: User Interface** - Ready to implement
- ❌ Users can create, edit, and delete blog posts (API ready, UI pending)
- ❌ Blog posts are properly categorized and tagged (API ready, UI pending)
- ❌ Search and filtering functionality works (API ready, UI pending)
- ❌ Rich text editor is fully functional (Pending)
- ❌ Image upload and management works (Pending)
- ✅ All user permissions are enforced (API level)

#### Non-Functional Requirements
- ✅ **API Performance**: API responses in under 500ms
- ✅ **Database Performance**: Direct SQL queries optimized
- ❌ Page loads in under 2 seconds (UI pending)
- ❌ 100% test coverage (Database tests failing due to test DB setup)
- ❌ Mobile responsive design (UI pending)
- ❌ Accessible to all users (UI pending)

#### User Experience
- ❌ Intuitive blog creation interface (Pending)
- ❌ Smooth editing experience (Pending)
- ❌ Easy content discovery (Pending)
- ❌ Consistent styling (Pending)
- ❌ Error handling and feedback (Pending)

### Current Implementation Status

#### ✅ **Completed Phases:**

**Phase 1: Database Implementation**
- ✅ Blog tables created: `blog_categories`, `blog_tags`, `blog_posts`, `blog_post_tags`
- ✅ Sample data inserted: 5 categories, 10 tags, 2 blog posts
- ✅ Foreign key relationships established
- ✅ Indexes created for performance
- ✅ Database setup script: `scripts/setup-blog-simple.js`

**Phase 2: API Implementation**
- ✅ REST API endpoints implemented using direct SQL queries
- ✅ Authentication and authorization middleware
- ✅ Error handling and validation
- ✅ Working endpoints:
  - `GET /api/v1/blog/posts` - List published posts
  - `GET /api/v1/blog/categories` - List categories with post counts
  - `GET /api/v1/blog/tags` - List tags with usage counts
- ✅ Deployed and tested on Vercel preview environment

**Phase 3: Backend Logic**
- ✅ Direct SQL queries instead of ORM (more reliable for Vercel)
- ✅ Case-insensitive username handling
- ✅ JWT authentication integration
- ✅ Database connection with SSL support

#### 🔄 **In Progress:**

**Phase 4: Frontend Implementation**
- 🔄 EJS templates for blog pages
- 🔄 JavaScript classes for blog management
- 🔄 Rich text editor integration
- 🔄 Image upload functionality
- 🔄 Search and filtering UI

#### ❌ **Pending:**

**Phase 5: Integration and Testing**
- ❌ End-to-end testing
- ❌ Performance testing
- ❌ Security testing
- ❌ Cross-browser testing

**Phase 6: Deployment and Monitoring**
- ❌ Production deployment
- ❌ Monitoring and logging
- ❌ Error tracking

### Risk Mitigation

#### Technical Risks
- **Rich Text Editor Complexity**: Use proven library (Quill.js)
- **Image Upload Performance**: Implement compression and optimization
- **Database Performance**: Proper indexing and query optimization
- **Browser Compatibility**: Test across all major browsers

#### User Experience Risks
- **Complex Interface**: Keep UI simple and intuitive
- **Data Loss**: Implement auto-save functionality
- **Performance Issues**: Optimize images and code
- **Mobile Experience**: Ensure responsive design

### Quality Assurance

#### Code Quality
- Follow established coding standards
- Implement proper error handling
- Add comprehensive logging
- Use TypeScript for type safety (optional)

#### Testing Strategy
- Unit tests for all models and functions
- Integration tests for API endpoints
- End-to-end tests for user workflows
- Performance tests for scalability
- Security tests for vulnerabilities

#### Documentation
- Update API documentation
- Create user guides
- Document deployment procedures
- Maintain changelog

This implementation plan ensures a robust, scalable, and user-friendly blog system that follows our established conventions and maintains high quality standards throughout the development process.

## 12. Vercel Deployment Debugging Conventions

### Problem Solved
Vercel deployments failing with `FUNCTION_INVOCATION_FAILED` errors due to complex dependency issues, particularly with ORM libraries that have schema mismatches with existing databases.

### Root Causes Identified
1. **ORM Schema Mismatches**: ORM schema definitions don't perfectly match actual database structure
2. **Complex Dependencies**: Heavy ORM libraries can cause initialization failures in serverless environments
3. **Database Connection Issues**: ORM connection pooling conflicts with Vercel's serverless architecture
4. **Import Chain Failures**: One failing import can crash the entire API

### Debugging Strategy
1. **Start with Minimal API**: Create a basic API with no database dependencies first
2. **Gradually Add Components**: Add database connection, then controllers, then complex features
3. **Test Each Layer**: Verify each component works before adding the next
4. **Use Direct SQL**: When ORM fails, fall back to direct SQL queries with `pg` client
5. **Isolate Problems**: Create separate API files to test specific functionality

### Implementation Approach
1. **Minimal Working API First**:
   ```javascript
   // Start with basic endpoints that don't require database
   app.get('/api/test', (req, res) => {
     res.json({ message: 'API working' });
   });
   ```

2. **Add Database Connection**:
   ```javascript
   // Test direct pg connection before adding ORM
   const { Client } = require('pg');
   const client = new Client({
     connectionString: process.env.DATABASE_URL,
     ssl: { rejectUnauthorized: false }
   });
   ```

3. **Add Controllers Gradually**:
   ```javascript
   // Add one controller at a time, test each
   app.get('/api/v1/blog/posts', async (req, res) => {
     // Direct SQL queries instead of ORM
   });
   ```

4. **Fallback Strategy**:
   - If ORM fails → Use direct SQL queries
   - If complex imports fail → Simplify dependencies
   - If entire API fails → Start with minimal version

### Code Examples

#### Minimal API Template
```javascript
const express = require('express');
const app = express();

app.use(express.json());

// Basic health check
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API working',
    timestamp: new Date().toISOString()
  });
});

module.exports = app;
```

#### Database Test Template
```javascript
app.get('/api/db-test', async (req, res) => {
  try {
    const { Client } = require('pg');
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    await client.connect();
    const result = await client.query('SELECT COUNT(*) FROM "Users"');
    await client.end();
    
    res.json({ status: 'OK', count: result.rows[0].count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

#### Direct SQL Controller Template
```javascript
app.get('/api/v1/blog/posts', async (req, res) => {
  try {
    const { Client } = require('pg');
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    await client.connect();
    const result = await client.query(`
      SELECT bp.*, u.username as author_name
      FROM blog_posts bp
      LEFT JOIN "Users" u ON bp.author_id = u.id
      WHERE bp.status = 'published'
      ORDER BY bp.created_at DESC
    `);
    await client.end();
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Common Pitfalls to Avoid
1. **Don't start with complex ORM**: Begin with direct SQL, add ORM later if needed
2. **Don't import everything at once**: Add imports gradually and test each
3. **Don't assume database structure**: Always verify actual table/column names
4. **Don't ignore SSL requirements**: Always use `ssl: { rejectUnauthorized: false }` for Vercel/Neon
5. **Don't skip minimal testing**: Test basic functionality before adding complexity

### Success Criteria
- ✅ API responds to basic health checks
- ✅ Database connection works with direct SQL
- ✅ All endpoints return expected data
- ✅ No `FUNCTION_INVOCATION_FAILED` errors
- ✅ Deployment completes successfully

### When to Use This Approach
- **Vercel deployments failing** with function invocation errors
- **ORM libraries causing issues** with schema mismatches
- **Complex dependency chains** causing import failures
- **Database connection problems** in serverless environments
- **Need for reliable, simple API** that works consistently

This debugging approach ensures reliable Vercel deployments by starting simple and building complexity gradually, with fallback strategies for when complex dependencies fail.