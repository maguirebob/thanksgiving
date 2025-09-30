import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import upload from '../middleware/upload';
import { validateMenuCreation, sanitizeMenuData } from '../middleware/menuValidation';

const router = Router();

/**
 * Create a new event
 * POST /api/v1/events
 */
router.post('/events', upload.single('menu_image'), sanitizeMenuData, validateMenuCreation, async (req: Request, res: Response) => {
  try {
    // At this point, validation has passed, so we can safely use the data
    const { event_name, event_date, event_location, event_description } = req.body;
    
    // Create the event
    const newEvent = await prisma.event.create({
      data: {
        event_name: event_name,
        event_type: 'Thanksgiving',
        event_location: event_location || null,
        event_date: new Date(event_date),
        event_description: event_description || null,
        menu_title: event_name,
        menu_image_filename: req.file!.filename
      }
    });

    // Transform the response to match what the frontend expects
    const transformedEvent = {
      id: newEvent.event_id,
      event_name: newEvent.event_name,
      event_type: newEvent.event_type,
      event_location: newEvent.event_location,
      event_date: newEvent.event_date,
      menu_image_url: `/images/${newEvent.menu_image_filename}`,
      description: newEvent.event_description,
      year: newEvent.event_date.getFullYear(),
      created_at: newEvent.event_date,
      updated_at: newEvent.event_date
    };

    return res.status(201).json({
      success: true,
      event: transformedEvent,
      message: 'Menu created successfully'
    });

  } catch (error) {
    console.error('Error creating event:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
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
      menu_image_url: `/images/${event.menu_image_filename}`,
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
      menu_image_url: `/images/${event.menu_image_filename}`,
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
      eventUpdateData.event_date = new Date(updateData.event_date);
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
      created_at: updatedEvent.event_date,
      updated_at: updatedEvent.event_date
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

export default router;
