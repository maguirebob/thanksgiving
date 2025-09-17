# Vercel Deployment Control Guide

This guide explains how to control when your Thanksgiving Menu App deploys to Vercel.

## Current Configuration

Your `vercel.json` is now configured to **disable automatic deployments** from the main branch.

## Deployment Control Options

### 1. Manual Deployments Only (Current Setup)

**What it does:**
- Prevents automatic deployments when you push to GitHub
- You must manually trigger deployments

**How to deploy manually:**
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from your project directory
vercel --prod
```

### 2. Branch-Specific Auto-Deploy

If you want auto-deploy only from specific branches:

```json
{
  "git": {
    "deploymentEnabled": {
      "main": false,
      "staging": true,
      "develop": true
    }
  }
}
```

### 3. Environment-Specific Control

Control deployments by environment:

```json
{
  "git": {
    "deploymentEnabled": {
      "main": false
    }
  },
  "env": {
    "NODE_ENV": "production",
    "AUTO_DEPLOY": "false"
  }
}
```

## Deployment Methods

### Method 1: Vercel CLI (Recommended)

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Deploy specific branch
vercel --prod --target production
```

### Method 2: Vercel Dashboard

1. Go to your project in Vercel dashboard
2. Click "Deployments" tab
3. Click "Redeploy" on any previous deployment
4. Or click "Deploy" button

### Method 3: GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel
on:
  push:
    branches: [main]
  workflow_dispatch: # Manual trigger

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

## Re-enabling Auto-Deploy

If you want to re-enable automatic deployments:

### Option 1: Remove Git Configuration
```json
{
  "version": 2,
  "builds": [...],
  "routes": [...],
  "env": {...},
  "functions": {...}
  // Remove the "git" section entirely
}
```

### Option 2: Enable for Main Branch
```json
{
  "git": {
    "deploymentEnabled": {
      "main": true
    }
  }
}
```

### Option 3: Vercel Dashboard
1. Go to Project Settings
2. Click "Git" tab
3. Toggle "Automatic deployments" on/off

## Deployment Strategies

### Strategy 1: Manual Only (Current)
- **Pros**: Full control, no accidental deployments
- **Cons**: Must remember to deploy manually
- **Best for**: Production apps, when you want complete control

### Strategy 2: Staging Auto, Production Manual
- **Pros**: Test changes automatically, control production
- **Cons**: Need to manage multiple environments
- **Best for**: Teams with staging/production workflows

### Strategy 3: Branch-Based
- **Pros**: Different branches deploy to different environments
- **Cons**: More complex setup
- **Best for**: Feature branch workflows

## Current Setup Benefits

With your current configuration:

✅ **No accidental deployments** from random commits
✅ **Full control** over when deployments happen
✅ **Can still deploy manually** when ready
✅ **Prevents breaking production** with untested code
✅ **Saves Vercel build minutes** (free tier has limits)

## Quick Commands

```bash
# Check deployment status
vercel ls

# View deployment logs
vercel logs [deployment-url]

# Remove a deployment
vercel remove [deployment-url]

# Get project info
vercel inspect

# Deploy with specific environment
vercel --prod --env NODE_ENV=production
```

## Troubleshooting

### If Deployments Still Happen Automatically
1. Check Vercel dashboard settings
2. Verify `vercel.json` is committed to repo
3. Check if webhooks are enabled in GitHub

### If Manual Deployments Fail
1. Check Vercel CLI is logged in: `vercel whoami`
2. Verify project is linked: `vercel link`
3. Check build logs in Vercel dashboard

### Environment Variables
Make sure these are set in Vercel dashboard:
- `NODE_ENV=production`
- `POSTGRES_URL` (from Vercel Postgres)
- `SETUP_KEY=thanksgiving-setup-2024`

## Best Practices

1. **Test locally first**: `npm run dev` before deploying
2. **Use preview deployments**: `vercel` (not `--prod`) for testing
3. **Check logs**: Always review deployment logs
4. **Database setup**: Run setup API after first deployment
5. **Monitor performance**: Use Vercel analytics

---

**Current Status**: ✅ Auto-deploy disabled, manual deployments only
