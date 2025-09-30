#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function updateDatabaseSchema(databaseUrl: string, environment: string) {
  console.log(`\n🔄 Updating ${environment} database schema...`);
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl
      }
    }
  });

  try {
    // Push schema changes to database
    await prisma.$executeRaw`SELECT 1`; // Test connection
    console.log(`✅ Connected to ${environment} database`);
    
    // Note: We need to run prisma db push from command line with the correct DATABASE_URL
    console.log(`⚠️  Please run: DATABASE_URL="${databaseUrl}" npx prisma db push`);
    console.log(`   This will update the schema to make event_description and event_location optional`);
    
  } catch (error) {
    console.error(`❌ Error connecting to ${environment} database:`, error);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  console.log('🚀 Database Schema Update Script');
  console.log('================================');
  
  // Get database URLs from environment or prompt user
  const testDbUrl = process.env['TEST_DATABASE_URL'];
  const prodDbUrl = process.env['PROD_DATABASE_URL'];
  
  if (!testDbUrl || !prodDbUrl) {
    console.log('\n📝 Please provide database URLs:');
    console.log('1. Set TEST_DATABASE_URL environment variable');
    console.log('2. Set PROD_DATABASE_URL environment variable');
    console.log('3. Or run this script with the URLs as arguments');
    console.log('\nExample:');
    console.log('TEST_DATABASE_URL="postgresql://..." PROD_DATABASE_URL="postgresql://..." npm run update-db-schemas');
    return;
  }
  
  await updateDatabaseSchema(testDbUrl, 'TEST');
  await updateDatabaseSchema(prodDbUrl, 'PRODUCTION');
  
  console.log('\n✅ Database schema update instructions provided');
  console.log('📋 Next steps:');
  console.log('1. Run the prisma db push commands for each environment');
  console.log('2. Test the Add Menu functionality in both environments');
  console.log('3. Verify version display is correct');
}

main().catch(console.error);
