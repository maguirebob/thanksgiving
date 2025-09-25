# Single Page with Tabbed Navigation - Implementation Plan

**Project**: Thanksgiving Website  
**Feature**: Enhanced Menu Details Page with Tabbed Navigation  
**Version**: 2.2.1+  
**Created**: September 24, 2025  
**Status**: Planning Phase  

## 📋 **Overview**

This document outlines the complete implementation plan for transforming the current menu details page into a comprehensive single-page application with tabbed navigation, following Design Option 1 from the Thanksgiving Website Architecture document (Section 9.2).

### **Current State**
- ✅ Hero section with menu image and event details
- ✅ Basic photos section with upload/camera modals (placeholder functionality only)
- ✅ Responsive layout and image zoom functionality
- ✅ Database models: Event and Photo models exist
- ❌ No tabbed navigation system
- ❌ No photo API endpoints (modals exist but no backend integration)
- ❌ Missing recipes, blog, and comments sections
- ❌ No quick stats overview
- ❌ No search/filter functionality

### **Target State**
- 🎯 Complete tabbed navigation system (Photos, Recipes, Blog, Comments)
- 🎯 Quick stats section showing content counts
- 🎯 Full CRUD operations for all content types
- 🎯 Search and filter capabilities
- 🎯 Responsive design for all devices
- 🎯 Database schema for new content types

## 🏗️ **Implementation Phases**

### **Phase 1: Foundation & Navigation** ⏳
**Goal**: Establish tabbed navigation structure and quick stats

#### **Task 1.1: Analyze Current Implementation**
- [ ] Review existing `views/detail.ejs` structure
- [ ] Identify current photo functionality
- [ ] Document existing CSS classes and JavaScript
- [ ] Map current API endpoints
- **Estimated Time**: 1 hour
- **Dependencies**: None

#### **Task 1.2: Design Tabbed Navigation Structure**
- [ ] Create HTML structure for Bootstrap tabs
- [ ] Design tab styling to match site theme
- [ ] Plan tab content areas layout
- [ ] Design responsive behavior for mobile
- **Estimated Time**: 2 hours
- **Dependencies**: Task 1.1

#### **Task 1.3: Implement Quick Stats Section**
- [ ] Create quick stats card component
- [ ] Add dynamic content counting
- [ ] Style stats cards with icons
- [ ] Implement responsive grid layout
- **Estimated Time**: 2 hours
- **Dependencies**: Task 1.2

#### **Task 1.4: Add Tabbed Navigation to Detail Page**
- [ ] Convert existing content sections to tab structure
- [ ] Implement Bootstrap tab JavaScript
- [ ] Add tab switching functionality
- [ ] Test tab navigation on all devices
- **Estimated Time**: 3 hours
- **Dependencies**: Task 1.3

#### **Task 1.5: Create Unit Tests for Navigation**
- [ ] Write tests for tab switching functionality
- [ ] Test quick stats calculation
- [ ] Test responsive behavior
- [ ] Achieve 80%+ test coverage for new code
- **Estimated Time**: 2 hours
- **Dependencies**: Task 1.4

#### **Task 1.6: Deploy Phase 1 to Test Environment**
- [ ] Commit and push Phase 1 changes
- [ ] Deploy to test environment
- [ ] Run smoke tests (basic navigation only)
- [ ] Verify no regression in existing functionality
- **Estimated Time**: 1 hour
- **Dependencies**: Task 1.5

### **Phase 2: Database Schema & Models** ⏳
**Goal**: Create database tables and Prisma models for new content types

#### **Task 2.1: Design Database Schema**
- [ ] Design recipes table schema
- [ ] Design blog_posts table schema
- [ ] Design comments table schema
- [ ] Plan relationships between tables
- **Estimated Time**: 2 hours
- **Dependencies**: None

#### **Task 2.2: Create Prisma Models**
- [ ] Add Recipe model to `prisma/schema.prisma`
- [ ] Add BlogPost model to `prisma/schema.prisma`
- [ ] Add Comment model to `prisma/schema.prisma`
- [ ] Update existing models with new relationships
- **Estimated Time**: 2 hours
- **Dependencies**: Task 2.1

