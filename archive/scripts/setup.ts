#!/usr/bin/env ts-node

/**
 * Development setup script
 * Sets up the development environment and database
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { config } from '../src/lib/config';

const prisma = new PrismaClient();

async function setupDatabase() {
  console.log('🔄 Setting up database...');
  
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connection established');

    // Create admin user if it doesn't exist
    const adminUser = await prisma.user.findUnique({
      where: { username: 'admin' }
    });

    if (!adminUser) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await prisma.user.create({
        data: {
          username: 'admin',
          email: 'admin@thanksgiving.com',
          password_hash: hashedPassword,
          role: 'ADMIN',
          first_name: 'Admin',
          last_name: 'User'
        }
      });
      
      console.log('✅ Admin user created (username: admin, password: admin123)');
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    // Create test user if it doesn't exist
    const testUser = await prisma.user.findUnique({
      where: { username: 'testuser' }
    });

    if (!testUser) {
      const hashedPassword = await bcrypt.hash('testpass123', 10);
      
      await prisma.user.create({
        data: {
          username: 'testuser',
          email: 'test@thanksgiving.com',
          password_hash: hashedPassword,
          role: 'USER',
          first_name: 'Test',
          last_name: 'User'
        }
      });
      
      console.log('✅ Test user created (username: testuser, password: testpass123)');
    } else {
      console.log('ℹ️  Test user already exists');
    }

    console.log('🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  console.log('🚀 Starting development setup...');
  console.log(`📊 Environment: ${config.getConfig().nodeEnv}`);
  console.log(`🗄️  Database: ${config.getDatabaseUrl()}`);
  
  await setupDatabase();
  
  console.log('\n📋 Next steps:');
  console.log('1. Run: npm install');
  console.log('2. Run: npm run db:push');
  console.log('3. Run: npm run dev');
  console.log('\n🎯 Access the application at: http://localhost:3000');
}

if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });
}
