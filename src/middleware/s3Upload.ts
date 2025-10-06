import multer from 'multer';
import multerS3 from 'multer-s3';
import { S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import path from 'path';

// Create S3 client
const s3Client = new S3Client({
  region: process.env['AWS_REGION'] || 'us-east-1',
  credentials: {
    accessKeyId: process.env['AWS_ACCESS_KEY_ID']!,
    secretAccessKey: process.env['AWS_SECRET_ACCESS_KEY']!
  }
});

const bucketName = process.env['S3_BUCKET_NAME'] || 'thanksgiving-images-dev';

/**
 * S3 Storage configuration for multer
 * Handles file uploads directly to S3
 */
const s3Storage = multerS3({
  s3: s3Client,
  bucket: bucketName,
  key: (_req: any, file: Express.Multer.File, cb: Function) => {
    // Generate unique filename with UUID
    const uniqueName = `${randomUUID()}${path.extname(file.originalname)}`;
    
    // Determine upload path based on file type
    let uploadPath = 'uploads';
    if (file.fieldname === 'menu_image') {
      uploadPath = 'menus';
    } else if (file.fieldname === 'photo') {
      uploadPath = 'photos';
    } else if (file.fieldname === 'recipe_image') {
      uploadPath = 'recipes';
    }
    
    const s3Key = `${uploadPath}/${uniqueName}`;
    console.log(`Uploading file to S3: ${s3Key}`);
    cb(null, s3Key);
  },
  contentType: multerS3.AUTO_CONTENT_TYPE,
  metadata: (_req: any, file: Express.Multer.File, cb: Function) => {
    cb(null, {
      originalName: file.originalname,
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'anonymous', // Will be updated when user context is available
      fieldName: file.fieldname
    });
  }
});

/**
 * File filter for image uploads
 * Only allows image files
 */
const imageFileFilter = (_req: any, file: Express.Multer.File, cb: Function) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (JPEG, JPG, PNG, GIF, WEBP)'));
  }
};

/**
 * Multer configuration for S3 uploads
 */
const s3Upload = multer({
  storage: s3Storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: imageFileFilter
});

/**
 * Middleware for single photo upload
 */
export const uploadSinglePhoto = s3Upload.single('photo');

/**
 * Middleware for single menu image upload
 */
export const uploadSingleMenu = s3Upload.single('menu_image');

/**
 * Middleware for single recipe image upload
 */
export const uploadSingleRecipe = s3Upload.single('recipe_image');

/**
 * Middleware for multiple file uploads
 */
export const uploadMultiple = s3Upload.array('files', 10);

/**
 * Middleware for mixed file uploads (photos and other files)
 */
export const uploadMixed = s3Upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'menu_image', maxCount: 1 },
  { name: 'recipe_image', maxCount: 1 }
]);

/**
 * Error handling middleware for multer errors
 */
export const handleUploadError = (error: any, req: any, res: any, _next: any) => {
  console.error('=== S3 UPLOAD ERROR ===');
  console.error('Error type:', error.constructor.name);
  console.error('Error message:', error.message);
  console.error('Error code:', error.code);
  console.error('Error stack:', error.stack);
  console.error('Request details:', {
    params: req.params,
    body: req.body,
    file: req.file ? {
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      fieldname: req.file.fieldname
    } : null
  });
  console.error('S3 Environment:', {
    S3_BUCKET_NAME: process.env["S3_BUCKET_NAME"],
    AWS_REGION: process.env["AWS_REGION"],
    AWS_ACCESS_KEY_ID: process.env["AWS_ACCESS_KEY_ID"] ? 'SET' : 'NOT SET',
    AWS_SECRET_ACCESS_KEY: process.env["AWS_SECRET_ACCESS_KEY"] ? 'SET' : 'NOT SET'
  });
  console.error('=== END S3 UPLOAD ERROR ===');

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB.',
        debug: { errorCode: error.code, errorMessage: error.message }
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum is 10 files.',
        debug: { errorCode: error.code, errorMessage: error.message }
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field.',
        debug: { errorCode: error.code, errorMessage: error.message }
      });
    }
  }
  
  if (error.message === 'Only image files are allowed (JPEG, JPG, PNG, GIF, WEBP)') {
    return res.status(400).json({
      success: false,
      message: 'Only image files are allowed (JPEG, JPG, PNG, GIF, WEBP)',
      debug: { errorMessage: error.message }
    });
  }
  
  // AWS S3 specific errors
  if (error.name === 'NoSuchBucket') {
    return res.status(500).json({
      success: false,
      message: 'S3 bucket not found',
      debug: { errorName: error.name, errorMessage: error.message }
    });
  }
  
  if (error.name === 'AccessDenied') {
    return res.status(500).json({
      success: false,
      message: 'S3 access denied',
      debug: { errorName: error.name, errorMessage: error.message }
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'File upload failed',
    debug: {
      errorType: error.constructor.name,
      errorMessage: error.message,
      errorCode: error.code,
      errorName: error.name
    }
  });
};

export default s3Upload;
