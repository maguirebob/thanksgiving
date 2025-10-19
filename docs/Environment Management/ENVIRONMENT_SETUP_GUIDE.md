# Environment Management Setup Guide
## Quick Reference for Initial Setup

### Current State
- ✅ Railway test environment: `https://thanksgiving-test-test.up.railway.app`
- ✅ Railway production environment: `https://thanksgiving-prod-production.up.railway.app`
- ❌ Both environments point to `main` branch
- ❌ Auto-deploy is disabled
- ❌ `test` branch doesn't exist

---

## 🚀 Step-by-Step Setup

### Step 1: Sync All Environments (User)
**Goal**: Ensure all environments start from the same state

1. **Manual Deploy to Test Environment:**
   - Go to Railway dashboard
   - Navigate to test environment
   - Trigger manual deployment from `main` branch
   - Verify deployment succeeds

2. **Manual Deploy to Production Environment:**
   - Go to Railway dashboard
   - Navigate to production environment
   - Trigger manual deployment from `main` branch
   - Verify deployment succeeds

3. **Verify Both Environments:**
   - Test: `https://thanksgiving-test-test.up.railway.app`
   - Production: `https://thanksgiving-prod-production.up.railway.app`
   - Both should show the same version/content

### Step 2: Create Branches (AI Assistant)
**Goal**: Create `test` and `dev` branches from current `main`

```bash
# Create test branch from current main
git checkout -b test
git push origin test

# Create dev branch for development
git checkout -b dev
git push origin dev

# Return to main branch
git checkout main
```

### Step 3: Configure Railway Auto-Deploy (User)
**Goal**: Set up automatic deployments based on branch pushes

1. **Configure Test Environment:**
   - Go to Railway dashboard → Test environment
   - Settings → GitHub Integration
   - Set deployment branch to `test`
   - Enable auto-deploy

2. **Configure Production Environment:**
   - Go to Railway dashboard → Production environment
   - Settings → GitHub Integration
   - Set deployment branch to `main`
   - Enable auto-deploy

3. **Test Auto-Deploy:**
   - Make a small change on `dev` branch
   - Merge to `test` branch and push
   - Verify test environment auto-deploys
   - Merge to `main` branch and push
   - Verify production environment auto-deploys

### Step 4: Set Up Branch Protection (User)
**Goal**: Prevent accidental direct checkout to main/test branches

1. **GitHub Repository Settings:**
   - Go to GitHub repository → Settings → Branches
   - Add branch protection rule for `main`:
     - ✅ Restrict pushes to main branch
     - ✅ Require status checks to pass
     - ✅ Allow force pushes
   - Add branch protection rule for `test`:
     - ✅ Restrict pushes to test branch
     - ✅ Allow force pushes
   - Leave `dev` branch unprotected

2. **Test Protection Rules:**
   - Try to checkout `main` branch directly (should be prevented)
   - Try to checkout `test` branch directly (should be prevented)
   - Verify `dev` branch has no restrictions

### Step 5: Environment Detection (AI Assistant)
**Goal**: Add environment detection to the application

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

### Step 6: Test Complete Workflow (Both)
**Goal**: Verify the entire dev → test → production workflow

```bash
# 1. Develop on dev branch
git checkout dev
# ... make a small change ...
git add .
git commit -m "test: verify environment workflow"
git push origin dev

# 2. Deploy to test
git checkout test
git merge dev
git push origin test
# → Should auto-deploy to test environment

# 3. Verify test environment
# Visit: https://thanksgiving-test-test.up.railway.app
# ... verify change is present ...

# 4. Deploy to production
git checkout main
git merge test
git push origin main
# → Should auto-deploy to production environment

# 5. Verify production environment
# Visit: https://thanksgiving-prod-production.up.railway.app
# ... verify change is present ...
```

---

## ✅ Success Criteria

### Phase 1 Complete When:
- [ ] All three environments show the same version
- [ ] `test` and `dev` branches exist
- [ ] Railway auto-deploy is configured

### Phase 2 Complete When:
- [ ] Branch protection rules are active
- [ ] Direct checkout to main/test is prevented
- [ ] Pushes to main/test still work

### Phase 3 Complete When:
- [ ] Environment detection is implemented
- [ ] Complete workflow tested end-to-end
- [ ] All environments are properly isolated

---

## 🚨 Troubleshooting

### Common Issues:

1. **Railway Auto-Deploy Not Working:**
   - Check GitHub integration settings
   - Verify branch names match exactly
   - Check Railway logs for errors

2. **Branch Protection Too Restrictive:**
   - Ensure "Allow force pushes" is enabled
   - Check that status checks are not blocking deployments

3. **Environment Detection Issues:**
   - Verify environment variables are set correctly
   - Check Railway environment variable names

4. **Database Connection Issues:**
   - Verify database URLs are correct for each environment
   - Test database connectivity from Railway dashboard

---

## 📞 Next Steps

Once setup is complete:
1. **Document the workflow** for team members
2. **Set up monitoring** for both environments
3. **Create deployment runbook** for common tasks
4. **Test rollback procedures** if needed

---

*This guide provides a step-by-step approach to setting up the simplified environment management system.*
