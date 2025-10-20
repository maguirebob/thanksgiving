# Project Conventions and Rules

This document outlines the established conventions, rules, and best practices for this project. These guidelines ensure consistency, maintainability, and proper workflow management.

## Git Workflow and Branch Management

### Branch Strategy
- **`dev`**: Primary development branch for all new features and fixes
- **`test`**: Testing/staging branch for pre-production validation
- **`main`**: Production branch (protected)

### Workflow Rules
1. **Always work in `dev` first** - Never make changes directly in `test` or `main`
2. **Version before merging** - Use the versioning script before moving changes between branches
3. **Push to origin** - Always push changes to origin before merging to other branches
4. **Merge `dev` to `test`** - Use `git merge dev` to move changes from dev to test
5. **Tag releases** - Use semantic versioning with git tags for all releases

### Git Commands Pattern
```bash
# Make changes in dev
git checkout dev
# ... make changes ...
git add .
npm run version:patch "Description" "Details"
git push origin dev --tags

# Move to test
git checkout test
git merge dev
git push origin test --tags
```

## Version Management

### Semantic Versioning
- **Major**: Breaking changes (rare)
- **Minor**: New features, backward compatible
- **Patch**: Bug fixes, small improvements

### Versioning Script Usage
```bash
npm run version:patch "Short description" "Detailed explanation" "Additional context"
```

### Version Bump Rules
1. **Always version before merging** between branches
2. **Include descriptive commit messages** with the version bump
3. **Update hardcoded version strings** in code when versioning
4. **Use the versioning script** - never manually edit version numbers
5. **Update schema definitions** - Always add schema definition for new versions in `src/lib/schemaVersions.ts`
6. **Document database changes** - Include all new tables, columns, and migrations in schema definition

## Code Quality and Standards

### TypeScript Configuration
- **Strict mode enabled** with `exactOptionalPropertyTypes: true`
- **Environment variable access** must use bracket notation: `process.env['VARIABLE_NAME']`
- **Null safety required** - always check for null/undefined before accessing properties
- **Build must pass** before any deployment

### Error Handling
- **Comprehensive error logging** with context (timestamp, environment, user agent, etc.)
- **Graceful error responses** with appropriate HTTP status codes
- **Null safety in middleware** - check for null/undefined before property access
- **Prisma error handling** - catch and handle specific Prisma error codes

### Authentication and Security
- **Session-based authentication** using express-session
- **Secure cookies in production** - `secure: process.env['NODE_ENV'] === 'production'`
- **Authentication middleware** must handle null sessions gracefully
- **CORS configuration** with proper credentials handling
- **Rate limiting** on API endpoints

## Database Management

### Prisma ORM Usage
- **Always use Prisma Client** for database operations
- **Include proper error handling** for Prisma operations
- **Use transactions** for complex operations
- **Validate data** before database operations

### Migration Management
- **Test migrations locally** before applying to remote environments
- **Create manual migrations** when automatic migrations fail
- **Validate migration safety** before production deployment
- **Backup before migrations** in production environments
- **Order operations carefully** - rename columns before updating constraints

### Data Integrity Rules
- **NO MANUAL DATABASE MANIPULATION** - Never manually insert/update/delete records unless explicitly requested by user
- **Debug the root cause** - If records are missing, debug why the application didn't create them properly
- **Fix the code, not the data** - Always fix the underlying code issue rather than manually patching data
- **Use proper error handling** - Ensure all database operations have proper error handling and logging
- **Validate before operations** - Always validate data before database operations

### Git History Management Rules
- **NEVER USE `git filter-branch`** - This command is deprecated and dangerous, can destroy entire repository history
- **Use `git filter-repo` instead** - Modern, safer alternative for rewriting git history
- **For removing secrets from history** - Use targeted approaches like editing specific commits or using `git filter-repo`
- **Always backup before history rewriting** - Create a full repository backup before any history manipulation
- **Prefer prevention over cure** - Never commit secrets in the first place, use environment variables

### Migration Safety Checklist
1. **Backup database** before any migration
2. **Test migration locally** with production-like data
3. **Validate migration syntax** and safety
4. **Apply migrations in correct order** (columns before constraints)
5. **Verify migration success** after application
6. **Have rollback plan** ready

## API Design and Testing

### API Endpoint Conventions
- **RESTful design** with proper HTTP methods
- **Consistent response format** with `success`, `data`, and `message` fields
- **Proper HTTP status codes** (200, 201, 400, 401, 403, 404, 500)
- **Authentication required** for editor/admin endpoints
- **Public endpoints** for viewer functionality

### Testing Strategy
- **Smoke tests** for basic functionality verification
- **Integration tests** for API endpoints with proper authentication
- **Unit tests** for individual functions and components
- **End-to-end tests** for complete user workflows

