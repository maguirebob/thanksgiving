#!/usr/bin/env node

/**
 * Migration script to upload all local menu images to S3
 * and update the database with S3 URLs
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const s3Service = require('../dist/services/s3Service').default;

const prisma = new PrismaClient();

async function migrateMenuImagesToS3() {
  console.log('🚀 Starting menu image migration to S3...');
  
  try {
    // Get all events that don't have S3 URLs
    const events = await prisma.event.findMany({
      where: {
        menu_image_s3_url: null
      },
      select: {
        event_id: true,
        menu_image_filename: true,
        event_name: true
      }
    });

    console.log(`📋 Found ${events.length} events to migrate`);

    if (events.length === 0) {
      console.log('✅ No events need migration');
      return;
    }

    const imagesDir = path.join(__dirname, '..', 'public', 'images');
    let successCount = 0;
    let errorCount = 0;

    for (const event of events) {
      try {
        console.log(`\n📤 Migrating ${event.event_name} (${event.menu_image_filename})...`);
        
        // Check if local file exists
        const localFilePath = path.join(imagesDir, event.menu_image_filename);
        if (!fs.existsSync(localFilePath)) {
          console.log(`❌ Local file not found: ${localFilePath}`);
          errorCount++;
          continue;
        }

        // Read the file
        const fileBuffer = fs.readFileSync(localFilePath);
        
        // Determine content type
        const ext = path.extname(event.menu_image_filename).toLowerCase();
        let contentType = 'image/jpeg';
        if (ext === '.png') {
          contentType = 'image/png';
        } else if (ext === '.gif') {
          contentType = 'image/gif';
        }

        // Upload to S3
        const s3Key = `menus/${event.menu_image_filename}`;
        const s3Url = await s3Service.uploadFile(
          s3Key,
          fileBuffer,
          contentType,
          {
            'original-filename': event.menu_image_filename,
            'event-id': event.event_id.toString(),
            'event-name': event.event_name
          }
        );

        // Update database with S3 URL
        await prisma.event.update({
          where: { event_id: event.event_id },
          data: { menu_image_s3_url: s3Url }
        });

        console.log(`✅ Successfully migrated: ${event.event_name}`);
        console.log(`   S3 URL: ${s3Url}`);
        successCount++;

      } catch (error) {
        console.log(`❌ Failed to migrate ${event.event_name}: ${error.message}`);
        errorCount++;
      }
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`   ✅ Successfully migrated: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    console.log(`   📋 Total processed: ${events.length}`);

    if (successCount > 0) {
      console.log(`\n🎉 Migration completed! ${successCount} menu images are now in S3.`);
    }

  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
if (require.main === module) {
  migrateMenuImagesToS3()
    .then(() => {
      console.log('\n🏁 Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateMenuImagesToS3 };
