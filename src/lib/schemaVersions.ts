export interface SchemaVersion {
  version: string;
  requiredTables: string[];
  requiredColumns: Record<string, string[]>;
  optionalColumns: Record<string, string[]>;
  migrationStatus: 'complete' | 'in-progress' | 'pending';
  notes?: string;
}

export const SCHEMA_VERSIONS: Record<string, SchemaVersion> = {
  '2.13.29': {
    version: '2.13.29',
    requiredTables: [
      'events',
      'JournalSections', 
      'JournalContentItems',
      'Users',
      'BlogPosts',
      'Photos',
      'Recipes',
      'Sessions'
    ],
    requiredColumns: {
      'events': [
        'event_id',
        'event_name', 
        'event_type',
        'event_location',
        'event_date',
        'event_description',
        'menu_title',
        'menu_image_filename',
        'created_at',
        'updated_at',
        'menu_image_s3_url'
      ],
      'JournalSections': [
        'section_id',
        'event_id',
        'year',
        'section_order',
        'title',
        'description',
        'created_at',
        'updated_at'
      ],
      'JournalContentItems': [
        'content_item_id',
        'journal_section_id',
        'content_type',
        'content_id',
        'custom_text',
        'heading_level',
        'display_order',
        'is_visible',
        'created_at',
        'updated_at'
      ],
      'Users': [
        'user_id',
        'username',
        'email',
        'password_hash',
        'role',
        'created_at',
        'updated_at'
      ],
      'BlogPosts': [
        'blog_post_id',
        'event_id',
        'title',
        'content',
        'excerpt',
        'featured_image',
        'images',
        'status',
        'tags',
        'user_id',
        'published_at',
        'created_at',
        'updated_at'
      ],
      'Photos': [
        'photo_id',
        'event_id',
        'filename',
        'original_filename',
        'caption',
        'description',
        'taken_date',
        'photo_type',
        'file_data',
        'file_size',
        'mime_type',
        's3_url',
        'created_at',
        'updated_at'
      ],
      'Recipes': [
        'recipe_id',
        'event_id',
        'title',
        'description',
        'category',
        'difficulty_level',
        'prep_time',
        'cook_time',
        'servings',
        'is_featured',
        'image_filename',
        'image_s3_url',
        'user_id',
        'ingredients',
        'instructions',
        'created_at',
        'updated_at'
      ],
      'Sessions': [
        'session_id',
        'user_id',
        'expires',
        'data',
        'created_at'
      ]
    },
    optionalColumns: {
      'JournalContentItems': [
        'manual_page_break',
        'page_break_position'
      ]
    },
    migrationStatus: 'complete',
    notes: 'Initial schema verification system - JournalPages renamed to JournalSections'
  },
  '2.13.30': {
    version: '2.13.30',
    requiredTables: [
      'events',
      'JournalSections', 
      'JournalContentItems',
      'Users',
      'BlogPosts',
      'Photos',
      'Recipes',
      'Sessions'
    ],
    requiredColumns: {
      'events': [
        'event_id',
        'event_name', 
        'event_type',
        'event_location',
        'event_date',
        'event_description',
        'menu_title',
        'menu_image_filename',
        'created_at',
        'updated_at',
        'menu_image_s3_url'
      ],
      'JournalSections': [
        'section_id',
        'event_id',
        'year',
        'section_order',
        'title',
        'description',
        'created_at',
        'updated_at'
      ],
      'JournalContentItems': [
        'content_item_id',
        'journal_section_id',
        'content_type',
        'content_id',
        'custom_text',
        'heading_level',
        'display_order',
        'is_visible',
        'manual_page_break',
        'page_break_position',
        'created_at',
        'updated_at'
      ],
      'Users': [
        'user_id',
        'username',
        'email',
        'password_hash',
        'role',
        'first_name',
        'last_name',
        'created_at',
        'updated_at'
      ],
      'BlogPosts': [
        'blog_post_id',
        'event_id',
        'user_id',
        'title',
        'content',
        'excerpt',
        'featured_image',
        'tags',
        'status',
        'published_at',
        'created_at',
        'updated_at',
        'images'
      ],
      'Photos': [
        'photo_id',
        'event_id',
        'filename',
        'original_filename',
        'description',
        'caption',
        'taken_date',
        'file_size',
        'mime_type',
        'file_data',
        'created_at',
        'updated_at',
        's3_url',
        'photo_type'
      ],
      'Recipes': [
        'recipe_id',
        'event_id',
        'user_id',
        'title',
        'description',
        'ingredients',
        'instructions',
        'prep_time',
        'cook_time',
        'servings',
        'difficulty_level',
        'category',
        'image_filename',
        'is_featured',
        'created_at',
        'updated_at',
        'image_s3_url'
      ],
      'Sessions': [
        'session_id',
        'user_id',
        'expires',
        'data',
        'created_at'
      ]
    },
    optionalColumns: {},
    migrationStatus: 'complete',
    notes: 'Added manual_page_break and page_break_position columns to JournalContentItems as required fields'
  }
};

export const getCurrentVersion = (): string => {
  try {
    const packageJson = require('../../package.json');
    return packageJson.version;
  } catch (error) {
    console.error('Failed to get current version from package.json:', error);
    return 'unknown';
  }
};

export const getSchemaVersion = (version: string): SchemaVersion | null => {
  return SCHEMA_VERSIONS[version] || null;
};

export const hasSchemaDefinition = (version: string): boolean => {
  return version in SCHEMA_VERSIONS;
};

export const getLatestSchemaVersion = (): string => {
  const versions = Object.keys(SCHEMA_VERSIONS).sort((a, b) => {
    // Simple version comparison - could be improved with semver
    return a.localeCompare(b, undefined, { numeric: true });
  });
  return versions[versions.length - 1] || 'unknown';
};
