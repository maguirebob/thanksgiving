# Add New Menu Feature Implementation Plan

**Project**: Thanksgiving Website - Admin Menu Management  
**Feature**: Add New Menu Functionality  
**Target**: Admin Dashboard  
**Priority**: High  
**Estimated Time**: 4-6 hours  

---

## 📋 **Feature Overview**

### **Objective**
Add the ability for admin users to create new Thanksgiving menu entries directly from the admin dashboard, including:
- Menu image upload
- Event details (name, date, location, description)
- Form validation and error handling
- Integration with existing menu display system

### **User Story**
As an admin user, I want to be able to add new Thanksgiving menu entries so that I can expand the collection with additional years or special events.

---

## 🎯 **Requirements**

### **Functional Requirements**
1. **Admin-Only Access**: Only users with `admin` role can access this functionality
2. **Menu Creation Form**: Complete form with all required fields
3. **Image Upload**: Support for menu image upload with validation
4. **Data Validation**: Client and server-side validation
5. **Success Feedback**: Clear confirmation when menu is created
6. **Error Handling**: Graceful error handling for all failure scenarios
7. **Integration**: New menus appear immediately in the system

### **Technical Requirements**
1. **Backend API**: New endpoint for menu creation
2. **Database Integration**: Proper Prisma integration
3. **File Upload**: Multer integration for image handling
4. **Frontend Form**: Responsive Bootstrap form
5. **Validation**: Both client and server-side validation
6. **Security**: Proper authentication and authorization

---

## 🏗️ **Implementation Plan**

### **Phase 1: Backend API Development (2 hours)**

#### **Task 1.1: Create Menu Creation API Endpoint**
- **File**: `src/routes/eventRoutes.ts`
- **Endpoint**: `POST /api/v1/events`
- **Features**:
  - Accept form data with image upload
  - Validate required fields
  - Handle image upload and storage
  - Create event record in database
  - Return success/error response

#### **Task 1.2: Add Image Upload Handling**
- **File**: `src/middleware/upload.ts` (new file)
- **Features**:
  - Configure multer for image uploads
  - Set file size limits
  - Validate file types (JPEG, PNG)
  - Generate unique filenames
  - Store images in `/public/images/` directory

#### **Task 1.3: Add Form Validation**
- **File**: `src/middleware/validation.ts`
- **Features**:
  - Validate event name (required, min length)
  - Validate event date (required, valid date)
  - Validate event location (optional)
  - Validate event description (optional)
  - Validate image file (required, valid type)

### **Phase 2: Frontend Form Development (2 hours)**

#### **Task 2.1: Create Add Menu Modal**
- **File**: `views/admin/add-menu.ejs` (new file)
- **Features**:
  - Bootstrap modal with form
  - Responsive design
  - File upload input with preview
  - Form validation feedback
  - Loading states and error handling

#### **Task 2.2: Add JavaScript Form Handling**
- **File**: `public/js/adminMenuManager.js` (new file)
- **Features**:
  - Form submission handling
  - Image preview functionality
  - Client-side validation
  - API communication
  - Success/error feedback
  - Modal management

#### **Task 2.3: Integrate with Admin Dashboard**
- **File**: `views/admin/dashboard.ejs`
- **Features**:
  - Add "Create New Menu" button
  - Modal trigger functionality
  - Success callback to refresh menu list
  - Error handling integration

### **Phase 3: Testing & Validation (1 hour)**

#### **Task 3.1: Unit Tests**
- **File**: `tests/unit/addMenu.test.js`
- **Coverage**:
  - Form validation functions
  - Image upload handling
  - API endpoint testing
  - Error scenarios

#### **Task 3.2: Integration Tests**
- **File**: `tests/integration/menuCreation.test.js`
- **Coverage**:
  - End-to-end menu creation flow
  - Database integration
  - File upload integration
  - Admin authentication

#### **Task 3.3: Manual Testing**
- **Scenarios**:
  - Create menu with valid data
  - Test form validation
  - Test image upload
  - Test error handling
  - Test admin-only access

### **Phase 4: Deployment & Documentation (1 hour)**

#### **Task 4.1: Update Documentation**
- **Files**: Various documentation files
- **Updates**:
  - Admin functionality documentation
  - API documentation
  - User guide updates

#### **Task 4.2: Version & Deploy**
- **Steps**:
  - Version increment
  - Commit changes
  - Deploy to test environment
  - Verify functionality

---

## 🔧 **Technical Implementation Details**

### **Database Schema**
```sql
-- Events table already exists with required fields:
-- event_id, event_name, event_type, event_location, event_date, 
-- event_description, menu_title, menu_image_filename
```

### **API Endpoint Specification**
```typescript
POST /api/v1/events
Content-Type: multipart/form-data

Body:
- event_name: string (required)
- event_date: string (required, ISO date)
- event_location: string (optional)
- event_description: string (optional)
- menu_image: File (required, JPEG/PNG)

Response:
{
  "success": true,
  "event": {
    "id": number,
    "event_name": string,
    "event_date": string,
    "menu_image_url": string,
    // ... other fields
  },
  "message": "Menu created successfully"
}
```

### **Frontend Form Structure**
```html
<!-- Add Menu Modal -->
<div class="modal fade" id="addMenuModal">
  <div class="modal-dialog modal-lg">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Add New Menu</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body">
        <form id="addMenuForm" enctype="multipart/form-data">
          <!-- Form fields -->
        </form>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
        <button type="submit" form="addMenuForm" class="btn btn-primary">Create Menu</button>
      </div>
    </div>
  </div>
</div>
```

