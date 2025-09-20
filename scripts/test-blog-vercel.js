#!/usr/bin/env node

/**
 * Blog Database Test Script for Vercel/Neon
 * 
 * This script tests the blog functionality in the Vercel/Neon database.
 * 
 * Usage:
 *   node scripts/test-blog-vercel.js
 */

const { Pool } = require('pg');
const db = require('../models');

// Configuration for Vercel/Neon database
const config = {
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
};

async function testBlogDatabase() {
  const pool = new Pool(config);
  
  try {
    console.log('🧪 Testing blog database on Vercel/Neon...');
    
    // Test direct database connection
    await pool.query('SELECT 1');
    console.log('✅ Direct database connection successful');
    
    // Test Sequelize connection
    await db.sequelize.authenticate();
    console.log('✅ Sequelize connection successful');
    
    // Test blog tables exist
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'blog_%'
      ORDER BY table_name;
    `);
    
    const blogTables = tablesResult.rows.map(r => r.table_name);
    console.log('📋 Blog tables found:', blogTables);
    
    if (blogTables.length !== 4) {
      throw new Error(`Expected 4 blog tables, found ${blogTables.length}`);
    }
    
    // Test blog categories
    const categories = await db.BlogCategory.findAll();
    console.log('✅ BlogCategories found:', categories.length);
    categories.forEach(cat => {
      console.log(`  - ${cat.name} (${cat.color})`);
    });
    
    // Test blog tags
    const tags = await db.BlogTag.findAll();
    console.log('✅ BlogTags found:', tags.length);
    tags.forEach(tag => {
      console.log(`  - ${tag.name} (usage: ${tag.usageCount})`);
    });
    
    // Test blog posts
    const posts = await db.BlogPost.findAll({
      include: [
        { model: db.User, as: 'author', attributes: ['username'] },
        { model: db.BlogCategory, as: 'category', attributes: ['name'] }
      ]
    });
    console.log('✅ BlogPosts found:', posts.length);
    posts.forEach(post => {
      console.log(`  - ${post.title} (${post.status}) by ${post.author?.username || 'Unknown'}`);
    });
    
    // Test creating a new blog post
    const newPost = await db.BlogPost.create({
      title: 'Vercel Test Blog Post',
      content: 'This is a test blog post created on Vercel to verify the blog functionality is working correctly.',
      authorId: 1,
      categoryId: 1,
      status: 'published'
    });
    console.log('✅ New blog post created:', newPost.id, 'Slug:', newPost.slug);
    
    // Test class methods
    const publishedPosts = await db.BlogPost.findPublished();
    console.log('✅ Published posts count:', publishedPosts.length);
    
    const featuredPosts = await db.BlogPost.findFeatured();
    console.log('✅ Featured posts count:', featuredPosts.length);
    
    // Test search functionality
    const searchResults = await db.BlogPost.search('test');
    console.log('✅ Search results for "test":', searchResults.length);
    
    const result = {
      success: true,
      message: 'Blog database test completed successfully on Vercel/Neon',
      stats: {
        categories: categories.length,
        tags: tags.length,
        posts: posts.length,
        publishedPosts: publishedPosts.length,
        featuredPosts: featuredPosts.length,
        searchResults: searchResults.length
      },
      tables: blogTables
    };
    
    console.log('🎉 Blog database test completed successfully!');
    console.log('📊 Test results:', JSON.stringify(result, null, 2));
    
    return result;
    
  } catch (error) {
    console.error('❌ Blog database test error:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testBlogDatabase()
    .then(() => {
      console.log('✅ Test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test failed:', error.message);
      process.exit(1);
    });
}

module.exports = { testBlogDatabase };
