-- CreateEnum
CREATE TYPE "PhotoType" AS ENUM ('individual', 'page');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('menu', 'photo', 'page_photo', 'blog', 'text', 'heading');

-- AlterTable
ALTER TABLE "Photos" ADD COLUMN "photo_type" "PhotoType" NOT NULL DEFAULT 'individual';

-- CreateTable
CREATE TABLE "JournalPages" (
    "journal_page_id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "page_number" INTEGER NOT NULL DEFAULT 1,
    "title" VARCHAR(255),
    "description" TEXT,
    "layout_config" JSONB,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JournalPages_pkey" PRIMARY KEY ("journal_page_id")
);

-- CreateTable
CREATE TABLE "JournalContentItems" (
    "content_item_id" SERIAL NOT NULL,
    "journal_page_id" INTEGER NOT NULL,
    "content_type" "ContentType" NOT NULL,
    "content_id" INTEGER,
    "custom_text" TEXT,
    "heading_level" INTEGER DEFAULT 1,
    "display_order" INTEGER NOT NULL,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JournalContentItems_pkey" PRIMARY KEY ("content_item_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JournalPages_event_id_year_page_number_key" ON "JournalPages"("event_id", "year", "page_number");

-- AddForeignKey
ALTER TABLE "JournalPages" ADD CONSTRAINT "JournalPages_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("event_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalContentItems" ADD CONSTRAINT "JournalContentItems_journal_page_id_fkey" FOREIGN KEY ("journal_page_id") REFERENCES "JournalPages"("journal_page_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalContentItems" ADD CONSTRAINT "JournalContentItems_photo_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "Photos"("photo_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalContentItems" ADD CONSTRAINT "JournalContentItems_blog_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "BlogPosts"("blog_post_id") ON DELETE SET NULL ON UPDATE CASCADE;



