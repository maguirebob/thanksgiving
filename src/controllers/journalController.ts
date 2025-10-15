import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import {
  UpdateJournalSectionRequest,
  CreateContentItemRequest,
  UpdateContentItemRequest,
  ReorderContentItemsRequest,
  AddPageBreakRequest,
  JournalSectionResponse,
  JournalSectionsResponse,
  AvailableContentResponse,
  PageBreakResponse,
  ErrorResponse
} from '../types/journal';

// Journal Sections CRUD Operations

export const createJournalSection = async (req: Request, res: Response): Promise<void> => {
  console.log('🔍 === STEP-BY-STEP TEST START ===');
  console.log('📊 Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    console.log('✅ Step 1: Inside try block - function is executing');
    
    // Step 1: Parse request data (no database yet)
    const event_id = req.body.event_id;
    const year = req.body.year;
    const section_order = req.body.section_order;
    const title = req.body.title;
    const description = req.body.description;
    const layout_config = req.body.layout_config;
    
    console.log('✅ Step 2: Parsed request data successfully');
    console.log('   event_id:', event_id, '(type:', typeof event_id, ')');
    console.log('   year:', year, '(type:', typeof year, ')');

    // Step 2: Validate required fields
    if (!event_id || !year) {
      console.log('❌ Validation failed: Missing required fields');
      res.status(400).json({
        success: false,
        message: 'Event ID and year are required'
      });
      return;
    }

    console.log('✅ Step 3: Validation passed');

    // Step 3: Test Prisma client (just a simple query)
    console.log('🔍 Step 4: Testing Prisma client...');
    const event = await prisma.event.findUnique({
      where: { event_id }
    });

    if (!event) {
      console.log('❌ Event not found for event_id:', event_id);
      res.status(404).json({
        success: false,
        message: 'Event not found'
      });
      return;
    }

    console.log('✅ Step 5: Event found:', {
      event_id: event.event_id,
      event_name: event.event_name
    });

    // For now, just return success with mock data
    console.log('✅ Step 6: Returning success with mock data');
    res.status(201).json({
      success: true,
      data: { 
        journal_section: {
          section_id: 777,
          event_id: event_id,
          year: year,
          section_order: 1,
          title: title || 'Step Test Section',
          description: description || 'Step Test Description'
        }
      }
    });
    
    console.log('🎉 === STEP-BY-STEP TEST END - SUCCESS ===');
  } catch (error) {
    console.log('❌ === STEP-BY-STEP TEST END - ERROR ===');
    console.error('💥 Error in step-by-step test:', error);
    console.error('🔍 Error details:');
    console.error('   Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('   Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('   Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getJournalSections = async (req: Request, res: Response): Promise<void> => {
  try {
    const { event_id, year } = req.query;
    const page = parseInt((req.query['page'] as string) || '1');
    const limit = parseInt((req.query['limit'] as string) || '10');

    const where: any = {};
    if (event_id) where.event_id = parseInt(event_id as string);
    if (year) where.year = parseInt(year as string);

    const [journalSections, total] = await Promise.all([
      prisma.journalSection.findMany({
        where,
        include: {
          content_items: {
            orderBy: { display_order: 'asc' }
          }
        },
        orderBy: [
          { year: 'desc' },
          { section_order: 'asc' }
        ],
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.journalSection.count({ where })
    ]);

    res.status(200).json({
      success: true,
      data: {
        journal_sections: journalSections,
        pagination: {
          total,
          page,
          limit
        }
      }
    } as JournalSectionsResponse);
  } catch (error) {
    console.error('Error fetching journal sections:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    } as ErrorResponse);
  }
};

export const getJournalSection = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sectionId } = req.params;
    
    if (!sectionId) {
      res.status(400).json({
        success: false,
        message: 'Section ID is required'
      } as ErrorResponse);
      return;
    }

    const journalSection = await prisma.journalSection.findUnique({
      where: { section_id: parseInt(sectionId) },
      include: {
        content_items: {
          orderBy: { display_order: 'asc' }
        }
      }
    });

    if (!journalSection) {
      res.status(404).json({
        success: false,
        message: 'Journal section not found'
      } as ErrorResponse);
      return;
    }

    // Manually fetch related data for content items
    const contentItemsWithData = await Promise.all(
      journalSection.content_items.map(async (item) => {
        let relatedData = {};

        if (item.content_type === 'menu' && item.content_id) {
          const menu = await prisma.event.findUnique({
            where: { event_id: item.content_id },
            select: {
              event_id: true,
              menu_title: true,
              menu_image_s3_url: true,
              event_date: true,
              event_name: true
            }
          });
          if (menu) relatedData = { menu };
        } else if ((item.content_type === 'photo' || item.content_type === 'page_photo') && item.content_id) {
          const photo = await prisma.photo.findUnique({
            where: { photo_id: item.content_id }
          });
          if (photo) relatedData = { photo };
        } else if (item.content_type === 'blog' && item.content_id) {
          const blogPost = await prisma.blogPost.findUnique({
            where: { blog_post_id: item.content_id }
          });
          if (blogPost) relatedData = { blog_post: blogPost };
        }

        return { ...item, ...relatedData };
      })
    );

    // Generate signed URLs for content items
    const s3Service = await import('../services/s3Service');
    
    // Helper function to extract S3 key from URL
    const extractS3Key = (s3Url: string): string => {
      if (!s3Url) return '';
      // If it's already a key (no https://), return as is
      if (!s3Url.startsWith('https://')) return s3Url;
      
      // Fix double slashes in blog image paths for both signed and unsigned URLs
      let fixedUrl = s3Url.replace('//api/blog-images/', '/api/blog-images/');
      
      // If it's already a signed URL (has query parameters), return the fixed URL
      if (fixedUrl.includes('?X-Amz-')) return fixedUrl;
      
      // Extract key from full S3 URL for unsigned URLs
      const url = new URL(fixedUrl);
      let pathname = url.pathname.substring(1); // Remove leading slash
      // Remove /preview from blog image paths
      pathname = pathname.replace('/preview', '');
      return pathname;
    };

    const contentItemsWithSignedUrls = await Promise.all(
      contentItemsWithData.map(async (item: any) => {
        // Generate signed URLs for menu images
        if (item.menu && item.menu.menu_image_s3_url) {
          item.menu.menu_image_s3_url = await s3Service.default.getSignedUrl(extractS3Key(item.menu.menu_image_s3_url));
        }
        
        // Generate signed URLs for photos
        if (item.photo && item.photo.s3_url) {
          item.photo.s3_url = await s3Service.default.getSignedUrl(extractS3Key(item.photo.s3_url));
        }
        
        // Generate signed URLs for blog images
        if (item.blog_post) {
          if (item.blog_post.featured_image) {
            item.blog_post.featured_image = await s3Service.default.getSignedUrl(extractS3Key(item.blog_post.featured_image));
          }
          if (item.blog_post.images && Array.isArray(item.blog_post.images)) {
            const signedImages = await Promise.all(
              item.blog_post.images.map(async (imageUrl: string) => 
                imageUrl ? await s3Service.default.getSignedUrl(extractS3Key(imageUrl)) : null
              )
            );
            item.blog_post.images = signedImages.filter((url): url is string => url !== null);
          }
        }
        
        return item;
      })
    );

    const sectionWithData = {
      ...journalSection,
      content_items: contentItemsWithSignedUrls
    };

    res.status(200).json({
      success: true,
      data: { journal_section: sectionWithData }
    } as JournalSectionResponse);
  } catch (error) {
    console.error('Error fetching journal section:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    } as ErrorResponse);
  }
};

export const updateJournalSection = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sectionId } = req.params;
    const { title, description, layout_config, is_published }: UpdateJournalSectionRequest = req.body;

    if (!sectionId) {
      res.status(400).json({
        success: false,
        message: 'Section ID is required'
      } as ErrorResponse);
      return;
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (layout_config !== undefined) updateData.layout_config = layout_config;
    if (is_published !== undefined) updateData.is_published = is_published;

    const journalSection = await prisma.journalSection.update({
      where: { section_id: parseInt(sectionId) },
      data: updateData,
      include: {
        content_items: {
          orderBy: { display_order: 'asc' }
        }
      }
    });

    res.status(200).json({
      success: true,
      data: { journal_section: journalSection }
    } as JournalSectionResponse);
  } catch (error) {
    console.error('Error updating journal section:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    } as ErrorResponse);
  }
};

export const deleteJournalSection = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sectionId } = req.params;

    if (!sectionId) {
      res.status(400).json({
        success: false,
        message: 'Section ID is required'
      } as ErrorResponse);
      return;
    }

    await prisma.journalSection.delete({
      where: { section_id: parseInt(sectionId) }
    });

    res.status(200).json({
      success: true,
      message: 'Journal section deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting journal section:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    } as ErrorResponse);
  }
};

// Content Items CRUD Operations

export const createContentItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sectionId } = req.params;
    const {
      content_type,
      content_id,
      custom_text,
      heading_level,
      display_order,
      is_visible,
      manual_page_break,
      page_break_position
    }: CreateContentItemRequest = req.body;

    if (!sectionId) {
      res.status(400).json({
        success: false,
        message: 'Section ID is required'
      } as ErrorResponse);
      return;
    }

    // Validate required fields
    if (!content_type || display_order === undefined) {
      res.status(400).json({
        success: false,
        message: 'Content type and display order are required'
      } as ErrorResponse);
      return;
    }

    // Check if section exists
    const section = await prisma.journalSection.findUnique({
      where: { section_id: parseInt(sectionId) }
    });

    if (!section) {
      res.status(404).json({
        success: false,
        message: 'Journal section not found'
      } as ErrorResponse);
      return;
    }

    // Create content item
    const contentItem = await prisma.journalContentItem.create({
      data: {
        journal_section_id: parseInt(sectionId),
        content_type,
        content_id: content_id || null,
        custom_text: custom_text || null,
        heading_level: heading_level || 1,
        display_order,
        is_visible: is_visible !== undefined ? is_visible : true,
        manual_page_break: manual_page_break || false,
        page_break_position: page_break_position || 1
      }
    });

    res.status(201).json({
      success: true,
      data: { content_item: contentItem }
    });
  } catch (error) {
    console.error('Error creating content item:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    } as ErrorResponse);
  }
};

