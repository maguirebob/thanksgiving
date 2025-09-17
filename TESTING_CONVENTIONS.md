# Testing Conventions & Guidelines

## Overview
This document outlines the testing conventions, patterns, and best practices for the Thanksgiving Menu Application. It serves as a reference for developers and ensures consistency across the testing suite.

## Table of Contents
1. [Testing Strategy](#testing-strategy)
2. [Backend Testing Conventions](#backend-testing-conventions)
3. [UI Testing Conventions](#ui-testing-conventions)
4. [Page Object Model (POM) Guidelines](#page-object-model-pom-guidelines)
5. [Test Data Management](#test-data-management)
6. [File Organization](#file-organization)
7. [Naming Conventions](#naming-conventions)
8. [CI/CD Integration](#cicd-integration)
9. [Code Review Guidelines](#code-review-guidelines)

## Testing Strategy

### Multi-Layer Testing Approach
We use a comprehensive testing strategy that covers multiple layers:

1. **Unit Tests** - Individual functions and methods
2. **Integration Tests** - API endpoints and database interactions
3. **Service Layer Tests** - Business logic validation
4. **UI Tests** - End-to-end user interface testing
5. **Database Tests** - Data persistence and relationships

### Testing Pyramid
```
    /\
   /  \     E2E UI Tests (Few)
  /____\    
 /      \   Integration Tests (Some)
/________\  Unit Tests (Many)
```

## Backend Testing Conventions

### Framework & Tools
- **Testing Framework**: Jest
- **HTTP Testing**: Supertest
- **Database**: PostgreSQL with test database
- **Mocking**: Jest built-in mocking

### File Structure
```
tests/
├── unit/                    # Unit tests for individual functions
├── integration/             # API endpoint tests
├── services/                # Service layer tests
├── models/                  # Database model tests
├── middleware/              # Middleware tests
├── helpers/                 # Test utilities and helpers
└── fixtures/                # Test data fixtures
```

### Test File Naming
- Unit tests: `[moduleName].test.js`
- Integration tests: `[endpointName].integration.test.js`
- Service tests: `[serviceName].service.test.js`
- Model tests: `[modelName].model.test.js`

### Test Structure Pattern
```javascript
describe('Module/Feature Name', () => {
  describe('Method/Function Name', () => {
    test('should do something when condition is met', async () => {
      // Arrange
      const input = 'test data';
      
      // Act
      const result = await functionUnderTest(input);
      
      // Assert
      expect(result).toBe(expectedValue);
    });
  });
});
```

### Database Testing Conventions
- Use `DatabaseHelper` for setup/teardown
- Each test gets fresh data via `beforeEach`
- Use transactions for test isolation when possible
- Clean up after each test suite

## UI Testing Conventions

### Framework & Tools
- **Testing Framework**: Playwright
- **Browser Support**: Chromium, Firefox, WebKit
- **Page Object Model**: Yes (for complex UI interactions)

### When to Use UI Testing
- **Critical User Journeys**: Login, menu viewing, photo upload
- **Cross-browser Compatibility**: Ensure features work across browsers
- **Visual Regression**: Detect unintended UI changes
- **Interactive Features**: JavaScript-heavy functionality

### When NOT to Use UI Testing
- **API Testing**: Use Supertest instead
- **Database Operations**: Use unit/integration tests
- **Business Logic**: Use service layer tests
- **Simple Static Pages**: Use integration tests

## Page Object Model (POM) Guidelines

### When to Use POM
- **Complex UI Interactions**: Multiple steps, modals, forms
- **Reusable Components**: Navigation, common elements
- **Maintainable Tests**: When UI changes frequently
- **Team Collaboration**: Multiple developers working on UI tests

### POM Structure
```javascript
class PageName {
  constructor(page) {
    this.page = page;
    // Locators
    this.elements = {
      button: page.locator('[data-testid="button"]'),
      input: page.locator('#input-field'),
      modal: page.locator('.modal')
    };
  }

  // Actions
  async performAction() {
    await this.elements.button.click();
  }

  // Assertions
  async verifyElementVisible() {
    await expect(this.elements.button).toBeVisible();
  }
}
```

### Locator Strategy
1. **Data Test IDs**: `[data-testid="element-name"]` (preferred)
2. **Semantic Selectors**: `[role="button"]`, `[aria-label="..."]`
3. **CSS Classes**: `.class-name` (when stable)
4. **Text Content**: `text="Button Text"` (when unique)
5. **Avoid**: XPath, complex CSS selectors

### Page Object File Organization
```
tests/ui/
├── pages/
│   ├── BasePage.js          # Common functionality
│   ├── HomePage.js          # Home page interactions
│   ├── LoginPage.js         # Authentication page
│   ├── MenuDetailPage.js    # Menu detail page
│   └── AdminPage.js         # Admin dashboard
├── components/
│   ├── Navigation.js        # Navigation component
│   ├── PhotoUpload.js       # Photo upload modal
│   └── MenuCard.js          # Menu card component
└── fixtures/
    ├── test-data.json       # UI test data
    └── images/              # Test images
```

## Test Data Management

### Backend Test Data
- **DatabaseHelper**: Centralized test data management
- **Fixtures**: JSON files for complex test data
- **Factories**: Functions to generate test data
- **Cleanup**: Automatic cleanup after each test

### UI Test Data
- **Test Users**: Predefined user accounts
- **Test Images**: Sample photos for upload tests
- **Mock Data**: API responses for UI testing
- **Environment Variables**: Test-specific configuration

### Data Isolation
- Each test gets fresh data
- No shared state between tests
- Cleanup after test completion
- Separate test database

## File Organization

### Backend Tests
```
tests/
├── unit/
│   ├── services/
│   ├── utils/
│   └── helpers/
├── integration/
│   ├── routes/
│   ├── controllers/
│   └── middleware/
├── models/
├── helpers/
│   ├── database.js
│   ├── auth.js
│   └── fixtures.js
└── setup.js
```

### UI Tests
```
tests/ui/
├── pages/                   # Page Object classes
├── components/              # Reusable UI components
├── fixtures/                # Test data and assets
├── utils/                   # UI test utilities
├── specs/                   # Test specifications
│   ├── auth.spec.js
│   ├── menu-navigation.spec.js
│   └── photo-upload.spec.js
└── playwright.config.js     # Playwright configuration
```

## Naming Conventions

### Test Files
- **Backend**: `[feature].test.js` or `[feature].[type].test.js`
- **UI**: `[feature].spec.js` or `[user-journey].spec.js`

### Test Descriptions
- **Backend**: `should [expected behavior] when [condition]`
- **UI**: `[User role] should be able to [action]`

### Variables and Functions
- **camelCase**: For JavaScript variables and functions
- **PascalCase**: For classes and constructors
- **UPPER_CASE**: For constants
- **kebab-case**: For file names (when appropriate)

### Data Test IDs
- **Format**: `[component]-[element]-[action]`
- **Examples**: `menu-card-view-button`, `photo-upload-modal-close`

## CI/CD Integration

### Test Execution Order
1. **Unit Tests**: Fastest, run first
2. **Integration Tests**: Medium speed
3. **UI Tests**: Slowest, run last
4. **Parallel Execution**: When possible

### Environment Setup
- **Test Database**: Separate from development
- **Test Images**: Stored in test fixtures
- **Environment Variables**: Test-specific configuration
- **Browser Setup**: Headless mode for CI

### Reporting
- **Coverage Reports**: Generated for backend tests
- **Screenshots**: On UI test failures
- **Video Recording**: For complex UI tests
- **Test Results**: JUnit XML format

## Code Review Guidelines

### Test Requirements
- **Coverage**: Minimum 80% for new code
- **Test Cases**: Both positive and negative scenarios
- **Documentation**: Clear test descriptions
- **Maintainability**: Easy to understand and modify

### Review Checklist
- [ ] Tests follow naming conventions
- [ ] Appropriate test type used (unit vs integration vs UI)
- [ ] Test data is properly managed
- [ ] Assertions are meaningful
- [ ] No hardcoded values
- [ ] Proper cleanup after tests
- [ ] Error scenarios covered

### Common Anti-Patterns to Avoid
- **Testing Implementation Details**: Focus on behavior
- **Overly Complex Tests**: Keep tests simple
- **Shared State**: Avoid test interdependencies
- **Hardcoded Values**: Use constants or configuration
- **Missing Cleanup**: Always clean up after tests

## Best Practices

### General Testing
1. **Test Behavior, Not Implementation**: Focus on what the code does, not how
2. **Arrange-Act-Assert**: Clear test structure
3. **One Assertion Per Test**: Easier to debug failures
4. **Descriptive Names**: Test names should explain the scenario
5. **Independent Tests**: Tests should not depend on each other

### UI Testing Specific
1. **Wait for Elements**: Use proper wait strategies
2. **Stable Selectors**: Use data-testid attributes
3. **Page Object Pattern**: For complex UI interactions
4. **Screenshot on Failure**: Help with debugging
5. **Cross-browser Testing**: Test on multiple browsers

### Performance Considerations
1. **Parallel Execution**: Run tests in parallel when possible
2. **Test Data Size**: Keep test data minimal
3. **Database Cleanup**: Efficient cleanup strategies
4. **UI Test Optimization**: Only test critical user journeys
5. **Mock External Services**: Avoid real API calls in tests

## Maintenance

### Regular Updates
- **Monthly**: Review and update test data
- **Quarterly**: Audit test coverage and performance
- **As Needed**: Update when adding new features

### Documentation Updates
- **New Patterns**: Document new testing patterns
- **Tool Changes**: Update when changing testing tools
- **Process Changes**: Update when changing CI/CD processes

---

## Quick Reference

### Running Tests
```bash
# Backend tests
npm test                    # All backend tests
npm run test:watch         # Watch mode
npm run test:coverage      # With coverage

# UI tests
npm run test:ui            # All UI tests
npm run test:ui:headed     # With browser UI
npm run test:ui:debug      # Debug mode
```

### Adding New Tests
1. Choose appropriate test type (unit/integration/UI)
2. Follow naming conventions
3. Use existing patterns and helpers
4. Add to appropriate test suite
5. Update this document if new patterns emerge

## Troubleshooting

### Common Issues

1. **Database Connection**: Ensure PostgreSQL is running
2. **Port Conflicts**: Tests use random ports to avoid conflicts
3. **File Permissions**: Ensure test directory has write permissions
4. **Memory Issues**: Large test suites may require more memory
5. **Missing Controllers**: Ensure all referenced controllers exist (e.g., adminController.js)
6. **Missing Views**: Ensure all referenced view templates exist in the views directory

### Development Server Issues

- **EADDRINUSE Error**: Port already in use - kill existing processes with `lsof -ti:3000 | xargs kill -9`
- **MODULE_NOT_FOUND**: Missing controller or view files - check import paths and file existence
- **Database Connection**: Ensure database is running and connection string is correct
- **Database Tables Missing**: Run `psql -d bobmaguire -f admin/database/create_tables_corrected.sql` to create tables
- **API Routes Not Found**: Ensure API prefix includes version (e.g., `/api/v1` not just `/api`)

### Vercel Deployment Issues

- **Database Not Initialized**: Run the setup API endpoint after deployment
- **Environment Variables**: Ensure `POSTGRES_URL` and `SETUP_KEY` are set in Vercel dashboard
- **Function Timeout**: Vercel has 30-second timeout limit for serverless functions
- **SSL Issues**: Vercel Postgres requires SSL in production (already configured)

---

*Last Updated: [Current Date]*
*Version: 1.0*

