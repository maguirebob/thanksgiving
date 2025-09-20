module.exports = async (req, res) => {
  try {
    console.log('Debug endpoint called');
    console.log('Environment variables:', {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
      POSTGRES_URL: process.env.POSTGRES_URL ? 'SET' : 'NOT SET'
    });
    
    res.json({
      success: true,
      message: 'Debug endpoint working',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasPostgresUrl: !!process.env.POSTGRES_URL
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
};
