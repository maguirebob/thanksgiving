// Simple test endpoint to verify Vercel deployment
module.exports = (req, res) => {
  res.json({
    message: 'Vercel deployment test successful!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    hasDatabaseUrl: !!process.env.POSTGRES_URL,
    hasDatabaseUrlAlt: !!process.env.DATABASE_URL
  });
};
