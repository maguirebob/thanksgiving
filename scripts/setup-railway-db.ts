import { PrismaClient } from '@prisma/client';
import { config } from '../src/lib/config';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: config.getDatabaseUrl()
    }
  }
});

async function setupRailwayDatabase() {
  console.log('🚀 Setting up Railway database...');
  console.log('📊 Database URL:', config.getDatabaseUrl().replace(/\/\/.*@/, '//***:***@')); // Hide credentials

  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connection established');

    // Check if we already have data
    const eventCount = await prisma.event.count();
    const userCount = await prisma.user.count();

    if (eventCount > 0 || userCount > 0) {
      console.log(`📊 Database already has data: ${eventCount} events, ${userCount} users`);
      console.log('🔄 Skipping data insertion');
      return;
    }

    console.log('📝 Creating sample data...');

    // Create sample events (Thanksgiving menus from 1994-2024)
    const events = [];
    for (let year = 1994; year <= 2024; year++) {
      events.push({
        event_name: `Thanksgiving ${year}`,
        event_type: 'Thanksgiving',
        event_location: 'Family Home',
        event_date: new Date(`${year}-11-${year === 2020 ? '26' : '25'}`), // 2020 was on 26th
        event_description: `Annual Thanksgiving celebration for ${year}`,
        menu_title: `${year} Thanksgiving Menu`,
        menu_image_filename: `${year}_Menu.jpeg`
      });
    }

    // Insert events
    const createdEvents = await prisma.event.createMany({
      data: events,
      skipDuplicates: true
    });

    console.log(`✅ Created ${createdEvents.count} events`);

    // Create sample users
    const bcrypt = require('bcryptjs');
    
    const users = [
      {
        username: 'admin',
        email: 'admin@thanksgiving.com',
        password_hash: await bcrypt.hash('admin123', 10),
        role: 'admin' as const,
        first_name: 'Admin',
        last_name: 'User'
      },
      {
        username: 'testuser',
        email: 'test@thanksgiving.com',
        password_hash: await bcrypt.hash('testpass123', 10),
        role: 'user' as const,
        first_name: 'Test',
        last_name: 'User'
      }
    ];

    const createdUsers = await prisma.user.createMany({
      data: users,
      skipDuplicates: true
    });

    console.log(`✅ Created ${createdUsers.count} users`);

    // Verify data
    const finalEventCount = await prisma.event.count();
    const finalUserCount = await prisma.user.count();

    console.log('📊 Final database state:');
    console.log(`   Events: ${finalEventCount}`);
    console.log(`   Users: ${finalUserCount}`);

    console.log('🎉 Railway database setup completed successfully!');

  } catch (error) {
    console.error('❌ Error setting up Railway database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
setupRailwayDatabase()
  .then(() => {
    console.log('✅ Setup completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });
