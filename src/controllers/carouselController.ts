import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../lib/logger';

const prisma = new PrismaClient();

export interface CarouselPhoto {
  id: number;
  filename: string;
  originalFilename: string | null;
  description: string | null;
  caption: string | null;
  fileSize: number | null;
  mimeType: string | null;
  s3Url: string | null;
  takenDate: Date | null;
  createdAt: Date;
  event: {
    id: number;
    name: string;
    date: Date;
    location: string | null;
  } | null;
  previewUrl: string | null;
}

export interface CarouselMetadata {
  totalPhotos: number;
  photosWithS3: number;
  photosWithoutS3: number;
  averageFileSize: number;
}

export interface CarouselPagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface CarouselResponse {
  success: boolean;
  data: {
    photos: CarouselPhoto[];
    pagination: CarouselPagination;
    metadata: CarouselMetadata;
  };
}

/**
 * Get all photos for carousel with pagination and metadata
 */
export const getCarouselPhotos = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query['page'] as string) || 1;
    const limit = parseInt(req.query['limit'] as string) || 50;
    const offset = (page - 1) * limit;

    logger.info(`Carousel Controller: Fetching photos - page ${page}, limit ${limit}`);

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      res.status(400).json({
        success: false,
        message: 'Invalid pagination parameters. Page must be >= 1, limit must be 1-100.'
      });
      return;
    }

    // Get total count for pagination metadata
    const totalCount = await prisma.photo.count();

    // Get photos with event information
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
            event_date: true,
            event_location: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      },
      skip: offset,
      take: limit
    });

    // Transform photos for carousel
    const transformedPhotos: CarouselPhoto[] = photos.map(photo => ({
      id: photo.photo_id,
      filename: photo.filename,
      originalFilename: photo.original_filename,
      description: photo.description,
      caption: photo.caption,
      fileSize: photo.file_size,
      mimeType: photo.mime_type,
      s3Url: photo.s3_url,
      takenDate: photo.taken_date,
      createdAt: photo.created_at,
      event: photo.event ? {
        id: photo.event.event_id,
        name: photo.event.event_name,
        date: photo.event.event_date,
        location: photo.event.event_location
      } : null,
      previewUrl: photo.s3_url ? `/api/photos/${photo.filename}/preview` : null
    }));

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Calculate metadata
    const photosWithS3 = photos.filter(p => p.s3_url).length;
    const photosWithoutS3 = photos.length - photosWithS3;
    const averageFileSize = photos.length > 0 ? 
      Math.round(photos.reduce((sum, p) => sum + (p.file_size || 0), 0) / photos.length) : 0;

    const response: CarouselResponse = {
      success: true,
      data: {
        photos: transformedPhotos,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage,
          hasPrevPage
        },
        metadata: {
          totalPhotos: totalCount,
          photosWithS3,
          photosWithoutS3,
          averageFileSize
        }
      }
    };

    logger.info(`Carousel Controller: Successfully fetched ${photos.length} photos (${totalCount} total)`);
    res.json(response);

  } catch (error) {
    logger.error('Carousel Controller: Error fetching photos:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch photos for carousel',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get detailed metadata for a specific photo
 */
export const getPhotoMetadata = async (req: Request, res: Response): Promise<void> => {
  try {
    const photoId = parseInt(req.params['id'] || '0');
    
    if (isNaN(photoId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid photo ID'
      });
      return;
    }

    logger.info(`Carousel Controller: Fetching metadata for photo ${photoId}`);

    const photo = await prisma.photo.findUnique({
      where: { photo_id: photoId },
      include: {
        event: {
          select: {
            event_id: true,
            event_name: true,
            event_date: true,
            event_location: true,
            event_description: true
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

    // Get related photos from the same event
    const relatedPhotos = await prisma.photo.findMany({
      where: { 
        event_id: photo.event_id,
        photo_id: { not: photoId }
      },
      select: {
        photo_id: true,
        filename: true,
        caption: true,
        s3_url: true
      },
      take: 5,
      orderBy: { created_at: 'desc' }
    });

    // Get photo statistics
    const totalPhotosInEvent = await prisma.photo.count({
      where: { event_id: photo.event_id }
    });

    const response = {
      success: true,
      data: {
        photo: {
          id: photo.photo_id,
          filename: photo.filename,
          originalFilename: photo.original_filename,
          description: photo.description,
          caption: photo.caption,
          fileSize: photo.file_size,
          mimeType: photo.mime_type,
          s3Url: photo.s3_url,
          takenDate: photo.taken_date,
          createdAt: photo.created_at
        },
        event: photo.event ? {
          id: photo.event.event_id,
          name: photo.event.event_name,
          date: photo.event.event_date,
          location: photo.event.event_location,
          description: photo.event.event_description
        } : null,
        relatedPhotos: relatedPhotos.map(p => ({
          id: p.photo_id,
          filename: p.filename,
          caption: p.caption,
          s3Url: p.s3_url,
          previewUrl: p.s3_url ? `/api/photos/${p.filename}/preview` : null
        })),
        statistics: {
          totalPhotosInEvent,
          relatedPhotosCount: relatedPhotos.length,
          hasS3Url: !!photo.s3_url,
          fileSizeFormatted: photo.file_size ? 
            `${(photo.file_size / 1024 / 1024).toFixed(2)} MB` : 'Unknown'
        }
      }
    };

    logger.info(`Carousel Controller: Successfully fetched metadata for photo ${photoId}`);
    res.json(response);

  } catch (error) {
    logger.error(`Carousel Controller: Error fetching metadata for photo ${req.params['id']}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch photo metadata',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get carousel statistics
 */
export const getCarouselStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    logger.info('Carousel Controller: Fetching carousel statistics');

    const [
      totalPhotos,
      photosWithS3,
      totalEvents,
      recentPhotos
    ] = await Promise.all([
      prisma.photo.count(),
      prisma.photo.count({ where: { s3_url: { not: null } } }),
      prisma.event.count(),
      prisma.photo.findMany({
        take: 10,
        orderBy: { created_at: 'desc' },
        select: {
          photo_id: true,
          filename: true,
          caption: true,
          created_at: true,
          event: {
            select: {
              event_name: true,
              event_date: true
            }
          }
        }
      })
    ]);

    const photosWithoutS3 = totalPhotos - photosWithS3;
    const s3CoveragePercentage = totalPhotos > 0 ? 
      Math.round((photosWithS3 / totalPhotos) * 100) : 0;

    const response = {
      success: true,
      data: {
        totalPhotos,
        photosWithS3,
        photosWithoutS3,
        s3CoveragePercentage,
        totalEvents,
        recentPhotos: recentPhotos.map(p => ({
          id: p.photo_id,
          filename: p.filename,
          caption: p.caption,
          createdAt: p.created_at,
          eventName: p.event?.event_name,
          eventDate: p.event?.event_date
        }))
      }
    };

    logger.info(`Carousel Controller: Successfully fetched statistics - ${totalPhotos} photos, ${s3CoveragePercentage}% S3 coverage`);
    res.json(response);

  } catch (error) {
    logger.error('Carousel Controller: Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch carousel statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
