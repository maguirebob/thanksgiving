import { Router } from 'express';
import { updatePhotoType, getPhotosByType } from '../controllers/photoTypeController';

const router = Router();

// Photo Type Management Routes
router.put('/:photoId/type', updatePhotoType);
router.get('/events/:event_id/photos/:photo_type', getPhotosByType);

export default router;
