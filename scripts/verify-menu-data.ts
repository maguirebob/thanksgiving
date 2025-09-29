#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyMenuData() {
  try {
    console.log('🔍 Verifying Thanksgiving menu data...');
    
    // Get total count
    const totalEvents = await prisma.event.count();
    console.log(`📊 Total events in database: ${totalEvents}`);
    
    // Get events by year range
    const events = await prisma.event.findMany({
      orderBy: { event_date: 'desc' },
      select: {
        event_id: true,
        event_name: true,
        event_date: true,
        menu_image_filename: true
      }
    });
    
    console.log('\n📅 Events by year:');
    events.forEach(event => {
      const year = event.event_date.getFullYear();
      console.log(`  ${year}: ${event.event_name} (ID: ${event.event_id}) - ${event.menu_image_filename}`);
    });
    
    // Check for missing years
    const years = events.map(e => e.event_date.getFullYear()).sort();
    const expectedYears = Array.from({length: 31}, (_, i) => 1994 + i); // 1994-2024
    const missingYears = expectedYears.filter(year => !years.includes(year));
    
    if (missingYears.length > 0) {
      console.log(`\n⚠️  Missing years: ${missingYears.join(', ')}`);
    } else {
      console.log('\n✅ All years from 1994-2024 are present!');
    }
    
    // Check for duplicate years
    const yearCounts = years.reduce((acc, year) => {
      acc[year] = (acc[year] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    const duplicates = Object.entries(yearCounts).filter(([_, count]) => count > 1);
    if (duplicates.length > 0) {
      console.log(`\n⚠️  Duplicate years found:`);
      duplicates.forEach(([year, count]) => {
        console.log(`  ${year}: ${count} events`);
      });
    } else {
      console.log('\n✅ No duplicate years found!');
    }
    
    console.log('\n🎉 Menu data verification complete!');
    
  } catch (error) {
    console.error('❌ Error verifying menu data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  verifyMenuData();
}

export { verifyMenuData };
