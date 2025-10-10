import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  CreateJournalPageRequest,
  UpdateJournalPageRequest,
  CreateContentItemRequest,
  UpdateContentItemRequest,
  ReorderContentItemsRequest,
  JournalPageResponse,
  JournalPagesResponse,
  AvailableContentResponse,
  ErrorResponse
} from '../types/journal';

const prisma = new PrismaClient();

// Journal Pages CRUD Operations

export const createJournalPage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { event_id, year, page_number, title, description, layout_config }: CreateJournalPageRequest = req.body;

    // Validate required fields
    if (!event_id || !year) {
      res.status(400).json({
        success: false,
        message: 'Event ID and year are required'
      } as ErrorResponse);
      return;
    }

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { event_id }
    });

    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Event not found'
      } as ErrorResponse);
      return;
    }

    // Create journal page
    const journalPage = await prisma.journalPage.create({
      data: {
        event_id,
        year,
        page_number: page_number || 1,
        title: title || null,
        description: description || null,
        layout_config: layout_config || null
      },
      include: {
        content_items: {
          orderBy: { display_order: 'asc' }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: { journal_page: journalPage }
    } as JournalPageResponse);
  } catch (error) {
    console.error('Error creating journal page:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    } as ErrorResponse);
  }
};

export const getJournalPages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { event_id, year } = req.query;
    const page = parseInt((req.query['page'] as string) || '1');
    const limit = parseInt((req.query['limit'] as string) || '10');

    const where: any = {};
    if (event_id) where.event_id = parseInt(event_id as string);
    if (year) where.year = parseInt(year as string);

    const [journalPages, total] = await Promise.all([
      prisma.journalPage.findMany({
        where,
        include: {
          content_items: {
            orderBy: { display_order: 'asc' }
          }
        },
        orderBy: [
          { year: 'desc' },
          { page_number: 'asc' }
        ],
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.journalPage.count({ where })
    ]);

    res.status(200).json({
      success: true,
      data: {
        journal_pages: journalPages,
        pagination: {
          total,
          page,
          limit
        }
      }
    } as JournalPagesResponse);
  } catch (error) {
    console.error('Error fetching journal pages:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    } as ErrorResponse);
  }
};

export const getJournalPage = async (req: Request, res: Response): Promise<void> => {
  try {
    const journalPageId = req.params['journalPageId'];
    if (!journalPageId) {
      res.status(400).json({
        success: false,
        message: 'Journal page ID is required'
      } as ErrorResponse);
      return;
    }

    const journalPage = await prisma.journalPage.findUnique({
      where: { journal_page_id: parseInt(journalPageId) },
      include: {
        content_items: {
          orderBy: { display_order: 'asc' }
        }
      }
    });

    // Manually fetch related data for content items
    if (journalPage && journalPage.content_items.length > 0) {
      const menuIds = journalPage.content_items
        .filter(item => item.content_type === 'menu' && item.content_id)
        .map(item => item.content_id!);
      
      const photoIds = journalPage.content_items
        .filter(item => (item.content_type === 'photo' || item.content_type === 'page_photo') && item.content_id)
        .map(item => item.content_id!);
      
      const blogIds = journalPage.content_items
        .filter(item => item.content_type === 'blog' && item.content_id)
        .map(item => item.content_id!);

      const [menus, photos, blogs] = await Promise.all([
        menuIds.length > 0 ? prisma.event.findMany({ where: { event_id: { in: menuIds } } }) : [],
        photoIds.length > 0 ? prisma.photo.findMany({ where: { photo_id: { in: photoIds } } }) : [],
        blogIds.length > 0 ? prisma.blogPost.findMany({ where: { blog_post_id: { in: blogIds } } }) : []
      ]);

      // Generate signed URLs for menus
      const s3Service = require('../services/s3Service').default;
      console.log('🔍 JOURNAL EDITOR: Generating signed URLs for menus...');
      
      const menusWithSignedUrls = await Promise.all(menus.map(async (menu) => {
        if (menu.menu_image_s3_url) {
          try {
            // Extract the S3 key from the stored URL
            const s3Key = `menus/${menu.menu_image_s3_url.split('/').pop()}`;
            const signedUrl = await s3Service.getSignedUrl(s3Key, 3600); // 1 hour expiry
            return {
              ...menu,
              menu_image_s3_url: signedUrl
            };
          } catch (error) {
            console.error(`❌ Failed to generate signed URL for menu ${menu.event_id}:`, error);
            return menu;
          }
        }
        return menu;
      }));

      // Generate signed URLs for photos
      console.log('🔍 JOURNAL EDITOR: Generating signed URLs for photos...');
      
      const photosWithSignedUrls = await Promise.all(photos.map(async (photo) => {
        if (photo.s3_url) {
          try {
            // Extract the S3 key from the stored URL
            const s3Key = `photos/${photo.filename}`;
            const signedUrl = await s3Service.getSignedUrl(s3Key, 3600); // 1 hour expiry
            return {
              ...photo,
              s3_url: signedUrl
            };
          } catch (error) {
            console.error(`❌ Failed to generate signed URL for photo ${photo.photo_id}:`, error);
            return photo;
          }
        }
        return photo;
      }));

      // Attach related data to content items
      journalPage.content_items.forEach(item => {
        if (item.content_type === 'menu' && item.content_id) {
          (item as any).menu = menusWithSignedUrls.find(menu => menu.event_id === item.content_id);
        } else if ((item.content_type === 'photo' || item.content_type === 'page_photo') && item.content_id) {
          (item as any).photo = photosWithSignedUrls.find(photo => photo.photo_id === item.content_id);
        } else if (item.content_type === 'blog' && item.content_id) {
          (item as any).blog_post = blogs.find(blog => blog.blog_post_id === item.content_id);
        }
      });
    }

    if (!journalPage) {
      res.status(404).json({
        success: false,
        message: 'Journal page not found'
      } as ErrorResponse);
      return;
    }

    res.status(200).json({
      success: true,
      data: { journal_page: journalPage }
    } as JournalPageResponse);
  } catch (error) {
    console.error('Error fetching journal page:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    } as ErrorResponse);
  }
};

export const updateJournalPage = async (req: Request, res: Response): Promise<void> => {
  try {
    const journalPageId = req.params['journalPageId'];
    if (!journalPageId) {
      res.status(400).json({
        success: false,
        message: 'Journal page ID is required'
      } as ErrorResponse);
      return;
    }

    const { title, description, layout_config, is_published }: UpdateJournalPageRequest = req.body;

    const journalPage = await prisma.journalPage.update({
      where: { journal_page_id: parseInt(journalPageId) },
      data: {
        title: title || null,
        description: description || null,
        layout_config: layout_config || null,
        is_published: is_published || false
      },
      include: {
        content_items: {
          orderBy: { display_order: 'asc' }
        }
      }
    });

    res.status(200).json({
      success: true,
      data: { journal_page: journalPage }
    } as JournalPageResponse);
  } catch (error) {
    console.error('Error updating journal page:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    } as ErrorResponse);
  }
};

export const deleteJournalPage = async (req: Request, res: Response): Promise<void> => {
  try {
    const journalPageId = req.params['journalPageId'];
    if (!journalPageId) {
      res.status(400).json({
        success: false,
        message: 'Journal page ID is required'
      } as ErrorResponse);
      return;
    }

    await prisma.journalPage.delete({
      where: { journal_page_id: parseInt(journalPageId) }
    });

    res.status(200).json({
      success: true,
      message: 'Journal page deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting journal page:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    } as ErrorResponse);
  }
};

// Content Items CRUD Operations

export const createContentItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const journalPageId = req.params['journalPageId'];
    if (!journalPageId) {
      res.status(400).json({
        success: false,
        message: 'Journal page ID is required'
      } as ErrorResponse);
      return;
    }

    const { content_type, content_id, custom_text, heading_level, display_order, is_visible }: CreateContentItemRequest = req.body;

    // Validate required fields
    if (!content_type || display_order === undefined) {
      res.status(400).json({
        success: false,
        message: 'Content type and display order are required'
      } as ErrorResponse);
      return;
    }

    const contentItem = await prisma.journalContentItem.create({
      data: {
        journal_page_id: parseInt(journalPageId),
        content_type,
        content_id: content_id || null,
        custom_text: custom_text || null,
        heading_level: heading_level || null,
        display_order,
        is_visible: is_visible !== undefined ? is_visible : true
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
    const contentItemId = req.params['contentItemId'];
    if (!contentItemId) {
      res.status(400).json({
        success: false,
        message: 'Content item ID is required'
      } as ErrorResponse);
      return;
    }

    const { content_type, content_id, custom_text, heading_level, display_order, is_visible }: UpdateContentItemRequest = req.body;

    const updateData: any = {};
    if (content_type !== undefined) updateData.content_type = content_type;
    if (content_id !== undefined) updateData.content_id = content_id || null;
    if (custom_text !== undefined) updateData.custom_text = custom_text || null;
    if (heading_level !== undefined) updateData.heading_level = heading_level || null;
    if (display_order !== undefined) updateData.display_order = display_order;
    if (is_visible !== undefined) updateData.is_visible = is_visible;

    const contentItem = await prisma.journalContentItem.update({
      where: { content_item_id: parseInt(contentItemId) },
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
    const contentItemId = req.params['contentItemId'];
    if (!contentItemId) {
      res.status(400).json({
        success: false,
        message: 'Content item ID is required'
      } as ErrorResponse);
      return;
    }

    await prisma.journalContentItem.delete({
      where: { content_item_id: parseInt(contentItemId) }
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

    // Update display order for each content item
    const updatePromises = content_items.map(item =>
      prisma.journalContentItem.update({
        where: { content_item_id: item.content_item_id },
        data: { display_order: item.display_order }
      })
    );

    await Promise.all(updatePromises);

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

// Available Content for Editor

export const getAvailableContent = async (req: Request, res: Response): Promise<void> => {
  try {
    const eventId = req.params['eventId'];
    const { year } = req.query;

    if (!eventId || !year) {
      res.status(400).json({
        success: false,
        message: 'Event ID and year are required'
      } as ErrorResponse);
      return;
    }

    const [menus, photos, blogs] = await Promise.all([
      // Get menus (events) for the year
      prisma.event.findMany({
        where: {
          event_id: parseInt(eventId),
          event_date: {
            gte: new Date(parseInt(year as string), 0, 1),
            lt: new Date(parseInt(year as string) + 1, 0, 1)
          }
        },
        select: {
          event_id: true,
          menu_title: true,
          menu_image_s3_url: true,
          event_date: true,
          event_name: true
        }
      }),
      // Get photos for the event
      prisma.photo.findMany({
        where: {
          event_id: parseInt(eventId)
        },
        select: {
          photo_id: true,
          filename: true,
          original_filename: true,
          description: true,
          caption: true,
          s3_url: true,
          photo_type: true,
          taken_date: true
        }
      }),
      // Get blog posts for the event
      prisma.blogPost.findMany({
        where: {
          event_id: parseInt(eventId)
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
          published_at: true
        }
      })
    ]);

    // Generate signed URLs for menu images
    const s3Service = require('../services/s3Service').default;
    console.log('🔍 DEBUG: Generating signed URLs for menus...');
    console.log('🔍 DEBUG: Found menus:', menus.length);
    
    const menusWithSignedUrls = await Promise.all(menus.map(async (menu) => {
      console.log(`🔍 DEBUG: Processing menu ${menu.event_id}:`, menu.menu_image_s3_url);
      
      if (menu.menu_image_s3_url) {
        try {
          // Extract the S3 key from the stored URL
          const s3Key = `menus/${menu.menu_image_s3_url.split('/').pop()}`;
          console.log(`🔍 DEBUG: Generated S3 key: ${s3Key}`);
          
          const signedUrl = await s3Service.getSignedUrl(s3Key, 3600); // 1 hour expiry
          console.log(`🔍 DEBUG: Generated signed URL: ${signedUrl.substring(0, 100)}...`);
          
          return {
            ...menu,
            menu_image_s3_url: signedUrl
          };
        } catch (error) {
          console.error(`❌ Failed to generate signed URL for menu ${menu.event_id}:`, error);
          return menu;
        }
      }
      console.log(`⚠️ Menu ${menu.event_id} has no S3 URL`);
      return menu;
    }));

    // Generate signed URLs for photos
    console.log('🔍 DEBUG: Generating signed URLs for photos...');
    console.log('🔍 DEBUG: Found photos:', photos.length);
    
    const photosWithSignedUrls = await Promise.all(photos.map(async (photo) => {
      console.log(`🔍 DEBUG: Processing photo ${photo.photo_id}:`, photo.s3_url);
      
      if (photo.s3_url) {
        try {
          // Extract the S3 key from the stored URL
          const s3Key = `photos/${photo.filename}`;
          console.log(`🔍 DEBUG: Generated S3 key: ${s3Key}`);
          
          const signedUrl = await s3Service.getSignedUrl(s3Key, 3600); // 1 hour expiry
          console.log(`🔍 DEBUG: Generated signed URL: ${signedUrl.substring(0, 100)}...`);
          
          return {
            ...photo,
            s3_url: signedUrl
          };
        } catch (error) {
          console.error(`❌ Failed to generate signed URL for photo ${photo.photo_id}:`, error);
          return photo;
        }
      }
      console.log(`⚠️ Photo ${photo.photo_id} has no S3 URL`);
      return photo;
    }));

    // Separate individual photos from page photos
    const individualPhotos = photosWithSignedUrls.filter(photo => photo.photo_type === 'individual');
    const pagePhotos = photosWithSignedUrls.filter(photo => photo.photo_type === 'page');

    res.status(200).json({
      success: true,
      data: {
        menus: menusWithSignedUrls,
        photos: individualPhotos,
        page_photos: pagePhotos,
        blogs
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

    // Get all journal pages for the specified year, ordered by page number
    const journalPages = await prisma.journalPage.findMany({
      where: {
        year: parseInt(year as string)
      },
      include: {
        content_items: {
          orderBy: {
            display_order: 'asc'
          }
        },
        event: {
          select: {
            event_id: true,
            event_name: true,
            event_date: true
          }
        }
      },
      orderBy: {
        page_number: 'asc'
      }
    });

    if (journalPages.length === 0) {
      res.status(404).json({
        success: false,
        message: 'No journal pages found for this year'
      } as ErrorResponse);
      return;
    }

    // Manually fetch related data for content items (same logic as getJournalPage)
    for (const page of journalPages) {
      if (page.content_items.length > 0) {
        const menuIds = page.content_items
          .filter(item => item.content_type === 'menu' && item.content_id)
          .map(item => item.content_id!);
        
        const photoIds = page.content_items
          .filter(item => (item.content_type === 'photo' || item.content_type === 'page_photo') && item.content_id)
          .map(item => item.content_id!);
        
        const blogIds = page.content_items
          .filter(item => item.content_type === 'blog' && item.content_id)
          .map(item => item.content_id!);

        const [menus, photos, blogs] = await Promise.all([
          menuIds.length > 0 ? prisma.event.findMany({ where: { event_id: { in: menuIds } } }) : [],
          photoIds.length > 0 ? prisma.photo.findMany({ where: { photo_id: { in: photoIds } } }) : [],
          blogIds.length > 0 ? prisma.blogPost.findMany({ where: { blog_post_id: { in: blogIds } } }) : []
        ]);

        // Generate signed URLs for menus
        const s3Service = require('../services/s3Service').default;
        console.log('🔍 JOURNAL VIEWER: Generating signed URLs for menus...');
        
        const menusWithSignedUrls = await Promise.all(menus.map(async (menu) => {
          if (menu.menu_image_s3_url) {
            try {
              // Extract the S3 key from the stored URL
              const s3Key = `menus/${menu.menu_image_s3_url.split('/').pop()}`;
              const signedUrl = await s3Service.getSignedUrl(s3Key, 3600); // 1 hour expiry
              return {
                ...menu,
                menu_image_s3_url: signedUrl
              };
            } catch (error) {
              console.error(`❌ Failed to generate signed URL for menu ${menu.event_id}:`, error);
              return menu;
            }
          }
          return menu;
        }));

        // Generate signed URLs for photos
        console.log('🔍 JOURNAL VIEWER: Generating signed URLs for photos...');
        
        const photosWithSignedUrls = await Promise.all(photos.map(async (photo) => {
          if (photo.s3_url) {
            try {
              // Extract the S3 key from the stored URL
              const s3Key = `photos/${photo.filename}`;
              const signedUrl = await s3Service.getSignedUrl(s3Key, 3600); // 1 hour expiry
              return {
                ...photo,
                s3_url: signedUrl
              };
            } catch (error) {
              console.error(`❌ Failed to generate signed URL for photo ${photo.photo_id}:`, error);
              return photo;
            }
          }
          return photo;
        }));

        // Attach related data to content items
        page.content_items.forEach(item => {
          if (item.content_type === 'menu' && item.content_id) {
            (item as any).menu = menusWithSignedUrls.find(menu => menu.event_id === item.content_id);
          } else if ((item.content_type === 'photo' || item.content_type === 'page_photo') && item.content_id) {
            (item as any).photo = photosWithSignedUrls.find(photo => photo.photo_id === item.content_id);
          } else if (item.content_type === 'blog' && item.content_id) {
            (item as any).blog_post = blogs.find(blog => blog.blog_post_id === item.content_id);
          }
        });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        year: parseInt(year as string),
        pages: journalPages
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

export const getJournalYears = async (_req: Request, res: Response): Promise<void> => {
  try {
    // Get all unique years from journal pages, ordered from oldest to newest
    const years = await prisma.journalPage.findMany({
      select: {
        year: true
      },
      distinct: ['year'],
      orderBy: {
        year: 'asc'
      }
    });

    res.status(200).json({
      success: true,
      data: {
        years: years.map(y => y.year)
      }
    });
  } catch (error) {
    console.error('Error fetching journal years:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    } as ErrorResponse);
  }
};
