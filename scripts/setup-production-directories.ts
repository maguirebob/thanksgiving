#!/usr/bin/env ts-node

import { execSync } from 'child_process';

/**
 * Script to create necessary directories in production environment
 * This ensures production has the same directory structure as test
 */

class ProductionDirectorySetup {
  private environment: string;

  constructor() {
    this.environment = process.env.RAILWAY_ENVIRONMENT || 'production';
  }

  /**
   * Create necessary directories in production
   */
  async setupDirectories(): Promise<void> {
    console.log(`🚀 Setting up directories for ${this.environment} environment...`);
    
    const directories = [
      '/app/uploads',
      '/app/uploads/photos',
      '/app/public/images'
    ];

    for (const dir of directories) {
      try {
        console.log(`📁 Creating directory: ${dir}`);
        execSync(`railway run mkdir -p ${dir}`, { stdio: 'pipe' });
        console.log(`✅ Created: ${dir}`);
      } catch (error) {
        console.error(`❌ Failed to create ${dir}:`, error);
        throw error;
      }
    }

    console.log('🎉 All directories created successfully!');
  }

  /**
   * Verify directories exist
   */
  async verifyDirectories(): Promise<void> {
    console.log('🔍 Verifying directories exist...');
    
    const directories = [
      '/app/uploads',
      '/app/uploads/photos', 
      '/app/public/images'
    ];

    for (const dir of directories) {
      try {
        execSync(`railway run test -d ${dir}`, { stdio: 'pipe' });
        console.log(`✅ Verified: ${dir}`);
      } catch (error) {
        console.error(`❌ Directory missing: ${dir}`);
        throw error;
      }
    }

    console.log('🎉 All directories verified!');
  }

  /**
   * Display directory structure
   */
  async displayDirectoryStructure(): Promise<void> {
    console.log('📂 Current directory structure:');
    
    try {
      const output = execSync('railway run find /app -type d -name "uploads" -o -name "images" -o -name "photos" | head -20', { 
        stdio: 'pipe',
        encoding: 'utf8'
      });
      console.log(output);
    } catch (error) {
      console.log('Could not display directory structure:', error);
    }
  }

  /**
   * Run the complete setup process
   */
  async run(): Promise<void> {
    try {
      await this.setupDirectories();
      await this.verifyDirectories();
      await this.displayDirectoryStructure();
      
      console.log('\n🎉 Production directory setup complete!');
      console.log('\nNext steps:');
      console.log('1. Test photo upload functionality');
      console.log('2. Verify photos page loads correctly');
      console.log('3. Check admin dashboard photo management');
      
    } catch (error) {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    }
  }
}

// Run the setup if this script is executed directly
if (require.main === module) {
  const setup = new ProductionDirectorySetup();
  setup.run().catch(console.error);
}

export default ProductionDirectorySetup;
