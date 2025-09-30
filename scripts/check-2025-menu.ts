#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check2025Menu() {
  try {
    console.log('🔍 Checking 2025 menu in database...');
    
    // Find events with 2025 in the name
    const events = await prisma.event.findMany({
      where: {
        OR: [
          { event_name: { contains: '2025' } },
          { event_date: { gte: new Date('2025-01-01'), lt: new Date('2026-01-01') } }
        ]
      },
      orderBy: { event_date: 'desc' }
    });

    console.log(`📊 Found ${events.length} events for 2025:`);
    
    events.forEach((event, index) => {
      console.log(`\n${index + 1}. Event ID: ${event.event_id}`);
      console.log(`   Name: ${event.event_name}`);
      console.log(`   Date: ${event.event_date.toISOString().split('T')[0]}`);
      console.log(`   Filename: ${event.menu_image_filename}`);
      console.log(`   Location: ${event.event_location || 'N/A'}`);
      console.log(`   Description: ${event.event_description || 'N/A'}`);
    });

    // Check if there are any recent events (created in last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentEvents = await prisma.event.findMany({
      where: {
        event_date: { gte: oneHourAgo }
      },
      orderBy: { event_date: 'desc' }
    });

    if (recentEvents.length > 0) {
      console.log(`\n🕐 Recent events (last hour):`);
      recentEvents.forEach((event, index) => {
        console.log(`\n${index + 1}. Event ID: ${event.event_id}`);
        console.log(`   Name: ${event.event_name}`);
        console.log(`   Date: ${event.event_date.toISOString().split('T')[0]}`);
        console.log(`   Filename: ${event.menu_image_filename}`);
      });
    }

  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

check2025Menu();
