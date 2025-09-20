#!/usr/bin/env node

/**
 * Test Blog Setup Script
 * 
 * This script tests the blog setup using Prisma with Vercel database.
 * 
 * Usage:
 *   DATABASE_URL="your-vercel-db-url" node scripts/test-blog-setup.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testBlogSetup() {
  try {
    console.log('🧪 Testing blog setup with Prisma...');
    
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Check existing tables
    const allTables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    
    console.log('📋 All tables in database:', allTables.map(t => t.table_name));
    
    // Check blog tables specifically
    const blogTables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'blog_%'
      ORDER BY table_name;
    `;
    
    console.log('📋 Blog tables:', blogTables.map(t => t.table_name));
    
    if (blogTables.length === 0) {
      console.log('❌ No blog tables found. Need to create them first.');
      return;
    }
    
    // Test Prisma models
    try {
      const categories = await prisma.blogCategory.findMany();
      console.log('✅ BlogCategories found:', categories.length);
      
      const tags = await prisma.blogTag.findMany();
      console.log('✅ BlogTags found:', tags.length);
      
      const posts = await prisma.blogPost.findMany();
      console.log('✅ BlogPosts found:', posts.length);
      
      console.log('🎉 Blog setup is working correctly!');
      
    } catch (error) {
      console.error('❌ Error testing Prisma models:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testBlogSetup()
    .then(() => {
      console.log('✅ Test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test failed:', error.message);
      process.exit(1);
    });
}

module.exports = { testBlogSetup };
