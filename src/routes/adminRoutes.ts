import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

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

export default router;