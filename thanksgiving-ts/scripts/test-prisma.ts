import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env['DATABASE_URL'] || 'postgresql://localhost:5432/thanksgiving_dev'
    }
  }
});

async function main() {
  console.log('🚀 Testing Prisma connection...');
  
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
