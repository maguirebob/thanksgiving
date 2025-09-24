const { Client } = require('pg');

// Load environment variables
require('dotenv').config();

async function migrateUsernamesToLowercase() {
  console.log('🔄 Migrating usernames to lowercase...');
  
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

    // Get all users with their current usernames
    const users = await client.query('SELECT user_id, username FROM "Users"');
    
    console.log(`📊 Found ${users.rows.length} users to check`);

    // Check for usernames that need to be converted
    const usersToUpdate = users.rows.filter(user => user.username !== user.username.toLowerCase());
    
    if (usersToUpdate.length === 0) {
      console.log('✅ All usernames are already lowercase, no migration needed');
      return;
    }

    console.log(`📝 Found ${usersToUpdate.length} usernames to convert to lowercase:`);
    usersToUpdate.forEach(user => {
      console.log(`  ${user.username} -> ${user.username.toLowerCase()}`);
    });

    // Update usernames to lowercase
    for (const user of usersToUpdate) {
      const lowercaseUsername = user.username.toLowerCase();
      
      // Check if lowercase version already exists
      const existingUser = await client.query(
        'SELECT user_id FROM "Users" WHERE username = $1 AND user_id != $2',
        [lowercaseUsername, user.user_id]
      );

      if (existingUser.rows.length > 0) {
        console.log(`⚠️  Skipping ${user.username} -> ${lowercaseUsername} (conflict with existing user)`);
        continue;
      }

      // Update the username
      await client.query(
        'UPDATE "Users" SET username = $1 WHERE user_id = $2',
        [lowercaseUsername, user.user_id]
      );
      
      console.log(`✅ Updated: ${user.username} -> ${lowercaseUsername}`);
    }

    // Verify the migration
    const result = await client.query('SELECT username FROM "Users" ORDER BY username');
    
    console.log('📊 All usernames after migration:');
    result.rows.forEach(row => {
      console.log(`  ${row.username}`);
    });

    console.log('✅ Username migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateUsernamesToLowercase()
    .then(() => {
      console.log('🎉 Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = migrateUsernamesToLowercase;
