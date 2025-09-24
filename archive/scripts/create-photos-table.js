#!/usr/bin/env node

/**
 * Create Photos Table Script
 * Creates the Photos table with proper schema and relationships
 */

const { Client } = require('pg');
require('dotenv').config();

async function createPhotosTable() {
  const client = new Client({
    connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    // Check if Photos table already exists
    console.log('🔍 Checking if Photos table exists...');
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'Photos'
      );
    `);

    if (tableExists.rows[0].exists) {
      console.log('⚠️  Photos table already exists');
      
      // Check current structure
      const columns = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'Photos' 
        ORDER BY ordinal_position;
      `);
      
      console.log('📋 Current Photos table structure:');
      columns.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
      
      console.log('✅ Photos table structure verified');
      return;
    }

    // Create Photos table
    console.log('🏗️  Creating Photos table...');
    await client.query(`
      CREATE TABLE "Photos" (
        id SERIAL PRIMARY KEY,
        event_id INTEGER NOT NULL REFERENCES "Events"(id) ON DELETE CASCADE,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER,
        mime_type VARCHAR(100),
        description TEXT,
        caption TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('✅ Photos table created successfully');

    // Create indexes for better performance
    console.log('📊 Creating indexes...');
    await client.query(`
      CREATE INDEX idx_photos_event_id ON "Photos"(event_id);
    `);
    await client.query(`
      CREATE INDEX idx_photos_created_at ON "Photos"(created_at);
    `);
    console.log('✅ Indexes created');

    // Verify table structure
    console.log('🔍 Verifying table structure...');
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'Photos' 
      ORDER BY ordinal_position;
    `);

    console.log('📋 Photos table structure:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    // Test foreign key constraint
    console.log('🔗 Testing foreign key constraint...');
    const fkCheck = await client.query(`
      SELECT 
        tc.constraint_name, 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name='Photos';
    `);

    if (fkCheck.rows.length > 0) {
      console.log('✅ Foreign key constraint verified:');
      fkCheck.rows.forEach(fk => {
        console.log(`  - ${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
      });
    }

    console.log('🎉 Photos table setup completed successfully!');

  } catch (error) {
    console.error('❌ Error creating Photos table:', error.message);
    console.error('Stack trace:', error.stack);
    if (require.main === module) {
      process.exit(1);
    } else {
      throw error;
    }
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  createPhotosTable()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error.message);
      process.exit(1);
    });
}

module.exports = { createPhotosTable };
