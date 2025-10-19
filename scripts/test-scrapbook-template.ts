import { ScrapbookTemplateService, ScrapbookData } from '../src/services/scrapbookTemplateService';

async function testTemplateSystem() {
  console.log('🧪 Testing Scrapbook Template System...\n');

  const templateService = new ScrapbookTemplateService();

  // Test data
  const testData: ScrapbookData = {
    title: 'Test Thanksgiving Scrapbook',
    pages: [
      {
        type: 'cover',
        content: { title: 'Test Scrapbook' }
      },
      {
        type: 'menu',
        content: { 
          imagePath: '../images/2024_Menu.jpeg',
          alt: '2024 Menu'
        }
      },
      {
        type: 'photo-grid',
        content: {
          images: [
            { src: '../photos/Grandma80s.jpg', alt: 'Grandma 80s' },
            { src: '../photos/JoeOld.jpg', alt: 'Joe Old' },
            { src: '../photos/JoewithMaeveJosie.jpg', alt: 'Joe with Maeve and Josie' },
            { src: '../photos/Maeve Announcement.jpg', alt: 'Maeve Announcement' },
            { src: '../photos/ParentsWedding.jpg', alt: 'Parents Wedding' },
            { src: '../photos/Summer73Wakins.jpg', alt: 'Summer 73 Wakins' }
          ]
        }
      },
      {
        type: 'section-header',
        content: { title: 'Test Section' }
      },
      {
        type: 'blog-images',
        content: {
          images: [
            { src: '../blog_images/2013_Journal_P1.jpeg', alt: '2013 Journal Page 1' },
            { src: '../blog_images/2013_Journal_P2.jpeg', alt: '2013 Journal Page 2' }
          ]
        }
      },
      {
        type: 'page-photo',
        content: {
          imagePath: '../page_photos/IMG_6016.jpeg',
          alt: 'Test Page Photo'
        }
      },
      {
        type: 'cover',
        content: { title: 'The End', isBackCover: true }
      }
    ]
  };

  try {
    console.log('📝 Generating test scrapbook...');
    const outputPath = await templateService.generateScrapbook(testData, 'test-scrapbook');
    
    console.log('✅ Success! Generated scrapbook at:', outputPath);
    console.log('🌐 You can view it at: /scrapbooks/test-scrapbook.html');
    console.log('\n📋 Generated pages:');
    testData.pages.forEach((page, index) => {
      console.log(`   ${index + 1}. ${page.type} - ${JSON.stringify(page.content)}`);
    });

  } catch (error) {
    console.error('❌ Error generating scrapbook:', error);
  }
}

// Run the test
testTemplateSystem();
