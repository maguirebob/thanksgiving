import prisma from './prisma';
import { 
  getCurrentVersion, 
  getSchemaVersion, 
  hasSchemaDefinition,
  getLatestSchemaVersion,
  type SchemaVersion 
} from './schemaVersions';

export interface DatabaseVerificationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  schema: {
    tables: string[];
    columns: Record<string, string[]>;
  };
  timestamp: string;
  versionInfo: {
    currentVersion: string;
    hasSchemaDefinition: boolean;
    schemaVersion: SchemaVersion | null;
    latestSchemaVersion: string;
    versionMismatch: boolean;
  };
}

export const verifyDatabaseStructure = async (): Promise<DatabaseVerificationResult> => {
  const currentVersion = getCurrentVersion();
  const schemaVersion = getSchemaVersion(currentVersion);
  const hasDefinition = hasSchemaDefinition(currentVersion);
  const latestSchemaVersion = getLatestSchemaVersion();
  
  const result: DatabaseVerificationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    schema: {
      tables: [],
      columns: {}
    },
    timestamp: new Date().toISOString(),
    versionInfo: {
      currentVersion,
      hasSchemaDefinition: hasDefinition,
      schemaVersion,
      latestSchemaVersion,
      versionMismatch: currentVersion !== latestSchemaVersion
    }
  };

  try {
    console.log('🔍 Starting database structure verification...');
    console.log('📊 Version info:', {
      current: currentVersion,
      hasDefinition,
      latest: latestSchemaVersion
    });

    // Check if current version has schema definition
    if (!hasDefinition) {
      result.errors.push(`No schema definition found for version ${currentVersion}. Please add schema definition to schemaVersions.ts`);
      result.isValid = false;
    }

    // Version mismatch warning removed - not useful

    // If no schema definition, we can't verify structure
    if (!schemaVersion) {
      console.log('❌ No schema definition available for verification');
      return result;
    }

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

    // Verify required tables exist
    for (const requiredTable of schemaVersion.requiredTables) {
      if (!result.schema.tables.includes(requiredTable)) {
        result.errors.push(`Required table '${requiredTable}' does not exist`);
        result.isValid = false;
      }
    }

    // Verify required columns for each table
    for (const [tableName, requiredColumns] of Object.entries(schemaVersion.requiredColumns)) {
      if (result.schema.tables.includes(tableName)) {
        const actualColumns = result.schema.columns[tableName];
        if (actualColumns) {
          for (const requiredCol of requiredColumns) {
            if (!actualColumns.includes(requiredCol)) {
              result.errors.push(`${tableName} table missing required column: ${requiredCol}`);
              result.isValid = false;
            }
          }
        }
      }
    }

    // Check for optional columns
    for (const [tableName, optionalColumns] of Object.entries(schemaVersion.optionalColumns)) {
      if (result.schema.tables.includes(tableName)) {
        const actualColumns = result.schema.columns[tableName];
        if (actualColumns) {
          for (const optionalCol of optionalColumns) {
            if (!actualColumns.includes(optionalCol)) {
              result.warnings.push(`${tableName} table missing optional column: ${optionalCol}`);
            }
          }
        }
      }
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
