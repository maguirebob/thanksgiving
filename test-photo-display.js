const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testPhotoUpload() {
  try {
    console.log('🧪 Testing Photo Upload and Display...');
    
    // Test 1: Check if photos endpoint returns S3 URLs
    console.log('📋 Testing photos API endpoint...');
    const photosResponse = await fetch('http://localhost:3000/api/events/466/photos');
    const photosResult = await photosResponse.json();
    
    console.log('Photos API Response:', {
      success: photosResult.success,
      photoCount: photosResult.data?.photos?.length || 0,
      hasS3Urls: photosResult.data?.photos?.some(p => p.s3_url) || false
    });
    
    if (photosResult.data?.photos?.length > 0) {
      const firstPhoto = photosResult.data.photos[0];
      console.log('First photo details:', {
        photo_id: firstPhoto.photo_id,
        filename: firstPhoto.filename,
        s3_url: firstPhoto.s3_url,
        hasS3Url: !!firstPhoto.s3_url
      });
      
      // Test 2: Check if photo file endpoint works
      if (firstPhoto.photo_id) {
        console.log('🖼️ Testing photo file endpoint...');
        const fileResponse = await fetch(`http://localhost:3000/api/photos/${firstPhoto.photo_id}/file`);
        console.log('Photo file response status:', fileResponse.status);
        console.log('Photo file response headers:', Object.fromEntries(fileResponse.headers.entries()));
        
        if (fileResponse.status === 302) {
          const redirectUrl = fileResponse.headers.get('location');
          console.log('✅ Photo redirects to:', redirectUrl);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testPhotoUpload();
