#!/usr/bin/env node

/**
 * Simple Blog Setup Script
 * 
 * This script creates the blog tables using raw SQL that works with the existing database.
 * It's designed to work with Vercel/Neon database.
 * 
 * Usage:
 *   DATABASE_URL="your-vercel-db-url" node scripts/setup-blog-simple.js
 */

const { Client } = require('pg');

async function setupBlogTables() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🚀 Starting blog setup with raw SQL...');
    
    await client.connect();
    console.log('✅ Database connection successful');
    
    // Check if blog tables already exist
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'blog_%'
      ORDER BY table_name;
    `);
    
    console.log('📋 Existing blog tables:', result.rows.map(r => r.table_name));
    
    if (result.rows.length > 0) {
      console.log('⚠️  Some blog tables already exist. Continuing with missing tables...');
    }
    
    // Create blog categories table
    console.log('📝 Creating blog_categories table...');
    await client.query(`
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
    `);
    console.log('✅ blog_categories table created');
    
    // Create blog tags table
    console.log('📝 Creating blog_tags table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS blog_tags (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        slug VARCHAR(50) NOT NULL UNIQUE,
        description TEXT,
        usage_count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ blog_tags table created');
    
    // Create blog posts table
    console.log('📝 Creating blog_posts table...');
    await client.query(`
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
        author_id INTEGER NOT NULL REFERENCES "Users"(id) ON DELETE CASCADE,
        event_id INTEGER REFERENCES "Events"(id) ON DELETE SET NULL,
        category_id INTEGER REFERENCES blog_categories(id) ON DELETE SET NULL,
        published_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ blog_posts table created');
    
    // Create blog post tags junction table
    console.log('📝 Creating blog_post_tags table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS blog_post_tags (
        id SERIAL PRIMARY KEY,
        blog_post_id INTEGER NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
        blog_tag_id INTEGER NOT NULL REFERENCES blog_tags(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(blog_post_id, blog_tag_id)
      );
    `);
    console.log('✅ blog_post_tags table created');
    
    // Create indexes
    console.log('📝 Creating indexes...');
    await client.query('CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_blog_posts_author ON blog_posts(author_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_blog_posts_event ON blog_posts(event_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published_at);');
    console.log('✅ Indexes created');
    
    // Insert sample data for categories
    console.log('📝 Inserting sample categories...');
    const categories = [
      ['Recipes', 'Thanksgiving recipes and cooking tips', '#28a745', 'recipes'],
      ['Memories', 'Family memories and stories from past Thanksgivings', '#ffc107', 'memories'],
      ['Traditions', 'Family traditions and customs', '#17a2b8', 'traditions'],
      ['Tips', 'Helpful tips for hosting Thanksgiving', '#6f42c1', 'tips'],
      ['Decorations', 'Thanksgiving decoration ideas', '#fd7e14', 'decorations']
    ];
    
    for (const [name, description, color, slug] of categories) {
      await client.query(`
        INSERT INTO blog_categories (name, description, color, slug)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (slug) DO NOTHING;
      `, [name, description, color, slug]);
    }
    console.log('✅ Sample categories inserted');
    
    // Insert sample data for tags
    console.log('📝 Inserting sample tags...');
    const tags = [
      ['turkey', 'turkey', 'Posts about turkey preparation and cooking'],
      ['stuffing', 'stuffing', 'Posts about stuffing recipes and techniques'],
      ['desserts', 'desserts', 'Posts about Thanksgiving desserts'],
      ['family', 'family', 'Posts about family gatherings and traditions'],
      ['cooking', 'cooking', 'Posts about cooking techniques and tips'],
      ['decorations', 'decorations', 'Posts about Thanksgiving decorations'],
      ['memories', 'memories', 'Posts sharing family memories'],
      ['tips', 'tips', 'Helpful tips and advice'],
      ['recipes', 'recipes', 'Recipe-related content'],
      ['traditions', 'traditions', 'Family and cultural traditions']
    ];
    
    for (const [name, slug, description] of tags) {
      await client.query(`
        INSERT INTO blog_tags (name, slug, description)
        VALUES ($1, $2, $3)
        ON CONFLICT (slug) DO NOTHING;
      `, [name, slug, description]);
    }
    console.log('✅ Sample tags inserted');
    
    // Get the first user and event for sample blog posts
    const userResult = await client.query('SELECT id FROM "Users" LIMIT 1');
    const eventResult = await client.query('SELECT id FROM "Events" LIMIT 1');
    const categoryResult = await client.query('SELECT id FROM blog_categories LIMIT 1');
    
    if (userResult.rows.length === 0) {
      throw new Error('No users found. Please create a user first.');
    }
    
    // Insert sample blog posts
    console.log('📝 Inserting sample blog posts...');
    const samplePosts = [
      [
        'The Perfect Thanksgiving Turkey',
        'perfect-thanksgiving-turkey',
        '<h2>Introduction</h2><p>After years of trial and error, I\'ve finally perfected the art of cooking a Thanksgiving turkey...</p>',
        'Learn the secrets to cooking the perfect Thanksgiving turkey with this comprehensive guide.',
        'published',
        true,
        userResult.rows[0].id,
        eventResult.rows[0]?.id || null,
        categoryResult.rows[0]?.id || null,
        new Date()
      ],
      [
        'Memories of Grandma\'s Kitchen',
        'memories-grandmas-kitchen',
        '<h2>A Thanksgiving Tradition</h2><p>Every Thanksgiving morning, I wake up to the smell of fresh bread...</p>',
        'A heartfelt reflection on family traditions and the memories that make Thanksgiving special.',
        'published',
        false,
        userResult.rows[0].id,
        eventResult.rows[0]?.id || null,
        categoryResult.rows[0]?.id || null,
        new Date()
      ]
    ];
    
    for (const [title, slug, content, excerpt, status, isFeatured, authorId, eventId, categoryId, publishedAt] of samplePosts) {
      await client.query(`
        INSERT INTO blog_posts (title, slug, content, excerpt, status, is_featured, author_id, event_id, category_id, published_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (slug) DO NOTHING;
      `, [title, slug, content, excerpt, status, isFeatured, authorId, eventId, categoryId, publishedAt]);
    }
    console.log('✅ Sample blog posts inserted');
    
    // Verify the setup
    const finalCategories = await client.query('SELECT COUNT(*) FROM blog_categories');
    const finalTags = await client.query('SELECT COUNT(*) FROM blog_tags');
    const finalPosts = await client.query('SELECT COUNT(*) FROM blog_posts');
    
    const setupResult = {
      success: true,
      message: 'Blog setup completed successfully with raw SQL',
      counts: {
        categories: parseInt(finalCategories.rows[0].count),
        tags: parseInt(finalTags.rows[0].count),
        posts: parseInt(finalPosts.rows[0].count)
      }
    };
    
    console.log('🎉 Blog setup completed successfully!');
    console.log('📊 Final counts:', setupResult.counts);
    
    return setupResult;
    
  } catch (error) {
    console.error('❌ Blog setup error:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the setup if this script is executed directly
if (require.main === module) {
  setupBlogTables()
    .then(() => {
      console.log('✅ Setup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Setup failed:', error.message);
      process.exit(1);
    });
}

module.exports = { setupBlogTables };