#### **Task 2.3: Generate Database Migration**
- [ ] Run `npx prisma db push` to create tables
- [ ] Generate Prisma client with new models
- [ ] Test database connection with new schema
- [ ] Create sample data for testing
- **Estimated Time**: 1 hour
- **Dependencies**: Task 2.2

#### **Task 2.4: Create Database Tests**
- [ ] Write tests for new Prisma models
- [ ] Test database relationships
- [ ] Test data validation constraints
- [ ] Test migration rollback procedures
- **Estimated Time**: 2 hours
- **Dependencies**: Task 2.3

#### **Task 2.5: Deploy Schema to Test Environment**
- [ ] Commit and push schema changes
- [ ] Deploy to test environment
- [ ] Run database migration in test
- [ ] Verify schema integrity
- [ ] Run smoke tests (database connectivity only)
- **Estimated Time**: 1 hour
- **Dependencies**: Task 2.4

### **Phase 3: Backend API Development** ⏳
**Goal**: Create API endpoints for Photos and Blog Posts (Recipes deferred to future phase)

#### **Task 3.1: Photo API Endpoints**
- [ ] Create `src/controllers/photoController.ts`
- [ ] Implement GET `/api/events/:eventId/photos`
- [ ] Implement POST `/api/events/:eventId/photos` (upload)
- [ ] Implement PUT `/api/photos/:photoId`
- [ ] Implement DELETE `/api/photos/:photoId`
- [ ] Add photo search endpoint
- **Estimated Time**: 3 hours
- **Dependencies**: Task 2.5

#### **Task 3.2: Create Photo API Tests**
- [ ] Write unit tests for photo controller
- [ ] Test all CRUD operations
- [ ] Test file upload functionality
- [ ] Test error handling
- [ ] Achieve 90%+ test coverage
- **Estimated Time**: 2 hours
- **Dependencies**: Task 3.1

#### **Task 3.3: Blog API Endpoints**
- [ ] Create `src/controllers/blogController.ts`
- [ ] Implement GET `/api/events/:eventId/blog`
- [ ] Implement POST `/api/events/:eventId/blog`
- [ ] Implement PUT `/api/blog/:postId`
- [ ] Implement DELETE `/api/blog/:postId`
- [ ] Add blog search endpoint
- **Estimated Time**: 4 hours
- **Dependencies**: Task 2.5

#### **Task 3.4: Create Blog API Tests**
- [ ] Write unit tests for blog controller
- [ ] Test all CRUD operations
- [ ] Test input validation
- [ ] Test error handling
- [ ] Achieve 90%+ test coverage
- **Estimated Time**: 2 hours
- **Dependencies**: Task 3.3

#### **Task 3.5: Update Server Routes**
- [ ] Add photo routes to `src/server.ts`
- [ ] Add blog routes to `src/server.ts`
- [ ] Test all new API endpoints
- **Estimated Time**: 1 hour
- **Dependencies**: Tasks 3.1, 3.3

#### **Task 3.6: Deploy API to Test Environment**
- [ ] Commit and push API changes
- [ ] Deploy to test environment
- [ ] Run integration tests
- [ ] Run smoke tests (API endpoints only)
- [ ] Verify no regression in existing APIs
- **Estimated Time**: 1 hour
- **Dependencies**: Task 3.5

### **Phase 4: Frontend Components** ⏳
**Goal**: Create user interface components for all content types

#### **Task 4.1: Recipe Components**
- [ ] Create recipe card component
- [ ] Design recipe detail modal/page
- [ ] Implement recipe form for add/edit
- [ ] Add recipe search and filter UI
- [ ] Create recipe grid layout
- **Estimated Time**: 5 hours
- **Dependencies**: Task 3.8

#### **Task 4.2: Create Recipe Component Tests**
- [ ] Write tests for recipe card component
- [ ] Test recipe form validation
- [ ] Test recipe search functionality
- [ ] Test responsive behavior
- **Estimated Time**: 2 hours
- **Dependencies**: Task 4.1