### Test Environment Management
- **Separate test database** from development and production
- **Test data cleanup** after test runs
- **Environment-specific configuration** for different test scenarios
- **Smoke tests must pass** before deployment

## Frontend Development

### JavaScript/Frontend Conventions
- **Include credentials in fetch requests** - `credentials: 'include'` for authenticated API calls
- **Comprehensive debugging** with detailed console logging
- **Error handling** with user-friendly messages
- **Session management** - handle authentication state properly

### Debugging Standards
- **Detailed logging** with timestamps, environment info, and context
- **Request/response logging** for API calls
- **Error details** including stack traces and error codes
- **Environment identification** in logs

## Deployment and Environment Management

### Environment Configuration
- **Environment-specific settings** for development, test, and production
- **Secure environment variables** for sensitive data
- **Proper CORS configuration** for each environment
- **Database URL validation** before connections

### Deployment Process
1. **Develop in dev branch**
2. **Test locally** with proper environment variables
3. **Version the changes**
4. **Push to origin**
5. **Merge to test branch**
6. **Deploy to test environment**
7. **Run smoke tests**
8. **Verify functionality**
9. **Deploy to production** (when ready)

### Railway Deployment
- **Automatic deployments** from git branches
- **Environment variable management** through Railway dashboard
- **Database connection** via Railway PostgreSQL
- **Log monitoring** through Railway logs

## Issue Management and Documentation

### GitHub Issue Creation
```bash
# Create issue with proper labels
gh issue create --title "Issue Title" --body "Description" --label "bug,enhancement"

# Add issue to project board
gh project item-add --owner USERNAME --number PROJECT_NUMBER --content-id ISSUE_ID
```

### Documentation Standards
- **README updates** for new processes and conventions
- **Changelog maintenance** with detailed version history
- **Code comments** for complex logic and business rules
- **API documentation** for endpoint usage

## Error Resolution Process

### Debugging Methodology
1. **Don't make changes immediately** - investigate first
2. **Check environment differences** between dev/test/production
3. **Verify database state** and migrations
4. **Check authentication and session handling**
5. **Review logs** for detailed error information
6. **Test with minimal reproduction** cases
7. **Fix in dev first** before applying to other environments

### AI Assistant Debugging Rules
**CRITICAL: When the user points to a specific problem, follow these rules:**

1. **Start exactly where the user points** - Look at the specific file/component mentioned first
2. **Follow the complete data flow** - Trace the path from user action to error display, don't assume the problem is where it seems
3. **Trust user evidence** - If user says something works (like "2013 generation works"), believe it and look elsewhere
4. **Ask clarifying questions** - "Where exactly do you see the error?" instead of assuming
5. **Don't overcomplicate** - If user says "the error doesn't display", look at the display layer, not the data layer
6. **Listen to user guidance** - When user says "look at X", start there, don't spin on unrelated issues

**Common mistakes to avoid:**
- Fixing server-side code when the problem is frontend error handling
- Spending time on database issues when the user says the data exists
- Creating test cases for APIs that are already working
- Ignoring user evidence that narrows down the problem scope

### Common Issue Patterns
- **Authentication issues** - check session configuration and middleware
- **Database issues** - verify migrations and schema consistency
- **Environment differences** - check configuration and environment variables
- **Build failures** - fix TypeScript errors before deployment
- **API errors** - check request format and authentication

## Performance and Monitoring

### Logging Standards
- **Structured logging** with consistent format
- **Error tracking** with stack traces and context
- **Performance monitoring** for API response times
- **Environment identification** in all logs

### Monitoring Checklist
- **Database connection health**
- **API endpoint availability**
- **Authentication flow**
- **File upload functionality**
- **Error rates and patterns**

## Security Best Practices

### Data Protection
- **Environment variable security** - never commit secrets
- **Session security** - proper cookie configuration
- **Input validation** - validate all user inputs
- **SQL injection prevention** - use Prisma parameterized queries

### Access Control
- **Role-based permissions** for admin functions
- **Authentication middleware** on protected routes
- **CORS configuration** for cross-origin requests
- **Rate limiting** to prevent abuse

---

## Quick Reference Commands

### Development Workflow
```bash
# Start development
git checkout dev
# Make changes
npm run version:patch "Description"
git push origin dev --tags

# Move to test
git checkout test
git merge dev
git push origin test --tags
```

### Testing Commands
```bash
# Run smoke tests
npm run test:smoke

# Run integration tests
npm test

# Build verification
npm run build
```

### Database Commands
```bash
# Check migration status
npx prisma migrate status

# Apply migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

### Issue Management
```bash
# Create GitHub issue
gh issue create --title "Title" --body "Description"

# Add to project
gh project item-add --owner USERNAME --number PROJECT_NUMBER --content-id ISSUE_ID
```

---

This document should be updated as new conventions are established and should be referenced by all team members working on the project.
