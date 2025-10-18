# Railway Deployment Lessons Learned

## Overview
This document captures the key issues encountered and solutions implemented during the successful deployment of the Thanksgiving website from JavaScript/Sequelize to TypeScript/Prisma on Railway.

## Critical Issues & Solutions

### 1. TypeScript Compilation Errors
**Issue**: Railway build failing with TypeScript errors
- `error TS6133: 'req' is declared but its value is never read`
- `error TS7016: Could not find a declaration file for module 'express-ejs-layouts'`

**Solution**:
- Install missing type definitions: `npm install --save-dev @types/express-ejs-layouts`
- Change unused parameters to underscore prefix: `req` → `_req`, `next` → `_next`
- Ensure all async functions have explicit return statements

**Prevention**: Run `npx tsc --noEmit` locally before pushing to catch TypeScript errors early.

### 2. Database Schema Not Created
**Issue**: `The table 'public.events' does not exist in the current database`

**Root Cause**: No Prisma migration files existed, so `prisma migrate deploy` failed silently.

**Solution**: Use `prisma db push` instead of migrations for initial deployment:
```bash
npx prisma generate
npx prisma db push --accept-data-loss
```

**Prevention**: 
- Create proper migration files with `prisma migrate dev` during development
- Or use `db push` for rapid prototyping and initial deployments

### 3. Database Initialization Strategy
**Issue**: Railway database empty after deployment, showing "Failed to load menus"

**Solution**: Created `/api/setup-database` endpoint that:
- Creates database schema using Prisma
- Populates with sample data
- Can be called via HTTP request after deployment

**Prevention**: Always include database initialization in deployment process.

### 4. Build Script Conflicts
**Issue**: `prebuild` hook cleaning `dist` directory before Railway's build process

**Solution**: Removed `prebuild` hook from `package.json` to avoid conflicts with Railway's build pipeline.

**Prevention**: Keep build scripts simple and avoid hooks that interfere with deployment platforms.

### 5. Port Binding for Railway
**Issue**: Application not accessible from external network

**Solution**: Bind to all interfaces: `app.listen(PORT, '0.0.0.0', callback)`

**Prevention**: Always bind to `0.0.0.0` for cloud deployments, not just `localhost`.

## Railway-Specific Considerations

### Environment Variables
- Railway automatically provides `DATABASE_URL` for PostgreSQL
- Use Railway's internal database URL format: `postgresql://user:pass@postgres.railway.internal:5432/railway`
- Environment variables are available during build and runtime

### Build Process
- Railway uses Nixpacks for Node.js applications
- Build command: `npm install && npm run build`
- Start command: `npm run build && npm start`
- Health check timeout: 120 seconds recommended

### Database Access
- Railway databases are only accessible from within Railway's network
- Cannot run database scripts locally against Railway database
- Use HTTP endpoints or Railway shell for database operations

## Production Deployment Checklist

### Pre-Deployment
- [ ] Run `npx tsc --noEmit` to check for TypeScript errors
- [ ] Test database connection locally with production-like setup
- [ ] Verify all environment variables are configured
- [ ] Ensure build scripts don't conflict with deployment platform
- [ ] Test database initialization process

### During Deployment
- [ ] Monitor build logs for TypeScript compilation errors
- [ ] Check that database schema is created successfully
- [ ] Verify application binds to `0.0.0.0` not `localhost`
- [ ] Confirm health checks pass within timeout period

### Post-Deployment
- [ ] Test database initialization endpoint
- [ ] Verify homepage loads with real data
- [ ] Check all routes and functionality work
- [ ] Monitor application logs for errors
- [ ] Test photo upload functionality (if applicable)

## Key Configuration Files

### package.json
```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/server.js",
    "dev": "ts-node-dev --respawn --transpile-only src/server.ts"
  },
  "main": "dist/server.js"
}
```

### railway.json
```json
{
  "startCommand": "npm run build && npm start",
  "healthcheckTimeout": 120
}
```

### tsconfig.json
```json
{
  "compilerOptions": {
    "rootDir": ".",
    "outDir": "./dist"
  },
  "ts-node": {
    "esm": false,
    "experimentalSpecifierResolution": "node",
    "transpileOnly": true
  }
}
```

## Database Setup Endpoint Template

```typescript
app.get('/api/setup-database', async (_req, res) => {
  try {
    // 1. Generate Prisma client
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    // 2. Create database schema
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
    
    // 3. Check for existing data
    const count = await prisma.model.count();
    if (count > 0) {
      return res.json({ success: true, message: 'Database already initialized' });
    }
    
    // 4. Create sample data
    await prisma.model.createMany({ data: sampleData });
    
    return res.json({ success: true, message: 'Database initialized successfully' });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});
```

## Common Pitfalls to Avoid

1. **Don't assume migrations exist** - Always check if migration files are present
2. **Don't ignore TypeScript errors** - Fix them before deployment
3. **Don't use localhost binding** - Use `0.0.0.0` for cloud deployments
4. **Don't skip database initialization** - Always have a way to populate initial data
5. **Don't use complex build hooks** - Keep build process simple for deployment platforms
6. **Don't forget error handling** - Ensure all async functions have proper error handling

## Next Steps for Production

1. **Create proper migration files** using `prisma migrate dev`
2. **Set up automated database backups**
3. **Configure monitoring and logging**
4. **Implement proper error handling and user feedback**
5. **Set up CI/CD pipeline** for automated deployments
6. **Configure custom domain** and SSL certificates
7. **Set up staging environment** for testing before production

---

*Last updated: December 2024*
*Deployment platform: Railway*
*Stack: TypeScript, Express.js, Prisma, PostgreSQL, EJS*