#### **Task 4.3: Blog Components**
- [ ] Create blog post card component
- [ ] Design blog post detail view
- [ ] Implement blog post editor
- [ ] Add blog search and filter UI
- [ ] Create blog post list layout
- **Estimated Time**: 5 hours
- **Dependencies**: Task 3.8

#### **Task 4.4: Create Blog Component Tests**
- [ ] Write tests for blog card component
- [ ] Test blog post editor
- [ ] Test blog search functionality
- [ ] Test responsive behavior
- **Estimated Time**: 2 hours
- **Dependencies**: Task 4.3

#### **Task 4.5: Comments Components**
- [ ] Create comment card component
- [ ] Design comment form
- [ ] Implement comment reply system
- [ ] Add comment moderation UI
- [ ] Create comment thread layout
- **Estimated Time**: 4 hours
- **Dependencies**: Task 3.8

#### **Task 4.6: Create Comments Component Tests**
- [ ] Write tests for comment components
- [ ] Test comment form validation
- [ ] Test reply functionality
- [ ] Test moderation features
- **Estimated Time**: 2 hours
- **Dependencies**: Task 4.5

#### **Task 4.7: Search and Filter Components**
- [ ] Create global search component
- [ ] Implement tab-specific filters
- [ ] Add search result highlighting
- [ ] Create filter tag system
- [ ] Add clear filters functionality
- **Estimated Time**: 3 hours
- **Dependencies**: Tasks 4.2, 4.4, 4.6

#### **Task 4.8: Deploy Frontend to Test Environment**
- [ ] Commit and push frontend changes
- [ ] Deploy to test environment
- [ ] Run E2E tests for new components
- [ ] Run smoke tests (UI components only)
- [ ] Verify no regression in existing UI
- **Estimated Time**: 1 hour
- **Dependencies**: Task 4.7

### **Phase 5: JavaScript Functionality** ⏳
**Goal**: Implement interactive features and API communication

#### **Task 5.1: Tab Management System**
- [ ] Create `TabManager` JavaScript class
- [ ] Implement tab switching logic
- [ ] Add tab state persistence
- [ ] Handle tab content loading
- [ ] Add tab animation effects
- **Estimated Time**: 3 hours
- **Dependencies**: Task 4.8

#### **Task 5.2: Create Tab Management Tests**
- [ ] Write tests for TabManager class
- [ ] Test tab switching functionality
- [ ] Test state persistence
- [ ] Test error handling
- **Estimated Time**: 2 hours
- **Dependencies**: Task 5.1

#### **Task 5.3: Content Management System**
- [ ] Create `ContentManager` JavaScript class
- [ ] Implement CRUD operations for all content types
- [ ] Add form validation
- [ ] Handle file uploads
- [ ] Implement error handling
- **Estimated Time**: 6 hours
- **Dependencies**: Task 4.8

#### **Task 5.4: Create Content Management Tests**
- [ ] Write tests for ContentManager class
- [ ] Test CRUD operations
- [ ] Test form validation
- [ ] Test file upload handling
- **Estimated Time**: 3 hours
- **Dependencies**: Task 5.3

#### **Task 5.5: Search and Filter System**
- [ ] Create `SearchManager` JavaScript class
- [ ] Implement real-time search
- [ ] Add filter combinations
- [ ] Handle search result display
- [ ] Add search history
- **Estimated Time**: 4 hours
- **Dependencies**: Task 4.8

#### **Task 5.6: Create Search System Tests**
- [ ] Write tests for SearchManager class
- [ ] Test search functionality
- [ ] Test filter combinations
- [ ] Test search history
- **Estimated Time**: 2 hours
- **Dependencies**: Task 5.5

#### **Task 5.7: Statistics and Analytics**
- [ ] Create `StatsManager` JavaScript class
- [ ] Implement real-time content counting
- [ ] Add statistics updates
- [ ] Create analytics dashboard
- [ ] Handle statistics caching
- **Estimated Time**: 3 hours
- **Dependencies**: Task 4.8

