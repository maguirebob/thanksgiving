import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import fs from 'fs';
import path from 'path';
import { uploadMultiple } from '../middleware/upload';

const router = Router();

// Apply authentication middleware to all admin routes
router.use(requireAuth);

/**
 * Admin dashboard root - redirect to dashboard
 */
router.get('/', async (_req: Request, res: Response) => {
  res.redirect('/admin/dashboard');
});

/**
 * Admin dashboard
 */
router.get('/dashboard', async (_req: Request, res: Response) => {
  try {
    // Get statistics
    const totalUsers = await prisma.user.count();
    const totalEvents = await prisma.event.count();
    const totalPhotos = await prisma.photo.count();

    // Get recent events
    const recentEvents = await prisma.event.findMany({
      orderBy: { event_date: 'desc' },
      take: 50, // Increased limit to show more events
      include: {
        photos: {
          take: 1
        }
      }
    });

    // Transform events for display
    const transformedEvents = recentEvents.map(event => ({
      ...event,
      id: event.event_id,
      photoCount: event.photos.length
    }));

    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      stats: {
        totalUsers,
        totalEvents,
        totalPhotos
      },
      recentEvents: transformedEvents
    });
  } catch (error) {
    console.error('Error loading admin dashboard:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load admin dashboard.',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Fix menu filenames endpoint
 */
router.post('/fix-filenames', async (_req: Request, res: Response) => {
  try {
    console.log('🔧 Running filename fix...');
    
    // Define expected filenames
    const expectedFilenames: Record<number, string> = {
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
      2019: '2019_Menu.jpeg',
      2020: '2020_Menu.jpeg',
      2021: '2021_Menu.jpeg',
      2022: '2022_Menu.jpeg',
      2023: '2023_Menu.jpeg',
      2024: '2024_Menu.jpeg',
      2025: '2025_Menu.jpeg'
    };
    
    // Get all events
    const events = await prisma.event.findMany({
      orderBy: { event_date: 'asc' }
    });
    
    let updatedCount = 0;
    const results: string[] = [];
    
    for (const event of events) {
      const year = event.event_date.getFullYear();
      const expectedFilename = expectedFilenames[year];
      
      if (!expectedFilename) {
        results.push(`⚠️  No expected filename for year ${year}`);
        continue;
      }
      
      if (event.menu_image_filename !== expectedFilename) {
        await prisma.event.update({
          where: { event_id: event.event_id },
          data: { menu_image_filename: expectedFilename }
        });
        
        results.push(`✅ Updated ${event.event_name}: ${event.menu_image_filename} → ${expectedFilename}`);
        updatedCount++;
      } else {
        results.push(`✅ ${event.event_name}: ${event.menu_image_filename} (already correct)`);
      }
    }
    
    console.log(`📊 Fixed ${updatedCount} filenames`);
    
    res.json({
      success: true,
      message: `Fixed ${updatedCount} filenames`,
      updatedCount,
      results
    });
    
  } catch (error) {
    console.error('Error fixing filenames:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fix filenames',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get volume contents
 * GET /admin/volume-contents
 */
router.get('/volume-contents', async (_req: Request, res: Response) => {
  try {
    // Determine the volume path based on environment
    const volumePath = process.env['NODE_ENV'] === 'development' 
      ? path.join(process.cwd(), 'public/images')
      : '/app/public/images';
    
    console.log(`🔍 Checking volume contents at: ${volumePath}`);
    
    // Check if directory exists
    if (!fs.existsSync(volumePath)) {
      return res.json({
        success: false,
        message: `Volume directory does not exist: ${volumePath}`,
        environment: process.env['NODE_ENV'] || 'unknown',
        mountPath: volumePath,
        volumeName: 'images-storage-thanksgiving-test',
        files: [],
        stats: {
          totalFiles: 0,
          totalSize: '0 B',
          imageFiles: 0,
          otherFiles: 0
        }
      });
    }
    
    // Read directory contents
    const files = fs.readdirSync(volumePath);
    const fileStats: any[] = [];
    let totalSize = 0;
    let imageFiles = 0;
    let otherFiles = 0;
    
    files.forEach(filename => {
      const filePath = path.join(volumePath, filename);
      const stats = fs.statSync(filePath);
      
      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(filename);
      if (isImage) imageFiles++;
      else otherFiles++;
      
      totalSize += stats.size;
      
      fileStats.push({
        name: filename,
        size: stats.size,
        type: isImage ? 'image' : 'file',
        modified: stats.mtime,
        path: filePath
      });
    });
    
    // Get linked filenames from database
    const linkedFilenames = await prisma.event.findMany({
      select: { menu_image_filename: true }
    }).then(events => events.map(e => e.menu_image_filename).filter(Boolean));
    
    console.log(`Found ${linkedFilenames.length} linked filenames in database`);
    console.log('Linked filenames:', linkedFilenames);
    
    // Add file status to each file
    fileStats.forEach(file => {
      file.isLinked = linkedFilenames.includes(file.name);
      file.status = file.isLinked ? 'linked' : 'orphaned';
    });
    
    // Sort files by modification date (newest first)
    fileStats.sort((a, b) => b.modified.getTime() - a.modified.getTime());
    
    // Format total size
    const formatFileSize = (bytes: number): string => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    
    // Calculate file status statistics
    const linkedFiles = fileStats.filter(f => f.isLinked).length;
    const orphanedFiles = fileStats.filter(f => !f.isLinked).length;
    
    return res.json({
      success: true,
      environment: process.env['NODE_ENV'] || 'unknown',
      mountPath: volumePath,
      volumeName: 'images-storage-thanksgiving-test',
      files: fileStats,
      stats: {
        totalFiles: files.length,
        totalSize: formatFileSize(totalSize),
        imageFiles,
        otherFiles,
        linkedFiles,
        orphanedFiles
      }
    });
    
  } catch (error) {
    console.error('Error reading volume contents:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to read volume contents',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Sync uploaded images to volume and create event records
 * POST /admin/sync-local-images
 */
router.post('/sync-local-images', uploadMultiple.array('menu_images', 25), async (req: Request, res: Response) => {
  try {
    console.log('🔄 Starting bulk image sync...');
    
    const uploadedFiles = req.files as Express.Multer.File[];
    const results: string[] = [];
    let processedCount = 0;
    let createdCount = 0;
    let skippedCount = 0;
    
    if (!uploadedFiles || uploadedFiles.length === 0) {
      return res.json({
        success: false,
        message: 'No files uploaded for sync',
        results: [`❌ Please upload menu image files to sync`]
      });
    }
    
    // Process each uploaded file
    for (const file of uploadedFiles) {
      if (!file) {
        results.push(`⚠️  Skipped: File is undefined`);
        skippedCount++;
        continue;
      }
      
      const filename = file.originalname;
      const yearMatch = filename.match(/(\d{4})/);
      
      if (!yearMatch) {
        results.push(`⚠️  Skipped ${filename}: Could not extract year from filename`);
        skippedCount++;
        continue;
      }
      
      const year = parseInt(yearMatch[1]!);
      const eventName = `Thanksgiving ${year}`;
      
      // Check if event already exists
      const existingEvent = await prisma.event.findFirst({
        where: { event_name: eventName }
      });
      
      if (existingEvent) {
        // Update existing event with new filename
        await prisma.event.update({
          where: { event_id: existingEvent.event_id },
          data: { menu_image_filename: file.filename }
        });
        results.push(`🔄 Updated ${eventName}: ${filename} → ${file.filename}`);
        processedCount++;
      } else {
        // Create new event record
        await prisma.event.create({
          data: {
            event_name: eventName,
            event_type: 'Thanksgiving',
            event_location: null,
            event_date: new Date(year, 10, 22), // November 22nd of the year
            event_description: null,
            menu_title: eventName,
            menu_image_filename: file.filename
          }
        });
        results.push(`📝 Created ${eventName}: ${filename} → ${file.filename}`);
        createdCount++;
        processedCount++;
      }
    }
    
    const summary = `Processed ${processedCount} files, created ${createdCount} events, skipped ${skippedCount} items`;
    results.push(`\n📊 Summary: ${summary}`);
    
    console.log(`✅ Sync completed: ${summary}`);
    
    return res.json({
      success: true,
      message: summary,
      results,
      stats: {
        processedFiles: processedCount,
        createdEvents: createdCount,
        skippedItems: skippedCount,
        totalUploaded: uploadedFiles.length
      }
    });
    
  } catch (error) {
    console.error('Error syncing local images:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to sync local images',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;