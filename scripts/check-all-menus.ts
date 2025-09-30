#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAllMenus() {
  try {
    console.log('🔍 Checking all menus in database...');
    
    const events = await prisma.event.findMany({
      orderBy: { event_date: 'desc' },
      take: 10
    });

    console.log(`📊 Found ${events.length} events (showing latest 10):`);
    
    events.forEach((event, index) => {
      console.log(`\n${index + 1}. Event ID: ${event.event_id}`);
      console.log(`   Name: ${event.event_name}`);
      console.log(`   Date: ${event.event_date.toISOString().split('T')[0]}`);
      console.log(`   Filename: ${event.menu_image_filename}`);
      console.log(`   Expected URL: /images/${event.menu_image_filename}`);
    });

    // Check for any events with placeholder or incorrect filenames
    const problematicEvents = await prisma.event.findMany({
      where: {
        OR: [
          { menu_image_filename: { contains: 'placeholder' } },
          { menu_image_filename: { contains: 'menu_' } }
        ]
      }
    });

    if (problematicEvents.length > 0) {
      console.log(`\n⚠️  Events with potentially problematic filenames:`);
      problematicEvents.forEach((event, index) => {
        console.log(`\n${index + 1}. Event ID: ${event.event_id}`);
        console.log(`   Name: ${event.event_name}`);
        console.log(`   Filename: ${event.menu_image_filename}`);
      });
    }

  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllMenus();
