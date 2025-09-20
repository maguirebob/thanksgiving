const { setupBlogWithPrisma } = require('../scripts/setup-blog-prisma-direct');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Use POST to run the blog setup'
    });
  }

  try {
    console.log('🚀 Blog setup requested via API...');
    
    const result = await setupBlogWithPrisma();
    
    console.log('✅ Blog setup completed via API');
    res.status(200).json(result);

  } catch (error) {
    console.error('❌ Blog setup failed via API:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Blog setup failed'
    });
  }
}