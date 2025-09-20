#!/usr/bin/env node

/**
 * Blog Database Setup Script
 * 
 * This script sets up the blog tables and sample data for the Thanksgiving website.
 * It can be run independently or as part of the main database setup.
 * 
 * Usage:
 *   node scripts/setup-blog-database.js
 *   node scripts/setup-blog-database.js --sample-data
 *   node scripts/setup-blog-database.js --help
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Configuration
const config = {
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

// Command line arguments
const args = process.argv.slice(2);
const includeSampleData = args.includes('--sample-data');
const showHelp = args.includes('--help');

if (showHelp) {
  console.log(`
Blog Database Setup Script

Usage:
  node scripts/setup-blog-database.js [options]

Options:
  --sample-data    Include sample blog posts and data
  --help          Show this help message

Environment Variables:
  POSTGRES_URL     PostgreSQL connection string
  DATABASE_URL     Alternative PostgreSQL connection string
  NODE_ENV         Environment (production enables SSL)
`);
  process.exit(0);
}

async function setupBlogDatabase() {
  const pool = new Pool(config);
  
  try {
    console.log('🚀 Starting blog database setup...');
    
    // Read the blog tables SQL file
    const blogTablesPath = path.join(__dirname, '..', 'admin', 'database', 'create_blog_tables.sql');
    const blogTablesSQL = fs.readFileSync(blogTablesPath, 'utf8');
    
    console.log('📋 Creating blog tables...');
    await pool.query(blogTablesSQL);
    console.log('✅ Blog tables created successfully');
    
    if (includeSampleData) {
      console.log('📝 Adding sample blog data...');
      await addSampleBlogData(pool);
      console.log('✅ Sample blog data added successfully');
    }
    
    // Verify the setup
    console.log('🔍 Verifying blog database setup...');
    await verifyBlogSetup(pool);
    console.log('✅ Blog database setup verified');
    
    console.log('🎉 Blog database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error setting up blog database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

async function addSampleBlogData(pool) {
  // Get the first user and event for sample data
  const userResult = await pool.query('SELECT user_id FROM "Users" LIMIT 1');
  const eventResult = await pool.query('SELECT event_id FROM events LIMIT 1');
  
  if (userResult.rows.length === 0) {
    throw new Error('No users found. Please run the main database setup first.');
  }
  
  if (eventResult.rows.length === 0) {
    throw new Error('No events found. Please run the main database setup first.');
  }
  
  const userId = userResult.rows[0].user_id;
  const eventId = eventResult.rows[0].event_id;
  
  // Sample blog posts
  const samplePosts = [
    {
      title: 'The Perfect Thanksgiving Turkey',
      content: `
        <h2>Introduction</h2>
        <p>After years of trial and error, I've finally perfected the art of cooking a Thanksgiving turkey. Here's my tried-and-true method that guarantees a juicy, flavorful bird every time.</p>
        
        <h2>Ingredients</h2>
        <ul>
          <li>1 whole turkey (12-15 lbs)</li>
          <li>1/2 cup butter, softened</li>
          <li>2 tablespoons fresh herbs (rosemary, thyme, sage)</li>
          <li>Salt and pepper to taste</li>
          <li>1 onion, quartered</li>
          <li>2 carrots, cut into chunks</li>
          <li>2 celery stalks, cut into chunks</li>
        </ul>
        
        <h2>Instructions</h2>
        <ol>
          <li>Preheat oven to 325°F</li>
          <li>Rinse and pat dry the turkey</li>
          <li>Mix butter with herbs, salt, and pepper</li>
          <li>Gently separate skin from meat and spread herb butter underneath</li>
          <li>Stuff cavity with onion, carrots, and celery</li>
          <li>Roast for 3-4 hours, basting every 30 minutes</li>
          <li>Let rest for 20 minutes before carving</li>
        </ol>
        
        <h2>Tips</h2>
        <p>Use a meat thermometer to ensure the turkey reaches 165°F in the thickest part of the thigh. Letting it rest is crucial for juicy meat!</p>
      `,
      excerpt: 'Learn the secrets to cooking the perfect Thanksgiving turkey with this comprehensive guide.',
      status: 'published',
      is_featured: true,
      category_id: 1, // Recipes
      event_id: eventId,
      author_id: userId,
      published_at: new Date()
    },
    {
      title: 'Memories of Grandma\'s Kitchen',
      content: `
        <h2>A Thanksgiving Tradition</h2>
        <p>Every Thanksgiving morning, I wake up to the smell of fresh bread and the sound of my grandmother humming in the kitchen. It's a tradition that's been passed down through generations.</p>
        
        <p>Grandma always started her day at 4 AM, preparing the feast that would bring our entire family together. The kitchen was her domain, and we all knew better than to interfere with her sacred Thanksgiving rituals.</p>
        
        <h2>The Secret Recipe</h2>
        <p>She never wrote down her stuffing recipe, but I've managed to piece it together over the years. It wasn't just about the ingredients - it was about the love and care she put into every step.</p>
        
        <p>Now that she's gone, I try to honor her memory by continuing these traditions with my own family. The kitchen may be different, but the love remains the same.</p>
      `,
      excerpt: 'A heartfelt reflection on family traditions and the memories that make Thanksgiving special.',
      status: 'published',
      is_featured: false,
      category_id: 2, // Memories
      event_id: eventId,
      author_id: userId,
      published_at: new Date()
    },
    {
      title: 'Thanksgiving Table Decorating Ideas',
      content: `
        <h2>Creating the Perfect Ambiance</h2>
        <p>Thanksgiving is about more than just the food - it's about creating a warm, welcoming atmosphere that brings family and friends together.</p>
        
        <h2>Centerpiece Ideas</h2>
        <ul>
          <li>Mini pumpkins and gourds in a rustic basket</li>
          <li>Fresh flowers in autumn colors</li>
          <li>Candles in various heights for depth</li>
          <li>Fall leaves scattered around the table</li>
        </ul>
        
        <h2>Table Settings</h2>
        <p>Keep it simple and elegant. Use natural materials like wood, burlap, and linen. Add personal touches like handwritten place cards or family photos.</p>
        
        <h2>Lighting</h2>
        <p>Soft, warm lighting creates the perfect mood. Use string lights, candles, or dimmed overhead lights to create a cozy atmosphere.</p>
      `,
      excerpt: 'Transform your Thanksgiving table with these beautiful and easy decorating ideas.',
      status: 'published',
      is_featured: false,
      category_id: 5, // Decorations
      event_id: eventId,
      author_id: userId,
      published_at: new Date()
    },
    {
      title: 'Hosting Tips for a Stress-Free Thanksgiving',
      content: `
        <h2>Planning Ahead</h2>
        <p>The key to a successful Thanksgiving is planning. Start preparing at least a week in advance to avoid last-minute stress.</p>
        
        <h2>Menu Planning</h2>
        <ul>
          <li>Create a detailed menu and shopping list</li>
          <li>Prepare make-ahead dishes</li>
          <li>Delegate tasks to family members</li>
          <li>Have backup plans for everything</li>
        </ul>
        
        <h2>Kitchen Organization</h2>
        <p>Clean and organize your kitchen before you start cooking. Make sure you have all the necessary tools and ingredients within reach.</p>
        
        <h2>Timing is Everything</h2>
        <p>Create a cooking schedule that accounts for oven space and cooking times. Start with dishes that can be reheated and finish with items that need to be served hot.</p>
        
        <h2>Don't Forget to Enjoy</h2>
        <p>Remember, Thanksgiving is about spending time with loved ones. Don't let the perfect be the enemy of the good - your family will appreciate the effort regardless of minor imperfections.</p>
      `,
      excerpt: 'Make your Thanksgiving hosting experience smooth and stress-free with these practical tips.',
      status: 'published',
      is_featured: false,
      category_id: 4, // Tips
      event_id: eventId,
      author_id: userId,
      published_at: new Date()
    }
  ];
  
  // Insert sample blog posts
  for (const post of samplePosts) {
    const result = await pool.query(`
      INSERT INTO blog_posts (title, content, excerpt, status, is_featured, category_id, event_id, author_id, published_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `, [
      post.title,
      post.content,
      post.excerpt,
      post.status,
      post.is_featured,
      post.category_id,
      post.event_id,
      post.author_id,
      post.published_at
    ]);
    
    const postId = result.rows[0].id;
    
    // Add some tags to each post
    const tagMappings = [
      { postId: 1, tagSlugs: ['turkey', 'cooking', 'recipes'] },
      { postId: 2, tagSlugs: ['memories', 'family', 'traditions'] },
      { postId: 3, tagSlugs: ['decorations', 'tips'] },
      { postId: 4, tagSlugs: ['tips', 'cooking'] }
    ];
    
    const mapping = tagMappings.find(m => m.postId === postId);
    if (mapping) {
      for (const tagSlug of mapping.tagSlugs) {
        await pool.query(`
          INSERT INTO blog_post_tags (blog_post_id, blog_tag_id)
          SELECT $1, id FROM blog_tags WHERE slug = $2
        `, [postId, tagSlug]);
      }
    }
  }
}

async function verifyBlogSetup(pool) {
  // Check if all tables exist
  const tables = ['blog_categories', 'blog_tags', 'blog_posts', 'blog_post_tags'];
  
  for (const table of tables) {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      )
    `, [table]);
    
    if (!result.rows[0].exists) {
      throw new Error(`Table ${table} was not created`);
    }
  }
  
  // Check sample data
  const categoryCount = await pool.query('SELECT COUNT(*) FROM blog_categories');
  const tagCount = await pool.query('SELECT COUNT(*) FROM blog_tags');
  const postCount = await pool.query('SELECT COUNT(*) FROM blog_posts');
  
  console.log(`📊 Database verification:`);
  console.log(`   - Categories: ${categoryCount.rows[0].count}`);
  console.log(`   - Tags: ${tagCount.rows[0].count}`);
  console.log(`   - Posts: ${postCount.rows[0].count}`);
  
  if (includeSampleData && parseInt(postCount.rows[0].count) === 0) {
    throw new Error('Sample blog posts were not created');
  }
}

// Run the setup
if (require.main === module) {
  setupBlogDatabase().catch(console.error);
}

module.exports = { setupBlogDatabase };
