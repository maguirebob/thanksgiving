
t # Thanksgiving Application Test Suite

This directory contains comprehensive tests for the Thanksgiving application using Jest and Supertest.

## Test Structure

```
tests/
├── README.md                    # This file
├── setup.js                     # Test setup configuration
├── helpers/
│   └── database.js              # Database helper for test setup/cleanup
├── routes/
│   └── app.test.js              # Main application route tests
├── controllers/
│   ├── menuController.test.js   # Menu controller tests
│   ├── authController.test.js   # Authentication controller tests
│   ├── adminController.test.js  # Admin controller tests
│   └── photoController.test.js  # Photo controller tests
├── middleware/
│   └── auth.test.js             # Authentication middleware tests
└── models/
    ├── User.test.js             # User model tests
    ├── Event.test.js            # Event model tests
    └── Photo.test.js            # Photo model tests
```

## Running Tests

### All Tests
```bash
npm test
```

### Watch Mode (for development)
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

### CI Mode (for continuous integration)
```bash
npm run test:ci
```

## Test Categories

### 1. Route Tests (`routes/app.test.js`)
- **Menu Routes**: Home page, menu detail pages, 404 handling
- **API Routes**: All CRUD operations for events and photos
- **Authentication Routes**: Login, register, logout, profile management
- **Admin Routes**: Dashboard, user management, role updates
- **Error Handling**: 404s, invalid JSON, database errors

### 2. Controller Tests
- **Menu Controller** (`controllers/menuController.test.js`):
  - Menu listing and detail views
  - API endpoints for CRUD operations
  - Query parameter handling (year, limit, offset)
  - Validation and error handling

- **Auth Controller** (`controllers/authController.test.js`):
  - Login/logout functionality
  - User registration with validation
  - Profile management
  - Session handling
  - Password validation

- **Admin Controller** (`controllers/adminController.test.js`):
  - Admin dashboard access
  - User management operations
  - Role-based access control
  - User deletion and role updates

- **Photo Controller** (`controllers/photoController.test.js`):
  - Photo upload and management
  - File validation and error handling
  - Photo metadata updates
  - File system operations

### 3. Middleware Tests (`middleware/auth.test.js`)
- **Authentication Middleware**:
  - `requireAuth`: API authentication
  - `requireAdmin`: Admin-only access
  - `addUserToLocals`: User data injection
  - `requireAuthView`: View authentication
  - `requireAdminView`: Admin view access

### 4. Model Tests
- **User Model** (`models/User.test.js`):
  - User creation and validation
  - Password hashing and validation
  - Role management
  - User queries and updates
  - Association handling

- **Event Model** (`models/Event.test.js`):
  - Event creation and validation
  - Menu items handling
  - Event queries and filtering
  - Photo associations
  - Cascade deletion

- **Photo Model** (`models/Photo.test.js`):
  - Photo creation and validation
  - File metadata handling
  - Photo queries and filtering
  - Event associations
  - Cascade deletion

## Test Features

### Database Management
- **Automatic Setup**: Tests automatically create and populate test database
- **Isolation**: Each test runs with fresh data
- **Cleanup**: Database is cleaned up after each test suite

### Authentication Testing
- **Session Management**: Tests maintain user sessions across requests
- **Role-Based Access**: Tests verify admin vs user permissions
- **Security**: Tests validate password hashing and session handling

### File Upload Testing
- **Mock File System**: Tests use in-memory file storage
- **Validation**: Tests verify file type and size restrictions
- **Error Handling**: Tests cover various upload failure scenarios

### API Testing
- **RESTful Endpoints**: All API endpoints are tested
- **Request/Response Validation**: Tests verify correct data formats
- **Error Handling**: Tests cover various error scenarios
- **Authentication**: Tests verify protected endpoints

## Test Data

The test suite uses the `DatabaseHelper` class to manage test data:

- **Test Users**: Admin and regular user accounts
- **Test Events**: Sample Thanksgiving events with menu items
- **Test Photos**: Sample photos with metadata
- **Test Sessions**: User session data

## Configuration

### Jest Configuration (`jest.config.js`)
- **Test Environment**: Node.js
- **Test Pattern**: `**/tests/**/*.test.js`
- **Coverage**: Includes all source files except node_modules
- **Timeout**: 10 seconds per test
- **Setup**: Uses `tests/setup.js` for global configuration

### Test Setup (`tests/setup.js`)
- **Environment**: Sets NODE_ENV to 'test'
- **Console Mocking**: Reduces noise during test runs
- **Global Timeout**: 10 seconds per test

## Coverage

The test suite aims for comprehensive coverage of:
- **Routes**: All HTTP endpoints
- **Controllers**: All business logic
- **Middleware**: All authentication and validation
- **Models**: All database operations
- **Error Handling**: All error scenarios

## Best Practices

1. **Isolation**: Each test is independent
2. **Cleanup**: Database is reset between tests
3. **Mocking**: External dependencies are mocked
4. **Validation**: All inputs and outputs are validated
5. **Error Testing**: Both success and failure cases are tested

## Troubleshooting

### Common Issues

1. **Database Connection**: Ensure PostgreSQL is running
2. **Port Conflicts**: Tests use random ports to avoid conflicts
3. **File Permissions**: Ensure test directory has write permissions
4. **Memory Issues**: Large test suites may require more memory

### Debug Mode

Run tests with debug output:
```bash
DEBUG=* npm test
```

### Individual Test Files

Run specific test files:
```bash
npm test -- tests/controllers/menuController.test.js
```

## Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Ensure all tests pass
3. Maintain test coverage above 80%
4. Update this documentation as needed


