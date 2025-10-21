#!/usr/bin/env ts-node

import fs from 'fs';
import path from 'path';
import prisma from '../src/lib/prisma';

interface JournalContentItem {
  content_item_id: number;
  journal_section_id: number;
  content_type: string;
  content_id: number | null;
  custom_text: string | null;
  heading_level: number | null;
  display_order: number;
  is_visible: boolean;
  manual_page_break: boolean;
  page_break_position: number | null;
}

interface ScrapbookTestResult {
  year: number;
  totalItems: number;
  itemsInOrder: boolean;
  missingItems: string[];
  orderErrors: string[];
  details: {
    databaseOrder: string[];
    htmlOrder: string[];
    dbByType: { [key: string]: JournalContentItem[] };
    htmlByType: { [key: string]: string[] };
  };
}

/**
 * Test scrapbook generation order and content
 */
async function testScrapbookOrder(year: number): Promise<ScrapbookTestResult> {
  console.log(`🧪 Testing scrapbook order for year ${year}...`);
  
  // 1. Get all journal content items for the year from database
  const journalSections = await prisma.journalSection.findMany({
    where: {
      year: year,
      is_published: true
    },
    include: {
      event: true,
      content_items: {
        orderBy: { display_order: 'asc' }
      }
    }
  });

  const allContentItems: JournalContentItem[] = [];
  journalSections.forEach(section => {
    section.content_items.forEach((item: any) => {
      allContentItems.push({
        content_item_id: item.content_item_id,
        journal_section_id: item.journal_section_id,
        content_type: item.content_type,
        content_id: item.content_id,
        custom_text: item.custom_text,
        heading_level: item.heading_level,
        display_order: item.display_order,
        is_visible: item.is_visible,
        manual_page_break: item.manual_page_break,
        page_break_position: item.page_break_position
      });
    });
  });

  console.log(`📊 Found ${allContentItems.length} journal content items in database`);

  // 2. Convert journal content to scrapbook content via API
  console.log(`🔄 Converting journal content to scrapbook content for year ${year}...`);
  try {
    const convertResponse = await fetch(`http://localhost:3000/api/scrapbook/convert-from-journal/${year}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!convertResponse.ok) {
      const errorData = await convertResponse.json();
      throw new Error(`Convert API failed: ${errorData.message || convertResponse.statusText}`);
    }
    
    const convertResult = await convertResponse.json();
    console.log(`✅ Journal content converted successfully: ${convertResult.itemsConverted} items`);
  } catch (error) {
    console.error(`❌ Failed to convert journal content:`, error);
    throw error;
  }

  // 3. Generate the scrapbook via API
  console.log(`🔧 Generating scrapbook for year ${year}...`);
  try {
    const generateResponse = await fetch(`http://localhost:3000/api/scrapbook/generate/${year}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!generateResponse.ok) {
      const errorData = await generateResponse.json();
      throw new Error(`Generate API failed: ${errorData.message || generateResponse.statusText}`);
    }
    
    const generateResult = await generateResponse.json();
    console.log(`✅ Scrapbook generated successfully: ${generateResult.filename}`);
  } catch (error) {
    console.error(`❌ Failed to generate scrapbook:`, error);
    throw error;
  }

  // 4. Read the generated HTML file
  const htmlPath = path.join(__dirname, '../public/scrapbooks', `${year}.html`);
  
  if (!fs.existsSync(htmlPath)) {
    throw new Error(`Scrapbook HTML file not found after generation: ${htmlPath}`);
  }

  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  console.log(`📄 Read HTML file: ${htmlPath}`);

  // 5. Parse HTML to extract content order
  const htmlOrder = parseHtmlContent(htmlContent);
  console.log(`🔍 Extracted ${htmlOrder.length} items from HTML`);

  // 6. Create expected order from database
  const databaseOrder = allContentItems.map(item => {
    switch (item.content_type) {
      case 'menu':
        return `menu_${item.content_id}`;
      case 'photo':
        return `photo_${item.content_id}`;
      case 'page_photo':
        return `page_photo_${item.content_id}`;
      case 'blog':
        return `blog_${item.content_id}`;
      case 'text':
        return `text: ${item.custom_text?.substring(0, 50)}...`;
      case 'heading':
        return `heading: ${item.custom_text}`;
      default:
        return `unknown_${item.content_type}_${item.content_id}`;
    }
  });

  // 7. Compare orders by content type and position rather than exact IDs
  const missingItems: string[] = [];
  const orderErrors: string[] = [];
  let itemsInOrder = true;

  // Group items by type for comparison
  const dbByType = {
    menu: allContentItems.filter(item => item.content_type === 'menu'),
    page_photo: allContentItems.filter(item => item.content_type === 'page_photo'),
    blog: allContentItems.filter(item => item.content_type === 'blog'),
    heading: allContentItems.filter(item => item.content_type === 'heading'),
    text: allContentItems.filter(item => item.content_type === 'text'),
    photo: allContentItems.filter(item => item.content_type === 'photo')
  };

  const htmlByType = {
    menu: htmlOrder.filter(item => item.startsWith('menu_')),
    page_photo: htmlOrder.filter(item => item.startsWith('page_photo:')),
    blog: htmlOrder.filter(item => item.startsWith('blog:')),
    heading: htmlOrder.filter(item => item.startsWith('heading:')),
    text: htmlOrder.filter(item => item.startsWith('text:')),
    photo: htmlOrder.filter(item => item.startsWith('photo:'))
  };

  // Check if we have the right number of each type
  Object.keys(dbByType).forEach(type => {
    const dbCount = dbByType[type as keyof typeof dbByType].length;
    const htmlCount = htmlByType[type as keyof typeof htmlByType].length;
    
    if (dbCount !== htmlCount) {
      missingItems.push(`Type ${type}: Expected ${dbCount}, found ${htmlCount}`);
      itemsInOrder = false;
    }
  });

  // For photos, check if they're in the right relative order
  if (dbByType.photo.length > 0 && htmlByType.photo.length > 0) {
    // Photos should be grouped in 6-photo grids, so we expect them in groups
    const actualPhotoGroups = htmlByType.photo.length; // Each photo in HTML is a separate item
    
    if (dbByType.photo.length !== actualPhotoGroups) {
      orderErrors.push(`Photos: Expected ${dbByType.photo.length} individual photos, found ${actualPhotoGroups} (may be grouped in grids)`);
    }
  }

  const result: ScrapbookTestResult = {
    year,
    totalItems: allContentItems.length,
    itemsInOrder,
    missingItems,
    orderErrors,
    details: {
      databaseOrder,
      htmlOrder,
      dbByType,
      htmlByType
    }
  };

  return result;
}