export const updateContentItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { itemId } = req.params;
    const {
      content_type,
      content_id,
      custom_text,
      heading_level,
      display_order,
      is_visible,
      manual_page_break,
      page_break_position
    }: UpdateContentItemRequest = req.body;

    if (!itemId) {
      res.status(400).json({
        success: false,
        message: 'Item ID is required'
      } as ErrorResponse);
      return;
    }

    const updateData: any = {};
    if (content_type !== undefined) updateData.content_type = content_type;
    if (content_id !== undefined) updateData.content_id = content_id;
    if (custom_text !== undefined) updateData.custom_text = custom_text;
    if (heading_level !== undefined) updateData.heading_level = heading_level;
    if (display_order !== undefined) updateData.display_order = display_order;
    if (is_visible !== undefined) updateData.is_visible = is_visible;
    if (manual_page_break !== undefined) updateData.manual_page_break = manual_page_break;
    if (page_break_position !== undefined) updateData.page_break_position = page_break_position;

    const contentItem = await prisma.journalContentItem.update({
      where: { content_item_id: parseInt(itemId) },
      data: updateData
    });

    res.status(200).json({
      success: true,
      data: { content_item: contentItem }
    });
  } catch (error) {
    console.error('Error updating content item:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    } as ErrorResponse);
  }
};

