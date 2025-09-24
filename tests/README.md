# Thanksgiving Website - Test Suite

This directory contains comprehensive test suites for the Thanksgiving website, including smoke tests for the test environment.

## Test Structure

### Smoke Tests (`tests/smoke/`)
Quick, essential tests to verify core functionality is working:

- **`api.test.ts`** - API endpoint smoke tests
- **`database.test.ts`** - Database operation smoke tests

### End-to-End Tests (`tests/e2e/`)
Full browser-based tests using Playwright:

- **`smoke.spec.ts`** - E2E smoke tests for critical user journeys

### Test Utilities (`tests/setup.ts`)
Shared test utilities and setup:

- Database test helpers
- Test data creation utilities
- Global test configuration

## Running Tests

### Smoke Tests (Jest)
```bash
# Run all smoke tests
npm run test:smoke

# Run API smoke tests only
npm run test:smoke:api

# Run database smoke tests only
npm run test:smoke:db

# Run custom smoke test runner (comprehensive)
npm run test:smoke:runner
```

### End-to-End Tests (Playwright)
```bash
# Run all E2E tests
npm run test:e2e

# Run E2E smoke tests only
npm run test:e2e:smoke

# Run with UI (interactive)
npm run test:e2e:ui
```

### All Tests
```bash
# Run Jest unit tests
npm test

# Run Jest tests with coverage
npm run test:coverage

# Run Jest tests in watch mode
npm run test:watch
```

## Test Environment Setup

### Prerequisites
1. **Database**: PostgreSQL database accessible via `DATABASE_URL`
2. **Server**: Application server running on `TEST_BASE_URL` (default: `http://localhost:3000`)
3. **Dependencies**: All npm dependencies installed

### Environment Variables
```bash
# Required for tests
DATABASE_URL=postgresql://user:pass@localhost:5432/thanksgiving_test
NODE_ENV=test
TEST_BASE_URL=http://localhost:3000  # Optional, defaults to localhost:3000
```

### Database Setup
Tests automatically clean up after themselves, but you may need to initialize the database schema:

```bash
# Generate Prisma client
npm run db:generate

# Push schema to test database
npm run db:push
```

## Smoke Test Coverage

### API Tests
- ✅ Version API endpoint (`/api/v1/version/display`)
- ✅ Database setup API (`/api/setup-database`)
- ✅ Database connection validation
- ✅ Error handling

### Database Tests
- ✅ Event CRUD operations
- ✅ User CRUD operations
- ✅ Photo CRUD operations
- ✅ Relationship queries (events with photos)
- ✅ Data validation

### E2E Tests
- ✅ Homepage loads and displays menus
- ✅ Navigation to menu detail pages
- ✅ API endpoints return correct responses
- ✅ Responsive design on mobile
- ✅ Static assets load correctly
- ✅ Error pages handle 404s gracefully

## Test Environment Deployment

### Railway Test Environment
To run smoke tests against your Railway test environment:

1. **Set environment variables**:
   ```bash
   export TEST_BASE_URL=https://your-test-app.railway.app
   export DATABASE_URL=your_railway_database_url
   ```

2. **Run smoke tests**:
   ```bash
   npm run test:smoke:runner
   ```

3. **Run E2E tests**:
   ```bash
   npm run test:e2e:smoke
   ```

### CI/CD Integration
Smoke tests can be integrated into your CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
- name: Run Smoke Tests
  run: |
    npm install
    npm run db:generate
    npm run db:push
    npm run test:smoke:runner
  env:
    DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
    TEST_BASE_URL: ${{ secrets.TEST_BASE_URL }}
```

## Test Data Management

### Automatic Cleanup
- Tests automatically clean up test data after each test
- Database is reset between test runs
- No manual cleanup required

### Test Data Creation
Use the provided utilities in `tests/setup.ts`:

```typescript
import { testUtils } from '../setup';

// Create test event
const event = await testUtils.createTestEvent(prisma);

// Create test user
const user = await testUtils.createTestUser(prisma);

// Clean up test data
await testUtils.cleanupTestData(prisma);
```

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify `DATABASE_URL` is correct
   - Ensure database server is running
   - Check network connectivity

2. **Server Not Running**
   - Start the development server: `npm run dev`
   - Verify `TEST_BASE_URL` points to running server
   - Check server logs for errors

3. **Test Timeouts**
   - Increase timeout in Jest config if needed
   - Check for slow database queries
   - Verify network latency

4. **Playwright Browser Issues**
   - Install browsers: `npx playwright install`
   - Check browser permissions
   - Verify headless mode settings

### Debug Mode
Run tests with verbose output:

```bash
# Jest with verbose output
npm run test:smoke -- --verbose

# Playwright with debug mode
npm run test:e2e:smoke -- --debug
```

## Contributing

When adding new tests:

1. **Follow naming conventions**: `*.test.ts` for Jest, `*.spec.ts` for Playwright
2. **Use test utilities**: Leverage `testUtils` for common operations
3. **Clean up after tests**: Use `beforeEach`/`afterEach` hooks
4. **Write descriptive test names**: Make it clear what each test validates
5. **Add to appropriate suite**: Smoke tests for critical functionality, E2E for user journeys

## Performance Considerations

- **Smoke tests should be fast**: Aim for < 30 seconds total runtime
- **Use parallel execution**: Jest runs tests in parallel by default
- **Minimize database operations**: Use efficient queries and cleanup
- **Cache static assets**: Playwright caches browser downloads

---

*Last updated: December 2024*
