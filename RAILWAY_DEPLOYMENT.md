# Railway Deployment Guide

This guide will help you deploy your Thanksgiving Menu application to Railway.com.

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Database**: You'll need a PostgreSQL database (Railway provides this)

## Step 1: Prepare Your Repository

1. **Commit all changes** to your GitHub repository:
   ```bash
   git add .
   git commit -m "Prepare for Railway deployment"
   git push origin main
   ```

## Step 2: Deploy to Railway

### Option A: Deploy from GitHub (Recommended)

1. **Go to Railway Dashboard**: Visit [railway.app/dashboard](https://railway.app/dashboard)
2. **Create New Project**: Click "New Project"
3. **Deploy from GitHub**: Select "Deploy from GitHub repo"
4. **Select Repository**: Choose your thanksgiving repository
5. **Deploy**: Railway will automatically detect it's a Node.js app

### Option B: Deploy with Railway CLI

1. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**:
   ```bash
   railway login
   ```

3. **Initialize Project**:
   ```bash
   railway init
   ```

4. **Deploy**:
   ```bash
   railway up
   ```

## Step 3: Set Up Database

1. **Add PostgreSQL Service**:
   - In your Railway project dashboard
   - Click "New Service" → "Database" → "PostgreSQL"

2. **Get Database URL**:
   - Click on your PostgreSQL service
   - Go to "Variables" tab
   - Copy the `DATABASE_URL`

## Step 4: Configure Environment Variables

In your Railway project dashboard, go to "Variables" and add:

```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=<your-database-url-from-step-3>
```

Railway will automatically parse the `DATABASE_URL` into individual variables:
- `PGUSER`
- `PGPASSWORD` 
- `PGDATABASE`
- `PGHOST`
- `PGPORT`

## Step 5: Set Up Database Tables

1. **Connect to your deployed app**:
   - Go to your service in Railway dashboard
   - Click "Deployments" tab
   - Click on the latest deployment
   - Go to "Logs" to see the deployment status

2. **Run database setup** (if needed):
   - The app will automatically sync database models on first run
   - If you need to run the SQL script, you can use Railway's console

## Step 6: Access Your Application

1. **Get your app URL**:
   - In Railway dashboard, go to your service
   - Click "Settings" tab
   - Copy the "Domain" URL

2. **Test your application**:
   - Visit your Railway URL
   - Check the health endpoint: `https://your-app.railway.app/health`

## Step 7: Custom Domain (Optional)

1. **Add Custom Domain**:
   - In Railway dashboard, go to "Settings"
   - Click "Domains" tab
   - Add your custom domain

2. **Configure DNS**:
   - Point your domain to Railway's servers
   - Follow Railway's DNS configuration instructions

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `production` |
| `PORT` | Server port | `3000` |
| `DATABASE_URL` | Full database URL | `postgresql://user:pass@host:port/db` |
| `PGUSER` | Database username | `postgres` |
| `PGPASSWORD` | Database password | `password123` |
| `PGDATABASE` | Database name | `railway` |
| `PGHOST` | Database host | `containers-us-west-1.railway.app` |
| `PGPORT` | Database port | `5432` |

## Troubleshooting

### Common Issues:

1. **Database Connection Failed**:
   - Check that `DATABASE_URL` is set correctly
   - Verify PostgreSQL service is running

2. **Build Failed**:
   - Check that all dependencies are in `package.json`
   - Verify Node.js version compatibility

3. **App Won't Start**:
   - Check logs in Railway dashboard
   - Verify all environment variables are set

### Useful Commands:

```bash
# View logs
railway logs

# Connect to database
railway connect

# Open shell in Railway environment
railway shell
```

## Monitoring

1. **View Logs**: Railway dashboard → Your service → Logs
2. **Monitor Performance**: Railway dashboard → Your service → Metrics
3. **Health Checks**: Your app has a `/health` endpoint for monitoring

## Updates and Redeployment

1. **Push to GitHub**: Any push to your main branch will trigger automatic deployment
2. **Manual Deploy**: Use Railway CLI or dashboard to trigger manual deployments
3. **Rollback**: Railway keeps deployment history for easy rollbacks

## Cost Management

- Railway offers a free tier with usage limits
- Monitor your usage in the dashboard
- Upgrade to paid plans as needed

## Support

- Railway Documentation: [docs.railway.app](https://docs.railway.app)
- Railway Discord: [discord.gg/railway](https://discord.gg/railway)
- GitHub Issues: Create issues in your repository for app-specific problems
