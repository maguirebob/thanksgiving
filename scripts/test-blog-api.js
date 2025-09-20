#!/usr/bin/env node

/**
 * Blog API Test Script
 * 
 * This script tests the blog API endpoints to ensure they're working correctly.
 * 
 * Usage:
 *   DATABASE_URL="your-vercel-db-url" node scripts/test-blog-api.js
 */

const db = require('../models');

async function testBlogAPI() {
  try {
    console.log('🧪 Testing Blog API functionality...');
    
    // Test database connection
    await db.sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Test 1: Get all blog posts
    console.log('\n📝 Testing blog posts...');
    const posts = await db.BlogPost.findAll({
      where: { status: 'published' },
      include: [
        {
          model: db.User,
          as: 'author',
          attributes: ['id', 'username', 'first_name', 'last_name']
        },
        {
          model: db.BlogCategory,
          as: 'category',
          attributes: ['id', 'name', 'color']
        },
        {
          model: db.Event,
          as: 'event',
          attributes: ['id', 'event_name', 'event_date']
        },
        {
          model: db.BlogTag,
          as: 'tags',
          attributes: ['id', 'name', 'slug'],
          through: { attributes: [] }
        }
      ],
      limit: 5
    });
    console.log(`✅ Found ${posts.length} published blog posts`);
    
    if (posts.length > 0) {
      const post = posts[0];
      console.log(`   Sample post: "${post.title}" by ${post.author.username}`);
      if (post.category) {
        console.log(`   Category: ${post.category.name}`);
      }
      if (post.tags && post.tags.length > 0) {
        console.log(`   Tags: ${post.tags.map(tag => tag.name).join(', ')}`);
      }
    }
    
    // Test 2: Get all blog categories
    console.log('\n📂 Testing blog categories...');
    const categories = await db.BlogCategory.findAll({
      where: { is_active: true },
      order: [['name', 'ASC']]
    });
    console.log(`✅ Found ${categories.length} active blog categories`);
    
    if (categories.length > 0) {
      categories.forEach(cat => {
        console.log(`   - ${cat.name} (${cat.color})`);
      });
    }
    
    // Test 3: Get all blog tags
    console.log('\n🏷️  Testing blog tags...');
    const tags = await db.BlogTag.findAll({
      order: [['name', 'ASC']]
    });
    console.log(`✅ Found ${tags.length} blog tags`);
    
    if (tags.length > 0) {
      const popularTags = tags
        .sort((a, b) => b.usage_count - a.usage_count)
        .slice(0, 5);
      console.log(`   Popular tags: ${popularTags.map(tag => `${tag.name} (${tag.usage_count})`).join(', ')}`);
    }
    
    // Test 4: Get blog statistics
    console.log('\n📊 Testing blog statistics...');
    const totalPosts = await db.BlogPost.count();
    const publishedPosts = await db.BlogPost.count({ where: { status: 'published' } });
    const draftPosts = await db.BlogPost.count({ where: { status: 'draft' } });
    const featuredPosts = await db.BlogPost.count({ where: { is_featured: true } });
    const totalViews = await db.BlogPost.sum('view_count') || 0;
    
    console.log(`✅ Blog Statistics:`);
    console.log(`   Total posts: ${totalPosts}`);
    console.log(`   Published posts: ${publishedPosts}`);
    console.log(`   Draft posts: ${draftPosts}`);
    console.log(`   Featured posts: ${featuredPosts}`);
    console.log(`   Total views: ${totalViews}`);
    
    // Test 5: Test search functionality
    console.log('\n🔍 Testing search functionality...');
    const searchResults = await db.BlogPost.findAll({
      where: {
        status: 'published',
        [db.Sequelize.Op.or]: [
          { title: { [db.Sequelize.Op.iLike]: '%thanksgiving%' } },
          { content: { [db.Sequelize.Op.iLike]: '%thanksgiving%' } }
        ]
      },
      limit: 3
    });
    console.log(`✅ Found ${searchResults.length} posts matching "thanksgiving"`);
    
    // Test 6: Test category filtering
    if (categories.length > 0) {
      console.log('\n📂 Testing category filtering...');
      const categoryId = categories[0].id;
      const categoryPosts = await db.BlogPost.findAll({
        where: { 
          status: 'published',
          category_id: categoryId
        },
        include: [{
          model: db.BlogCategory,
          as: 'category',
          attributes: ['name']
        }]
      });
      console.log(`✅ Found ${categoryPosts.length} posts in category "${categories[0].name}"`);
    }
    
    console.log('\n🎉 All blog API tests passed successfully!');
    
  } catch (error) {
    console.error('❌ Blog API test failed:', error);
    process.exit(1);
  } finally {
    await db.sequelize.close();
  }
}

if (require.main === module) {
  testBlogAPI();
}

module.exports = { testBlogAPI };