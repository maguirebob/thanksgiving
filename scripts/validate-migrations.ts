#!/usr/bin/env ts-node

/**
 * Migration Validation Script
 * Validates migration files before deployment to prevent production issues
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

interface MigrationFile {
  name: string;
  path: string;
  content: string;
  errors: string[];
  warnings: string[];
}

class MigrationValidator {
  private migrationsDir = './prisma/migrations';
  private criticalTables = ['Users', 'events', 'Photos', 'JournalSections', 'JournalContentItems'];
  
  async validateAllMigrations(): Promise<void> {
    console.log('🔍 Validating all migration files...\n');
    
    const migrations = this.getMigrationFiles();
    
    if (migrations.length === 0) {
      console.log('⚠️  No migration files found');
      return;
    }
    
    let hasErrors = false;
    let hasWarnings = false;
    
    for (const migration of migrations) {
      console.log(`📋 Validating: ${migration.name}`);
      
      // Validate SQL syntax
      this.validateSQLSyntax(migration);
      
      // Validate table operations
      this.validateTableOperations(migration);
      
      // Validate data safety
      this.validateDataSafety(migration);
      
      // Validate foreign key operations
      this.validateForeignKeyOperations(migration);
      
      // Report results
      if (migration.errors.length > 0) {
        hasErrors = true;
        console.log(`❌ Errors:`);
        migration.errors.forEach(error => console.log(`   - ${error}`));
      }
      
      if (migration.warnings.length > 0) {
        hasWarnings = true;
        console.log(`⚠️  Warnings:`);
        migration.warnings.forEach(warning => console.log(`   - ${warning}`));
      }
      
      if (migration.errors.length === 0 && migration.warnings.length === 0) {
        console.log(`✅ Valid`);
      }
      
      console.log('');
    }
    
    // Summary
    console.log('📊 Validation Summary:');
    console.log(`   Total migrations: ${migrations.length}`);
    console.log(`   Errors: ${migrations.reduce((sum, m) => sum + m.errors.length, 0)}`);
    console.log(`   Warnings: ${migrations.reduce((sum, m) => sum + m.warnings.length, 0)}`);
    
    if (hasErrors) {
      console.log('\n❌ Validation failed - fix errors before deployment');
      process.exit(1);
    } else if (hasWarnings) {
      console.log('\n⚠️  Validation completed with warnings - review before deployment');
    } else {
      console.log('\n✅ All migrations validated successfully');
    }
  }
  
  private getMigrationFiles(): MigrationFile[] {
    const migrations: MigrationFile[] = [];
    
    if (!statSync(this.migrationsDir).isDirectory()) {
      return migrations;
    }
    
    const dirs = readdirSync(this.migrationsDir)
      .filter(item => statSync(join(this.migrationsDir, item)).isDirectory())
      .sort();
    
    for (const dir of dirs) {
      const migrationPath = join(this.migrationsDir, dir, 'migration.sql');
      
      if (statSync(migrationPath).isFile()) {
        const content = readFileSync(migrationPath, 'utf8');
        migrations.push({
          name: dir,
          path: migrationPath,
          content,
          errors: [],
          warnings: []
        });
      }
    }
    
    return migrations;
  }
  
  private validateSQLSyntax(migration: MigrationFile): void {
    const content = migration.content;
    
    // Check for basic SQL syntax issues
    if (!content.trim()) {
      migration.errors.push('Migration file is empty');
      return;
    }
    
    // Check for missing semicolons
    const statements = content.split(';').filter(s => s.trim());
    if (statements.length > 0) {
      if (!content.trim().endsWith(';')) {
        migration.warnings.push('Migration may be missing final semicolon');
      }
    }
    
    // Check for dangerous operations
    const dangerousPatterns = [
      { pattern: /DROP\s+DATABASE/i, message: 'DROP DATABASE detected - extremely dangerous' },
      { pattern: /TRUNCATE\s+TABLE/i, message: 'TRUNCATE TABLE detected - will delete all data' },
      { pattern: /DELETE\s+FROM.*WHERE\s+1\s*=\s*1/i, message: 'DELETE without WHERE clause detected' }
    ];
    
    for (const { pattern, message } of dangerousPatterns) {
      if (pattern.test(content)) {
        migration.errors.push(message);
      }
    }
  }
  
  private validateTableOperations(migration: MigrationFile): void {
    const content = migration.content;
    
    // Check for table renames
    const tableRenames = content.match(/ALTER\s+TABLE\s+"?(\w+)"?\s+RENAME\s+TO\s+"?(\w+)"?/gi);
    if (tableRenames) {
      migration.warnings.push(`Table rename detected: ${tableRenames.join(', ')}`);
      
      // Check if foreign keys are handled properly
      if (!content.includes('DROP CONSTRAINT') || !content.includes('ADD CONSTRAINT')) {
        migration.errors.push('Table rename without proper foreign key constraint handling');
      }
    }
    
    // Check for column renames
    const columnRenames = content.match(/ALTER\s+TABLE\s+"?(\w+)"?\s+RENAME\s+COLUMN\s+"?(\w+)"?\s+TO\s+"?(\w+)"?/gi);
    if (columnRenames) {
      migration.warnings.push(`Column rename detected: ${columnRenames.join(', ')}`);
    }
    
    // Check for critical table operations
    for (const table of this.criticalTables) {
      if (content.includes(`DROP TABLE "${table}"`) || content.includes(`DROP TABLE ${table}`)) {
        migration.errors.push(`Critical table '${table}' is being dropped`);
      }
    }
  }
  
  private validateDataSafety(migration: MigrationFile): void {
    const content = migration.content;
    
    // Check for data migration operations
    if (content.includes('INSERT INTO') && content.includes('SELECT')) {
      migration.warnings.push('Data migration detected - ensure data integrity');
    }
    
    // Check for backup recommendations
    const backupRecommendedOps = [
      'ALTER TABLE',
      'DROP COLUMN',
      'RENAME',
      'MODIFY COLUMN'
    ];
    
    const hasBackupOps = backupRecommendedOps.some(op => 
      content.toUpperCase().includes(op)
    );
    
    if (hasBackupOps) {
      migration.warnings.push('Backup recommended before applying this migration');
    }
  }
  
  private validateForeignKeyOperations(migration: MigrationFile): void {
    const content = migration.content;
    
    // Check for foreign key operations
    const fkOperations = content.match(/ADD\s+CONSTRAINT.*FOREIGN\s+KEY/gi);
    if (fkOperations) {
      migration.warnings.push(`Foreign key operations detected: ${fkOperations.length} operations`);
      
      // Check if referenced tables/columns exist
      const fkReferences = content.match(/REFERENCES\s+"?(\w+)"?\s*\("?(\w+)"?\)/gi);
      if (fkReferences) {
        for (const ref of fkReferences) {
          const match = ref.match(/REFERENCES\s+"?(\w+)"?\s*\("?(\w+)"?\)/i);
          if (match) {
            const [, table, column] = match;
            migration.warnings.push(`Foreign key references: ${table}.${column}`);
          }
        }
      }
    }
    
    // Check for constraint drops
    const constraintDrops = content.match(/DROP\s+CONSTRAINT\s+"?(\w+)"?/gi);
    if (constraintDrops) {
      migration.warnings.push(`Constraint drops detected: ${constraintDrops.join(', ')}`);
    }
  }
}

// CLI Interface
if (require.main === module) {
  const validator = new MigrationValidator();
  
  validator.validateAllMigrations()
    .then(() => {
      console.log('\n🎉 Migration validation completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration validation failed:', error);
      process.exit(1);
    });
}

export { MigrationValidator };
