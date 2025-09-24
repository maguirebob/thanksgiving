import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env['DATABASE_URL'] || ''
    }
  }
});

async function main() {
  console.log('🚀 Testing Prisma connection...');
  console.log('📊 DATABASE_URL:', process.env['DATABASE_URL']);
  
  try {
    await prisma.$connect();
    console.log('✅ Database connection established');

    const userCount = await prisma.user.count();
    const eventCount = await prisma.event.count();
    const photoCount = await prisma.photo.count();

    console.log(`👥 Users: ${userCount}`);
    console.log(`📅 Events: ${eventCount}`);
    console.log(`📸 Photos: ${photoCount}`);

    console.log('✅ Prisma test completed successfully!');
    
  } catch (error) {
    console.error('❌ Prisma test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
