// Journal-related TypeScript interfaces

export interface JournalPage {
  journal_page_id: number;
  event_id: number;
  year: number;
  page_number: number;
  title?: string;
  description?: string;
  layout_config?: any;
  is_published: boolean;
  created_at: Date;
  updated_at: Date;
  content_items?: JournalContentItem[];
}

export interface JournalContentItem {
  content_item_id: number;
  journal_page_id: number;
  content_type: ContentType;
  content_id?: number;
  custom_text?: string;
  heading_level?: number;
  display_order: number;
  is_visible: boolean;
  created_at: Date;
  updated_at: Date;
  // Related content data (populated via joins)
  photo?: PhotoData;
  blog_post?: BlogPostData;
  menu?: MenuData;
}

export type ContentType = 'menu' | 'photo' | 'page_photo' | 'blog' | 'text' | 'heading';

export type PhotoType = 'individual' | 'page';

// Extended interfaces for content data
export interface PhotoData {
  photo_id: number;
  filename: string;
  original_filename?: string;
  description?: string;
  caption?: string;
  s3_url?: string;
  photo_type: PhotoType;
  taken_date: Date;
}

export interface BlogPostData {
  blog_post_id: number;
  title: string;
  content: string;
  excerpt?: string;
  featured_image?: string;
  images: string[];
  tags: string[];
  status: string;
  published_at?: Date;
}

export interface MenuData {
  event_id: number;
  menu_title: string;
  menu_image_s3_url?: string;
  event_date: Date;
  event_name: string;
}

// API Request/Response interfaces
export interface CreateJournalPageRequest {
  event_id: number;
  year: number;
  page_number?: number;
  title?: string;
  description?: string;
  layout_config?: any;
}

export interface UpdateJournalPageRequest {
  title?: string;
  description?: string;
  layout_config?: any;
  is_published?: boolean;
}

export interface CreateContentItemRequest {
  content_type: ContentType;
  content_id?: number;
  custom_text?: string;
  heading_level?: number;
  display_order: number;
  is_visible?: boolean;
}

export interface UpdateContentItemRequest {
  content_type?: ContentType;
  content_id?: number;
  custom_text?: string;
  heading_level?: number;
  display_order?: number;
  is_visible?: boolean;
}

export interface ReorderContentItemsRequest {
  content_items: Array<{
    content_item_id: number;
    display_order: number;
  }>;
}

export interface UpdatePhotoTypeRequest {
  photo_type: PhotoType;
}

// API Response interfaces
export interface JournalPageResponse {
  success: boolean;
  data: {
    journal_page: JournalPage;
  };
}

export interface JournalPagesResponse {
  success: boolean;
  data: {
    journal_pages: JournalPage[];
    pagination?: {
      total: number;
      page: number;
      limit: number;
    };
  };
}

export interface ContentItemsResponse {
  success: boolean;
  data: {
    content_items: JournalContentItem[];
  };
}

export interface AvailableContentResponse {
  success: boolean;
  data: {
    menus: MenuData[];
    photos: PhotoData[];
    page_photos: PhotoData[];
    blogs: BlogPostData[];
  };
}

export interface PhotoTypeResponse {
  success: boolean;
  data: {
    photo: PhotoData;
    photo_type: PhotoType;
  };
}

// Error response interface
export interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
}
