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