import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env['DATABASE_URL'] || 'postgresql://localhost:5432/thanksgiving'
    }
  }
});

async function testPrismaConnection() {
  console.log('🔍 Testing Prisma connection...');
  
  try {
    await prisma.$connect();
    console.log('✅ Prisma connected successfully');
    
    // Test basic query
    const eventCount = await prisma.event.count();
    console.log('📊 Event count:', eventCount);
    
    // Test journal section query
    const sectionCount = await prisma.journalSection.count();
    console.log('📊 Journal section count:', sectionCount);
    
    // Test creating a journal section (without committing)
    console.log('🔨 Testing journal section creation...');
    const testSection = await prisma.journalSection.create({
      data: {
        event_id: 39,
        year: 2025,
        section_order: 1,
        title: 'Test Section',
        description: 'Test Description'
      }
    });
    console.log('✅ Journal section created:', testSection.section_id);
    
    // Clean up
    await prisma.journalSection.delete({
      where: { section_id: testSection.section_id }
    });
    console.log('🧹 Test section cleaned up');
    
  } catch (error) {
    console.error('💥 Error:', error);
    if (error && typeof error === 'object' && 'code' in error) {
      console.error('   Prisma error code:', (error as any).code);
      console.error('   Prisma error meta:', (error as any).meta);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testPrismaConnection();
