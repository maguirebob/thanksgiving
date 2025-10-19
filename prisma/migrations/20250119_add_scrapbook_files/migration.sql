-- Create ScrapbookFiles table to track generated scrapbook files
-- This table tracks which years have scrapbooks available and their status

CREATE TABLE "ScrapbookFiles" (
  "id" SERIAL PRIMARY KEY,
  "year" INTEGER NOT NULL UNIQUE,
  "filename" VARCHAR(255) NOT NULL,
  "local_path" VARCHAR(500),
  "s3_url" VARCHAR(500),
  "s3_key" VARCHAR(500),
  "status" VARCHAR(20) NOT NULL DEFAULT 'generated' CHECK (status IN ('generated', 'error', 'processing')),
  "file_size" INTEGER,
  "generated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "last_accessed" TIMESTAMP,
  "access_count" INTEGER DEFAULT 0,
  "error_message" TEXT,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX idx_scrapbook_files_year ON "ScrapbookFiles" (year);
CREATE INDEX idx_scrapbook_files_status ON "ScrapbookFiles" (status);
CREATE INDEX idx_scrapbook_files_generated_at ON "ScrapbookFiles" (generated_at);
