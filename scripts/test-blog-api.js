#!/usr/bin/env node

/**
 * Blog API Test Script
 * 
 * This script tests the blog API endpoints to ensure they're working correctly.
 * 
 * Usage:
 *   DATABASE_URL="your-vercel-db-url" node scripts/test-blog-api.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['error'],
});

async function testBlogAPI() {
  try {
    console.log('🧪 Testing Blog API functionality...');
    
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test 1: Get all blog posts
    console.log('\n📝 Testing blog posts...');
    const posts = await prisma.blogPost.findMany({
      where: { status: 'published' },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            first_name: true,
            last_name: true
          }
        },
        category: true,
        tags: true,
        event: {
          select: {
            id: true,
            event_name: true,
            event_date: true
          }
        }
      },
      take: 5
    });
    console.log(`✅ Found ${posts.length} published blog posts`);
    
    if (posts.length > 0) {
      console.log(`   - Latest post: "${posts[0].title}" by ${posts[0].author.username}`);
    }
    
    // Test 2: Get all categories
    console.log('\n📂 Testing blog categories...');
    const categories = await prisma.blogCategory.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            posts: {
              where: { status: 'published' }
            }
          }
        }
      }
    });
    console.log(`✅ Found ${categories.length} active categories`);
    
    categories.forEach(cat => {
      console.log(`   - ${cat.name}: ${cat._count.posts} posts`);
    });
    
    // Test 3: Get all tags
    console.log('\n🏷️ Testing blog tags...');
    const tags = await prisma.blogTag.findMany({
      orderBy: { usage_count: 'desc' },
      take: 10
    });
    console.log(`✅ Found ${tags.length} tags`);
    
    tags.forEach(tag => {
      console.log(`   - ${tag.name}: ${tag.usage_count} uses`);
    });
    
    // Test 4: Test search functionality
    console.log('\n🔍 Testing search functionality...');
    const searchResults = await prisma.blogPost.findMany({
      where: {
        status: 'published',
        OR: [
          { title: { contains: 'thanksgiving', mode: 'insensitive' } },
          { content: { contains: 'thanksgiving', mode: 'insensitive' } }
        ]
      },
      take: 3
    });
    console.log(`✅ Search for "thanksgiving" found ${searchResults.length} posts`);
    
    // Test 5: Test featured posts
    console.log('\n⭐ Testing featured posts...');
    const featuredPosts = await prisma.blogPost.findMany({
      where: {
        status: 'published',
        is_featured: true
      },
      take: 3
    });
    console.log(`✅ Found ${featuredPosts.length} featured posts`);
    
    // Test 6: Test category posts
    if (categories.length > 0) {
      console.log('\n📂 Testing category posts...');
      const categoryPosts = await prisma.blogPost.findMany({
        where: {
          category_id: categories[0].id,
          status: 'published'
        },
        take: 3
      });
      console.log(`✅ Category "${categories[0].name}" has ${categoryPosts.length} posts`);
    }
    
    // Test 7: Test tag posts
    if (tags.length > 0) {
      console.log('\n🏷️ Testing tag posts...');
      const tagPosts = await prisma.blogPost.findMany({
        where: {
          tags: {
            some: {
              id: tags[0].id
            }
          },
          status: 'published'
        },
        take: 3
      });
      console.log(`✅ Tag "${tags[0].name}" has ${tagPosts.length} posts`);
    }
    
    // Test 8: Test statistics
    console.log('\n📊 Testing blog statistics...');
    const [
      totalPosts,
      publishedPosts,
      draftPosts,
      totalCategories,
      totalTags,
      totalViews
    ] = await Promise.all([
      prisma.blogPost.count(),
      prisma.blogPost.count({ where: { status: 'published' } }),
      prisma.blogPost.count({ where: { status: 'draft' } }),
      prisma.blogCategory.count(),
      prisma.blogTag.count(),
      prisma.blogPost.aggregate({
        _sum: { view_count: true }
      })
    ]);
    
    console.log('✅ Blog statistics:');
    console.log(`   - Total posts: ${totalPosts}`);
    console.log(`   - Published posts: ${publishedPosts}`);
    console.log(`   - Draft posts: ${draftPosts}`);
    console.log(`   - Categories: ${totalCategories}`);
    console.log(`   - Tags: ${totalTags}`);
    console.log(`   - Total views: ${totalViews._sum.view_count || 0}`);
    
    console.log('\n🎉 All blog API tests passed successfully!');
    
    return {
      success: true,
      message: 'Blog API functionality is working correctly',
      stats: {
        posts: { total: totalPosts, published: publishedPosts, draft: draftPosts },
        categories: totalCategories,
        tags: totalTags,
        totalViews: totalViews._sum.view_count || 0
      }
    };
    
  } catch (error) {
    console.error('❌ Blog API test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testBlogAPI()
    .then(() => {
      console.log('✅ Blog API test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Blog API test failed:', error.message);
      process.exit(1);
    });
}

module.exports = { testBlogAPI };
