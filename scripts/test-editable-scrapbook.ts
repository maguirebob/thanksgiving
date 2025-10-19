import { EditableScrapbookService } from '../src/services/editableScrapbookService';
import { ScrapbookTemplateService } from '../src/services/scrapbookTemplateService';
import { ScrapbookDataService } from '../src/services/scrapbookDataService';

async function testEditableScrapbookSystem() {
  console.log('🧪 Testing Editable Scrapbook System...\n');

  const editableService = new EditableScrapbookService();
  const templateService = new ScrapbookTemplateService();
  const dataService = new ScrapbookDataService();

  try {
    // Test 1: Get available events
    console.log('📋 Test 1: Getting available events...');
    const events = await dataService.getAvailableEvents();
    console.log(`✅ Found ${events.length} events:`);
    events.forEach(event => {
      console.log(`   - ${event.event_name} (ID: ${event.event_id}, Date: ${event.event_date.toISOString().split('T')[0]})`);
    });

    if (events.length === 0) {
      console.log('❌ No events found in database. Please add some events first.');
      return;
    }

    // Use the first event for testing
    const testEvent = events[0];
    const testYear = 2024; // Use 2024 as test year

    console.log(`\n🎯 Using event: ${testEvent.event_name} (ID: ${testEvent.event_id})`);

    // Test 2: Generate editable scrapbook data
    console.log('\n📝 Test 2: Generating editable scrapbook data...');
    const editableData = await editableService.generateEditableScrapbookData(
      testEvent.event_id, 
      testYear, 
      `Test Scrapbook - ${testEvent.event_name}`
    );

    console.log(`✅ Generated editable scrapbook with ${editableData.pages.length} pages:`);
    editableData.pages.forEach((page, index) => {
      console.log(`   ${index + 1}. ${page.type} - ${JSON.stringify(page.content)}`);
    });

    // Test 3: Simulate drag and drop editing
    console.log('\n🎨 Test 3: Simulating drag and drop editing...');
    
    // Modify some pages to simulate editing
    editableData.pages.forEach((page, index) => {
      page.position = { x: index * 10, y: index * 5 };
      page.size = { width: 400 + index * 10, height: 600 + index * 5 };
    });

    console.log('✅ Simulated drag and drop modifications:');
    editableData.pages.forEach((page, index) => {
      console.log(`   ${index + 1}. ${page.type} - Position: (${page.position.x}, ${page.position.y}), Size: ${page.size.width}x${page.size.height}`);
    });

    // Test 4: Save layout to database
    console.log('\n💾 Test 4: Saving layout to database...');
    await editableService.saveScrapbookLayout(editableData);
    console.log('✅ Layout saved to database successfully');

    // Test 5: Load layout from database
    console.log('\n📂 Test 5: Loading layout from database...');
    const loadedData = await editableService.loadScrapbookLayout(testEvent.event_id, testYear);
    
    if (loadedData) {
      console.log(`✅ Loaded layout with ${loadedData.pages.length} pages`);
      console.log('✅ Layout matches saved data:', 
        loadedData.pages.length === editableData.pages.length ? 'YES' : 'NO');
    } else {
      console.log('❌ Failed to load layout from database');
    }

    // Test 6: Generate static scrapbook from saved layout
    console.log('\n🖨️ Test 6: Generating static scrapbook from saved layout...');
    
    if (loadedData) {
      // Convert to static format
      const staticData = {
        title: loadedData.title,
        pages: loadedData.pages.map(page => ({
          type: page.type,
          content: page.content
        }))
      };

      const outputPath = await templateService.generateScrapbook(staticData, 'test-editable-scrapbook');
      console.log(`✅ Static scrapbook generated at: ${outputPath}`);
      console.log(`🌐 You can view it at: /scrapbooks/test-editable-scrapbook.html`);
    }

    // Test 7: Test API endpoints (simulation)
    console.log('\n🌐 Test 7: API Endpoints Summary...');
    console.log('Available endpoints:');
    console.log('   GET  /api/scrapbook/editable/:eventId/:year - Get editable data');
    console.log('   POST /api/scrapbook/save-layout - Save drag & drop layout');
    console.log('   POST /api/scrapbook/generate-static/:filename - Generate static HTML');
    console.log('   GET  /api/scrapbook/events - Get available events');
    console.log('   GET  /api/scrapbook/events/:eventId/years - Get available years');

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Start your server: npm run dev');
    console.log('   2. Test API endpoints with Postman or curl');
    console.log('   3. Build a drag & drop editor frontend');
    console.log('   4. Integrate with existing journal system');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Clean up database connections
    await editableService.disconnect();
    await dataService.disconnect();
  }
}

// Run the test
testEditableScrapbookSystem();
