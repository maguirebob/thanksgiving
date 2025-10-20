import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import s3Service from '../services/s3Service';

// Create prisma instance - can be mocked in tests
const prisma = new PrismaClient();

/**
 * Get all blog posts for a specific event
 * GET /api/events/:eventId/blog-posts
 */
export const getEventBlogPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;
    if (!eventId) {
      res.status(400).json({
        success: false,
        message: 'Event ID is required'
      });
      return;
    }

    const { page = '1', limit = '20', status, search } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    // Validate event exists
    const event = await prisma.event.findUnique({
      where: { event_id: parseInt(eventId, 10) }
    });

    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Event not found'
      });
      return;
    }

    // Build search conditions
    const whereConditions: any = {
      event_id: parseInt(eventId, 10)
    };

    if (status) {
      whereConditions.status = status as string;
    }

    if (search) {
      whereConditions.OR = [
        { title: { contains: search as string, mode: 'insensitive' as any } },
        { content: { contains: search as string, mode: 'insensitive' as any } },
        { excerpt: { contains: search as string, mode: 'insensitive' as any } },
        { tags: { has: search as string } }
      ];
    }

    // Get blog posts with pagination
    const [blogPosts, totalCount] = await Promise.all([
      prisma.blogPost.findMany({
        where: whereConditions,
        orderBy: { created_at: 'desc' },
        skip: offset,
        take: limitNum,
        select: {
          blog_post_id: true,
          title: true,
          content: true,
          excerpt: true,
          featured_image: true,
          images: true,
          tags: true,
          status: true,
          published_at: true,
          created_at: true,
          updated_at: true,
          user_id: true,
          user: {
            select: {
              username: true,
              first_name: true,
              last_name: true
            }
          }
        }
      }),
      prisma.blogPost.count({ where: whereConditions })
    ]);

    res.status(200).json({
      success: true,
      data: {
        blogPosts,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          pages: Math.ceil(totalCount / limitNum)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching event blog posts:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Create a new blog post for a specific event
 * POST /api/events/:eventId/blog-posts
 */
export const createEventBlogPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;
    if (!eventId) {
      res.status(400).json({ success: false, message: 'Event ID is required' });
      return;
    }

    const { title, content, tags, status = 'draft' } = req.body;

    // Validate required fields
    if (!title || !content) {
      res.status(400).json({
        success: false,
        message: 'Title and content are required'
      });
      return;
    }

    // Validate event exists
    const event = await prisma.event.findUnique({
      where: { event_id: parseInt(eventId, 10) }
    });

    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }

    // For now, we'll use a default user ID (in a real app, this would come from auth)
    // Find the first available user or create a default one
    let defaultUser = await prisma.user.findFirst();
    if (!defaultUser) {
      // Create a default user if none exists
      const bcrypt = require('bcryptjs');
      defaultUser = await prisma.user.create({
        data: {
          username: 'default_user',
          email: 'default@example.com',
          password_hash: await bcrypt.hash('defaultpassword', 10),
          role: 'user' as any,
          first_name: 'Default',
          last_name: 'User'
        }
      });
    }
    const defaultUserId = defaultUser.user_id;

    // Parse tags if they're a string
    let parsedTags: string[] = [];
    if (tags) {
      if (typeof tags === 'string') {
        parsedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      } else if (Array.isArray(tags)) {
        parsedTags = tags.filter(tag => typeof tag === 'string' && tag.trim().length > 0);
      }
    }

    // Handle featured image - either from file upload or URL
    let featuredImageUrl = null;
    let additionalImages: string[] = [];
    
    // Handle file uploads from multer.fields() structure
    if (req.files) {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      // Collect all images from both field names
      const allImages: Express.Multer.File[] = [];
      
      if (files['blog_image'] && files['blog_image'].length > 0) {
        allImages.push(...files['blog_image']);
      }
      
      if (files['blog_images'] && files['blog_images'].length > 0) {
        allImages.push(...files['blog_images']);
      }
      
      if (allImages.length > 0) {
        const imageUrls = allImages.map(file => {
          const filename = (file as any).key.split('/').pop();
          return `/api/blog-images/${filename}/preview`;
        });
        
        // First image becomes featured image, rest go to additional images
        featuredImageUrl = imageUrls[0] || null;
        additionalImages = imageUrls.slice(1);
        
        console.log(`Blog images uploaded: ${allImages.length} files`);
        console.log(`Featured image: ${featuredImageUrl}`);
        console.log(`Additional images: ${additionalImages.length}`);
      }
    } else if (req.body.featured_image) {
      // URL was provided directly
      featuredImageUrl = req.body.featured_image;
    }

    const newBlogPost = await prisma.blogPost.create({
      data: {
        event_id: parseInt(eventId, 10),
        user_id: defaultUserId,
        title,
        content,
        excerpt: null, // Remove excerpt field as requested
        featured_image: featuredImageUrl,
        images: additionalImages,
        tags: parsedTags,
        status,
        published_at: status === 'published' ? new Date() : null,
      },
      select: {
        blog_post_id: true,
        title: true,
        content: true,
        excerpt: true,
        featured_image: true,
        images: true,
        tags: true,
        status: true,
        published_at: true,
        created_at: true,
        updated_at: true,
        user_id: true,
        user: {
          select: {
            username: true,
            first_name: true,
            last_name: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Blog post created successfully',
      data: newBlogPost
    });
  } catch (error) {
    console.error('Error creating blog post:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get a single blog post by ID
 * GET /api/blog-posts/:blogPostId
 */
export const getBlogPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const { blogPostId } = req.params;
    if (!blogPostId) {
      res.status(400).json({ success: false, message: 'Blog post ID is required' });
      return;
    }

    const blogPost = await prisma.blogPost.findUnique({
      where: { blog_post_id: parseInt(blogPostId, 10) },
      select: {
        blog_post_id: true,
        title: true,
        content: true,
        excerpt: true,
        featured_image: true,
        images: true,
        tags: true,
        status: true,
        published_at: true,
        created_at: true,
        updated_at: true,
        user_id: true,
        event_id: true,
        user: {
          select: {
            username: true,
            first_name: true,
            last_name: true
          }
        },
        event: {
          select: {
            event_name: true,
            event_date: true
          }
        }
      }
    });

    if (!blogPost) {
      res.status(404).json({ success: false, message: 'Blog post not found' });
      return;
    }

    res.status(200).json({ success: true, data: blogPost });
  } catch (error) {
    console.error('Error fetching blog post:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Update blog post text fields only (no images)
 * PUT /api/blog-posts/:blogPostId/text
 */
export const updateBlogPostText = async (req: Request, res: Response): Promise<void> => {
  try {
    const { blogPostId } = req.params;
    if (!blogPostId) {
      res.status(400).json({ success: false, message: 'Blog post ID is required' });
      return;
    }

    // Debug: Log received data
    console.log('Blog update request body:', req.body);
    console.log('Blog update files:', req.file ? 'Single file' : req.files ? `${req.files.length} files` : 'No files');

    const { title, content, tags, status } = req.body;

    const existingBlogPost = await prisma.blogPost.findUnique({
      where: { blog_post_id: parseInt(blogPostId, 10) }
    });

    if (!existingBlogPost) {
      res.status(404).json({ success: false, message: 'Blog post not found' });
      return;
    }

    // Parse tags if they're provided
    let parsedTags: string[] | undefined;
    if (tags !== undefined) {
      if (typeof tags === 'string') {
        parsedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      } else if (Array.isArray(tags)) {
        parsedTags = tags.filter(tag => typeof tag === 'string' && tag.trim().length > 0);
      } else {
        parsedTags = existingBlogPost.tags;
      }
    }

    // Handle file uploads for images
    let featuredImageUrl = existingBlogPost.featured_image;
    let additionalImages: string[] = existingBlogPost.images || [];
    
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      // Multiple files were uploaded
      const files = req.files as Express.Multer.File[];
      const imageUrls = files.map(file => {
        const filename = (file as any).key.split('/').pop();
        return `/api/blog-images/${filename}/preview`;
      });
      
      // First image becomes featured image, rest go to additional images
      featuredImageUrl = imageUrls[0] || null;
      additionalImages = imageUrls.slice(1);
      
      console.log(`Multiple blog images uploaded: ${files.length} files`);
      console.log(`Featured image: ${featuredImageUrl}`);
      console.log(`Additional images: ${additionalImages.length}`);
    }

    // Handle status change to published
    let publishedAt = existingBlogPost.published_at;
    if (status === 'published' && existingBlogPost.status !== 'published') {
      publishedAt = new Date();
    } else if (status !== 'published' && existingBlogPost.status === 'published') {
      publishedAt = null;
    }

    // Debug: Log what we're about to update
    console.log('About to update blog post with data:', {
      title: title ?? existingBlogPost.title,
      content: content ?? existingBlogPost.content,
      featured_image: featuredImageUrl,
      images: additionalImages,
      tags: parsedTags ?? existingBlogPost.tags,
      status: status ?? existingBlogPost.status,
      published_at: publishedAt,
      updated_at: new Date(),
    });

    const updatedBlogPost = await prisma.blogPost.update({
      where: { blog_post_id: parseInt(blogPostId, 10) },
      data: {
        title: title ?? existingBlogPost.title,
        content: content ?? existingBlogPost.content,
        featured_image: featuredImageUrl,
        images: additionalImages,
        tags: parsedTags ?? existingBlogPost.tags,
        status: status ?? existingBlogPost.status,
        published_at: publishedAt,
        updated_at: new Date(),
      },
      select: {
        blog_post_id: true,
        title: true,
        content: true,
        excerpt: true,
        featured_image: true,
        images: true,
        tags: true,
        status: true,
        published_at: true,
        created_at: true,
        updated_at: true,
        user_id: true,
        user: {
          select: {
            username: true,
            first_name: true,
            last_name: true
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Blog post updated successfully',
      data: updatedBlogPost
    });
  } catch (error) {
    console.error('Error updating blog post:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Update blog post with images (text + images)
 * PUT /api/blog-posts/:blogPostId
 */
export const updateBlogPostWithImages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { blogPostId } = req.params;
    if (!blogPostId) {
      res.status(400).json({ success: false, message: 'Blog post ID is required' });
      return;
    }

    const { title, content, tags, status } = req.body;

    // Debug logging
    console.log('=== updateBlogPostWithImages called ===');
    console.log('Blog post ID:', blogPostId);
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);

    // Check if blog post exists
    const existingBlogPost = await prisma.blogPost.findUnique({
      where: { blog_post_id: parseInt(blogPostId, 10) }
    });

    if (!existingBlogPost) {
      res.status(404).json({ success: false, message: 'Blog post not found' });
      return;
    }

    // Parse tags if provided
    let parsedTags: string[] | undefined;
    if (tags !== undefined) {
      if (typeof tags === 'string') {
        parsedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      } else if (Array.isArray(tags)) {
        parsedTags = tags.filter(tag => typeof tag === 'string' && tag.trim().length > 0);
      } else {
        parsedTags = existingBlogPost.tags;
      }
    }

    // Handle image uploads
    let featuredImageUrl = existingBlogPost.featured_image;
    let additionalImages: string[] = existingBlogPost.images || [];
    
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      // Multiple files were uploaded
      const files = req.files as Express.Multer.File[];
      const imageUrls = files.map(file => {
        const filename = (file as any).key.split('/').pop();
        return `/api/blog-images/${filename}/preview`;
      });
      
      // First image becomes featured image, rest go to additional images
      featuredImageUrl = imageUrls[0] || null;
      additionalImages = imageUrls.slice(1);
      
      console.log(`Multiple blog images uploaded: ${files.length} files`);
      console.log(`Featured image: ${featuredImageUrl}`);
      console.log(`Additional images: ${additionalImages.length}`);
    }

    // Handle status change to published
    let publishedAt = existingBlogPost.published_at;
    if (status === 'published' && existingBlogPost.status !== 'published') {
      publishedAt = new Date();
    } else if (status !== 'published' && existingBlogPost.status === 'published') {
      publishedAt = null;
    }

    // Update blog post with both text and images
    const updatedBlogPost = await prisma.blogPost.update({
      where: { blog_post_id: parseInt(blogPostId, 10) },
      data: {
        title: title ?? existingBlogPost.title,
        content: content ?? existingBlogPost.content,
        excerpt: existingBlogPost.excerpt, // Keep existing excerpt for now
        featured_image: featuredImageUrl,
        images: additionalImages,
        tags: parsedTags ?? existingBlogPost.tags,
        status: status ?? existingBlogPost.status,
        published_at: publishedAt,
        updated_at: new Date(),
      },
      select: {
        blog_post_id: true,
        title: true,
        content: true,
        excerpt: true,
        featured_image: true,
        images: true,
        tags: true,
        status: true,
        published_at: true,
        created_at: true,
        updated_at: true,
        user_id: true,
        user: {
          select: {
            username: true,
            first_name: true,
            last_name: true
          }
        }
      }
    });

    console.log('Blog post updated successfully:', updatedBlogPost.title);

    res.status(200).json({
      success: true,
      message: 'Blog post updated successfully',
      data: updatedBlogPost
    });
  } catch (error) {
    console.error('Error updating blog post:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Delete a blog post by ID
 * DELETE /api/blog-posts/:blogPostId
 */
export const deleteBlogPost = async (req: Request, res: Response): Promise<void> => {
  console.log('=== DELETE BLOG POST ENDPOINT HIT ===');
  console.log('Request params:', req.params);
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  
  try {
    const { blogPostId } = req.params;
    if (!blogPostId) {
      res.status(400).json({ success: false, message: 'Blog post ID is required' });
      return;
    }

    const existingBlogPost = await prisma.blogPost.findUnique({
      where: { blog_post_id: parseInt(blogPostId, 10) }
    });

    if (!existingBlogPost) {
      res.status(404).json({ success: false, message: 'Blog post not found' });
      return;
    }

    console.log('=== BLOG DELETE DEBUG START ===');
    console.log('Blog post to delete:', {
      id: existingBlogPost.blog_post_id,
      title: existingBlogPost.title,
      featured_image: existingBlogPost.featured_image,
      images: existingBlogPost.images
    });

    // Delete featured image from S3 if it exists
    if (existingBlogPost.featured_image) {
      try {
        console.log('Processing featured image:', existingBlogPost.featured_image);
        // Extract filename from the preview URL
        const featuredImageMatch = existingBlogPost.featured_image.match(/\/api\/blog-images\/(.+)\/preview/);
        console.log('Featured image regex match:', featuredImageMatch);
        if (featuredImageMatch) {
          const filename = featuredImageMatch[1];
          const s3Key = `blogs/${filename}`;
          console.log(`Attempting to delete featured image from S3: ${s3Key}`);
          await s3Service.deleteFile(s3Key);
          console.log(`Successfully deleted featured image from S3: ${s3Key}`);
        } else {
          console.log('No regex match found for featured image URL');
        }
      } catch (s3Error) {
        console.error('Error deleting featured image from S3:', s3Error);
        // Continue with deletion even if S3 cleanup fails
      }
    }

    // Delete additional images from S3 if they exist
    if (existingBlogPost.images && existingBlogPost.images.length > 0) {
      console.log('Processing additional images:', existingBlogPost.images);
      for (const imageUrl of existingBlogPost.images) {
        try {
          console.log('Processing additional image:', imageUrl);
          // Extract filename from the preview URL
          const imageMatch = imageUrl.match(/\/api\/blog-images\/(.+)\/preview/);
          console.log('Additional image regex match:', imageMatch);
          if (imageMatch) {
            const filename = imageMatch[1];
            const s3Key = `blogs/${filename}`;
            console.log(`Attempting to delete additional image from S3: ${s3Key}`);
            await s3Service.deleteFile(s3Key);
            console.log(`Successfully deleted additional image from S3: ${s3Key}`);
          } else {
            console.log('No regex match found for additional image URL');
          }
        } catch (s3Error) {
          console.error('Error deleting additional image from S3:', s3Error);
          // Continue with deletion even if S3 cleanup fails
        }
      }
    }

    // Delete blog post record from database
    await prisma.blogPost.delete({
      where: { blog_post_id: parseInt(blogPostId, 10) }
    });

    console.log('Blog post deleted successfully from database');
    console.log('=== BLOG DELETE DEBUG END ===');

    res.status(200).json({ success: true, message: 'Blog post deleted successfully' });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Search blog posts by title, content, or tags
 * GET /api/blog-posts/search?q=<query>&page=<page>&limit=<limit>&status=<status>
 */
export const searchBlogPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q, page = '1', limit = '20', status } = req.query;

    if (!q || (q as string).trim() === '') {
      res.status(400).json({ success: false, message: 'Search query (q) is required' });
      return;
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    const searchTerm = (q as string).trim();

    // Build search conditions
    const whereConditions: any = {
      OR: [
        { title: { contains: searchTerm, mode: 'insensitive' as any } },
        { content: { contains: searchTerm, mode: 'insensitive' as any } },
        { excerpt: { contains: searchTerm, mode: 'insensitive' as any } },
        { tags: { has: searchTerm } },
        { event: { event_name: { contains: searchTerm, mode: 'insensitive' as any } } }
      ]
    };

    if (status) {
      whereConditions.status = status as string;
    }

    // Get blog posts with pagination
    const [blogPosts, totalCount] = await Promise.all([
      prisma.blogPost.findMany({
        where: whereConditions,
        orderBy: { created_at: 'desc' },
        skip: offset,
        take: limitNum,
        select: {
          blog_post_id: true,
          title: true,
          content: true,
          excerpt: true,
          featured_image: true,
          tags: true,
          status: true,
          published_at: true,
          created_at: true,
          updated_at: true,
          user_id: true,
          event_id: true,
          user: {
            select: {
              username: true,
              first_name: true,
              last_name: true
            }
          },
          event: {
            select: {
              event_name: true,
              event_date: true
            }
          }
        }
      }),
      prisma.blogPost.count({ where: whereConditions })
    ]);

    res.status(200).json({
      success: true,
      data: {
        blogPosts,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          pages: Math.ceil(totalCount / limitNum)
        }
      }
    });
  } catch (error) {
    console.error('Error searching blog posts:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Get blog posts by tag
 * GET /api/blog-posts/tag/:tag?page=<page>&limit=<limit>&status=<status>
 */
export const getBlogPostsByTag = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tag } = req.params;
    if (!tag) {
      res.status(400).json({ success: false, message: 'Tag is required' });
      return;
    }

    const { page = '1', limit = '20', status } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    // Build search conditions
    const whereConditions: any = {
      tags: { has: tag as string }
    };

    if (status) {
      whereConditions.status = status as string;
    }

    // Get blog posts with pagination
    const [blogPosts, totalCount] = await Promise.all([
      prisma.blogPost.findMany({
        where: whereConditions,
        orderBy: { created_at: 'desc' },
        skip: offset,
        take: limitNum,
        select: {
          blog_post_id: true,
          title: true,
          content: true,
          excerpt: true,
          featured_image: true,
          tags: true,
          status: true,
          published_at: true,
          created_at: true,
          updated_at: true,
          user_id: true,
          event_id: true,
          user: {
            select: {
              username: true,
              first_name: true,
              last_name: true
            }
          },
          event: {
            select: {
              event_name: true,
              event_date: true
            }
          }
        }
      }),
      prisma.blogPost.count({ where: whereConditions })
    ]);

    res.status(200).json({
      success: true,
      data: {
        blogPosts,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          pages: Math.ceil(totalCount / limitNum)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching blog posts by tag:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
