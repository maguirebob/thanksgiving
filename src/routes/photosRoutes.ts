import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

const router = Router();
const prisma = new PrismaClient();

/**
 * Photos page
 * GET /photos
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    // Determine the photos path based on environment
    const photosPath = process.env['NODE_ENV'] === 'development' 
      ? path.join(process.cwd(), 'public/uploads/photos')
      : '/app/uploads/photos';
    
    // Check if directory exists
    const directoryExists = fs.existsSync(photosPath);
    
    let files: any[] = [];
    let stats = {
      totalFiles: 0,
      totalSize: '0 B',
      imageFiles: 0,
      otherFiles: 0,
      linkedFiles: 0,
      orphanedFiles: 0
    };
    
    if (directoryExists) {
      // Read directory contents
      const fileList = fs.readdirSync(photosPath);
      let totalSize = 0;
      let imageFiles = 0;
      let otherFiles = 0;
      
      files = fileList.map(filename => {
        const filePath = path.join(photosPath, filename);
        const fileStats = fs.statSync(filePath);
        
        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(filename);
        if (isImage) imageFiles++;
        else otherFiles++;
        
        totalSize += fileStats.size;
        
        return {
          name: filename,
          size: fileStats.size,
          type: isImage ? 'image' : 'file',
          modified: fileStats.mtime,
          path: filePath
        };
      });
      
      // Get linked filenames from database
      const linkedFilenames = await prisma.photo.findMany({
        select: { filename: true }
      }).then(photos => photos.map(p => p.filename).filter(Boolean));
      
      // Add file status to each file
      files.forEach(file => {
        file.isLinked = linkedFilenames.includes(file.name);
        file.status = file.isLinked ? 'linked' : 'orphaned';
      });
      
      // Sort files by modification date (newest first)
      files.sort((a, b) => b.modified.getTime() - a.modified.getTime());
      
      // Format total size
      const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
      };
      
      // Calculate file status statistics
      const linkedFiles = files.filter(f => f.isLinked).length;
      const orphanedFiles = files.filter(f => !f.isLinked).length;
      
      stats = {
        totalFiles: files.length,
        totalSize: formatFileSize(totalSize),
        imageFiles,
        otherFiles,
        linkedFiles,
        orphanedFiles
      };
    }
    
    res.render('photos', {
      title: 'Photos Volume',
      environment: process.env['NODE_ENV'] || 'unknown',
      mountPath: photosPath,
      volumeName: 'images-storage-thanksgiving-test',
      files,
      stats,
      directoryExists
    });
    
  } catch (error) {
    console.error('Error loading photos page:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load photos page',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Serve photo preview
 * GET /api/photos/:filename/preview
 */
router.get('/api/photos/:filename/preview', async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    
    // Determine the photos path based on environment
    const photosPath = process.env['NODE_ENV'] === 'development' 
      ? path.join(process.cwd(), 'public/uploads/photos')
      : '/app/uploads/photos';
    
    const filePath = path.join(photosPath, filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Photo not found'
      });
    }
    
    // Set appropriate headers
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('Error serving photo preview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to serve photo'
    });
  }
});

export default router;
