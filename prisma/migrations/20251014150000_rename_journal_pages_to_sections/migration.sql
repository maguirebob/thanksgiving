-- Rename JournalPages table to JournalSections
-- This migration safely renames the table without data loss

-- Step 1: Rename the foreign key column in JournalContentItems FIRST
ALTER TABLE "JournalContentItems" RENAME COLUMN "journal_page_id" TO "journal_section_id";

-- Step 2: Rename the table
ALTER TABLE "JournalPages" RENAME TO "JournalSections";

-- Step 3: Rename the primary key column from journal_page_id to section_id
ALTER TABLE "JournalSections" RENAME COLUMN "journal_page_id" TO "section_id";

-- Step 4: Rename the page_number column to section_order
ALTER TABLE "JournalSections" RENAME COLUMN "page_number" TO "section_order";

-- Step 5: Update the foreign key constraint name
ALTER TABLE "JournalContentItems" DROP CONSTRAINT "JournalContentItems_journal_page_id_fkey";
ALTER TABLE "JournalContentItems" ADD CONSTRAINT "JournalContentItems_journal_section_id_fkey" 
    FOREIGN KEY ("journal_section_id") REFERENCES "JournalSections"("section_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 6: Update the unique constraint name
DROP INDEX "JournalPages_event_id_year_page_number_key";
CREATE UNIQUE INDEX "JournalSections_event_id_year_section_order_key" ON "JournalSections"("event_id", "year", "section_order");

-- Step 7: Update the foreign key constraint name for events
ALTER TABLE "JournalSections" DROP CONSTRAINT "JournalPages_event_id_fkey";
ALTER TABLE "JournalSections" ADD CONSTRAINT "JournalSections_event_id_fkey" 
    FOREIGN KEY ("event_id") REFERENCES "events"("event_id") ON DELETE CASCADE ON UPDATE CASCADE;