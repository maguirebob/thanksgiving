import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { uploadSingleMenu, handleUploadError } from '../middleware/s3Upload';
import { validateMenuCreation, sanitizeMenuData } from '../middleware/menuValidation';
import s3Service from '../services/s3Service';

const router = Router();

/**
 * Create a new event
 * POST /api/v1/events
 */
router.post('/events', uploadSingleMenu, handleUploadError, sanitizeMenuData, validateMenuCreation, async (req: Request, res: Response) => {
  try {
    console.log('=== MENU UPLOAD DEBUG START ===');
    console.log('Request params:', req.params);
    console.log('Request body:', req.body);
    console.log('Request file:', req.file ? {
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      fieldname: req.file.fieldname,
      location: (req.file as any).location,
      key: (req.file as any).key
    } : 'NO FILE');
    console.log('Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
      AWS_REGION: process.env.AWS_REGION,
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ? 'SET' : 'NOT SET',
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ? 'SET' : 'NOT SET'
    });

    // At this point, validation has passed, so we can safely use the data
    const { event_name, event_date, event_location, event_description } = req.body;
    console.log('Parsed menu data:', { event_name, event_date, event_location, event_description });
    
    // Validate and parse date as local date to avoid timezone issues
    console.log('Parsing date:', event_date);
    const [year, month, day] = event_date.split('-').map(Number);
    const eventDate = new Date(year, month - 1, day); // month is 0-indexed
    if (isNaN(eventDate.getTime())) {
      console.log('ERROR: Invalid date format:', event_date);
      return res.status(400).json({
        success: false,
        message: 'Invalid date format',
        debug: { event_date, parsedDate: eventDate }
      });
    }
    console.log('Date parsed successfully:', eventDate);

    // Check if file was uploaded
    if (!req.file) {
      console.log('ERROR: No file in request');
      console.log('Request body keys:', Object.keys(req.body));
      console.log('Request files:', req.files);
      return res.status(400).json({
        success: false,
        message: 'No menu image file provided',
        debug: { 
          hasFile: !!req.file,
          bodyKeys: Object.keys(req.body),
          files: req.files
        }
      });
    }

    console.log('File validation passed, processing upload...');

    // Extract filename from S3 key or use original name
    const s3Key = (req.file as any).key;
    const filename = s3Key ? s3Key.split('/').pop() : req.file!.originalname;
    console.log('Extracted filename:', filename);

    if (!s3Key) {
      console.log('ERROR: No S3 key found in file object');
      return res.status(500).json({
        success: false,
        message: 'File upload failed - no S3 key',
        debug: { file: req.file }
      });
    }

    if (!(req.file as any).location) {
      console.log('ERROR: No S3 location URL found in file object');
      return res.status(500).json({
        success: false,
        message: 'File upload failed - no S3 URL',
        debug: { file: req.file }
      });
    }

    console.log('Creating database record...');
    // Create the event
    const newEvent = await prisma.event.create({
      data: {
        event_name: event_name,
        event_type: 'Thanksgiving',
        event_location: event_location && event_location.trim() ? event_location.trim() : null,
        event_date: eventDate,
        event_description: event_description && event_description.trim() ? event_description.trim() : null,
        menu_title: event_name,
        menu_image_filename: filename,
        menu_image_s3_url: (req.file as any).location // S3 URL from multer-s3
      }
    });

    console.log('Event created successfully:', newEvent);
    console.log('=== MENU UPLOAD DEBUG END ===');

    // Transform the response to match what the frontend expects
    const transformedEvent = {
      id: newEvent.event_id,
      event_name: newEvent.event_name,
      event_type: newEvent.event_type,
      event_location: newEvent.event_location,
      event_date: newEvent.event_date,
      menu_image_url: newEvent.menu_image_s3_url 
        ? `/api/v1/menu-images/${newEvent.event_id}` 
        : `/images/${newEvent.menu_image_filename}`,
      description: newEvent.event_description,
      year: newEvent.event_date.getFullYear(),
      created_at: newEvent.created_at,
      updated_at: newEvent.updated_at
    };

    return res.status(201).json({
      success: true,
      event: transformedEvent,
      message: 'Menu created successfully'
    });

  } catch (error) {
    console.error('=== MENU UPLOAD ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Request details:', {
      params: req.params,
      body: req.body,
      file: req.file ? {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      } : null
    });
    console.error('Environment at error:', {
      NODE_ENV: process.env.NODE_ENV,
      S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
      AWS_REGION: process.env.AWS_REGION,
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ? 'SET' : 'NOT SET',
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ? 'SET' : 'NOT SET'
    });
    console.error('=== END MENU UPLOAD ERROR ===');
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      debug: {
        errorType: error.constructor.name,
        errorMessage: error.message,
        hasFile: !!req.file,
        eventName: req.body.event_name
      }
    });
  }
});

/**
 * Get all events
 * GET /api/v1/events
 */
