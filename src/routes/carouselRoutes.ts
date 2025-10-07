import { Router } from 'express';
import { getCarouselPhotos, getPhotoMetadata, getCarouselStats } from '../controllers/carouselController';

const router = Router();

// GET /api/carousel/photos - Get all photos for carousel with pagination
router.get('/photos', getCarouselPhotos);

// GET /api/carousel/photos/:id/metadata - Get detailed metadata for a specific photo
router.get('/photos/:id/metadata', getPhotoMetadata);

// GET /api/carousel/stats - Get carousel statistics
router.get('/stats', getCarouselStats);

export default router;
