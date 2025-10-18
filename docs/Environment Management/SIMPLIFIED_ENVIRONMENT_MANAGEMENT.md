# Simplified Environment Management Plan
## GitHub Branch-Based Deployment Strategy

### Overview
A streamlined environment management approach using GitHub branches to control deployments across three environments: Development, Test, and Production. No pull request reviews required - direct push-based deployments with branch protection to prevent accidental checkouts.

---

## 🏗️ Simplified Architecture

### Branch Structure
```
main (production)     → Railway Production Environment
├── test             → Railway Test Environment  
└── dev              → Local Development Environment
```

### Environment Mapping
| Environment | Branch | Deployment Trigger | Platform | URL |
|-------------|--------|-------------------|----------|-----|
| **Development** | `dev` | Manual `npm start` | Local | `http://localhost:3000` |
| **Test** | `test` | Push to `test` branch | Railway | `https://thanksgiving-test-test.up.railway.app` |
| **Production** | `main` | Push to `main` branch | Railway | `https://thanksgiving-prod-production.up.railway.app` |

---

## 🔄 Simplified Workflow

### Development Process
```
1. Checkout dev branch
2. Develop features locally
3. Test locally
4. Push to test branch → Auto-deploy to Railway Test
5. Test in Railway Test environment
6. Push to main branch → Auto-deploy to Railway Production
```

### Example Workflow
```bash
# 1. Start development
git checkout dev
git pull origin dev

# 2. Develop and test locally
npm start
# ... make changes, test locally ...

# 3. Deploy to test environment
git checkout test
git merge dev
git push origin test
# → Railway automatically deploys to test environment

# 4. Test in Railway test environment
# Visit: https://thanksgiving-test-production.up.railway.app
# ... perform testing ...

# 5. Deploy to production
git checkout main
git merge test
git push origin main
# → Railway automatically deploys to production environment
```

---

## 🛡️ Branch Protection Strategy

### Branch Protection Rules
- **`main`**: Prevent direct checkout (read-only for most users)
- **`test`**: Prevent direct checkout (read-only for most users)  
- **`dev`**: No protection (free development)

### Implementation
```bash
# Set up branch protection (via GitHub web interface)
# main branch:
# - Restrict pushes to main branch
# - Require status checks to pass
# - Allow force pushes (for hotfixes)

# test branch:
# - Restrict pushes to test branch
# - Allow force pushes (for hotfixes)
```

---

## 🚀 Initial Setup Process

### Current State
- ✅ Railway test environment exists: `https://thanksgiving-test-test.up.railway.app`
- ✅ Railway production environment exists: `https://thanksgiving-prod-production.up.railway.app`
- ❌ Both environments currently point to `main` branch
- ❌ Auto-deploy is currently disabled
- ❌ `test` branch doesn't exist yet

### Setup Sequence
```bash
# 1. Sync all environments with current main branch
# (This ensures all environments start from the same state)

# 2. Create test branch from current main
git checkout -b test
git push origin test

# 3. Configure Railway environments
# - Set test environment to deploy from 'test' branch
# - Set production environment to deploy from 'main' branch
# - Enable auto-deploy for both environments

# 4. Set up branch protection rules
# - Protect main and test branches from direct checkout
# - Allow direct pushes (no PR reviews required)

# 5. Test the complete workflow
```

---

## 🚀 Implementation Plan

### Phase 1: Initial Sync and Branch Setup (30 minutes)

#### Task 1.1: Sync All Environments
**Assigned to: User**

1. **Deploy Current Main to Both Railway Environments:**
   - Manually trigger deployment to test environment
   - Manually trigger deployment to production environment
   - Verify both environments are running the same code

2. **Verify Environment URLs:**
   - Test: `https://thanksgiving-test-test.up.railway.app`
   - Production: `https://thanksgiving-prod-production.up.railway.app`

#### Task 1.2: Create Test Branch
**Assigned to: AI Assistant**

```bash
# Create test branch from current main
git checkout -b test
git push origin test

# Create dev branch for development
git checkout -b dev
git push origin dev
```

#### Task 1.3: Configure Railway Auto-Deploy
**Assigned to: User**

1. **Configure Railway GitHub Integration:**
   - Set test environment to deploy from `test` branch
   - Set production environment to deploy from `main` branch
   - Enable auto-deploy for both environments

2. **Verify Environment Variables:**
   - Ensure both environments have correct database URLs
   - Test database connectivity for both environments

### Phase 2: Branch Protection Setup (15 minutes)

#### Task 2.1: Configure GitHub Branch Protection
**Assigned to: User**

1. **Set up Branch Protection Rules:**
   - **Main Branch**: Restrict pushes, require status checks, allow force pushes
   - **Test Branch**: Restrict pushes, allow force pushes
   - **Dev Branch**: No protection (free development)

2. **Verify Protection Rules:**
   - Test that direct checkout to main/test is prevented
   - Verify that pushes to main/test still work
   - Confirm dev branch has no restrictions

### Phase 3: Environment Configuration (45 minutes)

#### Task 3.1: Environment Detection
**Assigned to: AI Assistant**

Create `src/lib/environment.ts`:
```typescript
export const getEnvironment = (): 'development' | 'test' | 'production' => {
  const nodeEnv = process.env['NODE_ENV'];
  const railwayEnv = process.env['RAILWAY_ENVIRONMENT'];
  
  if (nodeEnv === 'development') return 'development';
  if (railwayEnv === 'production') return 'production';
  if (railwayEnv === 'test' || nodeEnv === 'test') return 'test';
  
  return 'development';
};
```