#### **Task 5.8: Deploy JavaScript to Test Environment**
- [ ] Commit and push JavaScript changes
- [ ] Deploy to test environment
- [ ] Run JavaScript unit tests
- [ ] Run smoke tests (JavaScript functionality only)
- [ ] Verify no regression in existing JavaScript
- **Estimated Time**: 1 hour
- **Dependencies**: Tasks 5.2, 5.4, 5.6

### **Phase 6: Integration Testing & Quality Assurance** ⏳
**Goal**: Ensure all functionality works correctly together

#### **Task 6.1: End-to-End Integration Testing**
- [ ] Test complete user workflows across all tabs
- [ ] Test API endpoint integration with frontend
- [ ] Test database operations with real data
- [ ] Test file upload functionality end-to-end
- [ ] Test search and filter features across all content types
- **Estimated Time**: 4 hours
- **Dependencies**: Task 5.8

#### **Task 6.2: Cross-Browser Testing**
- [ ] Test on Chrome, Firefox, Safari, Edge
- [ ] Test responsive design on all devices
- [ ] Test accessibility features (WCAG compliance)
- [ ] Test performance optimization
- [ ] Test user experience flows
- **Estimated Time**: 3 hours
- **Dependencies**: Task 6.1

#### **Task 6.3: Update Smoke Tests (Minimal)**
- [ ] Add ONLY critical tabbed navigation test
- [ ] Add ONLY basic content count verification
- [ ] Ensure smoke tests remain fast (< 30 seconds)
- [ ] Keep smoke tests focused on core functionality
- [ ] Verify no regression in existing smoke tests
- **Estimated Time**: 2 hours
- **Dependencies**: Task 6.2

#### **Task 6.4: Performance Testing**
- [ ] Test page load times with new features
- [ ] Test API response times
- [ ] Test database query performance
- [ ] Test memory usage with multiple tabs
- [ ] Optimize any performance bottlenecks
- **Estimated Time**: 3 hours
- **Dependencies**: Task 6.3

### **Phase 7: Production Deployment & Documentation** ⏳
**Goal**: Deploy to production and document the feature

#### **Task 7.1: Pre-Production Deployment**
- [ ] Update version number (minor bump)
- [ ] Run full test suite (unit + integration)
- [ ] Run smoke tests on test environment
- [ ] Prepare production deployment checklist
- [ ] Backup current production data
- **Estimated Time**: 2 hours
- **Dependencies**: Task 6.4

#### **Task 7.2: Production Deployment**
- [ ] Deploy to production environment
- [ ] Run database migrations in production
- [ ] Run production smoke tests
- [ ] Monitor application performance
- [ ] Verify all features work correctly
- **Estimated Time**: 2 hours
- **Dependencies**: Task 7.1

#### **Task 7.3: Post-Deployment Verification**
- [ ] Run comprehensive smoke tests
- [ ] Monitor error logs for 24 hours
- [ ] Verify performance metrics
- [ ] Test all user workflows
- [ ] Document any issues found
- **Estimated Time**: 1 hour
- **Dependencies**: Task 7.2

#### **Task 7.4: Documentation Updates**
- [ ] Update README.md with new features
- [ ] Update API documentation
- [ ] Create user guide for tabbed navigation
- [ ] Update architecture documentation
- [ ] Create troubleshooting guide
- **Estimated Time**: 3 hours
- **Dependencies**: Task 7.3

## 🔄 **DevOps Best Practices**

### **Incremental Deployment Strategy**
Each phase includes deployment to test environment with focused smoke tests:

- **Phase 1**: Basic navigation + quick stats
- **Phase 2**: Database schema only
- **Phase 3**: API endpoints only  
- **Phase 4**: UI components only
- **Phase 5**: JavaScript functionality only
- **Phase 6**: Integration testing
- **Phase 7**: Production deployment

### **Smoke Test Strategy (Minimal Approach)**
Smoke tests are kept minimal and fast (< 30 seconds total):

