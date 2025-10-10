-- AlterTable
ALTER TABLE "events" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "JournalContentItems" ADD CONSTRAINT "JournalContentItems_menu_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "events"("event_id") ON DELETE SET NULL ON UPDATE CASCADE;
