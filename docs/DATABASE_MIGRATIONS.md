# Database Migration Workflow

This document outlines the proper workflow for managing database schema changes using Prisma migrations.

## 🎯 Overview

Prisma migrations ensure that database schema changes are:
- **Version controlled** - Each change is tracked in git
- **Automatically deployed** - Schema updates happen with code deployments
- **Rollback safe** - Can revert problematic changes
- **Environment consistent** - Same schema across all environments

## 📁 Migration Files

Migrations are stored in `prisma/migrations/`:
```
prisma/migrations/
├── 0001_init/
│   ├── migration.sql
│   └── migration_lock.toml
└── 0002_make_fields_optional/
    ├── migration.sql
    └── migration_lock.toml
```

## 🔄 Workflow

### 1. Making Schema Changes

When you modify `prisma/schema.prisma`:

```bash
# Generate migration file
npx prisma migrate dev --name describe_your_change

# Example:
npx prisma migrate dev --name make_fields_optional
```

### 2. Development Environment

```bash
# Apply migrations in development
npm run db:migrate:dev

# Or use the full deployment script
npm run deploy:dev
```

### 3. Production Deployment

```bash
# Apply migrations in production
npm run db:migrate

# Or use the full deployment script
npm run deploy
```

## 🚀 Deployment Scripts

### Available Commands

```bash
# Database operations
npm run db:migrate          # Apply migrations (production)
npm run db:migrate:dev       # Apply migrations (development)
npm run db:migrate:status    # Check migration status
npm run db:push              # Push schema without migrations (dev only)

# Full deployment
npm run deploy               # Build + migrate + start (production)
npm run deploy:dev           # Build + migrate + dev (development)

# Utility scripts
npm run db:generate          # Generate Prisma client
npm run db:studio            # Open Prisma Studio
npm run db:reset             # Reset database and reseed
```

### Deployment Script

The `scripts/deploy.sh` script handles:
- ✅ Database migrations
- ✅ Deployment verification
- ✅ Error handling
- ✅ Environment-specific behavior

## 🔧 Railway Integration

### Automatic Migrations

Railway can run migrations automatically during deployment:

1. **Set build command**: `npm run deploy`
2. **Set start command**: `npm start`

This ensures migrations run before the application starts.

### Manual Migration

If needed, run migrations manually:

```bash
# Connect to Railway database
railway connect

# Run migrations
npm run db:migrate
```

## 📋 Best Practices

### 1. Always Use Migrations
- ❌ Don't use `prisma db push` in production
- ✅ Use `prisma migrate dev` for schema changes
- ✅ Use `prisma migrate deploy` for production

### 2. Test Migrations
- Test migrations in development first
- Verify migrations work with existing data
- Test rollback procedures

### 3. Version Control
- Commit migration files to git
- Include migration files in deployments
- Tag releases after successful migrations

### 4. Environment Consistency
- Same migration files across all environments
- Consistent schema versions
- Proper environment-specific configuration

## 🚨 Troubleshooting

### Migration Fails
```bash
# Check migration status
npm run db:migrate:status

# Reset and reapply (development only)
npm run db:reset
```

### Schema Drift
```bash
# Check for schema differences
npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-url $DATABASE_URL
```

### Production Issues
```bash
# Rollback to previous migration
npx prisma migrate resolve --rolled-back <migration_name>
```

## 📚 Additional Resources

- [Prisma Migrate Documentation](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Railway Database Guide](https://docs.railway.app/databases/postgresql)
- [Environment Management Plan](../docs/SIMPLIFIED_ENVIRONMENT_MANAGEMENT.md)
