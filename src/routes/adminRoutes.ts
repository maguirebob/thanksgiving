import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import fs from 'fs';
import path from 'path';

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
      take: 10,
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
        otherFiles
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
 * Sync local images to volume and create event records
 * POST /admin/sync-local-images
 */
router.post('/sync-local-images', async (_req: Request, res: Response) => {
  try {
    console.log('🔄 Starting local images sync...');
    
    // Define the menu years and their details (same as load-all-menus.ts)
    const menuYears = [
      { year: 1994, filename: '1994_Menu.png', eventName: 'Thanksgiving 1994' },
      { year: 1997, filename: '1997_Menu.jpeg', eventName: 'Thanksgiving 1997' },
      { year: 1999, filename: '1999_Menu.jpeg', eventName: 'Thanksgiving 1999' },
      { year: 2000, filename: '2000_Menu.jpeg', eventName: 'Thanksgiving 2000' },
      { year: 2002, filename: '2002_Menu.jpeg', eventName: 'Thanksgiving 2002' },
      { year: 2004, filename: '2004_Menu.jpeg', eventName: 'Thanksgiving 2004' },
      { year: 2005, filename: '2005_Menu.jpeg', eventName: 'Thanksgiving 2005' },
      { year: 2006, filename: '2006_Menu.jpeg', eventName: 'Thanksgiving 2006' },
      { year: 2007, filename: '2007_Menu.jpeg', eventName: 'Thanksgiving 2007' },
      { year: 2008, filename: '2008_Menu.jpeg', eventName: 'Thanksgiving 2008' },
      { year: 2009, filename: '2009_Menu.jpeg', eventName: 'Thanksgiving 2009' },
      { year: 2010, filename: '2010_Menu.jpeg', eventName: 'Thanksgiving 2010' },
      { year: 2011, filename: '2011_Menu.jpeg', eventName: 'Thanksgiving 2011' },
      { year: 2012, filename: '2012_Menu.jpeg', eventName: 'Thanksgiving 2012' },
      { year: 2013, filename: '2013_Menu.jpeg', eventName: 'Thanksgiving 2013' },
      { year: 2014, filename: '2014_Menu.jpeg', eventName: 'Thanksgiving 2014' },
      { year: 2015, filename: '2015_Menu.jpeg', eventName: 'Thanksgiving 2015' },
      { year: 2016, filename: '2016_Menu.jpeg', eventName: 'Thanksgiving 2016' },
      { year: 2017, filename: '2017_Menu.jpeg', eventName: 'Thanksgiving 2017' },
      { year: 2018, filename: '2018_Menu.jpeg', eventName: 'Thanksgiving 2018' },
      { year: 2019, filename: '2019_Menu.jpeg', eventName: 'Thanksgiving 2019' },
      { year: 2020, filename: '2020_Menu.jpeg', eventName: 'Thanksgiving 2020' },
      { year: 2021, filename: '2021_Menu.jpeg', eventName: 'Thanksgiving 2021' },
      { year: 2022, filename: '2022_Menu.jpeg', eventName: 'Thanksgiving 2022' },
      { year: 2023, filename: '2023_Menu.jpeg', eventName: 'Thanksgiving 2023' },
      { year: 2024, filename: '2024_Menu.jpeg', eventName: 'Thanksgiving 2024' }
    ];
    
    // Determine paths based on environment
    const localImagesPath = path.join(process.cwd(), 'public/images');
    const volumePath = process.env['NODE_ENV'] === 'development' 
      ? localImagesPath
      : '/app/public/images';
    
    console.log(`📁 Local images path: ${localImagesPath}`);
    console.log(`📁 Volume path: ${volumePath}`);
    
    const results: string[] = [];
    let copiedCount = 0;
    let createdCount = 0;
    let skippedCount = 0;
    
    // Check if local images directory exists
    if (!fs.existsSync(localImagesPath)) {
      return res.json({
        success: false,
        message: `Local images directory does not exist: ${localImagesPath}`,
        results: [`❌ Local directory not found: ${localImagesPath}`]
      });
    }
    
    // Ensure volume directory exists
    if (!fs.existsSync(volumePath)) {
      fs.mkdirSync(volumePath, { recursive: true });
      results.push(`📁 Created volume directory: ${volumePath}`);
    }
    
    // Process each menu year
    for (const menu of menuYears) {
      const localFilePath = path.join(localImagesPath, menu.filename);
      const volumeFilePath = path.join(volumePath, menu.filename);
      
      // Check if local file exists
      if (!fs.existsSync(localFilePath)) {
        results.push(`⚠️  Local file not found: ${menu.filename}`);
        skippedCount++;
        continue;
      }
      
      // Copy file to volume if not already there
      if (!fs.existsSync(volumeFilePath)) {
        try {
          fs.copyFileSync(localFilePath, volumeFilePath);
          results.push(`📤 Copied: ${menu.filename}`);
          copiedCount++;
        } catch (error) {
          results.push(`❌ Failed to copy ${menu.filename}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          continue;
        }
      } else {
        results.push(`✅ Already exists: ${menu.filename}`);
        skippedCount++;
      }
      
      // Check if event record exists in database
      const existingEvent = await prisma.event.findFirst({
        where: { event_name: menu.eventName }
      });
      
      if (!existingEvent) {
        try {
          // Create event record
          await prisma.event.create({
            data: {
              event_name: menu.eventName,
              event_type: 'Thanksgiving',
              event_location: null,
              event_date: new Date(menu.year, 10, 22), // November 22nd of the year
              event_description: null,
              menu_title: menu.eventName,
              menu_image_filename: menu.filename
            }
          });
          results.push(`📝 Created event record: ${menu.eventName}`);
          createdCount++;
        } catch (error) {
          results.push(`❌ Failed to create event ${menu.eventName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      } else {
        // Update existing event with correct filename if needed
        if (existingEvent.menu_image_filename !== menu.filename) {
          await prisma.event.update({
            where: { event_id: existingEvent.event_id },
            data: { menu_image_filename: menu.filename }
          });
          results.push(`🔄 Updated filename: ${menu.eventName} → ${menu.filename}`);
        } else {
          results.push(`✅ Event record exists: ${menu.eventName}`);
        }
      }
    }
    
    const summary = `Synced ${copiedCount} files, created ${createdCount} events, skipped ${skippedCount} items`;
    results.push(`\n📊 Summary: ${summary}`);
    
    console.log(`✅ Sync completed: ${summary}`);
    
    return res.json({
      success: true,
      message: summary,
      results,
      stats: {
        copiedFiles: copiedCount,
        createdEvents: createdCount,
        skippedItems: skippedCount,
        totalProcessed: menuYears.length
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