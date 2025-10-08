import { Router } from 'express';
import {
  getEventBlogPosts,
  createEventBlogPost,
  getBlogPost,
  updateBlogPostText,
  updateBlogPostWithImages,
  deleteBlogPost,
  searchBlogPosts,
  getBlogPostsByTag
} from '../controllers/blogController';
import { uploadMultipleBlogImages, handleUploadError } from '../middleware/s3Upload';
import s3Service from '../services/s3Service';
// import { requireAuth } from '../middleware/auth'; // Temporarily disabled for testing

const router = Router();

// Get all blog posts for an event
router.get('/events/:eventId/blog-posts', getEventBlogPosts);

// Create a new blog post for an event
router.post('/events/:eventId/blog-posts', uploadMultipleBlogImages, handleUploadError, createEventBlogPost);

// Get a single blog post by ID
router.get('/blog-posts/:blogPostId', getBlogPost);

// Update blog post text fields only (no images)
router.put('/blog-posts/:blogPostId/text', updateBlogPostText);

// Update blog post with images (text + images)
router.put('/blog-posts/:blogPostId', uploadMultipleBlogImages, handleUploadError, updateBlogPostWithImages);

// Delete a blog post by ID
router.delete('/blog-posts/:blogPostId', deleteBlogPost);

// Search blog posts
router.get('/blog-posts/search', searchBlogPosts);

// Get blog posts by tag
router.get('/blog-posts/tag/:tag', getBlogPostsByTag);

// Serve blog image file
// GET /api/blog-images/:filename/preview
router.get('/blog-images/:filename/preview', async (req, res) => {
  try {
    const { filename } = req.params;
    
    if (!filename) {
      res.status(400).json({
        success: false,
        message: 'Filename parameter is required'
      });
      return;
    }
    
    // Generate signed URL for S3
    const s3Key = `blogs/${filename}`;
    const signedUrl = await s3Service.getSignedUrl(s3Key, 3600); // 1 hour expiry
    
    // Redirect to S3 signed URL
    res.redirect(signedUrl);
    
  } catch (error) {
    console.error('Error serving blog image preview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to serve blog image'
    });
  }
});

export default router;
