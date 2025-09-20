const { Pool } = require('pg');

const config = {
  connectionString: process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const pool = new Pool(config);

  try {
    // Test database connection
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful');

    // Check if blog tables exist
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('blog_categories', 'blog_tags', 'blog_posts', 'blog_post_tags')
      ORDER BY table_name;
    `;
    
    const tablesResult = await pool.query(tablesQuery);
    const existingTables = tablesResult.rows.map(row => row.table_name);
    
    console.log('📋 Existing blog tables:', existingTables);

    // Check blog categories count
    let categoriesCount = 0;
    if (existingTables.includes('blog_categories')) {
      const categoriesResult = await pool.query('SELECT COUNT(*) FROM blog_categories');
      categoriesCount = parseInt(categoriesResult.rows[0].count);
    }

    // Check blog tags count
    let tagsCount = 0;
    if (existingTables.includes('blog_tags')) {
      const tagsResult = await pool.query('SELECT COUNT(*) FROM blog_tags');
      tagsCount = parseInt(tagsResult.rows[0].count);
    }

    // Check blog posts count
    let postsCount = 0;
    if (existingTables.includes('blog_posts')) {
      const postsResult = await pool.query('SELECT COUNT(*) FROM blog_posts');
      postsCount = parseInt(postsResult.rows[0].count);
    }

    // Test creating a sample blog post
    let testPostCreated = false;
    if (existingTables.includes('blog_posts') && existingTables.includes('blog_categories')) {
      try {
        // Get first user and category
        const userResult = await pool.query('SELECT user_id FROM "Users" LIMIT 1');
        const categoryResult = await pool.query('SELECT id FROM blog_categories LIMIT 1');
        
        if (userResult.rows.length > 0 && categoryResult.rows.length > 0) {
          const testPost = await pool.query(`
            INSERT INTO blog_posts (title, slug, content, author_id, category_id, status)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
          `, [
            'Test Blog Post from Vercel',
            'test-blog-post-from-vercel',
            'This is a test blog post created from Vercel to verify the database setup.',
            userResult.rows[0].user_id,
            categoryResult.rows[0].id,
            'draft'
          ]);
          
          testPostCreated = true;
          console.log('✅ Test blog post created with ID:', testPost.rows[0].id);
        }
      } catch (error) {
        console.error('❌ Error creating test blog post:', error.message);
      }
    }

    const result = {
      success: true,
      message: 'Blog database test completed',
      database: {
        connected: true,
        tables: {
          expected: ['blog_categories', 'blog_tags', 'blog_posts', 'blog_post_tags'],
          existing: existingTables,
          missing: ['blog_categories', 'blog_tags', 'blog_posts', 'blog_post_tags'].filter(
            table => !existingTables.includes(table)
          )
        },
        counts: {
          categories: categoriesCount,
          tags: tagsCount,
          posts: postsCount
        },
        testPostCreated: testPostCreated
      }
    };

    console.log('🎉 Blog database test result:', JSON.stringify(result, null, 2));
    
    res.status(200).json(result);

  } catch (error) {
    console.error('❌ Blog database test error:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Blog database test failed'
    });
  } finally {
    await pool.end();
  }
}
