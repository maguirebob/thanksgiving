const { setupBlogDatabase } = require('../scripts/setup-blog-vercel');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Use POST to run the blog database setup'
    });
  }

  try {
    console.log('🚀 Blog database setup requested via API...');
    
    const result = await setupBlogDatabase();
    
    console.log('✅ Blog database setup completed via API');
    res.status(200).json(result);

  } catch (error) {
    console.error('❌ Blog database setup failed via API:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Blog database setup failed'
    });
  }
}