import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import s3Service from '../services/s3Service';
import { uploadSinglePhoto, handleUploadError } from '../middleware/s3Upload';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

// Export S3 upload middleware
export { uploadSinglePhoto, handleUploadError };

/**
 * Get all photos for a specific event
 * GET /api/events/:eventId/photos
 */
export const getEventPhotos = async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;
    if (!eventId) {
      res.status(400).json({
        success: false,
        message: 'Event ID is required'
      });
      return;
    }
    const { page = '1', limit = '20', search } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    // Validate event exists
    const event = await prisma.event.findUnique({
      where: { event_id: parseInt(eventId, 10) }
    });

    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Event not found'
      });
      return;
    }

    // Build search conditions
    const whereConditions: any = {
      event_id: parseInt(eventId, 10)
    };

    if (search) {
      whereConditions.OR = [
        { description: { contains: search as string, mode: 'insensitive' as any } },
        { caption: { contains: search as string, mode: 'insensitive' as any } },
        { original_filename: { contains: search as string, mode: 'insensitive' as any } }
      ];
    }

    // Get photos with pagination
    const [photos, totalCount] = await Promise.all([
      prisma.photo.findMany({
        where: whereConditions,
        orderBy: { taken_date: 'desc' },
        skip: offset,
        take: limitNum,
        select: {
          photo_id: true,
          filename: true,
          original_filename: true,
          description: true,
          caption: true,
          taken_date: true,
          file_size: true,
          mime_type: true,
          s3_url: true,
          created_at: true,
          updated_at: true
        }
      }),
      prisma.photo.count({ where: whereConditions })
    ]);

    res.json({
      success: true,
      data: {
        photos,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          pages: Math.ceil(totalCount / limitNum)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching event photos:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Upload a new photo for an event
 * POST /api/events/:eventId/photos
 */
export const uploadEventPhoto = async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;
    if (!eventId) {
      res.status(400).json({
        success: false,
        message: 'Event ID is required'
      });
      return;
    }
    const { description, caption } = req.body;

    console.log('Photo upload request:', { eventId, hasFile: !!req.file, description, caption });

    // Validate event exists
    const event = await prisma.event.findUnique({
      where: { event_id: parseInt(eventId, 10) }
    });

    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Event not found'
      });
      return;
    }

    // Check if file was uploaded
    if (!req.file) {
      console.log('No file in request:', req.body);
      res.status(400).json({
        success: false,
        message: 'No photo file provided'
      });
      return;
    }

    console.log('File details:', {
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      location: (req.file as any).location, // S3 URL from multer-s3
      key: (req.file as any).key // S3 key from multer-s3
    });

    // Extract filename from S3 key or use original name
    const s3Key = (req.file as any).key;
    const filename = s3Key ? s3Key.split('/').pop() : req.file.originalname;

    // Create photo record with S3 URL
    const photo = await prisma.photo.create({
      data: {
        event_id: parseInt(eventId, 10),
        filename: filename,
        original_filename: req.file.originalname,
        description: description || null,
        caption: caption || null,
        file_size: req.file.size,
        mime_type: req.file.mimetype,
        s3_url: (req.file as any).location, // S3 URL from multer-s3
        file_data: null // We're storing files in S3, not in database
      },
      select: {
        photo_id: true,
        filename: true,
        original_filename: true,
        description: true,
        caption: true,
        taken_date: true,
        file_size: true,
        mime_type: true,
        s3_url: true,
        created_at: true
      }
    });

    res.status(201).json({
      success: true,
      data: { photo },
      message: 'Photo uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get a specific photo by ID
 * GET /api/photos/:photoId
 */
export const getPhoto = async (req: Request, res: Response): Promise<void> => {
  try {
    const { photoId } = req.params;
    if (!photoId) {
      res.status(400).json({
        success: false,
        message: 'Photo ID is required'
      });
      return;
    }

    const photo = await prisma.photo.findUnique({
      where: { photo_id: parseInt(photoId, 10) },
      select: {
        photo_id: true,
        event_id: true,
        filename: true,
        original_filename: true,
        description: true,
        caption: true,
        taken_date: true,
        file_size: true,
        mime_type: true,
        created_at: true,
        updated_at: true,
        event: {
          select: {
            event_name: true,
            event_date: true
          }
        }
      }
    });

    if (!photo) {
      res.status(404).json({
        success: false,
        message: 'Photo not found'
      });
      return;
    }

    res.json({
      success: true,
      data: { photo }
    });
  } catch (error) {
    console.error('Error fetching photo:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update a photo
 * PUT /api/photos/:photoId
 */
export const updatePhoto = async (req: Request, res: Response): Promise<void> => {
  try {
    const { photoId } = req.params;
    if (!photoId) {
      res.status(400).json({
        success: false,
        message: 'Photo ID is required'
      });
      return;
    }
    const { description, caption, taken_date } = req.body;

    // Check if photo exists
    const existingPhoto = await prisma.photo.findUnique({
      where: { photo_id: parseInt(photoId, 10) }
    });

    if (!existingPhoto) {
      res.status(404).json({
        success: false,
        message: 'Photo not found'
      });
      return;
    }

    // Update photo
    const updatedPhoto = await prisma.photo.update({
      where: { photo_id: parseInt(photoId, 10) },
      data: {
        description: description !== undefined ? description : existingPhoto.description,
        caption: caption !== undefined ? caption : existingPhoto.caption,
        taken_date: taken_date !== undefined ? new Date(taken_date) : existingPhoto.taken_date
      },
      select: {
        photo_id: true,
        filename: true,
        original_filename: true,
        description: true,
        caption: true,
        taken_date: true,
        file_size: true,
        mime_type: true,
        created_at: true,
        updated_at: true
      }
    });

    res.json({
      success: true,
      data: { photo: updatedPhoto },
      message: 'Photo updated successfully'
    });
  } catch (error) {
    console.error('Error updating photo:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Delete a photo
 * DELETE /api/photos/:photoId
 */
export const deletePhoto = async (req: Request, res: Response): Promise<void> => {
  try {
    const { photoId } = req.params;
    if (!photoId) {
      res.status(400).json({
        success: false,
        message: 'Photo ID is required'
      });
      return;
    }

    // Check if photo exists
    const existingPhoto = await prisma.photo.findUnique({
      where: { photo_id: parseInt(photoId, 10) }
    });

    if (!existingPhoto) {
      res.status(404).json({
        success: false,
        message: 'Photo not found'
      });
      return;
    }

    // Delete photo file from disk
    const filePath = path.join('public/uploads/photos', existingPhoto.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete photo record from database
    await prisma.photo.delete({
      where: { photo_id: parseInt(photoId, 10) }
    });

    res.json({
      success: true,
      message: 'Photo deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Search photos across all events
 * GET /api/photos/search
 */
export const searchPhotos = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q, page = '1', limit = '20' } = req.query;

    if (!q || (q as string).trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
      return;
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    const searchTerm = (q as string).trim();

    // Build search conditions
    const whereConditions: any = {
      OR: [
        { description: { contains: searchTerm, mode: 'insensitive' as any } },
        { caption: { contains: searchTerm, mode: 'insensitive' as any } },
        { original_filename: { contains: searchTerm, mode: 'insensitive' as any } },
        { event: { event_name: { contains: searchTerm, mode: 'insensitive' as any } } }
      ]
    };

    // Get photos with pagination
    const [photos, totalCount] = await Promise.all([
      prisma.photo.findMany({
        where: whereConditions,
        orderBy: { taken_date: 'desc' },
        skip: offset,
        take: limitNum,
        select: {
          photo_id: true,
          filename: true,
          original_filename: true,
          description: true,
          caption: true,
          taken_date: true,
          file_size: true,
          mime_type: true,
          created_at: true,
          event: {
            select: {
              event_id: true,
              event_name: true,
              event_date: true
            }
          }
        }
      }),
      prisma.photo.count({ where: whereConditions })
    ]);

    res.json({
      success: true,
      data: {
        photos,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          pages: Math.ceil(totalCount / limitNum)
        },
        searchTerm
      }
    });
  } catch (error) {
    console.error('Error searching photos:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Serve photo file
 * GET /api/photos/:photoId/file
 */
export const servePhotoFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { photoId } = req.params;
    if (!photoId) {
      res.status(400).json({
        success: false,
        message: 'Photo ID is required'
      });
      return;
    }

    const photo = await prisma.photo.findUnique({
      where: { photo_id: parseInt(photoId, 10) },
      select: {
        filename: true,
        mime_type: true,
        original_filename: true,
        s3_url: true
      }
    });

    if (!photo) {
      res.status(404).json({
        success: false,
        message: 'Photo not found'
      });
      return;
    }

    // Always generate signed URL for S3 access (more secure)
    try {
      const s3Key = `photos/${photo.filename}`;
      const signedUrl = await s3Service.getSignedUrl(s3Key, 3600); // 1 hour expiry
      res.redirect(signedUrl);
    } catch (s3Error) {
      console.error('Error generating S3 signed URL:', s3Error);
      res.status(404).json({
        success: false,
        message: 'Photo file not available'
      });
    }
  } catch (error) {
    console.error('Error serving photo file:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
