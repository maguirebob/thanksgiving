-- AlterTable
ALTER TABLE "JournalContentItems" ADD COLUMN "manual_page_break" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "JournalContentItems" ADD COLUMN "page_break_position" INTEGER DEFAULT 1;
