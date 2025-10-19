# 🛡️ Production Migration Safety Checklist

## 🚨 Critical Safeguards to Prevent Migration Failures

### ✅ Pre-Deployment Validation

#### 1. Migration File Validation
```bash
# Validate all migration files before deployment
npm run validate:migrations

# Check for:
- SQL syntax errors
- Dangerous operations (DROP DATABASE, TRUNCATE)
- Table rename operations
- Foreign key constraint handling
- Data safety concerns
```

#### 2. Test Migration in Staging
```bash
# Always test migrations in test environment first
npm run test:safe-migrate

# Verify:
- Migration applies successfully
- No data loss
- All constraints work
- Application functions correctly
```

#### 3. Backup Strategy
```bash
# Create production backup before any migration
npm run prod:backup

# Verify backup:
- Backup file created successfully
- Backup size is reasonable
- Backup can be restored
```

### 🔧 Enhanced Deployment Process

#### 1. Use Enhanced Production Script
```bash
# Use the enhanced deployment script
bash scripts/railway-deploy-production.sh

# Features:
- Automatic backup creation
- Migration validation
- Rollback on failure
- Health checks
- Detailed logging
```

#### 2. Migration Order Validation
```bash
# Check migration order and dependencies
npx prisma migrate status

# Ensure:
- No failed migrations
- All migrations applied in order
- No pending migrations
```

### 🚨 Error Prevention Strategies

#### 1. Foreign Key Constraint Handling
```sql
-- ❌ WRONG: Try to create FK before renaming column
ALTER TABLE "JournalContentItems" ADD CONSTRAINT "fk" 
    FOREIGN KEY ("journal_section_id") REFERENCES "JournalSections"("section_id");

-- ✅ CORRECT: Rename column first, then create FK
ALTER TABLE "JournalContentItems" RENAME COLUMN "journal_page_id" TO "journal_section_id";
ALTER TABLE "JournalContentItems" ADD CONSTRAINT "fk" 
    FOREIGN KEY ("journal_section_id") REFERENCES "JournalSections"("section_id");
```

#### 2. Table Rename Safety
```sql
-- ❌ WRONG: Rename table without handling constraints
ALTER TABLE "JournalPages" RENAME TO "JournalSections";

-- ✅ CORRECT: Handle all constraints properly
-- Step 1: Rename foreign key columns first
ALTER TABLE "JournalContentItems" RENAME COLUMN "journal_page_id" TO "journal_section_id";

-- Step 2: Rename table
ALTER TABLE "JournalPages" RENAME TO "JournalSections";

-- Step 3: Update constraints
ALTER TABLE "JournalContentItems" DROP CONSTRAINT "old_constraint";
ALTER TABLE "JournalContentItems" ADD CONSTRAINT "new_constraint" 
    FOREIGN KEY ("journal_section_id") REFERENCES "JournalSections"("section_id");
```

#### 3. Data Preservation Checks
```sql
-- Always verify data before and after migration
SELECT COUNT(*) FROM "JournalPages";  -- Before
SELECT COUNT(*) FROM "JournalSections"; -- After

-- Verify critical data integrity
SELECT COUNT(*) FROM "JournalContentItems" WHERE "journal_section_id" IS NOT NULL;
```

### 🔄 Rollback Procedures

#### 1. Automatic Rollback
```bash
# The enhanced deployment script automatically:
- Creates backup before migration
- Detects migration failures
- Restores from backup if needed
- Exits with error code
```

#### 2. Manual Rollback
```bash
# If automatic rollback fails:
npx prisma migrate resolve --rolled-back "migration_name"

# Restore from backup:
psql $DATABASE_URL < backup_file.sql

# Verify restoration:
npx prisma migrate status
```

### 📊 Monitoring and Verification

#### 1. Post-Migration Verification
```bash
# Verify all critical tables exist and are accessible
npm run verify:schema

# Check:
- All tables exist
- All constraints are valid
- Data integrity maintained
- Application health checks pass
```

#### 2. Health Monitoring
```bash
# Monitor application after migration
curl -f http://localhost:3000/api/health

# Check:
- Server responds
- Database connectivity
- Critical endpoints work
- No error logs
```

### 🚫 What NOT to Do

#### ❌ Never Do These in Production:
1. **Skip migration validation** - Always validate first
2. **Ignore migration failures** - Fix before proceeding
3. **Skip backups** - Always backup before migration
4. **Use `prisma db push`** - Use proper migrations
5. **Deploy without testing** - Test in staging first
6. **Ignore foreign key constraints** - Handle them properly
7. **Continue on migration failure** - Stop and fix

### 🎯 Best Practices

#### 1. Migration Development
- Test migrations locally first
- Use descriptive migration names
- Include rollback procedures
- Document breaking changes
- Validate with real data

#### 2. Deployment Process
- Use enhanced deployment script
- Create backups automatically
- Validate before applying
- Monitor during application
- Verify after completion

#### 3. Error Handling
- Never ignore migration errors
- Always have rollback plan
- Monitor application health
- Alert on failures
- Document resolution steps

## 🚀 Quick Reference Commands

```bash
# Pre-deployment validation
npm run validate:migrations
npm run test:safe-migrate
npm run prod:backup

# Enhanced production deployment
bash scripts/railway-deploy-production.sh

# Emergency rollback
npx prisma migrate resolve --rolled-back "migration_name"
psql $DATABASE_URL < backup_file.sql

# Verification
npm run verify:schema
curl -f http://localhost:3000/api/health
```

## 📞 Emergency Contacts

- **Database Issues**: Check Railway dashboard
- **Migration Failures**: Use rollback procedures
- **Data Loss**: Restore from backup
- **Application Issues**: Check deployment logs

---

**Remember**: It's better to be safe than sorry. Always validate, backup, and test before deploying to production!
