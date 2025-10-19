# Deployment Checklist

This checklist ensures proper versioning, testing, and deployment across all environments. **ALWAYS follow this checklist before making any code changes or environment management.**

## Pre-Development Checklist
- [ ] **Read this checklist** - Confirm you understand all steps
- [ ] **Check current branch** - Ensure you're on `dev` branch
- [ ] **Pull latest changes** - `git pull origin dev`
- [ ] **Verify clean working directory** - No uncommitted changes
- [ ] **Check environment** - Confirm you're in development mode

## Development Phase Checklist
- [ ] **Make code changes** in `dev` branch only
- [ ] **Test changes locally** - Verify functionality works
- [ ] **Run linting** - `npm run lint` (if available)
- [ ] **Run tests** - `npm test` (if available)
- [ ] **Commit changes** - Use descriptive commit messages
- [ ] **Document any database changes** - Note new tables/columns

## Versioning Checklist
- [ ] **All changes committed** - No uncommitted files
- [ ] **Determine version type** - patch/minor/major
- [ ] **Run versioning script** - `npm run version:patch/minor/major "Description" "Details"`
- [ ] **Update schema definition** - Add new version to `src/lib/schemaVersions.ts`
- [ ] **Document database changes** - Include all new tables/columns in schema
- [ ] **Commit schema changes** - `git add src/lib/schemaVersions.ts && git commit -m "feat: add schema definition for version X.X.X"`
- [ ] **Push to dev** - `git push origin dev --tags`

## Backup Checklist
- [ ] **Database backup** - Create backup of current database state
- [ ] **File system backup** - Backup any critical files (if needed)
- [ ] **Document backup location** - Note where backups are stored
- [ ] **Verify backup integrity** - Confirm backups are valid

## Move to Test Environment Checklist
- [ ] **Switch to test branch** - `git checkout test`
- [ ] **Pull latest test changes** - `git pull origin test`
- [ ] **Merge dev to test** - `git merge dev`
- [ ] **Resolve any conflicts** - Handle merge conflicts if they occur
- [ ] **Push to test** - `git push origin test --tags`
- [ ] **Verify test environment** - Confirm test environment is updated

## Test Environment Testing Checklist
- [ ] **Environment variables** - Verify test environment variables are correct
- [ ] **Database migrations** - Run any new migrations in test
- [ ] **Smoke tests** - `npm run test:smoke` (if available)
- [ ] **Integration tests** - `npm test` (if available)
- [ ] **Manual testing** - Test key functionality manually
- [ ] **API testing** - Verify all API endpoints work
- [ ] **Database verification** - Confirm database schema is correct
- [ ] **Error handling** - Test error scenarios
- [ ] **Performance check** - Verify no performance regressions
- [ ] **Security check** - Verify security measures are in place

## Move to Production Checklist
- [ ] **All tests passed** - Confirm test environment testing is complete
- [ ] **Documentation updated** - Update any relevant documentation
- [ ] **BACKUP PRODUCTION DATABASE** - Create full backup of production database
- [ ] **BACKUP PRODUCTION FILES** - Backup any critical production files
- [ ] **Verify backup integrity** - Confirm production backups are valid and accessible
- [ ] **Document backup location** - Note where production backups are stored
- [ ] **Switch to main branch** - `git checkout main`
- [ ] **Pull latest main changes** - `git pull origin main`
- [ ] **Merge test to main** - `git merge test`
- [ ] **Resolve any conflicts** - Handle merge conflicts if they occur
- [ ] **Push to main** - `git push origin main --tags`
- [ ] **Verify production environment** - Confirm production environment is updated

## Production Environment Testing Checklist
- [ ] **Environment variables** - Verify production environment variables are correct
- [ ] **Database migrations** - Run any new migrations in production
- [ ] **Smoke tests** - Run smoke tests in production
- [ ] **Manual testing** - Test key functionality manually
- [ ] **API testing** - Verify all API endpoints work
- [ ] **Database verification** - Confirm database schema is correct
- [ ] **Performance monitoring** - Monitor for performance issues
- [ ] **Error monitoring** - Monitor for errors
- [ ] **User acceptance** - Confirm users can access new features
- [ ] **Rollback plan** - Have rollback plan ready if needed

## Post-Deployment Checklist
- [ ] **Monitor logs** - Watch for errors or issues
- [ ] **Monitor performance** - Check for performance issues
- [ ] **User feedback** - Monitor for user-reported issues
- [ ] **Document deployment** - Record deployment details
- [ ] **Update changelog** - Update project changelog if needed
- [ ] **Team notification** - Notify team of successful deployment

## Emergency Rollback Checklist
- [ ] **Identify issue** - Determine what went wrong
- [ ] **Stop new deployments** - Prevent further issues
- [ ] **Restore database** - Restore from backup if needed
- [ ] **Revert code** - Revert to previous working version
- [ ] **Test rollback** - Verify rollback works
- [ ] **Monitor stability** - Ensure system is stable
- [ ] **Document incident** - Record what happened and why
- [ ] **Plan fix** - Plan how to fix the issue properly

## Environment-Specific Commands

### Development Environment
```bash
# Start development server
npm run dev

# Run tests
npm test

# Run linting
npm run lint
```

### Test Environment
```bash
# Deploy to test
git checkout test
git merge dev
git push origin test --tags

# Run smoke tests
npm run test:smoke

# Run integration tests
npm test
```

### Production Environment
```bash
# Deploy to production
git checkout main
git merge test
git push origin main --tags

# Monitor production
# Check logs, performance, errors
```

## Critical Rules
1. **NEVER skip steps** - Each step is important
2. **ALWAYS test in test environment first** - Never go directly to production
3. **ALWAYS backup before changes** - Database and critical files
4. **ALWAYS monitor after deployment** - Watch for issues
5. **ALWAYS have rollback plan** - Be prepared to revert if needed
6. **ALWAYS document changes** - Keep records of what was done
7. **ALWAYS update schema definitions** - Keep schema versions current

## Common Mistakes to Avoid
- ❌ Making changes directly in test or main branches
- ❌ Skipping test environment testing
- ❌ Not backing up before changes
- ❌ Not updating schema definitions
- ❌ Not monitoring after deployment
- ❌ Not having a rollback plan
- ❌ Not documenting changes

## Emergency Contacts
- **Database Issues**: [Contact info]
- **Server Issues**: [Contact info]
- **Code Issues**: [Contact info]

---

**Remember: This checklist exists to prevent problems. Follow it religiously.**