#### **Core Smoke Tests (Always Run)**
- [ ] Homepage loads correctly
- [ ] Menu detail page loads
- [ ] Basic navigation works
- [ ] Database connectivity
- [ ] API endpoints respond

#### **Feature-Specific Smoke Tests (Phase-Based)**
- **Phase 1**: Tab navigation works
- **Phase 2**: Database schema exists
- **Phase 3**: New API endpoints respond
- **Phase 4**: New UI components render
- **Phase 5**: JavaScript functionality works
- **Phase 6**: End-to-end workflows
- **Phase 7**: Full feature integration

### **Testing Strategy by Phase**
- **Unit Tests**: Written immediately after each feature
- **Integration Tests**: Written after API completion
- **E2E Tests**: Written after frontend completion
- **Smoke Tests**: Updated minimally per phase
- **Performance Tests**: Final phase only

### **Rollback Strategy**
Each phase can be rolled back independently:
- **Database**: Migration rollback scripts
- **API**: Feature flags for new endpoints
- **Frontend**: Component-level rollback
- **JavaScript**: Progressive enhancement approach

## 📊 **Progress Tracking**

### **Overall Progress**
- **Total Tasks**: 38 (Photos & Blog Posts focus, Recipes deferred)
- **Completed**: 11 (Phase 1 & 2 complete)
- **In Progress**: 0
- **Pending**: 27
- **Completion**: 29%

### **Phase Progress**
- **Phase 1**: 6/6 tasks (100%) - Foundation & Navigation + Tests + Deploy ✅
- **Phase 2**: 5/5 tasks (100%) - Database Schema + Tests + Deploy ✅
- **Phase 3**: 0/6 tasks (0%) - Backend API (Photos & Blog) + Tests + Deploy
- **Phase 4**: 0/8 tasks (0%) - Frontend Components + Tests + Deploy
- **Phase 5**: 0/8 tasks (0%) - JavaScript Functionality + Tests + Deploy
- **Phase 6**: 0/4 tasks (0%) - Integration Testing & QA
- **Phase 7**: 0/4 tasks (0%) - Production Deployment & Documentation

## 🎯 **Success Criteria**

### **Functional Requirements**
- [ ] All four tabs (Photos, Recipes, Blog, Comments) are functional
- [ ] Users can create, read, update, and delete content in each tab
- [ ] Search and filter functionality works across all content types
- [ ] Quick stats section displays accurate content counts
- [ ] Responsive design works on all device sizes

### **Technical Requirements**
- [ ] All API endpoints return proper HTTP status codes
- [ ] Database operations are optimized and secure
- [ ] JavaScript code is well-structured and maintainable
- [ ] Test coverage is above 80%
- [ ] Performance meets acceptable standards

### **User Experience Requirements**
- [ ] Tab navigation is intuitive and smooth
- [ ] Content creation forms are user-friendly
- [ ] Search results are relevant and fast
- [ ] Error messages are clear and helpful
- [ ] Loading states provide good user feedback

## 🚨 **Risk Assessment**

### **High Risk**
- **Database Migration Issues**: New tables might conflict with existing data
- **Performance Impact**: Additional content types might slow down the page
- **Browser Compatibility**: Complex JavaScript might not work on older browsers

### **Medium Risk**
- **API Rate Limiting**: Multiple API calls might hit rate limits
- **File Upload Issues**: Large files might cause timeout problems
- **Search Performance**: Complex search queries might be slow

### **Low Risk**
- **UI/UX Issues**: Minor styling problems that don't affect functionality
- **Documentation Gaps**: Missing documentation that can be added later

## 📅 **Timeline Estimate**

### **Total Estimated Time**: 115 hours (increased from 110 hours to include Photo API endpoints)
### **Recommended Schedule**: 4-5 weeks (20-25 hours/week)

### **Week 1**: Foundation & Database
- Phase 1: Foundation & Navigation + Tests + Deploy (11 hours)
- Phase 2: Database Schema + Tests + Deploy (8 hours)
- **Total**: 19 hours

### **Week 2**: Backend Development
- Phase 3: Backend API + Tests + Deploy (25 hours)
- **Total**: 25 hours

