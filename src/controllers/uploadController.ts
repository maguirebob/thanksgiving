import { Request, Response } from 'express';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

/**
 * API endpoint to upload menu images from public/images to S3
 * This endpoint should be run in production where AWS credentials are configured
 */

interface UploadResult {
  success: boolean;
  filename: string;
  s3Url?: string;
  error?: string;
}

export const uploadMenuImagesToS3 = async (_req: Request, res: Response): Promise<void> => {
  try {
    console.log('🚀 Starting menu images upload to S3...');
    
    const results: UploadResult[] = [];
    const publicImagesPath = path.join(process.cwd(), 'public', 'images');
    const bucketName = process.env['S3_BUCKET_NAME'] || 'thanksgiving-images-prod';
    const region = process.env['AWS_REGION'] || 'us-east-1';
    
    console.log(`📁 Public images path: ${publicImagesPath}`);
    console.log(`🪣 S3 bucket: ${bucketName}`);
    console.log(`🌍 AWS region: ${region}`);
    
    // Check if directory exists
    if (!fs.existsSync(publicImagesPath)) {
      res.status(404).json({
        success: false,
        message: `Public images directory not found: ${publicImagesPath}`,
        results: []
      });
      return;
    }

    // Initialize S3 client
    const s3Client = new S3Client({
      region: region,
      credentials: {
        accessKeyId: process.env['AWS_ACCESS_KEY_ID'] || '',
        secretAccessKey: process.env['AWS_SECRET_ACCESS_KEY'] || ''
      }
    });

    // Get all image files
    const files = fs.readdirSync(publicImagesPath).filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
    });

    console.log(`📋 Found ${files.length} image files`);

    if (files.length === 0) {
      res.status(200).json({
        success: true,
        message: 'No image files found in public/images directory',
        results: []
      });
      return;
    }

    // Process each file
    for (const filename of files) {
      console.log(`\n🔄 Processing: ${filename}`);
      
      try {
        const localPath = path.join(publicImagesPath, filename);
        const stats = fs.statSync(localPath);
        console.log(`   📊 File size: ${formatFileSize(stats.size)}`);

        // Read file
        const fileBuffer = fs.readFileSync(localPath);
        const contentType = getContentType(filename);

        // Upload to S3
        const s3Key = `menus/${filename}`;
        console.log(`   ⬆️  Uploading to S3: ${s3Key}`);
        
        const command = new PutObjectCommand({
          Bucket: bucketName,
          Key: s3Key,
          Body: fileBuffer,
          ContentType: contentType
        });

        await s3Client.send(command);
        
        const s3Url = `https://${bucketName}.s3.${region}.amazonaws.com/${s3Key}`;
        console.log(`   ✅ Uploaded successfully: ${s3Url}`);

        results.push({
          success: true,
          filename,
          s3Url
        });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.log(`   ❌ Upload failed: ${errorMessage}`);
        results.push({
          success: false,
          filename,
          error: errorMessage
        });
      }
    }

    // Calculate summary
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log('\n📊 Upload Summary:');
    console.log(`✅ Successful: ${successful.length}`);
    console.log(`❌ Failed: ${failed.length}`);

    // Return results
    res.status(200).json({
      success: true,
      message: `Upload completed. ${successful.length} successful, ${failed.length} failed.`,
      summary: {
        total: results.length,
        successful: successful.length,
        failed: failed.length
      },
      results: results,
      s3Urls: successful.map(r => ({
        filename: r.filename,
        s3Url: r.s3Url
      }))
    });

  } catch (error) {
    console.error('❌ Upload endpoint failed:', error);
    res.status(500).json({
      success: false,
      message: 'Upload endpoint failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * API endpoint to fix S3 URLs in database to match actual uploaded filenames
 * POST /api/upload/fix-s3-urls
 */
export const fixS3Urls = async (_req: Request, res: Response): Promise<void> => {
  try {
    console.log('🚀 Starting S3 URL fix...');
    
    const bucketName = process.env['S3_BUCKET_NAME'] || 'thanksgiving-images-prod';
    const region = process.env['AWS_REGION'] || 'us-east-1';
    
    // Map of event years to actual S3 filenames we uploaded
    const yearToFilename: Record<number, string> = {
      1994: '1994_Menu.png',
      1997: '1997_Menu.jpeg',
      1999: '1999_Menu.jpeg',
      2000: '2000_Menu.jpeg',
      2002: '2002_Menu.jpeg',
      2004: '2004_Menu.jpeg',
      2005: '2005_Menu.jpeg',
      2006: '2006_Menu.jpeg',
      2007: '2007_Menu.jpeg',
      2008: '2008_Menu.jpeg',
      2009: '2009_Menu.jpeg',
      2010: '2010_Menu.jpeg',
      2011: '2011_Menu.jpeg',
      2012: '2012_Menu.jpeg',
      2013: '2013_Menu.jpeg',
      2014: '2014_Menu.jpeg',
      2015: '2015_Menu.jpeg',
      2016: '2016_Menu.jpeg',
      2017: '2017_Menu.jpeg',
      2018: '2018_Menu.jpeg',
      2020: '2020_Menu.jpeg',
      2021: '2021_Menu.jpeg',
      2022: '2022_Menu.jpeg',
      2023: '2023_Menu.jpeg',
      2024: '2024_Menu.jpeg'
    };
    
    console.log(`🪣 S3 bucket: ${bucketName}`);
    
    // Get all events
    const events = await prisma.event.findMany({
      select: {
        event_id: true,
        event_name: true,
        event_date: true,
        menu_image_filename: true,
        menu_image_s3_url: true
      },
      orderBy: {
        event_date: 'asc'
      }
    });

    console.log(`📋 Found ${events.length} events`);

    const results: Array<{
      success: boolean;
      eventId: number;
      eventName: string;
      year: number;
      oldFilename?: string | undefined;
      newFilename: string;
      oldS3Url?: string | undefined;
      newS3Url: string;
      error?: string;
    }> = [];

    // Process each event
    for (const event of events) {
      const { event_id, event_name, event_date, menu_image_filename, menu_image_s3_url } = event;
      const year = event_date.getFullYear();
      
      console.log(`\n🔄 Processing: ${event_name} (ID: ${event_id}, Year: ${year})`);

      // Check if we have a mapping for this year
      const correctFilename = yearToFilename[year];
      if (!correctFilename) {
        console.log(`   ⚠️  No mapping found for year ${year}`);
        results.push({
          success: false,
          eventId: event_id,
          eventName: event_name,
          year: year,
          newFilename: '',
          newS3Url: '',
          error: `No mapping found for year ${year}`
        });
        continue;
      }

      const newS3Url = `https://${bucketName}.s3.${region}.amazonaws.com/menus/${correctFilename}`;
      
      console.log(`   📁 Current filename: ${menu_image_filename || 'null'}`);
      console.log(`   📁 Correct filename: ${correctFilename}`);
      console.log(`   🔗 Current S3 URL: ${menu_image_s3_url || 'null'}`);
      console.log(`   🔗 Correct S3 URL: ${newS3Url}`);

      try {
        // Update database
        await prisma.event.update({
          where: { event_id: event_id },
          data: { 
            menu_image_filename: correctFilename,
            menu_image_s3_url: newS3Url
          }
        });
        
        console.log(`   ✅ Database updated successfully`);

        results.push({
          success: true,
          eventId: event_id,
          eventName: event_name,
          year: year,
          oldFilename: menu_image_filename || undefined,
          newFilename: correctFilename,
          oldS3Url: menu_image_s3_url || undefined,
          newS3Url: newS3Url
        });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.log(`   ❌ Update failed: ${errorMessage}`);
        results.push({
          success: false,
          eventId: event_id,
          eventName: event_name,
          year: year,
          newFilename: correctFilename,
          newS3Url: newS3Url,
          error: errorMessage
        });
      }
    }

    // Calculate summary
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log('\n📊 Fix Summary:');
    console.log(`✅ Successful: ${successful.length}`);
    console.log(`❌ Failed: ${failed.length}`);

    // Return results
    res.status(200).json({
      success: true,
      message: `S3 URL fix completed. ${successful.length} successful, ${failed.length} failed.`,
      summary: {
        total: results.length,
        successful: successful.length,
        failed: failed.length
      },
      results: results,
      fixedUrls: successful.map(r => ({
        eventId: r.eventId,
        eventName: r.eventName,
        year: r.year,
        filename: r.newFilename,
        s3Url: r.newS3Url
      }))
    });

  } catch (error) {
    console.error('❌ S3 URL fix endpoint failed:', error);
    res.status(500).json({
      success: false,
      message: 'S3 URL fix endpoint failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Helper functions
function getContentType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const contentTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp'
  };
  return contentTypes[ext] || 'application/octet-stream';
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * API endpoint to update database with S3 URLs for menu images
 * POST /api/upload/update-database-s3-urls
 */
export const updateDatabaseWithS3Urls = async (_req: Request, res: Response): Promise<void> => {
  try {
    console.log('🚀 Starting database update with S3 URLs...');
    
    const bucketName = process.env['S3_BUCKET_NAME'] || 'thanksgiving-images-prod';
    const region = process.env['AWS_REGION'] || 'us-east-1';
    const baseUrl = `https://${bucketName}.s3.${region}.amazonaws.com`;
    
    console.log(`🪣 S3 bucket: ${bucketName}`);
    console.log(`🌍 AWS region: ${region}`);
    console.log(`🔗 Base URL: ${baseUrl}`);
    
    // Get all events that have menu_image_filename but no menu_image_s3_url
    const allEvents = await prisma.event.findMany({
      select: {
        event_id: true,
        event_name: true,
        event_date: true,
        menu_image_filename: true,
        menu_image_s3_url: true
      },
      orderBy: {
        event_date: 'asc'
      }
    });

    // Filter to only events that have menu_image_filename but no menu_image_s3_url
    const eventsToUpdate = allEvents.filter(event => 
      event.menu_image_filename && !event.menu_image_s3_url
    );

    console.log(`📋 Found ${eventsToUpdate.length} events needing S3 URL updates`);

    if (eventsToUpdate.length === 0) {
      res.status(200).json({
        success: true,
        message: 'All events already have S3 URLs',
        updated: 0,
        results: []
      });
      return;
    }

    const results: Array<{
      success: boolean;
      eventId: number;
      eventName: string;
      filename: string;
      s3Url?: string;
      error?: string;
    }> = [];

    // Process each event
    for (const event of eventsToUpdate) {
      const { event_id, event_name, menu_image_filename } = event;
      
      console.log(`\n🔄 Processing: ${event_name} (ID: ${event_id})`);
      console.log(`   📁 Filename: ${menu_image_filename}`);

      try {
        // Generate S3 URL
        const s3Url = `${baseUrl}/menus/${menu_image_filename}`;
        console.log(`   🔗 S3 URL: ${s3Url}`);

        // Update database
        await prisma.event.update({
          where: { event_id: event_id },
          data: { 
            menu_image_s3_url: s3Url
          }
        });
        
        console.log(`   ✅ Database updated successfully`);

        results.push({
          success: true,
          eventId: event_id,
          eventName: event_name,
          filename: menu_image_filename,
          s3Url
        });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.log(`   ❌ Update failed: ${errorMessage}`);
        results.push({
          success: false,
          eventId: event_id,
          eventName: event_name,
          filename: menu_image_filename,
          error: errorMessage
        });
      }
    }

    // Calculate summary
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log('\n📊 Update Summary:');
    console.log(`✅ Successful: ${successful.length}`);
    console.log(`❌ Failed: ${failed.length}`);

    // Return results
    res.status(200).json({
      success: true,
      message: `Database update completed. ${successful.length} successful, ${failed.length} failed.`,
      summary: {
        total: results.length,
        successful: successful.length,
        failed: failed.length
      },
      results: results,
      s3Urls: successful.map(r => ({
        eventId: r.eventId,
        eventName: r.eventName,
        filename: r.filename,
        s3Url: r.s3Url
      }))
    });

  } catch (error) {
    console.error('❌ Database update endpoint failed:', error);
    res.status(500).json({
      success: false,
      message: 'Database update endpoint failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
