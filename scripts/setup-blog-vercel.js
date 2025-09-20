#!/usr/bin/env node

/**
 * Blog Database Setup Script for Vercel/Neon
 * 
 * This script sets up the blog tables in the Vercel/Neon database.
 * It can be run as a Vercel function or locally with proper environment variables.
 * 
 * Usage:
 *   node scripts/setup-blog-vercel.js
 *   curl -X POST https://your-vercel-app.vercel.app/api/setup-blog-vercel
 */

const { Pool } = require('pg');

// Configuration for Vercel/Neon database
const config = {
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
};

async function setupBlogDatabase() {
  const pool = new Pool(config);
  
  try {
    console.log('🚀 Starting blog database setup on Vercel/Neon...');
    
    // Test database connection
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful');
    
    // Check existing tables
    const existingTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('📋 Existing tables:', existingTables.rows.map(r => r.table_name));
    
    // Create blog tables
    const createTablesSQL = `
-- Create BlogCategories table
CREATE TABLE IF NOT EXISTS blog_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#007bff',
    slug VARCHAR(100) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create BlogTags table
CREATE TABLE IF NOT EXISTS blog_tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create BlogPosts table
CREATE TABLE IF NOT EXISTS blog_posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    content TEXT NOT NULL,
    excerpt TEXT,
    featured_image_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    is_featured BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    author_id INTEGER NOT NULL REFERENCES "Users"(user_id) ON DELETE CASCADE,
    event_id INTEGER REFERENCES events(event_id) ON DELETE SET NULL,
    category_id INTEGER REFERENCES blog_categories(id) ON DELETE SET NULL,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create BlogPostTags junction table
CREATE TABLE IF NOT EXISTS blog_post_tags (
    id SERIAL PRIMARY KEY,
    blog_post_id INTEGER NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    blog_tag_id INTEGER NOT NULL REFERENCES blog_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(blog_post_id, blog_tag_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_event_id ON blog_posts(event_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category_id ON blog_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at);
CREATE INDEX IF NOT EXISTS idx_blog_posts_is_featured ON blog_posts(is_featured);
CREATE INDEX IF NOT EXISTS idx_blog_posts_view_count ON blog_posts(view_count);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_categories_slug ON blog_categories(slug);
CREATE INDEX IF NOT EXISTS idx_blog_categories_is_active ON blog_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_blog_tags_slug ON blog_tags(slug);
CREATE INDEX IF NOT EXISTS idx_blog_tags_usage_count ON blog_tags(usage_count);
CREATE INDEX IF NOT EXISTS idx_blog_post_tags_blog_post_id ON blog_post_tags(blog_post_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_tags_blog_tag_id ON blog_post_tags(blog_tag_id);
`;

    console.log('📋 Creating blog tables...');
    await pool.query(createTablesSQL);
    console.log('✅ Blog tables created successfully');
    
    // Insert sample data
    const insertSampleDataSQL = `
-- Insert sample blog categories
INSERT INTO blog_categories (name, description, color, slug) VALUES
('Recipes', 'Thanksgiving recipes and cooking tips', '#28a745', 'recipes'),
('Memories', 'Family memories and stories from past Thanksgivings', '#ffc107', 'memories'),
('Traditions', 'Family traditions and customs', '#17a2b8', 'traditions'),
('Tips', 'Helpful tips for hosting Thanksgiving', '#6f42c1', 'tips'),
('Decorations', 'Thanksgiving decoration ideas', '#fd7e14', 'decorations')
ON CONFLICT (slug) DO NOTHING;

-- Insert sample blog tags
INSERT INTO blog_tags (name, slug, description) VALUES
('turkey', 'turkey', 'Posts about turkey preparation and cooking'),
('stuffing', 'stuffing', 'Posts about stuffing recipes and techniques'),
('desserts', 'desserts', 'Posts about Thanksgiving desserts'),
('family', 'family', 'Posts about family gatherings and traditions'),
('cooking', 'cooking', 'Posts about cooking techniques and tips'),
('decorations', 'decorations', 'Posts about Thanksgiving decorations'),
('memories', 'memories', 'Posts sharing family memories'),
('tips', 'tips', 'Helpful tips and advice'),
('recipes', 'recipes', 'Recipe-related content'),
('traditions', 'traditions', 'Family and cultural traditions')
ON CONFLICT (slug) DO NOTHING;
`;

    console.log('📝 Inserting sample data...');
    await pool.query(insertSampleDataSQL);
    console.log('✅ Sample data inserted successfully');
    
    // Verify the setup
    const finalTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'blog_%'
      ORDER BY table_name;
    `);
    
    const categoriesCount = await pool.query('SELECT COUNT(*) FROM blog_categories');
    const tagsCount = await pool.query('SELECT COUNT(*) FROM blog_tags');
    const postsCount = await pool.query('SELECT COUNT(*) FROM blog_posts');
    
    const result = {
      success: true,
      message: 'Blog database setup completed successfully on Vercel/Neon',
      tables: {
        created: finalTables.rows.map(r => r.table_name),
        expected: ['blog_categories', 'blog_tags', 'blog_posts', 'blog_post_tags']
      },
      counts: {
        categories: parseInt(categoriesCount.rows[0].count),
        tags: parseInt(tagsCount.rows[0].count),
        posts: parseInt(postsCount.rows[0].count)
      }
    };
    
    console.log('🎉 Blog database setup completed!');
    console.log('📊 Final result:', JSON.stringify(result, null, 2));
    
    return result;
    
  } catch (error) {
    console.error('❌ Blog database setup error:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the setup if this script is executed directly
if (require.main === module) {
  setupBlogDatabase()
    .then(() => {
      console.log('✅ Setup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Setup failed:', error.message);
      process.exit(1);
    });
}

module.exports = { setupBlogDatabase };
