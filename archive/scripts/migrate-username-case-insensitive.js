const { Client } = require('pg');
const path = require('path');

// Load environment variables
require('dotenv').config();

async function migrateUsernameCaseInsensitive() {
  console.log('🔄 Migrating database for case-insensitive usernames...');
  
  // Get database URL from environment
  const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error('POSTGRES_URL environment variable is required');
  }

  const client = new Client({
    connectionString: databaseUrl,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Check if username_lower column already exists
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Users' AND column_name = 'username_lower'
    `);

    if (columnCheck.rows.length > 0) {
      console.log('⚠️  username_lower column already exists, skipping migration');
      return;
    }

    // Add username_lower column
    console.log('📝 Adding username_lower column...');
    await client.query(`
      ALTER TABLE "Users" 
      ADD COLUMN username_lower VARCHAR(255)
    `);

    // Update existing users to set username_lower
    console.log('📝 Updating existing users with lowercase usernames...');
    await client.query(`
      UPDATE "Users" 
      SET username_lower = LOWER(username)
      WHERE username_lower IS NULL
    `);

    // Add NOT NULL constraint
    console.log('📝 Adding NOT NULL constraint...');
    await client.query(`
      ALTER TABLE "Users" 
      ALTER COLUMN username_lower SET NOT NULL
    `);

    // Add unique constraint
    console.log('📝 Adding unique constraint...');
    await client.query(`
      ALTER TABLE "Users" 
      ADD CONSTRAINT unique_username_lower UNIQUE (username_lower)
    `);

    // Create index for efficient lookups
    console.log('📝 Creating index...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_username_lower ON "Users"(username_lower)
    `);

    // Verify the migration
    const result = await client.query(`
      SELECT username, username_lower 
      FROM "Users" 
      LIMIT 5
    `);
    
    console.log('📊 Sample data after migration:');
    result.rows.forEach(row => {
      console.log(`  ${row.username} -> ${row.username_lower}`);
    });

    console.log('✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateUsernameCaseInsensitive()
    .then(() => {
      console.log('🎉 Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = migrateUsernameCaseInsensitive;
