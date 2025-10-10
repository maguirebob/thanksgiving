#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateJournalSchema() {
  console.log('🔄 Starting Journal Schema Migration...');
  
  try {
    // Step 1: Create the new JournalSections table
    console.log('📋 Creating JournalSections table...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "JournalSections" (
        "section_id" SERIAL PRIMARY KEY,
        "event_id" INTEGER NOT NULL,
        "year" INTEGER NOT NULL,
        "section_order" INTEGER NOT NULL DEFAULT 1,
        "title" VARCHAR(255),
        "description" TEXT,
        "layout_config" JSONB,
        "is_published" BOOLEAN NOT NULL DEFAULT false,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "JournalSections_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("event_id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "JournalSections_event_id_year_section_order_key" UNIQUE ("event_id", "year", "section_order")
      );
    `;

    // Step 2: Migrate data from JournalPages to JournalSections
    console.log('📦 Migrating data from JournalPages to JournalSections...');
    await prisma.$executeRaw`
      INSERT INTO "JournalSections" (
        "section_id", "event_id", "year", "section_order", "title", "description", 
        "layout_config", "is_published", "created_at", "updated_at"
      )
      SELECT 
        "journal_page_id", "event_id", "year", "page_number", "title", "description",
        "layout_config", "is_published", "created_at", "updated_at"
      FROM "JournalPages";
    `;

    // Step 3: Add new columns to JournalContentItems
    console.log('🔧 Adding new columns to JournalContentItems...');
    await prisma.$executeRaw`
      ALTER TABLE "JournalContentItems" 
      ADD COLUMN IF NOT EXISTS "journal_section_id" INTEGER,
      ADD COLUMN IF NOT EXISTS "manual_page_break" BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "page_break_position" INTEGER DEFAULT 1;
    `;

    // Step 4: Update journal_section_id to match the migrated data
    console.log('🔗 Updating foreign key references...');
    await prisma.$executeRaw`
      UPDATE "JournalContentItems" 
      SET "journal_section_id" = "journal_page_id";
    `;

    // Step 5: Make journal_section_id NOT NULL
    console.log('✅ Making journal_section_id NOT NULL...');
    await prisma.$executeRaw`
      ALTER TABLE "JournalContentItems" 
      ALTER COLUMN "journal_section_id" SET NOT NULL;
    `;

    // Step 6: Add foreign key constraint
    console.log('🔗 Adding foreign key constraint...');
    await prisma.$executeRaw`
      ALTER TABLE "JournalContentItems" 
      ADD CONSTRAINT "JournalContentItems_journal_section_id_fkey" 
      FOREIGN KEY ("journal_section_id") REFERENCES "JournalSections"("section_id") 
      ON DELETE CASCADE ON UPDATE CASCADE;
    `;

    // Step 7: Drop old foreign key constraint and column
    console.log('🗑️ Removing old foreign key constraint...');
    await prisma.$executeRaw`
      ALTER TABLE "JournalContentItems" 
      DROP CONSTRAINT IF EXISTS "JournalContentItems_journal_page_id_fkey";
    `;

    console.log('🗑️ Dropping old journal_page_id column...');
    await prisma.$executeRaw`
      ALTER TABLE "JournalContentItems" 
      DROP COLUMN IF EXISTS "journal_page_id";
    `;

    // Step 8: Drop the old JournalPages table
    console.log('🗑️ Dropping old JournalPages table...');
    await prisma.$executeRaw`
      DROP TABLE IF EXISTS "JournalPages";
    `;

    // Step 9: Update the Event table foreign key reference
    console.log('🔗 Updating Event table foreign key reference...');
    await prisma.$executeRaw`
      ALTER TABLE "events" 
      DROP CONSTRAINT IF EXISTS "events_journal_pages_fkey";
    `;

    console.log('✅ Journal Schema Migration completed successfully!');
    
    // Verify the migration
    const sectionCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "JournalSections"` as any[];
    const itemCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "JournalContentItems"` as any[];
    
    console.log(`📊 Migration Results:`);
    console.log(`   - JournalSections: ${sectionCount[0].count} records`);
    console.log(`   - JournalContentItems: ${itemCount[0].count} records`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateJournalSchema()
  .then(() => {
    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });
