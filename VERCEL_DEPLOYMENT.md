# Vercel Deployment Guide

This guide will help you deploy your Thanksgiving Menu App to Vercel.

## Prerequisites

- GitHub repository with your code
- Vercel account (free tier available)
- Vercel CLI (optional, for local deployment)

## Deployment Steps

### 1. Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Sign up with your GitHub account
3. Authorize Vercel to access your repositories

### 2. Deploy from GitHub

1. **Import Project**: Click "New Project" in your Vercel dashboard
2. **Select Repository**: Choose `maguirebob/thanksgiving`
3. **Configure Project**:
   - Framework Preset: `Other`
   - Root Directory: `./` (default)
   - Build Command: `npm install`
   - Output Directory: `./` (default)
   - Install Command: `npm install`
4. **Environment Variables**: Add these in the Vercel dashboard:
   - `NODE_ENV` = `production`
   - `POSTGRES_URL` = (will be set automatically when you add Vercel Postgres)

### 3. Add Vercel Postgres Database

1. **In your Vercel project dashboard**:
   - Go to the "Storage" tab
   - Click "Create Database"
   - Select "Postgres"
   - Choose "Hobby" plan (free tier)
   - Name it: `thanksgiving-db`
   - Click "Create"

2. **The `POSTGRES_URL` environment variable will be automatically added**

### 4. Deploy

1. **Click "Deploy"** - Vercel will:
   - Install dependencies
   - Build your application
   - Deploy to a global CDN
   - Provide you with a URL like `https://thanksgiving-xxx.vercel.app`

### 5. Initialize Database

After deployment, you need to populate the database:

#### Option A: Using Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link to your project
vercel link

# Run the database setup script
vercel env pull .env.local
node scripts/setup-vercel-db.js
```

#### Option B: Using Vercel Functions

Create a one-time setup function by adding this to your project:

```javascript
// api/setup-db.js
const { setupVercelDatabase } = require('../scripts/setup-vercel-db');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    await setupVercelDatabase();
    res.json({ success: true, message: 'Database setup completed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

Then visit: `https://your-app.vercel.app/api/setup-db` (POST request)

### 6. Test Your Deployment

Visit these URLs to test:

- **Main App**: `https://your-app.vercel.app/`
- **Health Check**: `https://your-app.vercel.app/health`
- **Database Health**: `https://your-app.vercel.app/health/db`
- **API**: `https://your-app.vercel.app/api/v1/events`

## Environment Variables

Vercel automatically provides:
- `POSTGRES_URL` - Database connection string
- `NODE_ENV` - Set to "production"

## Advantages of Vercel

- ✅ **Global CDN** - Fast loading worldwide
- ✅ **Automatic HTTPS** - SSL certificates included
- ✅ **Git Integration** - Auto-deploy on push
- ✅ **Preview Deployments** - Test before going live
- ✅ **Built-in Analytics** - Performance monitoring
- ✅ **Edge Functions** - Serverless functions
- ✅ **Vercel Postgres** - Integrated database

## Troubleshooting

### Database Connection Issues
- Ensure `POSTGRES_URL` is set in environment variables
- Check that Vercel Postgres is created and running
- Verify the database setup script ran successfully

### Build Issues
- Check that all dependencies are in `package.json`
- Ensure `vercel.json` is properly configured
- Review build logs in Vercel dashboard

### Performance Issues
- Vercel has a 30-second function timeout
- Consider optimizing database queries
- Use Vercel's built-in caching

## Custom Domain (Optional)

1. **In Vercel dashboard**:
   - Go to "Domains" tab
   - Add your custom domain
   - Follow DNS configuration instructions

## Monitoring

- **Vercel Analytics**: Built-in performance monitoring
- **Function Logs**: View in Vercel dashboard
- **Database Metrics**: Available in Vercel Postgres dashboard

## Cost

- **Free Tier**: 100GB bandwidth, 100GB-hours function execution
- **Pro Tier**: $20/month for more resources
- **Vercel Postgres**: Free tier includes 1GB storage, 1 billion row reads

Your Thanksgiving Menu App should work excellently on Vercel with fast global performance!
