#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testDatabaseSchema() {
  console.log('🔍 Testing database schema...');
  
  const prisma = new PrismaClient();

  try {
    // Test if we can create an event with null description and location
    console.log('Testing event creation with null optional fields...');
    
    const testEvent = await prisma.event.create({
      data: {
        event_name: 'Test Event Schema',
        event_type: 'Thanksgiving',
        event_location: null, // This should work if schema is correct
        event_date: new Date(),
        event_description: null, // This should work if schema is correct
        menu_title: 'Test Event Schema',
        menu_image_filename: 'test-schema.jpg'
      }
    });

    console.log('✅ Successfully created test event:', testEvent.event_id);
    
    // Clean up the test event
    await prisma.event.delete({
      where: { event_id: testEvent.event_id }
    });
    
    console.log('✅ Test event cleaned up');
    console.log('🎉 Database schema is correct!');

  } catch (error) {
    console.error('❌ Database schema test failed:', error);
    console.log('\n🔧 The database schema needs to be updated.');
    console.log('Run: DATABASE_URL="your-db-url" npx prisma db push');
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseSchema().catch(console.error);
