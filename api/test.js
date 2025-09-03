// Simple test endpoint to verify Vercel deployment
module.exports = (req, res) => {
  try {
    res.json({
      message: 'Vercel deployment test successful!',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      hasDatabaseUrl: !!process.env.POSTGRES_URL,
      hasDatabaseUrlAlt: !!process.env.DATABASE_URL,
      nodeVersion: process.version,
      platform: process.platform
    });
  } catch (error) {
    res.status(500).json({
      error: 'Test endpoint failed',
      message: error.message,
      stack: error.stack
    });
  }
};
