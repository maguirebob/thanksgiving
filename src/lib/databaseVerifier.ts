import prisma from './prisma';

export interface DatabaseVerificationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  schema: {
    tables: string[];
    columns: Record<string, string[]>;
  };
  timestamp: string;
}

export const verifyDatabaseStructure = async (): Promise<DatabaseVerificationResult> => {
  const result: DatabaseVerificationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    schema: {
      tables: [],
      columns: {}
    },
    timestamp: new Date().toISOString()
  };

  try {
    console.log('🔍 Starting database structure verification...');

    // Get all tables
    const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;

    result.schema.tables = tables.map(t => t.table_name);
    console.log('📊 Found tables:', result.schema.tables);

    // Check each table for expected columns
    for (const table of result.schema.tables) {
      const columns = await prisma.$queryRaw<Array<{ column_name: string }>>`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = ${table}
        ORDER BY column_name;
      `;
      
      result.schema.columns[table] = columns.map(c => c.column_name);
    }

    // Verify JournalSections table structure
    if (result.schema.tables.includes('JournalSections')) {
      const journalSectionsColumns = result.schema.columns['JournalSections'];
      if (journalSectionsColumns) {
        const expectedColumns = ['section_id', 'event_id', 'year', 'section_order', 'title', 'description', 'created_at', 'updated_at'];
        
        for (const expectedCol of expectedColumns) {
          if (!journalSectionsColumns.includes(expectedCol)) {
            result.errors.push(`JournalSections table missing column: ${expectedCol}`);
            result.isValid = false;
          }
        }
      }
    } else {
      result.errors.push('JournalSections table does not exist');
      result.isValid = false;
    }

    // Verify JournalContentItems table structure
    if (result.schema.tables.includes('JournalContentItems')) {
      const contentItemsColumns = result.schema.columns['JournalContentItems'];
      if (contentItemsColumns) {
        const expectedColumns = [
          'content_item_id', 
          'journal_section_id', 
          'content_type', 
          'content_id', 
          'custom_text', 
          'heading_level', 
          'display_order', 
          'is_visible', 
          'created_at', 
          'updated_at'
        ];
        
        for (const expectedCol of expectedColumns) {
          if (!contentItemsColumns.includes(expectedCol)) {
            result.errors.push(`JournalContentItems table missing column: ${expectedCol}`);
            result.isValid = false;
          }
        }

        // Check for optional columns that might be missing
        const optionalColumns = ['manual_page_break', 'page_break_position'];
        for (const optionalCol of optionalColumns) {
          if (!contentItemsColumns.includes(optionalCol)) {
            result.warnings.push(`JournalContentItems table missing optional column: ${optionalCol}`);
          }
        }
      }
    } else {
      result.errors.push('JournalContentItems table does not exist');
      result.isValid = false;
    }

    // Verify Events table structure
    if (result.schema.tables.includes('Events')) {
      const eventsColumns = result.schema.columns['Events'];
      if (eventsColumns) {
        const expectedColumns = ['event_id', 'event_name', 'event_date', 'created_at', 'updated_at'];
        
        for (const expectedCol of expectedColumns) {
          if (!eventsColumns.includes(expectedCol)) {
            result.errors.push(`Events table missing column: ${expectedCol}`);
            result.isValid = false;
          }
        }
      }
    } else {
      result.errors.push('Events table does not exist');
      result.isValid = false;
    }

    // Check for old table names that should have been migrated
    if (result.schema.tables.includes('JournalPages')) {
      result.errors.push('JournalPages table still exists - migration may not have completed');
      result.isValid = false;
    }

    console.log('✅ Database verification completed');
    console.log('📊 Results:', {
      isValid: result.isValid,
      errorCount: result.errors.length,
      warningCount: result.warnings.length
    });

  } catch (error) {
    console.error('❌ Database verification failed:', error);
    result.isValid = false;
    result.errors.push(`Database verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
};

export const getDatabaseStatus = async (): Promise<{
  status: 'healthy' | 'warning' | 'error';
  message: string;
  details: DatabaseVerificationResult;
}> => {
  const verification = await verifyDatabaseStructure();
  
  if (verification.isValid && verification.warnings.length === 0) {
    return {
      status: 'healthy',
      message: 'Database structure is correct',
      details: verification
    };
  } else if (verification.isValid && verification.warnings.length > 0) {
    return {
      status: 'warning',
      message: `Database structure is correct but has ${verification.warnings.length} warnings`,
      details: verification
    };
  } else {
    return {
      status: 'error',
      message: `Database structure has ${verification.errors.length} errors`,
      details: verification
    };
  }
};
