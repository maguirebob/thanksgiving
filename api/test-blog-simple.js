const { Client } = require('pg');

module.exports = async (req, res) => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // Test blog categories
    const categoriesResult = await client.query('SELECT COUNT(*) as count FROM blog_categories');
    const categoryCount = parseInt(categoriesResult.rows[0].count);
    
    // Test blog tags
    const tagsResult = await client.query('SELECT COUNT(*) as count FROM blog_tags');
    const tagCount = parseInt(tagsResult.rows[0].count);
    
    // Test blog posts
    const postsResult = await client.query('SELECT COUNT(*) as count FROM blog_posts');
    const postCount = parseInt(postsResult.rows[0].count);
    
    // Get sample data
    const samplePosts = await client.query(`
      SELECT 
        bp.title,
        bp.status,
        bp.is_featured,
        u.username as author,
        bc.name as category_name
      FROM blog_posts bp
      LEFT JOIN "Users" u ON bp.author_id = u.id
      LEFT JOIN blog_categories bc ON bp.category_id = bc.id
      ORDER BY bp.created_at DESC
      LIMIT 5
    `);
    
    await client.end();
    
    res.json({
      success: true,
      message: 'Blog database is working correctly',
      counts: {
        categories: categoryCount,
        tags: tagCount,
        posts: postCount
      },
      samplePosts: samplePosts.rows
    });
    
  } catch (error) {
    console.error('Blog test error:', error);
    res.status(500).json({
      success: false,
      error: 'Blog test failed',
      message: error.message
    });
  }
};
