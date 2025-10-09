import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { UpdatePhotoTypeRequest, PhotoTypeResponse, ErrorResponse } from '../types/journal';

const prisma = new PrismaClient();

export const updatePhotoType = async (req: Request, res: Response): Promise<void> => {
  try {
    const photoId = req.params['photoId'];
    if (!photoId) {
      res.status(400).json({
        success: false,
        message: 'Photo ID is required'
      } as ErrorResponse);
      return;
    }

    const { photo_type }: UpdatePhotoTypeRequest = req.body;

    // Validate required fields
    if (!photo_type) {
      res.status(400).json({
        success: false,
        message: 'Photo type is required'
      } as ErrorResponse);
      return;
    }

    // Validate photo type enum
    if (!['individual', 'page'].includes(photo_type)) {
      res.status(400).json({
        success: false,
        message: 'Photo type must be either "individual" or "page"'
      } as ErrorResponse);
      return;
    }

    // Check if photo exists
    const existingPhoto = await prisma.photo.findUnique({
      where: { photo_id: parseInt(photoId) }
    });

    if (!existingPhoto) {
      res.status(404).json({
        success: false,
        message: 'Photo not found'
      } as ErrorResponse);
      return;
    }

    // Update photo type
    const updatedPhoto = await prisma.photo.update({
      where: { photo_id: parseInt(photoId) },
      data: { photo_type },
      select: {
        photo_id: true,
        filename: true,
        original_filename: true,
        description: true,
        caption: true,
        s3_url: true,
        photo_type: true,
        taken_date: true
      }
    });

    res.status(200).json({
      success: true,
      data: {
        photo: updatedPhoto,
        photo_type: updatedPhoto.photo_type
      }
    } as PhotoTypeResponse);
  } catch (error) {
    console.error('Error updating photo type:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    } as ErrorResponse);
  }
};

export const getPhotosByType = async (req: Request, res: Response): Promise<void> => {
  try {
    const event_id = req.params['event_id'];
    const photo_type = req.params['photo_type'];

    if (!event_id || !photo_type) {
      res.status(400).json({
        success: false,
        message: 'Event ID and photo type are required'
      } as ErrorResponse);
      return;
    }

    // Validate photo type
    if (!['individual', 'page'].includes(photo_type)) {
      res.status(400).json({
        success: false,
        message: 'Photo type must be either "individual" or "page"'
      } as ErrorResponse);
      return;
    }

    const photos = await prisma.photo.findMany({
      where: {
        event_id: parseInt(event_id),
        photo_type: photo_type as 'individual' | 'page'
      },
      select: {
        photo_id: true,
        filename: true,
        original_filename: true,
        description: true,
        caption: true,
        s3_url: true,
        photo_type: true,
        taken_date: true
      },
      orderBy: { taken_date: 'desc' }
    });

    res.status(200).json({
      success: true,
      data: {
        photos,
        photo_type
      }
    });
  } catch (error) {
    console.error('Error fetching photos by type:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    } as ErrorResponse);
  }
};
