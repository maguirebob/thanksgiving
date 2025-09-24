const migrateUsernamesToLowercase = require('../scripts/migrate-usernames-to-lowercase');

module.exports = async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check for setup key
  const setupKey = req.headers['x-setup-key'] || req.body.setupKey;
  const expectedKey = process.env.SETUP_KEY || 'thanksgiving-setup-2024';
  
  if (setupKey !== expectedKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('🔄 Starting username to lowercase migration...');
    
    await migrateUsernamesToLowercase();
    
    console.log('✅ Username to lowercase migration completed');
    
    res.status(200).json({
      success: true,
      message: 'Username to lowercase migration completed successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    
    res.status(500).json({
      success: false,
      error: 'Migration failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
