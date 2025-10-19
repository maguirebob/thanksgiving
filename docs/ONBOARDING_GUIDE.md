# Onboarding Guide for Thanksgiving Website Development

## Overview
This guide tells me exactly what files to read to understand all established conventions, rules, and the current design approach for the Thanksgiving website project. Read this first before making any changes.

## Essential Files to Read First

### 1. Project Conventions and Rules
**File**: `PROJECT_CONVENTIONS_AND_RULES.md`
**Purpose**: Contains ALL established project conventions, workflow rules, and guidelines
**Key Points**:
- Git workflow (dev → test → main)
- Version management process
- Database migration safety
- Testing requirements
- Code quality standards

### 2. Current Design Document
**File**: `docs/Design/SIMPLIFIED_SCRAPBOOK_DESIGN.md`
**Purpose**: Complete design specification for the new scrapbook system
**Key Points**:
- Static HTML file approach
- 6 content types (title, text-paragraph, menu, photo, page-photo, blog)
- jQuery + Turn.js integration
- Leather/parchment styling
- Testing strategy

### 3. README with GitHub Issue Management
**File**: `README.md`
**Purpose**: Project overview and GitHub issue creation process
**Key Points**:
- How to create GitHub issues correctly
- Kanban project integration
- Project structure overview

## Database and Schema Files

### 4. Database Verification System
**File**: `src/lib/databaseVerifier.ts`
**Purpose**: Database schema verification system
**Key Points**:
- How to verify database structure
- Schema version management
- Error reporting

### 5. Schema Versions
**File**: `src/lib/schemaVersions.ts`
**Purpose**: Defines expected database schemas for each version
**Key Points**:
- Version-based schema definitions
- Required tables and columns
- Migration status tracking

### 6. Prisma Schema
**File**: `prisma/schema.prisma`
**Purpose**: Current database schema definition
**Key Points**:
- All current models and relationships
- Table mappings (@@map directives)
- Column definitions

## Current Implementation Files

### 7. Journal Editor (Current System)
**File**: `public/js/components/journalEditor.js`
**Purpose**: Current journal editor implementation
**Key Points**:
- Drag-and-drop interface
- Content management
- Authentication handling
- Debugging implementation

### 8. Scrapbook Viewer (Current System)
**File**: `public/js/components/scrapbookFlipbook.js`
**Purpose**: Current Turn.js flipbook implementation
**Key Points**:
- Turn.js integration
- Page switching logic
- Content caching approach
- Navigation controls

### 9. Journal Controller
**File**: `src/controllers/journalController.ts`
**Purpose**: Backend logic for journal operations
**Key Points**:
- API endpoints
- Database operations
- Error handling
- Debugging implementation

### 10. Journal Routes
**File**: `src/routes/journalRoutes.ts`
**Purpose**: API route definitions
**Key Points**:
- Route structure
- Authentication middleware
- Error handling

## Configuration and Setup Files

### 11. Package Configuration
**File**: `package.json`
**Purpose**: Project dependencies and scripts
**Key Points**:
- Available npm scripts
- Version management
- Testing commands
- Deployment scripts

### 12. TypeScript Configuration
**File**: `tsconfig.json`
**Purpose**: TypeScript compiler settings
**Key Points**:
- Compilation settings
- Path mappings
- Target configuration

### 13. Server Configuration
**File**: `src/server.ts`
**Purpose**: Main server setup and configuration
**Key Points**:
- Express setup
- Session configuration
- Middleware setup
- Route registration

## Testing and Quality Assurance

### 14. Smoke Tests
**File**: `scripts/run-smoke-tests.ts`
**Purpose**: End-to-end testing for deployed environments
**Key Points**:
- Test coverage
- Environment validation
- API testing

### 15. Jest Configuration
**File**: `jest.config.js`
**Purpose**: Unit testing configuration
**Key Points**:
- Test environment setup
- Coverage requirements
- Test patterns

