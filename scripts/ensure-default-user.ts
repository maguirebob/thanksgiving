#!/usr/bin/env ts-node

/**
 * Ensure Default User Script
 * Creates a default user if none exists for blog post creation
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function ensureDefaultUser() {
  try {
    console.log('Checking for default user...');
    
    // Check if user with ID 1 exists
    let defaultUser = await prisma.user.findUnique({
      where: { user_id: 1 }
    });

    if (!defaultUser) {
      console.log('Default user not found, creating...');
      
      // Create default user
      defaultUser = await prisma.user.create({
        data: {
          username: 'default_user',
          email: 'default@example.com',
          password_hash: await bcrypt.hash('defaultpassword', 10),
          role: 'user' as any,
          first_name: 'Default',
          last_name: 'User'
        }
      });
      
      console.log('✅ Default user created successfully!');
      console.log('   User ID:', defaultUser.user_id);
      console.log('   Username:', defaultUser.username);
      console.log('   Email:', defaultUser.email);
    } else {
      console.log('✅ Default user already exists!');
      console.log('   User ID:', defaultUser.user_id);
      console.log('   Username:', defaultUser.username);
      console.log('   Email:', defaultUser.email);
    }

    // Also check if there are any users at all
    const userCount = await prisma.user.count();
    console.log(`📊 Total users in database: ${userCount}`);

  } catch (error) {
    console.error('❌ Error ensuring default user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
ensureDefaultUser();