router.get('/events', async (_req: Request, res: Response) => {
  try {
    const events = await prisma.event.findMany({
      orderBy: { event_date: 'desc' },
      include: {
        photos: {
          take: 1 // Include one photo per event for thumbnails
        }
      }
    });

    // Transform events to match frontend expectations
    const transformedEvents = events.map(event => ({
      id: event.event_id,
      event_name: event.event_name,
      event_type: event.event_type,
      event_location: event.event_location,
      event_date: event.event_date,
      menu_image_url: event.menu_image_s3_url 
        ? `/api/v1/menu-images/${event.event_id}` 
        : `/images/${event.menu_image_filename}`,
      description: event.event_description,
      year: event.event_date.getFullYear(),
      created_at: event.event_date,
      updated_at: event.event_date,
      photos: event.photos
    }));

    return res.json({
      success: true,
      events: transformedEvents,
      count: transformedEvents.length
    });

  } catch (error) {
    console.error('Error fetching events:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Get a single event by ID
 * GET /api/v1/events/:id
 */
router.get('/events/:id', async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params['id'] || '');
    
    if (isNaN(eventId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID'
      });
    }

    const event = await prisma.event.findUnique({
      where: { event_id: eventId }
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Transform the event data to match what the frontend expects
    const transformedEvent = {
      id: event.event_id,
      event_name: event.event_name,
      event_type: event.event_type,
      event_location: event.event_location,
      event_date: event.event_date,
      menu_image_url: event.menu_image_s3_url 
        ? `/api/v1/menu-images/${event.event_id}` 
        : `/images/${event.menu_image_filename}`,
      description: event.event_description,
      year: event.event_date.getFullYear(),
      created_at: event.event_date,
      updated_at: event.event_date
    };

    return res.json({
      success: true,
      event: transformedEvent
    });

  } catch (error) {
    console.error('Error fetching event:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Update an event by ID
 * PUT /api/v1/events/:id
 */
router.put('/events/:id', async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params['id'] || '');
    
    if (isNaN(eventId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID'
      });
    }

    const updateData = req.body;

    // Validate required fields
    if (!updateData.event_name) {
      return res.status(400).json({
        success: false,
        message: 'Event name is required'
      });
    }

    // Check if event exists
    const existingEvent = await prisma.event.findUnique({
      where: { event_id: eventId }
    });

    if (!existingEvent) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Prepare update data
    const eventUpdateData: any = {
      event_name: updateData.event_name
    };

    // Add optional fields if provided
    if (updateData.event_type) {
      eventUpdateData.event_type = updateData.event_type;
    }
    if (updateData.event_location) {
      eventUpdateData.event_location = updateData.event_location;
    }
    if (updateData.event_date) {
      // Parse date as local date to avoid timezone issues
      const [year, month, day] = updateData.event_date.split('-').map(Number);
      const eventDate = new Date(year, month - 1, day); // month is 0-indexed
      if (isNaN(eventDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format'
        });
      }
      eventUpdateData.event_date = eventDate;
    }
    if (updateData.menu_image_url) {
      // Extract filename from URL if it's a full URL
      const filename = updateData.menu_image_url.includes('/') 
        ? updateData.menu_image_url.split('/').pop() 
        : updateData.menu_image_url;
      eventUpdateData.menu_image_filename = filename;
    }
    if (updateData.description) {
      eventUpdateData.event_description = updateData.description;
    }

    // Update the event
    const updatedEvent = await prisma.event.update({
      where: { event_id: eventId },
      data: eventUpdateData
    });

    // Transform the response to match what the frontend expects
    const transformedEvent = {
      id: updatedEvent.event_id,
      event_name: updatedEvent.event_name,
      event_type: updatedEvent.event_type,
      event_location: updatedEvent.event_location,
      event_date: updatedEvent.event_date,
      menu_image_url: `/images/${updatedEvent.menu_image_filename}`,
      description: updatedEvent.event_description,
      year: updatedEvent.event_date.getFullYear(),
      created_at: updatedEvent.created_at,
      updated_at: updatedEvent.updated_at
    };

    return res.json({
      success: true,
      event: transformedEvent,
      message: 'Event updated successfully'
    });

  } catch (error) {
    console.error('Error updating event:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Delete an event by ID
 * DELETE /api/v1/events/:id
 */
router.delete('/events/:id', async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params['id'] || '');
    
    if (isNaN(eventId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID'
      });
    }

    // Check if event exists
    const existingEvent = await prisma.event.findUnique({
      where: { event_id: eventId }
    });

    if (!existingEvent) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Delete associated photos first (cascade delete should handle this, but being explicit)
    await prisma.photo.deleteMany({
      where: { event_id: eventId }
    });

    // Delete the event
    await prisma.event.delete({
      where: { event_id: eventId }
    });

    return res.json({
      success: true,
      message: 'Event deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting event:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Serve menu image file
 * GET /api/v1/menu-images/:eventId
 */
router.get('/menu-images/:eventId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;
    if (!eventId) {
      res.status(400).json({
        success: false,
        message: 'Event ID is required'
      });
      return;
    }

    const event = await prisma.event.findUnique({
      where: { event_id: parseInt(eventId, 10) },
      select: {
        menu_image_filename: true,
        menu_image_s3_url: true
      }
    });

    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Event not found'
      });
      return;
    }

    // If we have an S3 URL, generate a signed URL
    if (event.menu_image_s3_url) {
      try {
        const s3Key = `menus/${event.menu_image_filename}`;
        const signedUrl = await s3Service.getSignedUrl(s3Key, 3600); // 1 hour expiry
        res.redirect(signedUrl);
        return;
      } catch (s3Error) {
        console.error('Error generating S3 signed URL for menu image:', s3Error);
        res.status(404).json({
          success: false,
          message: 'Menu image not available'
        });
        return;
      }
    }

    // Fallback to local file serving
    res.status(404).json({
      success: false,
      message: 'Menu image not found'
    });
  } catch (error) {
    console.error('Error serving menu image file:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;