## Deployment and Environment Files

### 16. Railway Configuration
**File**: `railway.json`
**Purpose**: Railway deployment configuration
**Key Points**:
- Environment variables
- Build settings
- Deployment configuration

### 17. Environment Setup Guide
**File**: `docs/Environment Management/ENVIRONMENT_SETUP_GUIDE.md`
**Purpose**: Environment configuration instructions
**Key Points**:
- Local development setup
- Environment variables
- Database configuration

## Migration and Safety Files

### 18. Migration Safety Guide
**File**: `docs/Environment Management/PRODUCTION_MIGRATION_SAFETY.md`
**Purpose**: Safe migration practices
**Key Points**:
- Migration validation
- Rollback procedures
- Safety checks

### 19. Production Configuration
**File**: `docs/Environment Management/PRODUCTION_CONFIGURATION.md`
**Purpose**: Production environment setup
**Key Points**:
- Production settings
- Security considerations
- Performance optimization

## Key Conventions Summary

### Git Workflow
1. **ALWAYS** make changes in `dev` branch first
2. Test changes in `dev` environment
3. Push to `origin dev`
4. Merge `dev` into `test`
5. Push to `origin test`
6. Test in test environment
7. Only then merge to `main`

### Version Management
- Use `npm run version:patch` for version bumps
- Always tag versions for rollback capability
- Update version in multiple places (package.json, server.ts)

### Database Safety
- Always backup before migrations
- Use database verification system
- Test migrations in dev/test first
- Never destroy existing data

### Testing Requirements
- Unit tests for new functionality
- Update database verification for schema changes
- Run smoke tests after deployment
- User validation for UI changes

### Code Quality
- TypeScript compilation must pass
- ESLint checks must pass
- Minimum 80% test coverage
- Document all functions

## Current Project Status

### Recent Changes
- Implemented content caching approach for Turn.js
- Fixed journal section creation issues
- Added database verification system
- Created comprehensive testing framework

### Current Version
- Version: 2.13.31
- Tag: v2.13.31
- Status: Ready for scrapbook redesign implementation

### Next Steps
1. Implement Phase 1: Static file infrastructure
2. Create HTML generation system
3. Update journal editor for scrapbook creation
4. Implement comprehensive testing

## Important Notes

### Critical Rules
- **NEVER** make changes directly in `test` or `main` branches
- **ALWAYS** follow dev → test → main workflow
- **ALWAYS** backup production database before changes
- **ALWAYS** test in dev environment first
- **ALWAYS** update database verification for schema changes

### Common Mistakes to Avoid
- Making changes in wrong branch
- Skipping testing phases
- Not updating database verification
- Not following version management process
- Not backing up before migrations

### When in Doubt
1. Read `PROJECT_CONVENTIONS_AND_RULES.md`
2. Check current branch (`git branch`)
3. Follow established workflow
4. Ask user for clarification before proceeding

## File Reading Order for Me

1. `PROJECT_CONVENTIONS_AND_RULES.md` - Understand all rules
2. `README.md` - Project overview and GitHub issues
3. `docs/Design/SIMPLIFIED_SCRAPBOOK_DESIGN.md` - Current design
4. `src/lib/databaseVerifier.ts` - Database verification
5. `src/lib/schemaVersions.ts` - Schema management
6. `prisma/schema.prisma` - Current database structure
7. `public/js/components/journalEditor.js` - Current editor
8. `public/js/components/scrapbookFlipbook.js` - Current viewer
9. `src/controllers/journalController.ts` - Backend logic
10. `src/routes/journalRoutes.ts` - API routes
11. `package.json` - Available scripts
12. `src/server.ts` - Server configuration
13. `scripts/run-smoke-tests.ts` - Testing approach
14. `docs/Environment Management/ENVIRONMENT_SETUP_GUIDE.md` - Setup

This order ensures I understand the rules first, then the design, then the current implementation, and finally the testing and deployment processes.
