# Changelog

All notable changes to the Thanksgiving Menu Collection will be documented in this file.

## [2.13.18] - 2025-10-15

- Restore original function with step-by-step debugging
- Ultra-simple test confirmed function setup works
- Now testing original logic with detailed step-by-step debugging
- Should identify exactly which database operation fails
## [2.13.17] - 2025-10-15

- Create ultra-simple test version
- Removed all database operations and complex logic
- Just logs and returns mock data to isolate the issue
- Should show debugging output if function is being called
## [2.13.16] - 2025-10-15

- Fix TypeScript build error
- Removed unused CreateJournalSectionRequest import
- Build now passes successfully
## [2.13.15] - 2025-10-15

- Bypass TypeScript type checking in createJournalSection
- Removed destructuring with type annotation that may be causing issues
- Using direct property access to isolate the problem
- Should show debugging output if TypeScript was the issue
## [2.13.14] - 2025-10-15

- Restore original createJournalSection function with debugging
- Minimal test confirmed function setup works correctly
- Now testing original logic with comprehensive debugging
- Should identify the specific database operation causing the error
## [2.13.13] - 2025-10-15

- Create minimal test version of createJournalSection function
- Replaced complex function with simple test that returns success
- This will help isolate if the issue is with the function logic or setup
- Should show debugging output if function is being called
## [2.13.12] - 2025-10-15

- Add Prisma client debugging to journal controller
- Added prisma client type check to debug initialization issues
- This will help identify if the Prisma client is properly imported
## [2.13.11] - 2025-10-14

- Fix Prisma client initialization in journal controller
- Use centralized Prisma client from lib/prisma.ts instead of creating new instance
- This ensures proper DATABASE_URL configuration in all environments
- Should resolve 500 errors when creating journal sections
## [2.13.10] - 2025-10-14

- Fix session configuration: Revert to secure=false for Railway
- Railway HTTPS setup incompatible with secure cookies
- Sessions not being created properly with secure=true
- This should fix login and session persistence issues
## [2.13.9] - 2025-10-14

- Add comprehensive project conventions and rules document
- Created PROJECT_CONVENTIONS_AND_RULES.md with all established conventions
- Covers git workflow, versioning, code quality, database management
- Includes debugging methodology, deployment process, and security best practices
- Generic document for reuse in future projects
## [2.13.8] - 2025-10-14

- Fix authentication middleware: Add null safety and proper HTTPS session handling
- Fixed requireAuth middleware to handle null sessions gracefully
- Updated session configuration to use secure cookies in production
- This should resolve 500 errors when creating journal sections
## [2.13.7] - 2025-10-14

- Fix smoke tests: Remove authenticated journal API tests
- Journal Available Content API and Journal Page API require authentication
- These are editor endpoints, not public viewer endpoints
- Smoke tests should only test public functionality
- Integration tests cover authenticated endpoints with proper auth
## [2.13.6] - 2025-10-14

- Fix TypeScript error: Use bracket notation for process.env.NODE_ENV
- Resolves TS4111 error in journalController.ts
- Required for Docker build to succeed
## [2.13.5] - 2025-10-14

- Add comprehensive debugging to journal section creation
- Detailed logging in createJournalSection controller
- Enhanced frontend debugging in createNewSection
- Will help diagnose test vs dev environment differences
- Includes request/response data, error details, and environment info
- Add production migration safety safeguards
- Enhanced Railway deployment script with automatic backup and rollback
- Migration validation script to catch issues before deployment
- Comprehensive production migration safety documentation
- Prevents silent migration failures like the JournalPages rename issue
## [2.13.4] - 2025-10-14

- Add migration to rename JournalPages to JournalSections
- Safely renames JournalPages table to JournalSections without data loss
- Updates column names: journal_page_id -> section_id, page_number -> section_order
- Updates foreign key constraints and indexes
- Fixes database schema mismatch between dev and test environments
## [2.13.3] - 2025-10-14

- Fix TypeScript error: Add null safety for existingSections[0]
- Fix TS2532 error: Object is possibly 'undefined'
- Add optional chaining and null coalescing for section_order access
- Ensures build passes without TypeScript compilation errors
## [2.12.70] - 2025-10-08

- Add migration for BlogPosts images field
## [2.7.0] - 2025-09-28

- feat: Implement camera access functionality with rate limiting handling
- Add getUserMedia() API integration for camera access
- Implement video stream display and photo capture
- Add retry mechanism with exponential backoff for rate limiting
- Fix CSP violations by using manual base64 decoding
- Enhance error handling for HTTP status codes and JSON parsing
- Integrate camera photos with existing photo upload system
## [2.2.0] - 2025-09-24

- Added complete authentication system
- Implemented admin dashboard and user management
- Fixed login/logout functionality
- Added profile management with JavaScript
- Created admin routes and controllers
## [2.1.0] - 2025-09-24

- Added version management system
- Fixed Jest test configuration
- Enhanced About page with dynamic version info
## [2.0.0] - 2024-12-24

### Added
- Complete TypeScript migration from JavaScript
- Prisma ORM replacing Sequelize
- Comprehensive smoke test suite (Jest + Playwright)
- Railway deployment with automated CI/CD
- Modern responsive UI with Bootstrap 5
- Security enhancements (Helmet.js, CSP, rate limiting)
- About page with version information
- Version management system

### Changed
- Database schema migrated to Prisma
- Server architecture modernized with TypeScript
- Frontend styling updated with custom CSS
- Navigation simplified (removed Stats link)

### Fixed
- Database connection issues
- TypeScript compilation errors
- CSP violations preventing JavaScript execution
- Tab functionality on detail pages
- Responsive design issues

### Technical
- 31 Thanksgiving events migrated to new database
- 2 sample users created
- 100% smoke test pass rate achieved
- All 8 migration phases completed successfully

## [1.0.0] - Original Release

### Added
- Initial JavaScript/Sequelize implementation
- Basic Thanksgiving menu display
- PostgreSQL database integration
- Express.js server setup
- EJS templating system

