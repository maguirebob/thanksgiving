import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import s3Service from '../services/s3Service';

const router = Router();
const prisma = new PrismaClient();

/**
 * Photos page
 * GET /photos
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    // Get all photos from database with event information
    const photos = await prisma.photo.findMany({
      select: {
        photo_id: true,
        filename: true,
        original_filename: true,
        description: true,
        caption: true,
        file_size: true,
        mime_type: true,
        s3_url: true,
        taken_date: true,
        created_at: true,
        event: {
          select: {
            event_id: true,
            event_name: true,
            event_date: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    // Format file size helper
    const formatFileSize = (bytes: number): string => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Calculate statistics
    const totalSize = photos.reduce((sum, photo) => sum + (photo.file_size || 0), 0);
    const imageFiles = photos.length;
    const otherFiles = 0; // All photos are images
    
    const stats = {
      totalFiles: photos.length,
      totalSize: formatFileSize(totalSize),
      imageFiles,
      otherFiles,
      linkedFiles: photos.length, // All photos in DB are "linked"
      orphanedFiles: 0 // No orphaned files with S3 approach
    };

    // Transform photos for template
    const files = photos.map(photo => ({
      name: photo.filename,
      originalName: photo.original_filename,
      size: photo.file_size || 0,
      type: 'image',
      modified: photo.created_at,
      description: photo.description,
      caption: photo.caption,
      eventName: photo.event?.event_name,
      eventDate: photo.event?.event_date,
      s3Url: photo.s3_url,
      previewUrl: `/api/photos/${photo.filename}/preview`,
      isLinked: true,
      status: 'linked'
    }));
    
    res.render('photos', {
      title: 'Photos',
      environment: process.env['NODE_ENV'] || 'unknown',
      mountPath: 'S3 Storage',
      volumeName: process.env['S3_BUCKET_NAME'] || 'S3 Bucket',
      files,
      stats,
      directoryExists: true, // Always true with S3
      useS3: true // Flag for template to know we're using S3
    });
    
  } catch (error) {
    console.error('Error loading photos page:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load photos page',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Serve photo preview
 * GET /api/photos/:filename/preview
 */
router.get('/api/photos/:filename/preview', async (req: Request, res: Response): Promise<void> => {
  try {
    const { filename } = req.params;
    
    if (!filename) {
      res.status(400).json({
        success: false,
        message: 'Filename parameter is required'
      });
      return;
    }
    
    // Generate signed URL for S3
    const s3Key = `photos/${filename}`;
    const signedUrl = await s3Service.getSignedUrl(s3Key, 3600); // 1 hour expiry
    
    // Redirect to S3 signed URL
    res.redirect(signedUrl);
    
  } catch (error) {
    console.error('Error serving photo preview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to serve photo'
    });
  }
});

export default router;
