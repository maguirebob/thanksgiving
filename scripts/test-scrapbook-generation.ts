import { ScrapbookHtmlGenerator } from '../src/services/scrapbookHtmlGenerator';
import prisma from '../src/lib/prisma';

async function testScrapbookGeneration() {
  console.log('🧪 Testing Scrapbook HTML Generation');
  
  try {
    // Create test content in database
    const testYear = 2025;
    
    console.log('📝 Creating test content...');
    
    // Clear any existing test data
    await prisma.scrapbookContent.deleteMany({
      where: { year: testYear }
    });
    
    // Create test content items
    const testContent = [
      {
        year: testYear,
        content_type: 'title' as const,
        content_reference: 'Thanksgiving Memories',
        display_order: 1,
        page_break_before: false,
        page_break_after: false
      },
      {
        year: testYear,
        content_type: 'menu' as const,
        content_reference: '2024_Menu.jpeg',
        display_order: 2,
        page_break_before: false,
        page_break_after: false
      },
      {
        year: testYear,
        content_type: 'photo' as const,
        content_reference: 'Grandma80s.jpg',
        display_order: 3,
        page_break_before: false,
        page_break_after: false
      },
      {
        year: testYear,
        content_type: 'photo' as const,
        content_reference: 'JoeOld.jpg',
        display_order: 4,
        page_break_before: false,
        page_break_after: false
      },
      {
        year: testYear,
        content_type: 'photo' as const,
        content_reference: 'JoewithMaeveJosie.jpg',
        display_order: 5,
        page_break_before: false,
        page_break_after: false
      },
      {
        year: testYear,
        content_type: 'photo' as const,
        content_reference: 'Maeve Announcement.jpg',
        display_order: 6,
        page_break_before: false,
        page_break_after: false
      },
      {
        year: testYear,
        content_type: 'photo' as const,
        content_reference: 'ParentsWedding.jpg',
        display_order: 7,
        page_break_before: false,
        page_break_after: false
      },
      {
        year: testYear,
        content_type: 'photo' as const,
        content_reference: 'Summer73Wakins.jpg',
        display_order: 8,
        page_break_before: false,
        page_break_after: false
      },
      {
        year: testYear,
        content_type: 'title' as const,
        content_reference: 'Blog Images',
        display_order: 9,
        page_break_before: false,
        page_break_after: false
      },
      {
        year: testYear,
        content_type: 'blog' as const,
        content_reference: '2013_Journal_P1.jpeg',
        display_order: 10,
        page_break_before: false,
        page_break_after: false
      },
      {
        year: testYear,
        content_type: 'blog' as const,
        content_reference: '2013_Journal_P2.jpeg',
        display_order: 11,
        page_break_before: false,
        page_break_after: false
      },
      {
        year: testYear,
        content_type: 'page-photo' as const,
        content_reference: 'IMG_6016.jpeg',
        display_order: 12,
        page_break_before: false,
        page_break_after: false
      }
    ];
    
    // Insert test content
    for (const content of testContent) {
      await prisma.scrapbookContent.create({ data: content });
    }
    
    console.log(`✅ Created ${testContent.length} test content items`);
    
    // Generate scrapbook HTML
    console.log('📖 Generating scrapbook HTML...');
    const generator = new ScrapbookHtmlGenerator();
    const outputPath = await generator.generateScrapbook(testYear);
    
    console.log(`✅ Generated scrapbook: ${outputPath}`);
    console.log(`🌐 You can view it at: http://localhost:3000/scrapbooks/${testYear}.html`);
    
    // Clean up test data
    console.log('🧹 Cleaning up test data...');
    await prisma.scrapbookContent.deleteMany({
      where: { year: testYear }
    });
    
    console.log('✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testScrapbookGeneration();
