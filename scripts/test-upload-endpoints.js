#!/usr/bin/env node

/**
 * Test script to demonstrate the upload endpoints
 * This shows how to call the endpoints once deployed
 */

const BASE_URL = process.argv[2] || 'http://localhost:3000';

async function testUploadEndpoints() {
  console.log('🧪 Testing Upload Endpoints');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log('');

  try {
    // Test 1: Upload menu images to S3
    console.log('1️⃣ Testing: Upload menu images to S3');
    console.log(`   POST ${BASE_URL}/api/upload/menu-images-to-s3`);
    
    const uploadResponse = await fetch(`${BASE_URL}/api/upload/menu-images-to-s3`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const uploadResult = await uploadResponse.json();
    console.log(`   Status: ${uploadResponse.status}`);
    console.log(`   Success: ${uploadResult.success}`);
    console.log(`   Message: ${uploadResult.message}`);
    
    if (uploadResult.summary) {
      console.log(`   Summary: ${uploadResult.summary.successful}/${uploadResult.summary.total} successful`);
    }
    console.log('');

    // Test 2: Update database with S3 URLs
    console.log('2️⃣ Testing: Update database with S3 URLs');
    console.log(`   POST ${BASE_URL}/api/upload/update-database-s3-urls`);
    
    const updateResponse = await fetch(`${BASE_URL}/api/upload/update-database-s3-urls`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const updateResult = await updateResponse.json();
    console.log(`   Status: ${updateResponse.status}`);
    console.log(`   Success: ${updateResult.success}`);
    console.log(`   Message: ${updateResult.message}`);
    
    if (updateResult.summary) {
      console.log(`   Summary: ${updateResult.summary.successful}/${updateResult.summary.total} updated`);
    }
    console.log('');

    console.log('✅ Tests completed!');
    
    if (uploadResult.s3Urls && uploadResult.s3Urls.length > 0) {
      console.log('\n🔗 S3 URLs created:');
      uploadResult.s3Urls.forEach((item: any) => {
        console.log(`   • ${item.filename}: ${item.s3Url}`);
      });
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testUploadEndpoints();