#### Task 3.2: Database Configuration
**Assigned to: User**

1. **Database Setup:**
   - Create PostgreSQL services in Railway for test and production
   - Configure connection strings
   - Test database connectivity

2. **Migration and Seeding:**
   - Run `prisma db push` on test environment
   - Run `prisma db push` on production environment
   - Set up test data seeding for test environment

### Phase 3: Versioning Integration (15 minutes)

#### Task 3.1: Version Management
**Assigned to: AI Assistant**

Update versioning to work with branch-based deployments:
```bash
# Version bump workflow
npm run version:minor  # or version:major, version:patch
git push origin dev    # Push versioned code to dev
git checkout test
git merge dev
git push origin test   # Deploy to test
# ... test ...
git checkout main
git merge test
git push origin main   # Deploy to production
```

---

## 📋 Complete Example Workflow

### Scenario: Adding a New Feature

```bash
# 1. Start development
git checkout dev
git pull origin dev
npm start
# ... develop new feature locally ...

# 2. Test locally
# Visit: http://localhost:3000
# ... test the new feature ...

# 3. Version and commit
npm run version:minor
git add .
git commit -m "feat: add new feature"
git push origin dev

# 4. Deploy to test
git checkout test
git merge dev
git push origin test
# → Railway automatically deploys to test environment

# 5. Test in Railway test environment
# Visit: https://thanksgiving-test-test.up.railway.app
# ... perform comprehensive testing ...

# 6. Deploy to production
git checkout main
git merge test
git push origin main
# → Railway automatically deploys to production environment

# 7. Verify production
# Visit: https://thanksgiving-prod-production.up.railway.app
# ... verify everything works ...
```

---

## 🔧 Configuration Files

### Environment Detection
```typescript
// src/lib/environment.ts
export const getEnvironment = (): 'development' | 'test' | 'production' => {
  const nodeEnv = process.env['NODE_ENV'];
  const railwayEnv = process.env['RAILWAY_ENVIRONMENT'];
  
  if (nodeEnv === 'development') return 'development';
  if (railwayEnv === 'production') return 'production';
  if (railwayEnv === 'test' || nodeEnv === 'test') return 'test';
  
  return 'development';
};

export const getDatabaseUrl = (): string => {
  const env = getEnvironment();
  
  switch (env) {
    case 'development':
      return process.env['DATABASE_URL'] || 'postgresql://localhost:5432/thanksgiving_dev';
    case 'test':
      return process.env['RAILWAY_TEST_DATABASE_URL'];
    case 'production':
      return process.env['RAILWAY_PROD_DATABASE_URL'];
    default:
      throw new Error(`Unknown environment: ${env}`);
  }
};
```

### Railway Configuration
```yaml
# railway.json (for each environment)
{
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health"
  }
}
```

---

## 🚨 Branch Protection Setup

### GitHub Branch Protection Rules

#### Main Branch (Production)
- ✅ Restrict pushes to main branch
- ✅ Require status checks to pass
- ✅ Allow force pushes (for hotfixes)
- ❌ No pull request reviews required

#### Test Branch
- ✅ Restrict pushes to test branch
- ✅ Allow force pushes (for hotfixes)
- ❌ No pull request reviews required

#### Dev Branch
- ❌ No protection (free development)

---

## 📊 Monitoring and Health Checks

### Health Check Endpoint
```typescript
// src/server.ts
app.get('/health', (req, res) => {
  const env = getEnvironment();
  res.json({
    status: 'healthy',
    environment: env,
    timestamp: new Date().toISOString(),
    version: process.env['npm_package_version']
  });
});
```

### Environment-Specific Logging
```typescript
// src/lib/logger.ts
export const log = (message: string, level: 'info' | 'warn' | 'error' = 'info') => {
  const env = getEnvironment();
  const timestamp = new Date().toISOString();
  
  if (env === 'development') {
    console.log(`[${timestamp}] [${env}] [${level}] ${message}`);
  } else {
    // In production/test, use structured logging
    console.log(JSON.stringify({
      timestamp,
      environment: env,
      level,
      message
    }));
  }
};
```

---

## 🎯 Success Criteria

### Phase 1 Success
- [ ] All three branches created (`dev`, `test`, `main`)
- [ ] Branch protection rules configured
- [ ] Railway environments created and connected

### Phase 2 Success
- [ ] Environment detection working
- [ ] Database connections configured for each environment
- [ ] Health check endpoint responding

### Phase 3 Success
- [ ] Versioning integrated with deployment workflow
- [ ] Complete workflow tested end-to-end
- [ ] Documentation updated

---

## 🚀 Getting Started

### Immediate Next Steps
1. **Review this simplified plan** - Confirm this approach meets your needs
2. **Start Phase 1** - Create branches and Railway environments
3. **Test the workflow** - Try the complete development → test → production flow
4. **Document any issues** - Refine the process based on experience

### Key Benefits
✅ **Simple workflow** - No complex PR reviews  
✅ **Direct deployments** - Push to branch triggers deployment  
✅ **Environment isolation** - Separate databases and configurations  
✅ **Version integration** - Works with existing versioning system  
✅ **Easy rollback** - Git-based rollback capabilities  
✅ **Clear separation** - Dev, test, and production are clearly separated  

---

*This simplified approach focuses on the core workflow you requested while maintaining the benefits of environment isolation and automated deployments.*
