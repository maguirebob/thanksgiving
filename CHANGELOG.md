# Changelog

All notable changes to the Thanksgiving Menu Collection will be documented in this file.

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

