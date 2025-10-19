const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPhotoFilenames() {
  try {
    console.log('Checking photo filenames for page photos...');
    
    // Check the specific photo IDs that are failing
    const photoIds = [57, 38, 37];
    
    for (const photoId of photoIds) {
      const photo = await prisma.photo.findUnique({
        where: { photo_id: photoId },
        select: { 
          photo_id: true, 
          filename: true, 
          s3_url: true,
          photo_type: true,
          event_id: true
        }
      });
      
      console.log(`Photo ID ${photoId}:`, photo);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPhotoFilenames();
