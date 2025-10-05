import { Router } from 'express';
import { uploadMenuImagesToS3, updateDatabaseWithS3Urls } from '../controllers/uploadController';

const router = Router();

/**
 * Upload menu images from public/images to S3
 * POST /api/upload/menu-images-to-s3
 */
router.post('/menu-images-to-s3', uploadMenuImagesToS3);

/**
 * Update database with S3 URLs for menu images
 * POST /api/upload/update-database-s3-urls
 */
router.post('/update-database-s3-urls', updateDatabaseWithS3Urls);

export default router;