---

## 🎨 **UI/UX Design**

### **Admin Dashboard Integration**
- **Location**: Top of admin dashboard, next to existing buttons
- **Button**: "Add New Menu" with plus icon
- **Style**: Primary button with Bootstrap styling
- **Accessibility**: Proper ARIA labels and keyboard navigation

### **Form Design**
- **Layout**: Two-column responsive layout
- **Fields**: 
  - Event Name (required)
  - Event Date (required, date picker)
  - Event Location (optional)
  - Event Description (optional, textarea)
  - Menu Image (required, file upload with preview)
- **Validation**: Real-time validation with error messages
- **Feedback**: Success/error toast notifications

### **Image Upload Experience**
- **Drag & Drop**: Support drag and drop for images
- **Preview**: Show image preview before upload
- **Validation**: File type and size validation
- **Progress**: Upload progress indicator

---

## 🔒 **Security Considerations**

### **Authentication & Authorization**
- **Admin Only**: Verify admin role before allowing access
- **Session Validation**: Ensure valid admin session
- **CSRF Protection**: Include CSRF tokens in forms

### **File Upload Security**
- **File Type Validation**: Only allow JPEG/PNG images
- **File Size Limits**: Reasonable size limits (e.g., 5MB)
- **Filename Sanitization**: Prevent path traversal attacks
- **Virus Scanning**: Consider adding virus scanning for uploads

### **Input Validation**
- **Server-Side**: Validate all inputs on the server
- **SQL Injection**: Use Prisma parameterized queries
- **XSS Prevention**: Sanitize user inputs

---

## 📊 **Success Criteria**

### **Functional Success**
- ✅ Admin can create new menu entries
- ✅ Images upload and display correctly
- ✅ New menus appear in the system immediately
- ✅ Form validation works properly
- ✅ Error handling is graceful

### **Technical Success**
- ✅ API endpoint responds correctly
- ✅ Database integration works
- ✅ File upload system functions
- ✅ Frontend form is responsive
- ✅ Tests pass with good coverage

### **User Experience Success**
- ✅ Intuitive form interface
- ✅ Clear feedback messages
- ✅ Fast response times
- ✅ Mobile-friendly design
- ✅ Accessible to all users

---

## 🚀 **Deployment Strategy**

### **Development Phase**
1. **Local Development**: Implement and test locally
2. **Code Review**: Review all changes
3. **Testing**: Run comprehensive tests
4. **Documentation**: Update all documentation

### **Deployment Phase**
1. **Version Increment**: Update version number
2. **Commit Changes**: Commit all changes to Git
3. **Deploy to Test**: Deploy to test environment
4. **Verify Functionality**: Test in test environment
5. **Deploy to Production**: Deploy to production

### **Post-Deployment**
1. **Monitor**: Monitor for any issues
2. **User Training**: Train admin users
3. **Documentation**: Update user guides
4. **Feedback**: Collect user feedback

---

## 📝 **Implementation Checklist**

### **Backend Tasks**
- [ ] Create `POST /api/v1/events` endpoint
- [ ] Add multer middleware for file uploads
- [ ] Implement form validation middleware
- [ ] Add image storage and filename generation
- [ ] Test API endpoint with Postman/curl

### **Frontend Tasks**
- [ ] Create add menu modal template
- [ ] Implement form JavaScript handling
- [ ] Add image preview functionality
- [ ] Integrate with admin dashboard
- [ ] Add success/error feedback

### **Testing Tasks**
- [ ] Write unit tests for validation
- [ ] Write integration tests for API
- [ ] Test file upload functionality
- [ ] Test admin-only access
- [ ] Manual testing of complete flow

### **Deployment Tasks**
- [ ] Update documentation
- [ ] Version increment
- [ ] Commit and push changes
- [ ] Deploy to test environment
- [ ] Verify functionality
- [ ] Deploy to production

---

## 🎯 **Timeline**

| Phase | Duration | Tasks | Dependencies |
|-------|----------|-------|--------------|
| Phase 1 | 2 hours | Backend API Development | None |
| Phase 2 | 2 hours | Frontend Form Development | Phase 1 |
| Phase 3 | 1 hour | Testing & Validation | Phase 2 |
| Phase 4 | 1 hour | Deployment & Documentation | Phase 3 |
| **Total** | **6 hours** | **All phases** | **Sequential** |

---

## 🔄 **Future Enhancements**

### **Potential Improvements**
1. **Bulk Upload**: Allow multiple menu uploads at once
2. **Menu Templates**: Pre-defined templates for common menu types
3. **Auto-Date Detection**: Extract date from image metadata
4. **Menu Categories**: Categorize menus by type or year
5. **Menu Duplication**: Duplicate existing menus as templates
6. **Advanced Image Processing**: Automatic image optimization
7. **Menu Import**: Import menus from external sources

### **Integration Opportunities**
1. **Calendar Integration**: Link menus to calendar events
2. **Social Sharing**: Share new menus on social media
3. **Email Notifications**: Notify users of new menus
4. **Menu Analytics**: Track menu views and interactions
5. **Menu Search**: Enhanced search functionality

---

**Last Updated**: September 29, 2025  
**Next Review**: After implementation completion  
**Plan Owner**: Development Team  
**Stakeholders**: Bob Maguire, Admin Users
