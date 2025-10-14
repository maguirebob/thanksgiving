import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env['DATABASE_URL'] || 'postgresql://localhost:5432/thanksgiving'
    }
  }
});

async function testSession() {
  console.log('🔍 Testing session and authentication...');
  
  try {
    // Test database connection
    console.log('📊 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Test if we can access the events table
    console.log('📋 Testing events table access...');
    const events = await prisma.event.findMany({
      take: 3,
      select: {
        event_id: true,
        event_name: true,
        event_date: true
      }
    });
    console.log('✅ Events table accessible:', events.length, 'events found');
    
    // Test if we can access the journal sections table
    console.log('📋 Testing journal sections table access...');
    const sections = await prisma.journalSection.findMany({
      take: 3,
      select: {
        section_id: true,
        event_id: true,
        year: true,
        title: true
      }
    });
    console.log('✅ Journal sections table accessible:', sections.length, 'sections found');
    
    // Test creating a journal section
    console.log('🔨 Testing journal section creation...');
    try {
      const testSection = await prisma.journalSection.create({
        data: {
          event_id: 39, // Maguire Thanksgiving 2025
          year: 2025,
          section_order: 1,
          title: 'Test Section',
          description: 'Test Description'
        }
      });
      console.log('✅ Journal section created successfully:', testSection.section_id);
      
      // Clean up - delete the test section
      await prisma.journalSection.delete({
        where: { section_id: testSection.section_id }
      });
      console.log('🧹 Test section cleaned up');
      
    } catch (createError) {
      console.error('❌ Error creating journal section:', createError);
      if (createError && typeof createError === 'object' && 'code' in createError) {
        console.error('   Prisma error code:', (createError as any).code);
        console.error('   Prisma error meta:', (createError as any).meta);
      }
    }
    
  } catch (error) {
    console.error('💥 Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSession();
