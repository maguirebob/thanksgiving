import { Router } from 'express';
import {
  getEventPhotos,
  uploadEventPhoto,
  getPhoto,
  updatePhoto,
  deletePhoto,
  searchPhotos,
  servePhotoFile,
  uploadSingle
} from '../controllers/photoController';
import { validatePhotoUpload } from '../middleware/validation';

const router = Router();

// Get all photos for a specific event
router.get('/events/:eventId/photos', getEventPhotos);

// Upload a new photo for an event
router.post('/events/:eventId/photos', uploadSingle, validatePhotoUpload, uploadEventPhoto);

// Get a specific photo by ID
router.get('/photos/:photoId', getPhoto);

// Update a photo
router.put('/photos/:photoId', validatePhotoUpload, updatePhoto);

// Delete a photo
router.delete('/photos/:photoId', deletePhoto);

// Search photos across all events
router.get('/photos/search', searchPhotos);

// Serve photo file
router.get('/photos/:photoId/file', servePhotoFile);

export default router;
