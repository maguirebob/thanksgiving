import { Router } from 'express';
import {
  getEventBlogPosts,
  createEventBlogPost,
  getBlogPost,
  updateBlogPost,
  deleteBlogPost,
  searchBlogPosts,
  getBlogPostsByTag
} from '../controllers/blogController';
// import { requireAuth } from '../middleware/auth'; // Temporarily disabled for testing

const router = Router();

// Get all blog posts for an event
router.get('/events/:eventId/blog-posts', getEventBlogPosts);

// Create a new blog post for an event
router.post('/events/:eventId/blog-posts', createEventBlogPost);

// Get a single blog post by ID
router.get('/blog-posts/:blogPostId', getBlogPost);

// Update a blog post by ID
router.put('/blog-posts/:blogPostId', updateBlogPost);

// Delete a blog post by ID
router.delete('/blog-posts/:blogPostId', deleteBlogPost);

// Search blog posts
router.get('/blog-posts/search', searchBlogPosts);

// Get blog posts by tag
router.get('/blog-posts/tag/:tag', getBlogPostsByTag);

export default router;