### **Week 3**: Frontend Development
- Phase 4: Frontend Components + Tests + Deploy (24 hours)
- **Total**: 24 hours

### **Week 4**: JavaScript & Integration
- Phase 5: JavaScript Functionality + Tests + Deploy (24 hours)
- **Total**: 24 hours

### **Week 5**: Testing & Deployment
- Phase 6: Integration Testing & QA (12 hours)
- Phase 7: Production Deployment & Documentation (8 hours)
- **Total**: 20 hours

## 🔧 **Technical Specifications**

### **Database Schema**
```sql
-- Recipes Table
CREATE TABLE recipes (
    recipe_id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(event_id),
    user_id INTEGER REFERENCES users(user_id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    ingredients TEXT NOT NULL,
    instructions TEXT NOT NULL,
    prep_time INTEGER,
    cook_time INTEGER,
    servings INTEGER,
    difficulty_level VARCHAR(20),
    category VARCHAR(50),
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Blog Posts Table
CREATE TABLE blog_posts (
    post_id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(event_id),
    user_id INTEGER REFERENCES users(user_id),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    featured_image_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'published',
    tags TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Comments Table
CREATE TABLE comments (
    comment_id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(event_id),
    user_id INTEGER REFERENCES users(user_id),
    parent_comment_id INTEGER REFERENCES comments(comment_id),
    content TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'approved',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **API Endpoints**
```
GET    /api/events/:eventId/photos
POST   /api/events/:eventId/photos
PUT    /api/photos/:photoId
DELETE /api/photos/:photoId
GET    /api/photos/search

GET    /api/events/:eventId/recipes
POST   /api/events/:eventId/recipes
PUT    /api/recipes/:recipeId
DELETE /api/recipes/:recipeId
GET    /api/recipes/search

GET    /api/events/:eventId/blog
POST   /api/events/:eventId/blog
PUT    /api/blog/:postId
DELETE /api/blog/:postId
GET    /api/blog/search

GET    /api/events/:eventId/comments
POST   /api/events/:eventId/comments
PUT    /api/comments/:commentId
DELETE /api/comments/:commentId
POST   /api/comments/:commentId/reply
```

### **JavaScript Classes**
```javascript
// TabManager - Handles tab navigation
class TabManager {
    constructor() { /* ... */ }
    switchTab(tabId) { /* ... */ }
    loadTabContent(tabId) { /* ... */ }
    updateTabStats() { /* ... */ }
}

// ContentManager - Handles CRUD operations
class ContentManager {
    constructor() { /* ... */ }
    createContent(type, data) { /* ... */ }
    updateContent(type, id, data) { /* ... */ }
    deleteContent(type, id) { /* ... */ }
    loadContent(type, filters) { /* ... */ }
}

// SearchManager - Handles search and filtering
class SearchManager {
    constructor() { /* ... */ }
    search(query, type) { /* ... */ }
    applyFilters(filters) { /* ... */ }
    clearFilters() { /* ... */ }
    highlightResults(results) { /* ... */ }
}

// StatsManager - Handles statistics and analytics
class StatsManager {
    constructor() { /* ... */ }
    updateStats() { /* ... */ }
    getContentCounts() { /* ... */ }
    refreshStats() { /* ... */ }
}
```

## 📝 **Notes & Considerations**

### **Design Decisions**
- Using Bootstrap tabs for consistency with existing design
- Implementing progressive enhancement for JavaScript features
- Following existing CSS naming conventions
- Maintaining responsive design principles

### **Performance Considerations**
- Lazy loading for tab content
- Pagination for large content lists
- Image optimization for uploaded content
- Caching for frequently accessed data

### **Security Considerations**
- Input validation for all forms
- File upload restrictions and scanning
- SQL injection prevention
- XSS protection for user-generated content

### **Accessibility Considerations**
- Proper ARIA labels for tabs
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support

---

**Last Updated**: September 24, 2025  
**Next Review**: After Phase 1 completion  
**Document Owner**: Development Team  
**Stakeholders**: Bob Maguire, Development Team
