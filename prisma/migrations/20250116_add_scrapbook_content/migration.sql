-- Create temporary ScrapbookContent table for HTML generation
-- This table is only used temporarily during HTML generation
-- Once HTML files are created, content can be deleted from database

CREATE TABLE "ScrapbookContent" (
  "id" SERIAL PRIMARY KEY,
  "year" INTEGER NOT NULL,
  "content_type" TEXT NOT NULL CHECK (content_type IN ('title', 'text-paragraph', 'menu', 'photo', 'page-photo', 'blog')),
  "content_reference" TEXT NOT NULL, -- Image filename or content ID
  "display_order" INTEGER NOT NULL,
  "page_break_before" BOOLEAN DEFAULT false,
  "page_break_after" BOOLEAN DEFAULT false,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(year, display_order)
);

-- Add indexes for performance
CREATE INDEX idx_scrapbook_content_year ON "ScrapbookContent" (year);
CREATE INDEX idx_scrapbook_content_order ON "ScrapbookContent" (year, display_order);
CREATE INDEX idx_scrapbook_content_type ON "ScrapbookContent" (content_type);
