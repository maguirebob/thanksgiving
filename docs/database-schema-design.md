# Database Schema Design for Tabbed Navigation Content

## Overview
This document outlines the database schema design for the tabbed navigation system content types: **Photos**, **Recipes**, and **Blog Posts**.

## Current Schema Analysis
- **Users**: Authentication and user management ✅
- **Sessions**: User session management ✅  
- **Events**: Thanksgiving events/menus ✅
- **Photos**: Event photos ✅

## New Schema Requirements

### 1. Recipes Table
**Purpose**: Store Thanksgiving recipes associated with events

```sql
CREATE TABLE Recipes (
    recipe_id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES Users(user_id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    ingredients TEXT NOT NULL,
    instructions TEXT NOT NULL,
    prep_time INTEGER, -- minutes
    cook_time INTEGER, -- minutes
    servings INTEGER,
    difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('Easy', 'Medium', 'Hard')),
    category VARCHAR(50), -- e.g., 'Main Course', 'Side Dish', 'Dessert', 'Appetizer'
    image_filename VARCHAR(255),
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Relationships**:
- `event_id` → `events.event_id` (Many recipes belong to one event)
- `user_id` → `Users.user_id` (Recipe author, nullable for imported recipes)

### 2. Blog Posts Table
**Purpose**: Store blog posts/stories about Thanksgiving events

```sql
CREATE TABLE BlogPosts (
    blog_post_id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT, -- Short summary for previews
    featured_image VARCHAR(255),
    tags TEXT[], -- Array of tags
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Relationships**:
- `event_id` → `events.event_id` (Many blog posts belong to one event)
- `user_id` → `Users.user_id` (Blog post author)

## Updated Event Model
The existing Event model should be enhanced to include computed fields:

```sql
-- Add computed fields to events table (via Prisma)
-- These will be calculated dynamically:
-- - recipe_count: COUNT(Recipes WHERE event_id = events.event_id)
-- - blog_post_count: COUNT(BlogPosts WHERE event_id = events.event_id)  
-- - photo_count: COUNT(Photos WHERE event_id = events.event_id) [existing]
```

## Indexes for Performance
```sql
-- Recipes indexes
CREATE INDEX idx_recipes_event_id ON Recipes(event_id);
CREATE INDEX idx_recipes_user_id ON Recipes(user_id);
CREATE INDEX idx_recipes_category ON Recipes(category);
CREATE INDEX idx_recipes_featured ON Recipes(is_featured);

-- Blog Posts indexes
CREATE INDEX idx_blog_posts_event_id ON BlogPosts(event_id);
CREATE INDEX idx_blog_posts_user_id ON BlogPosts(user_id);
CREATE INDEX idx_blog_posts_status ON BlogPosts(status);
CREATE INDEX idx_blog_posts_published_at ON BlogPosts(published_at);
```

## Data Validation Rules

### Recipes
- `title`: Required, max 255 characters
- `ingredients`: Required, non-empty
- `instructions`: Required, non-empty
- `prep_time`, `cook_time`: Non-negative integers
- `servings`: Positive integer
- `difficulty_level`: Must be one of: Easy, Medium, Hard
- `category`: Must be one of: Main Course, Side Dish, Dessert, Appetizer, Beverage

### Blog Posts
- `title`: Required, max 255 characters
- `content`: Required, minimum 100 characters
- `excerpt`: Optional, max 500 characters
- `status`: Must be one of: draft, published, archived
- `published_at`: Required when status = 'published'

## Migration Strategy
1. Create new tables in separate migration
2. Add indexes after table creation
3. Update Prisma schema
4. Generate new Prisma client
5. Test with sample data

## Sample Data
Each table will need sample data for testing:
- 3-5 recipes per event
- 2-3 blog posts per event  
- Photos already exist

This schema design provides a solid foundation for the tabbed navigation content with **Photos**, **Recipes**, and **Blog Posts** while maintaining referential integrity and performance.
