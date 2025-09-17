const path = require('path');
const { Photo, Event } = require('../../models');

// Get photos for a specific event
const getEventPhotos = async (req, res) => {
  try {
    const eventId = req.params.id;
    
    const photos = await Photo.findAll({
      where: { event_id: eventId },
      order: [['taken_date', 'DESC'], ['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: photos,
      count: photos.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching photos:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch photos',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Upload a new photo
const uploadPhoto = async (req, res) => {
  try {
    const eventId = req.params.id;
    const { description, caption } = req.body;
    
    console.log('Photo upload request:', {
      eventId,
      description,
      caption,
      hasFile: !!req.file,
      fileInfo: req.file ? {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      } : null
    });
    
    // Check if event exists
    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
        timestamp: new Date().toISOString()
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No photo file provided',
        timestamp: new Date().toISOString()
      });
    }

    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = 'photo_' + uniqueSuffix + path.extname(req.file.originalname);
    
    // Convert file buffer to base64 for storage
    const base64Data = req.file.buffer.toString('base64');
    const dataUrl = `data:${req.file.mimetype};base64,${base64Data}`;

    // Limit base64 data size to prevent database issues
    const maxDataSize = 1000000; // 1MB limit for base64 data
    let finalDataUrl = dataUrl;
    if (dataUrl.length > maxDataSize) {
      console.log('Base64 data too large, truncating...');
      finalDataUrl = dataUrl.substring(0, maxDataSize);
    }

    const newPhoto = await Photo.create({
      event_id: eventId,
      filename: filename,
      original_filename: req.file.originalname,
      description: description || null,
      caption: caption || null,
      mime_type: req.file.mimetype,
      file_size: req.file.size,
      file_data: finalDataUrl
    });

    res.json({
      success: true,
      data: newPhoto,
      message: 'Photo uploaded successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error adding photo:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add photo',
      message: error.message,
      details: error.toString(),
      timestamp: new Date().toISOString()
    });
  }
};

// Update photo details
const updatePhoto = async (req, res) => {
  try {
    const photoId = req.params.photoId;
    const { description, caption } = req.body;

    const photo = await Photo.findByPk(photoId);
    if (!photo) {
      return res.status(404).json({
        success: false,
        error: 'Photo not found',
        timestamp: new Date().toISOString()
      });
    }

    await photo.update({
      description: description || photo.description,
      caption: caption || photo.caption
    });

    res.json({
      success: true,
      data: photo,
      message: 'Photo updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating photo:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update photo',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Delete photo
const deletePhoto = async (req, res) => {
  try {
    const photoId = req.params.photoId;

    const photo = await Photo.findByPk(photoId);
    if (!photo) {
      return res.status(404).json({
        success: false,
        error: 'Photo not found',
        timestamp: new Date().toISOString()
      });
    }

    await photo.destroy();

    res.json({
      success: true,
      message: 'Photo deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete photo',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  getEventPhotos,
  uploadPhoto,
  updatePhoto,
  deletePhoto
};
