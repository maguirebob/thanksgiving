const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Test S3 photo upload
async function testPhotoUpload() {
  try {
    console.log('🧪 Testing S3 Photo Upload...');
    
    // Import the S3 service
    const s3Service = require('./dist/services/s3Service').default;
    
    // Create a test image buffer (1x1 pixel PNG)
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x0F, 0x00, 0x00,
      0x01, 0x00, 0x01, 0x00, 0x18, 0xDD, 0x8D, 0xB4, 0x00, 0x00, 0x00, 0x00,
      0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    
    // Generate unique filename
    const filename = s3Service.generateUniqueFilename('test-image.png', 'photos');
    console.log('📁 Uploading to S3 key:', filename);
    
    // Upload to S3
    const s3Url = await s3Service.uploadFile(
      filename,
      testImageBuffer,
      'image/png',
      { test: 'true', uploadedAt: new Date().toISOString() }
    );
    
    console.log('✅ Upload successful!');
    console.log('🔗 S3 URL:', s3Url);
    
    // Test signed URL generation
    console.log('🔐 Testing signed URL generation...');
    const signedUrl = await s3Service.getSignedUrl(filename, 3600);
    console.log('✅ Signed URL generated:', signedUrl.substring(0, 100) + '...');
    
    // Test file listing
    console.log('📋 Testing file listing...');
    const files = await s3Service.listFiles('photos/');
    console.log('✅ Files in photos folder:', files.length);
    
    // Clean up - delete the test file
    console.log('🧹 Cleaning up test file...');
    await s3Service.deleteFile(filename);
    console.log('✅ Test file deleted');
    
    console.log('🎉 All S3 tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testPhotoUpload();
