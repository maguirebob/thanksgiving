-- AlterTable
ALTER TABLE "ScrapbookContent" DROP CONSTRAINT "ScrapbookContent_content_type_check";

-- AlterTable
ALTER TABLE "ScrapbookContent" ADD CONSTRAINT "ScrapbookContent_content_type_check" CHECK (content_type IN ('title', 'text-paragraph', 'menu', 'photo', 'page-photo', 'blog', 'heading'));
