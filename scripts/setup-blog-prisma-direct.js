#!/usr/bin/env node

/**
 * Blog Setup Script using Prisma Client directly
 * 
 * This script creates the blog tables using Prisma client without migrations.
 * It's designed to work with Vercel/Neon database.
 * 
 * Usage:
 *   DATABASE_URL="your-vercel-db-url" node scripts/setup-blog-prisma-direct.js
 */

const { PrismaClient } = require('@prisma/client');

// Use DATABASE_URL from environment (Vercel sets this automatically)
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function setupBlogWithPrisma() {
  try {
    console.log('🚀 Starting blog setup with Prisma...');
    
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Check if blog tables already exist
    const existingTables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'blog_%'
      ORDER BY table_name;
    `;
    
    console.log('📋 Existing blog tables:', existingTables.map(t => t.table_name));
    
    if (existingTables.length > 0) {
      console.log('⚠️  Blog tables already exist. Checking data...');
      
      // Check counts
      const categoriesCount = await prisma.blogCategory.count();
      const tagsCount = await prisma.blogTag.count();
      const postsCount = await prisma.blogPost.count();
      
      console.log('📊 Current counts:', {
        categories: categoriesCount,
        tags: tagsCount,
        posts: postsCount
      });
      
      return {
        success: true,
        message: 'Blog tables already exist',
        counts: { categories: categoriesCount, tags: tagsCount, posts: postsCount }
      };
    }
    
    // Create blog categories
    console.log('📝 Creating blog categories...');
    const categories = await prisma.blogCategory.createMany({
      data: [
        {
          name: 'Recipes',
          description: 'Thanksgiving recipes and cooking tips',
          color: '#28a745',
          slug: 'recipes'
        },
        {
          name: 'Memories',
          description: 'Family memories and stories from past Thanksgivings',
          color: '#ffc107',
          slug: 'memories'
        },
        {
          name: 'Traditions',
          description: 'Family traditions and customs',
          color: '#17a2b8',
          slug: 'traditions'
        },
        {
          name: 'Tips',
          description: 'Helpful tips for hosting Thanksgiving',
          color: '#6f42c1',
          slug: 'tips'
        },
        {
          name: 'Decorations',
          description: 'Thanksgiving decoration ideas',
          color: '#fd7e14',
          slug: 'decorations'
        }
      ],
      skipDuplicates: true
    });
    console.log('✅ Blog categories created');
    
    // Create blog tags
    console.log('🏷️ Creating blog tags...');
    const tags = await prisma.blogTag.createMany({
      data: [
        { name: 'turkey', slug: 'turkey', description: 'Posts about turkey preparation and cooking' },
        { name: 'stuffing', slug: 'stuffing', description: 'Posts about stuffing recipes and techniques' },
        { name: 'desserts', slug: 'desserts', description: 'Posts about Thanksgiving desserts' },
        { name: 'family', slug: 'family', description: 'Posts about family gatherings and traditions' },
        { name: 'cooking', slug: 'cooking', description: 'Posts about cooking techniques and tips' },
        { name: 'decorations', slug: 'decorations', description: 'Posts about Thanksgiving decorations' },
        { name: 'memories', slug: 'memories', description: 'Posts sharing family memories' },
        { name: 'tips', slug: 'tips', description: 'Helpful tips and advice' },
        { name: 'recipes', slug: 'recipes', description: 'Recipe-related content' },
        { name: 'traditions', slug: 'traditions', description: 'Family and cultural traditions' }
      ],
      skipDuplicates: true
    });
    console.log('✅ Blog tags created');
    
    // Get the first user and event for sample blog posts
    const firstUser = await prisma.users.findFirst();
    const firstEvent = await prisma.events.findFirst();
    const firstCategory = await prisma.blogCategory.findFirst();
    
    if (!firstUser) {
      throw new Error('No users found. Please create a user first.');
    }
    
    // Create sample blog posts
    console.log('📝 Creating sample blog posts...');
    const samplePosts = await prisma.blogPost.createMany({
      data: [
        {
          title: 'The Perfect Thanksgiving Turkey',
          slug: 'perfect-thanksgiving-turkey',
          content: '<h2>Introduction</h2><p>After years of trial and error, I\'ve finally perfected the art of cooking a Thanksgiving turkey...</p>',
          excerpt: 'Learn the secrets to cooking the perfect Thanksgiving turkey with this comprehensive guide.',
          status: 'published',
          isFeatured: true,
          authorId: firstUser.user_id,
          eventId: firstEvent?.event_id,
          categoryId: firstCategory?.id,
          publishedAt: new Date()
        },
        {
          title: 'Memories of Grandma\'s Kitchen',
          slug: 'memories-grandmas-kitchen',
          content: '<h2>A Thanksgiving Tradition</h2><p>Every Thanksgiving morning, I wake up to the smell of fresh bread...</p>',
          excerpt: 'A heartfelt reflection on family traditions and the memories that make Thanksgiving special.',
          status: 'published',
          isFeatured: false,
          authorId: firstUser.user_id,
          eventId: firstEvent?.event_id,
          categoryId: firstCategory?.id,
          publishedAt: new Date()
        }
      ],
      skipDuplicates: true
    });
    console.log('✅ Sample blog posts created');
    
    // Verify the setup
    const finalCategories = await prisma.blogCategory.count();
    const finalTags = await prisma.blogTag.count();
    const finalPosts = await prisma.blogPost.count();
    
    const result = {
      success: true,
      message: 'Blog setup completed successfully with Prisma',
      counts: {
        categories: finalCategories,
        tags: finalTags,
        posts: finalPosts
      }
    };
    
    console.log('🎉 Blog setup completed successfully!');
    console.log('📊 Final counts:', result.counts);
    
    return result;
    
  } catch (error) {
    console.error('❌ Blog setup error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup if this script is executed directly
if (require.main === module) {
  setupBlogWithPrisma()
    .then(() => {
      console.log('✅ Setup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Setup failed:', error.message);
      process.exit(1);
    });
}

module.exports = { setupBlogWithPrisma };
