# Changelog

All notable changes to the Thanksgiving Menu Collection will be documented in this file.

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

