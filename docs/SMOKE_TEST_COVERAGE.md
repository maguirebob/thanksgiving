# Smoke Test Coverage Documentation

## 📋 **Overview**

This document describes the comprehensive smoke test coverage for the Thanksgiving website, including what's tested, how to run tests, and how to interpret results.

## 🎯 **Test Categories**

### **1. Core Navigation Tests**
- ✅ Homepage redirects to login (authentication required)
- ✅ Login page loads with proper form elements
- ✅ Menu detail pages load correctly
- ✅ 404 pages handle gracefully

### **2. Authentication Tests**
- ✅ Login page loads with username/password fields
- ✅ Login form submission handles invalid credentials
- ✅ Admin dashboard requires authentication
- ✅ Unauthorized access redirects to login
- ✅ User registration endpoint exists
- ✅ Profile management accessible

### **3. Admin Dashboard Tests**
- ✅ Admin dashboard loads after login
- ✅ View Volume button is present and functional
- ✅ Add Menu button opens modal correctly
- ✅ Volume contents modal loads
- ✅ Admin form elements are present
- ✅ File upload inputs accept images

### **4. API Endpoint Tests**
- ✅ Version API returns correct response structure
- ✅ Database setup API works correctly
- ✅ Admin volume contents API returns proper JSON
- ✅ Menu creation API endpoint exists
- ✅ Database operations work correctly

### **5. File Management Tests**
- ✅ File upload endpoints exist
- ✅ File input accepts image files
- ✅ Volume management functionality present
- ✅ Photo management functionality present

### **6. Error Handling Tests**
- ✅ 404 pages display properly
- ✅ Invalid admin routes handled gracefully
- ✅ Error pages don't expose sensitive information
- ✅ Unauthorized access properly redirected

### **7. Performance Tests**
- ✅ Pages load within acceptable time (< 5 seconds)
- ✅ Response times are reasonable (< 10 seconds)
- ✅ Static assets load correctly

### **8. Security Tests**
- ✅ Admin routes require authentication
- ✅ Error pages don't expose stack traces
- ✅ Sensitive information not exposed

### **9. Mobile Responsiveness Tests**
- ✅ Mobile viewport works correctly
- ✅ No horizontal scroll on mobile
- ✅ Login form visible on mobile devices

### **10. Static Asset Tests**
- ✅ Bootstrap CSS loads correctly
- ✅ Bootstrap JavaScript loads correctly
- ✅ Font Awesome loads correctly
- ✅ Meta tags are properly configured

## 🚀 **Running Smoke Tests**

### **E2E Tests (Playwright)**
```bash
# Run all E2E smoke tests
npx playwright test tests/e2e/smoke.spec.ts

# Run with specific browser
npx playwright test tests/e2e/smoke.spec.ts --project=chromium

# Run with headed browser (see what's happening)
npx playwright test tests/e2e/smoke.spec.ts --headed
```

### **API Tests (Custom Runner)**
```bash
# Run smoke tests for test environment
TEST_BASE_URL=https://thanksgiving-test-test.up.railway.app ts-node scripts/run-smoke-tests.ts

# Run smoke tests for production environment
TEST_BASE_URL=https://thanksgiving-prod-production.up.railway.app ts-node scripts/run-smoke-tests.ts

# Run smoke tests for local development
ts-node scripts/run-smoke-tests.ts
```

### **Jest Unit Tests**
```bash
# Run all Jest tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test suites
npm run test:photo
```

## 📊 **Test Coverage Areas**

### **✅ Well Covered**
- Basic navigation and authentication
- Admin dashboard functionality
- API endpoint availability
- Error handling
- Static asset loading
- Mobile responsiveness

### **⚠️ Partially Covered**
- File upload functionality (structure only)
- Database operations (basic tests)
- Performance (basic timing tests)
- Security (basic authentication tests)

### **❌ Needs Enhancement**
- File upload with actual files
- Database data integrity
- Advanced error scenarios
- Load testing
- Security penetration testing
- Cross-browser compatibility

## 🔧 **Test Configuration**

### **Environment Variables**
- `TEST_BASE_URL`: Base URL for testing (defaults to localhost:3000)
- `NODE_ENV`: Environment setting (development, test, production)

### **Test Data**
- **Admin Credentials**: username: 'admin', password: 'admin123'
- **Test Menu ID**: 31 (for menu detail tests)
- **Test File Types**: JPEG, PNG images

### **Test Timeouts**
- **Page Load**: 5 seconds maximum
- **API Response**: 10 seconds maximum
- **Overall Test**: 30 seconds maximum

## 📈 **Interpreting Results**

### **✅ Pass Criteria**
- All tests pass without errors
- Response times within acceptable limits
- No security vulnerabilities exposed
- All functionality accessible

### **❌ Fail Criteria**
- Any test fails
- Response times exceed limits
- Security issues detected
- Critical functionality inaccessible

### **⚠️ Warning Signs**
- Slow response times (but within limits)
- Non-critical functionality issues
- Browser compatibility issues
- Performance degradation

## 🚨 **Common Issues and Solutions**

### **Authentication Failures**
- **Issue**: Admin tests fail due to authentication
- **Solution**: Ensure admin user exists in test database
- **Check**: Database setup API returns success

### **File Upload Issues**
- **Issue**: File upload tests fail
- **Solution**: Check multer configuration and file permissions
- **Check**: Volume mounting in Railway environments

### **Performance Issues**
- **Issue**: Tests fail due to slow response times
- **Solution**: Check server performance and database queries
- **Check**: Railway environment resource allocation

### **API Endpoint Issues**
- **Issue**: API tests fail with 404 or 500 errors
- **Solution**: Verify route configuration and middleware
- **Check**: Server logs for detailed error information

## 📋 **Test Maintenance**

### **Regular Updates Needed**
- Update test data when database schema changes
- Update selectors when UI changes
- Update timeouts based on performance changes
- Update credentials when authentication changes

### **New Feature Testing**
- Add tests for new admin functionality
- Add tests for new API endpoints
- Add tests for new user features
- Add tests for new file operations

### **Environment Updates**
- Update test URLs when domains change
- Update test data for new environments
- Update performance baselines
- Update security test scenarios

## 🎯 **Future Enhancements**

### **Planned Improvements**
- Add actual file upload tests with real files
- Add database integrity tests
- Add load testing for performance
- Add cross-browser compatibility tests
- Add security penetration tests

### **Advanced Testing**
- Add visual regression tests
- Add accessibility tests
- Add internationalization tests
- Add offline functionality tests

## 📚 **Resources**

- **Playwright Documentation**: https://playwright.dev/
- **Jest Documentation**: https://jestjs.io/
- **Test Environment**: https://thanksgiving-test-test.up.railway.app/
- **Production Environment**: https://thanksgiving-prod-production.up.railway.app/

## 📅 **Last Updated**

- **Date**: 2025-01-02
- **Version**: 1.0
- **Author**: AI Assistant
- **Status**: Comprehensive coverage implemented
