import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// Get the appropriate upload path based on environment
const getUploadPath = (): string => {
  // Development: use local directory
  if (process.env['NODE_ENV'] === 'development') {
    return path.join(process.cwd(), 'public/images');
  }
  
  // Test/Production: use Railway volume
  return '/app/public/images';
};

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb: Function) => {
    const uploadDir = getUploadPath();
    
    // Create directory if it doesn't exist
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (_req: Request, file: Express.Multer.File, cb: Function) => {
    // Generate unique filename with timestamp and original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `menu_${uniqueSuffix}${ext}`);
  }
});

// File filter to only allow image files
const fileFilter = (_req: Request, file: Express.Multer.File, cb: Function) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG and PNG images are allowed'), false);
  }
};

// Configure multer for single file uploads
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Only one file at a time
  }
});

// Configure multer for bulk file uploads
const uploadMultiple = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
    files: 50 // Allow up to 50 files for bulk operations
  }
});

export default upload;
export { uploadMultiple };
