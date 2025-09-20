const { setupVercelDatabase } = require('../scripts/setup-vercel-db');
const migrateUsernamesToLowercase = require('../scripts/migrate-usernames-to-lowercase');

module.exports = async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Use POST to setup database'
    });
  }

  // Add basic security - require a setup key
  const setupKey = req.headers['x-setup-key'] || req.body.setupKey;
  const expectedKey = process.env.SETUP_KEY || 'thanksgiving-setup-2024';
  
  if (setupKey !== expectedKey) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid setup key'
    });
  }

  try {
    console.log('🔄 Starting database setup via API...');
    await setupVercelDatabase();
    
    console.log('🔄 Starting username migration to lowercase...');
    await migrateUsernamesToLowercase();
    
    res.json({
      success: true,
      message: 'Database setup and username migration completed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
