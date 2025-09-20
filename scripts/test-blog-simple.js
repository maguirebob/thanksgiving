#!/usr/bin/env node

/**
 * Simple Blog API Test Script
 * 
 * This script tests the blog database tables using direct SQL queries.
 * 
 * Usage:
 *   DATABASE_URL="your-vercel-db-url" node scripts/test-blog-simple.js
 */

const { Client } = require('pg');

async function testBlogDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🧪 Testing Blog Database functionality...');
    
    await client.connect();
    console.log('✅ Database connection successful');
    
    // Test 1: Check if blog tables exist
    console.log('\n📋 Checking blog tables...');
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('blog_categories', 'blog_tags', 'blog_posts', 'blog_post_tags')
      ORDER BY table_name;
    `);
    
    const tableNames = tablesResult.rows.map(row => row.table_name);
    console.log(`✅ Found ${tableNames.length} blog tables:`, tableNames);
    
    // Test 2: Check blog categories
    if (tableNames.includes('blog_categories')) {
      console.log('\n📂 Testing blog categories...');
      const categoriesResult = await client.query('SELECT COUNT(*) as count FROM blog_categories');
      const categoryCount = parseInt(categoriesResult.rows[0].count);
      console.log(`✅ Found ${categoryCount} blog categories`);
      
      if (categoryCount > 0) {
        const sampleCategories = await client.query('SELECT name, slug, color FROM blog_categories LIMIT 3');
        sampleCategories.rows.forEach(cat => {
          console.log(`   - ${cat.name} (${cat.slug}) - ${cat.color}`);
        });
      }
    }
    
    // Test 3: Check blog tags
    if (tableNames.includes('blog_tags')) {
      console.log('\n🏷️ Testing blog tags...');
      const tagsResult = await client.query('SELECT COUNT(*) as count FROM blog_tags');
      const tagCount = parseInt(tagsResult.rows[0].count);
      console.log(`✅ Found ${tagCount} blog tags`);
      
      if (tagCount > 0) {
        const sampleTags = await client.query('SELECT name, slug, usage_count FROM blog_tags ORDER BY usage_count DESC LIMIT 5');
        sampleTags.rows.forEach(tag => {
          console.log(`   - ${tag.name} (${tag.slug}) - ${tag.usage_count} uses`);
        });
      }
    }
    
    // Test 4: Check blog posts
    if (tableNames.includes('blog_posts')) {
      console.log('\n📝 Testing blog posts...');
      const postsResult = await client.query('SELECT COUNT(*) as count FROM blog_posts');
      const postCount = parseInt(postsResult.rows[0].count);
      console.log(`✅ Found ${postCount} blog posts`);
      
      if (postCount > 0) {
        const samplePosts = await client.query(`
          SELECT bp.title, bp.status, bp.is_featured, u.username as author
          FROM blog_posts bp
          LEFT JOIN "Users" u ON bp.author_id = u.id
          ORDER BY bp.created_at DESC
          LIMIT 3
        `);
        samplePosts.rows.forEach(post => {
          console.log(`   - "${post.title}" by ${post.author} (${post.status})`);
        });
      }
    }
    
    // Test 5: Check blog post tags junction table
    if (tableNames.includes('blog_post_tags')) {
      console.log('\n🔗 Testing blog post tags junction...');
      const junctionResult = await client.query('SELECT COUNT(*) as count FROM blog_post_tags');
      const junctionCount = parseInt(junctionResult.rows[0].count);
      console.log(`✅ Found ${junctionCount} blog post-tag relationships`);
    }
    
    // Test 6: Test a simple blog post query
    if (tableNames.includes('blog_posts') && tableNames.includes('blog_categories')) {
      console.log('\n🔍 Testing blog post with category join...');
      try {
        const joinResult = await client.query(`
          SELECT 
            bp.title,
            bp.status,
            bc.name as category_name,
            bc.color as category_color
          FROM blog_posts bp
          LEFT JOIN blog_categories bc ON bp.category_id = bc.id
          LIMIT 3
        `);
        
        console.log(`✅ Successfully joined blog posts with categories (${joinResult.rows.length} results)`);
        joinResult.rows.forEach(post => {
          console.log(`   - "${post.title}" in category "${post.category_name || 'None'}"`);
        });
      } catch (error) {
        console.log(`⚠️  Join query failed: ${error.message}`);
      }
    }
    
    console.log('\n🎉 Blog database test completed successfully!');
    
    return {
      success: true,
      message: 'Blog database is working correctly',
      tables: tableNames,
      counts: {
        categories: tableNames.includes('blog_categories') ? parseInt((await client.query('SELECT COUNT(*) as count FROM blog_categories')).rows[0].count) : 0,
        tags: tableNames.includes('blog_tags') ? parseInt((await client.query('SELECT COUNT(*) as count FROM blog_tags')).rows[0].count) : 0,
        posts: tableNames.includes('blog_posts') ? parseInt((await client.query('SELECT COUNT(*) as count FROM blog_posts')).rows[0].count) : 0
      }
    };
    
  } catch (error) {
    console.error('❌ Blog database test failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testBlogDatabase()
    .then((result) => {
      console.log('✅ Blog database test completed successfully');
      console.log('📊 Summary:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Blog database test failed:', error.message);
      process.exit(1);
    });
}

module.exports = { testBlogDatabase };
