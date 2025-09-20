-- Blog Tables for Thanksgiving Website
-- Created: 2024
-- Purpose: Support blog functionality for Thanksgiving events

-- Create BlogCategories table
CREATE TABLE IF NOT EXISTS blog_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#007bff', -- Hex color code
    slug VARCHAR(100) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create BlogTags table
CREATE TABLE IF NOT EXISTS blog_tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create BlogPosts table
CREATE TABLE IF NOT EXISTS blog_posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    content TEXT NOT NULL,
    excerpt TEXT,
    featured_image_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    is_featured BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id INTEGER REFERENCES events(id) ON DELETE SET NULL,
    category_id INTEGER REFERENCES blog_categories(id) ON DELETE SET NULL,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create BlogPostTags junction table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS blog_post_tags (
    id SERIAL PRIMARY KEY,
    blog_post_id INTEGER NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    blog_tag_id INTEGER NOT NULL REFERENCES blog_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(blog_post_id, blog_tag_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_event_id ON blog_posts(event_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category_id ON blog_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at);
CREATE INDEX IF NOT EXISTS idx_blog_posts_is_featured ON blog_posts(is_featured);
CREATE INDEX IF NOT EXISTS idx_blog_posts_view_count ON blog_posts(view_count);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_categories_slug ON blog_categories(slug);
CREATE INDEX IF NOT EXISTS idx_blog_categories_is_active ON blog_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_blog_tags_slug ON blog_tags(slug);
CREATE INDEX IF NOT EXISTS idx_blog_tags_usage_count ON blog_tags(usage_count);
CREATE INDEX IF NOT EXISTS idx_blog_post_tags_blog_post_id ON blog_post_tags(blog_post_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_tags_blog_tag_id ON blog_post_tags(blog_tag_id);

-- Insert sample blog categories
INSERT INTO blog_categories (name, description, color, slug) VALUES
('Recipes', 'Thanksgiving recipes and cooking tips', '#28a745', 'recipes'),
('Memories', 'Family memories and stories from past Thanksgivings', '#ffc107', 'memories'),
('Traditions', 'Family traditions and customs', '#17a2b8', 'traditions'),
('Tips', 'Helpful tips for hosting Thanksgiving', '#6f42c1', 'tips'),
('Decorations', 'Thanksgiving decoration ideas', '#fd7e14', 'decorations')
ON CONFLICT (slug) DO NOTHING;

-- Insert sample blog tags
INSERT INTO blog_tags (name, slug, description) VALUES
('turkey', 'turkey', 'Posts about turkey preparation and cooking'),
('stuffing', 'stuffing', 'Posts about stuffing recipes and techniques'),
('desserts', 'desserts', 'Posts about Thanksgiving desserts'),
('family', 'family', 'Posts about family gatherings and traditions'),
('cooking', 'cooking', 'Posts about cooking techniques and tips'),
('decorations', 'decorations', 'Posts about Thanksgiving decorations'),
('memories', 'memories', 'Posts sharing family memories'),
('tips', 'tips', 'Helpful tips and advice'),
('recipes', 'recipes', 'Recipe-related content'),
('traditions', 'traditions', 'Family and cultural traditions')
ON CONFLICT (slug) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_blog_categories_updated_at 
    BEFORE UPDATE ON blog_categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blog_tags_updated_at 
    BEFORE UPDATE ON blog_tags 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blog_posts_updated_at 
    BEFORE UPDATE ON blog_posts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to generate slug from title
CREATE OR REPLACE FUNCTION generate_slug(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN lower(regexp_replace(regexp_replace(input_text, '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '-', 'g'));
END;
$$ LANGUAGE plpgsql;

-- Create function to ensure unique slugs for blog posts
CREATE OR REPLACE FUNCTION ensure_unique_blog_post_slug()
RETURNS TRIGGER AS $$
DECLARE
    base_slug TEXT;
    new_slug TEXT;
    counter INTEGER := 0;
BEGIN
    -- Generate base slug from title
    base_slug := generate_slug(NEW.title);
    new_slug := base_slug;
    
    -- Check if slug already exists (excluding current record for updates)
    WHILE EXISTS (
        SELECT 1 FROM blog_posts 
        WHERE slug = new_slug 
        AND (TG_OP = 'INSERT' OR id != NEW.id)
    ) LOOP
        counter := counter + 1;
        new_slug := base_slug || '-' || counter;
    END LOOP;
    
    NEW.slug := new_slug;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to ensure unique slugs for blog posts
CREATE TRIGGER ensure_unique_blog_post_slug_trigger
    BEFORE INSERT OR UPDATE ON blog_posts
    FOR EACH ROW EXECUTE FUNCTION ensure_unique_blog_post_slug();

-- Create function to update tag usage count
CREATE OR REPLACE FUNCTION update_tag_usage_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE blog_tags 
        SET usage_count = usage_count + 1 
        WHERE id = NEW.blog_tag_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE blog_tags 
        SET usage_count = usage_count - 1 
        WHERE id = OLD.blog_tag_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update tag usage count
CREATE TRIGGER update_tag_usage_count_trigger
    AFTER INSERT OR DELETE ON blog_post_tags
    FOR EACH ROW EXECUTE FUNCTION update_tag_usage_count();

-- Add comments for documentation
COMMENT ON TABLE blog_categories IS 'Categories for organizing blog posts';
COMMENT ON TABLE blog_tags IS 'Tags for labeling and searching blog posts';
COMMENT ON TABLE blog_posts IS 'Main table for blog posts content';
COMMENT ON TABLE blog_post_tags IS 'Junction table for many-to-many relationship between posts and tags';

COMMENT ON COLUMN blog_posts.status IS 'Post status: draft, published, or archived';
COMMENT ON COLUMN blog_posts.is_featured IS 'Whether this post should be featured on the homepage';
COMMENT ON COLUMN blog_posts.view_count IS 'Number of times this post has been viewed';
COMMENT ON COLUMN blog_posts.published_at IS 'When the post was published (NULL for drafts)';
COMMENT ON COLUMN blog_categories.color IS 'Hex color code for category display';
COMMENT ON COLUMN blog_tags.usage_count IS 'Number of times this tag has been used';