export const deleteContentItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { itemId } = req.params;

    if (!itemId) {
      res.status(400).json({
        success: false,
        message: 'Item ID is required'
      } as ErrorResponse);
      return;
    }

    await prisma.journalContentItem.delete({
      where: { content_item_id: parseInt(itemId) }
    });

    res.status(200).json({
      success: true,
      message: 'Content item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting content item:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    } as ErrorResponse);
  }
};

export const reorderContentItems = async (req: Request, res: Response): Promise<void> => {
  try {
    const { content_items }: ReorderContentItemsRequest = req.body;

    // Update display orders in a transaction
    await prisma.$transaction(
      content_items.map(({ content_item_id, display_order }) =>
        prisma.journalContentItem.update({
          where: { content_item_id },
          data: { display_order }
        })
      )
    );

    res.status(200).json({
      success: true,
      message: 'Content items reordered successfully'
    });
  } catch (error) {
    console.error('Error reordering content items:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    } as ErrorResponse);
  }
};

// Page Break Management

export const addPageBreak = async (req: Request, res: Response): Promise<void> => {
  try {
    const { contentItemId } = req.params;
    const { page_break_position }: AddPageBreakRequest = req.body;

    if (!contentItemId) {
      res.status(400).json({
        success: false,
        message: 'Content Item ID is required'
      } as ErrorResponse);
      return;
    }

    const contentItem = await prisma.journalContentItem.update({
      where: { content_item_id: parseInt(contentItemId) },
      data: {
        manual_page_break: true,
        page_break_position: page_break_position || 1
      }
    });

    res.status(200).json({
      success: true,
      data: {
        content_item: contentItem,
        page_break_added: true
      }
    } as PageBreakResponse);
  } catch (error) {
    console.error('Error adding page break:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    } as ErrorResponse);
  }
};

export const removePageBreak = async (req: Request, res: Response): Promise<void> => {
  try {
    const { contentItemId } = req.params;

    if (!contentItemId) {
      res.status(400).json({
        success: false,
        message: 'Content Item ID is required'
      } as ErrorResponse);
      return;
    }

    const contentItem = await prisma.journalContentItem.update({
      where: { content_item_id: parseInt(contentItemId) },
      data: {
        manual_page_break: false,
        page_break_position: null
      }
    });

    res.status(200).json({
      success: true,
      data: {
        content_item: contentItem,
        page_break_added: false
      }
    } as PageBreakResponse);
  } catch (error) {
    console.error('Error removing page break:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    } as ErrorResponse);
  }
};

// Available Content for Journal Editor

export const getAvailableContent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;
    const { year } = req.query;

    if (!eventId) {
      res.status(400).json({
        success: false,
        message: 'Event ID is required'
      } as ErrorResponse);
      return;
    }

    // Get event details
    const event = await prisma.event.findUnique({
      where: { event_id: parseInt(eventId) }
    });

    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Event not found'
      } as ErrorResponse);
      return;
    }

    // Get menus for the specific year if provided
    const menuWhere: any = {};
    if (year) {
      menuWhere.event_date = {
        gte: new Date(`${year}-01-01`),
        lt: new Date(`${parseInt(year as string) + 1}-01-01`)
      };
    }

    const menus = await prisma.event.findMany({
      where: menuWhere,
      select: {
        event_id: true,
        menu_title: true,
        menu_image_s3_url: true,
        event_date: true,
        event_name: true
      },
      orderBy: { event_date: 'desc' }
    });

    // Get photos for the specific event (not filtered by date)
    const photoWhere: any = { event_id: parseInt(eventId) };

    // Get blog posts for the specific event (not filtered by date)
    const blogWhere: any = { event_id: parseInt(eventId) };

    const [photos, pagePhotos, blogs] = await Promise.all([
      // Individual photos
      prisma.photo.findMany({
        where: { ...photoWhere, photo_type: 'individual' },
        orderBy: { taken_date: 'desc' }
      }),
      // Page photos
      prisma.photo.findMany({
        where: { ...photoWhere, photo_type: 'page' },
        orderBy: { taken_date: 'desc' }
      }),
      // Blog posts
      prisma.blogPost.findMany({
        where: blogWhere,
        orderBy: { published_at: 'desc' }
      })
    ]);

    // Generate signed URLs for menu images and photos
    const s3Service = await import('../services/s3Service');
    
    // Helper function to extract S3 key from URL
    const extractS3Key = (s3Url: string): string => {
      if (!s3Url) return '';
      // If it's already a key (no https://), return as is
      if (!s3Url.startsWith('https://')) return s3Url;
      
      // Fix double slashes in blog image paths for both signed and unsigned URLs
      let fixedUrl = s3Url.replace('//api/blog-images/', '/api/blog-images/');
      
      // If it's already a signed URL (has query parameters), return the fixed URL
      if (fixedUrl.includes('?X-Amz-')) return fixedUrl;
      
      // Extract key from full S3 URL for unsigned URLs
      const url = new URL(fixedUrl);
      let pathname = url.pathname.substring(1); // Remove leading slash
      // Remove /preview from blog image paths
      pathname = pathname.replace('/preview', '');
      return pathname;
    };

    const menusWithSignedUrls = await Promise.all(
      menus.map(async (menu) => ({
        ...menu,
        menu_image_s3_url: menu.menu_image_s3_url ? await s3Service.default.getSignedUrl(extractS3Key(menu.menu_image_s3_url)) : null
      }))
    );

    const photosWithSignedUrls = await Promise.all(
      photos.map(async (photo) => ({
        ...photo,
        s3_url: photo.s3_url ? await s3Service.default.getSignedUrl(extractS3Key(photo.s3_url)) : null
      }))
    );

    const pagePhotosWithSignedUrls = await Promise.all(
      pagePhotos.map(async (photo) => ({
        ...photo,
        s3_url: photo.s3_url ? await s3Service.default.getSignedUrl(extractS3Key(photo.s3_url)) : null
      }))
    );

    // Blog images should use application routes, not signed URLs
    const blogsWithSignedUrls = blogs;

    res.status(200).json({
      success: true,
      data: {
        menus: menusWithSignedUrls,
        photos: photosWithSignedUrls,
        page_photos: pagePhotosWithSignedUrls,
        blogs: blogsWithSignedUrls
      }
    } as AvailableContentResponse);
  } catch (error) {
    console.error('Error fetching available content:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    } as ErrorResponse);
  }
};