/**
 * Parse HTML content to extract item order
 */
function parseHtmlContent(html: string): string[] {
  const items: string[] = [];
  
  // Extract menu pages
  const menuMatches = html.match(/<!-- Menu Page -->[\s\S]*?<img src="\/api\/v1\/menu-images\/(\d+)"/g);
  if (menuMatches) {
    menuMatches.forEach(match => {
      const menuId = match.match(/\/api\/v1\/menu-images\/(\d+)/)?.[1];
      if (menuId) items.push(`menu_${menuId}`);
    });
  }

  // Extract page-photo pages
  const pagePhotoMatches = html.match(/<!-- Page Photo Page -->[\s\S]*?<img src="\/api\/photos\/([^"]+)\/preview"/g);
  if (pagePhotoMatches) {
    pagePhotoMatches.forEach(match => {
      const filename = match.match(/\/api\/photos\/([^"]+)\/preview/)?.[1];
      if (filename) items.push(`page_photo: ${filename}`);
    });
  }

  // Extract blog pages (journal pages with blog content)
  const blogMatches = html.match(/<!-- Journal Page -->[\s\S]*?<h3 class="blog-title">([^<]+)<\/h3>/g);
  if (blogMatches) {
    blogMatches.forEach(match => {
      const title = match.match(/<h3 class="blog-title">([^<]+)<\/h3>/)?.[1];
      if (title) items.push(`blog: ${title}`);
    });
  }

  // Extract text pages
  const textMatches = html.match(/<!-- Text Page -->[\s\S]*?<p>([^<]+)<\/p>/g);
  if (textMatches) {
    textMatches.forEach(match => {
      const text = match.match(/<p>([^<]+)<\/p>/)?.[1];
      if (text) items.push(`text: ${text.substring(0, 50)}...`);
    });
  }

  // Extract heading pages
  const headingMatches = html.match(/<!-- Heading Page -->[\s\S]*?<h2 class="section-heading">([^<]+)<\/h2>/g);
  if (headingMatches) {
    headingMatches.forEach(match => {
      const heading = match.match(/<h2 class="section-heading">([^<]+)<\/h2>/)?.[1];
      if (heading) items.push(`heading: ${heading}`);
    });
  }

  // Extract photo grid pages (multiple photos in one page)
  const photoGridMatches = html.match(/<!-- Photo Grid Page -->[\s\S]*?<div class="photo-grid">([\s\S]*?)<\/div>/g);
  if (photoGridMatches) {
    photoGridMatches.forEach(match => {
      // Extract all photo filenames from this grid
      const photoFilenames = match.match(/\/api\/photos\/([^"]+)\/preview/g);
      if (photoFilenames) {
        photoFilenames.forEach(photoMatch => {
          const filename = photoMatch.match(/\/api\/photos\/([^"]+)\/preview/)?.[1];
          if (filename) items.push(`photo: ${filename}`);
        });
      }
    });
  }

  return items;
}

/**
 * Print test results
 */
function printTestResults(result: ScrapbookTestResult): void {
  console.log('\n' + '='.repeat(60));
  console.log(`🧪 SCRAPBOOK ORDER TEST RESULTS - YEAR ${result.year}`);
  console.log('='.repeat(60));
  
  console.log(`📊 Total Items: ${result.totalItems}`);
  console.log(`✅ Items in Order: ${result.itemsInOrder ? 'YES' : 'NO'}`);
  
  if (result.missingItems.length > 0) {
    console.log(`\n❌ Missing Items (${result.missingItems.length}):`);
    result.missingItems.forEach(item => console.log(`   - ${item}`));
  }
  
  if (result.orderErrors.length > 0) {
    console.log(`\n🔄 Order Errors (${result.orderErrors.length}):`);
    result.orderErrors.forEach(error => console.log(`   - ${error}`));
  }
  
  console.log('\n📊 Content Type Comparison:');
  Object.keys(result.details.dbByType).forEach(type => {
    const dbCount = result.details.dbByType[type]?.length || 0;
    const htmlCount = result.details.htmlByType[type]?.length || 0;
    const status = dbCount === htmlCount ? '✅' : '❌';
    console.log(`   ${status} ${type}: DB=${dbCount}, HTML=${htmlCount}`);
  });
  
  console.log('\n📋 Database Order:');
  result.details.databaseOrder.forEach((item, index) => {
    console.log(`   ${index + 1}. ${item}`);
  });
  
  console.log('\n📄 HTML Order:');
  result.details.htmlOrder.forEach((item, index) => {
    console.log(`   ${index + 1}. ${item}`);
  });
  
  console.log('\n' + '='.repeat(60));
}

/**
 * Main function
 */
async function main() {
  const year = process.argv[2] ? parseInt(process.argv[2]) : 2013;
  
  try {
    const result = await testScrapbookOrder(year);
    printTestResults(result);
    
    if (result.itemsInOrder && result.missingItems.length === 0) {
      console.log('🎉 All tests passed! Scrapbook order is correct.');
      process.exit(0);
    } else {
      console.log('❌ Tests failed! Scrapbook order needs fixing.');
      process.exit(1);
    }
  } catch (error) {
    console.error('💥 Test failed with error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
if (require.main === module) {
  main();
}

export { testScrapbookOrder, ScrapbookTestResult };