// Public Journal Viewer Functions

export const getJournalYears = async (_req: Request, res: Response): Promise<void> => {
  try {
    const years = await prisma.journalSection.findMany({
      select: { year: true },
      distinct: ['year'],
      orderBy: { year: 'asc' }
    });

    const yearList = years.map(section => section.year);

    res.status(200).json({
      success: true,
      data: { years: yearList }
    });
  } catch (error) {
    console.error('Error fetching journal years:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    } as ErrorResponse);
  }
};

export const getJournalViewerData = async (req: Request, res: Response): Promise<void> => {
  try {
    const { year } = req.query;

    if (!year) {
      res.status(400).json({
        success: false,
        message: 'Year parameter is required'
      } as ErrorResponse);
      return;
    }

    // Get all journal sections for the specified year
    const journalSections = await prisma.journalSection.findMany({
      where: { year: parseInt(year as string) },
      include: {
        content_items: {
          orderBy: { display_order: 'asc' }
        }
      },
      orderBy: { section_order: 'asc' }
    });

    // Manually fetch related data for content items
    const sectionsWithData = await Promise.all(
      journalSections.map(async (section) => {
        const contentItemsWithData = await Promise.all(
          section.content_items.map(async (item) => {
            let relatedData = {};

            if (item.content_type === 'menu' && item.content_id) {
              const menu = await prisma.event.findUnique({
                where: { event_id: item.content_id },
                select: {
                  event_id: true,
                  menu_title: true,
                  menu_image_s3_url: true,
                  event_date: true,
                  event_name: true
                }
              });
              if (menu) relatedData = { menu };
            } else if ((item.content_type === 'photo' || item.content_type === 'page_photo') && item.content_id) {
              const photo = await prisma.photo.findUnique({
                where: { photo_id: item.content_id }
              });
              if (photo) relatedData = { photo };
            } else if (item.content_type === 'blog' && item.content_id) {
              const blogPost = await prisma.blogPost.findUnique({
                where: { blog_post_id: item.content_id }
              });
              if (blogPost) relatedData = { blog_post: blogPost };
            }

            return { ...item, ...relatedData };
          })
        );

        return {
          ...section,
          content_items: contentItemsWithData
        };
      })
    );

    // Generate signed URLs for menu images and photos
    const s3Service = await import('../services/s3Service');
    
    // Helper function to extract S3 key from URL
    const extractS3Key = (s3Url: string): string => {
      if (!s3Url) return '';
      // If it's already a key (no https://), return as is
      if (!s3Url.startsWith('https://')) return s3Url;
      
      // Fix double slashes in blog image paths for both signed and unsigned URLs
      let fixedUrl = s3Url.replace('//api/blog-images/', '/api/blog-images/');
      
      // If it's already a signed URL (has query parameters), return the fixed URL
      if (fixedUrl.includes('?X-Amz-')) return fixedUrl;
      
      // Extract key from full S3 URL for unsigned URLs
      const url = new URL(fixedUrl);
      let pathname = url.pathname.substring(1); // Remove leading slash
      // Remove /preview from blog image paths
      pathname = pathname.replace('/preview', '');
      return pathname;
    };
    
    const sectionsWithSignedUrls = await Promise.all(
      sectionsWithData.map(async (section) => {
        const contentItemsWithSignedUrls = await Promise.all(
          section.content_items.map(async (item: any) => {
            if (item.menu && item.menu.menu_image_s3_url) {
              item.menu.menu_image_s3_url = await s3Service.default.getSignedUrl(extractS3Key(item.menu.menu_image_s3_url));
            }
            if (item.photo && item.photo.s3_url) {
              item.photo.s3_url = await s3Service.default.getSignedUrl(extractS3Key(item.photo.s3_url));
            }
            return item;
          })
        );

        return {
          ...section,
          content_items: contentItemsWithSignedUrls
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        year: parseInt(year as string),
        journal_sections: sectionsWithSignedUrls
      }
    });
  } catch (error) {
    console.error('Error fetching journal viewer data:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    } as ErrorResponse);
  }
};