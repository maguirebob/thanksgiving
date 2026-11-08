#!/usr/bin/env ts-node

/**
 * Create Admin User Script
 * Creates an admin user or promotes an existing user to admin role
 * 
 * Usage:
 *   npx ts-node scripts/create-admin-user.ts --username <username> --email <email> --password <password>
 *   
 *   Or via Railway:
 *   railway run npx ts-node scripts/create-admin-user.ts --username <username> --email <email> --password <password>
 */

import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface AdminUserOptions {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

function parseArgs(): AdminUserOptions {
  const args = process.argv.slice(2);
  const options: Partial<AdminUserOptions> = {};

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    const value = args[i + 1];

    switch (key) {
      case '--username':
        options.username = value;
        break;
      case '--email':
        options.email = value;
        break;
      case '--password':
        options.password = value;
        break;
      case '--firstName':
        options.firstName = value;
        break;
      case '--lastName':
        options.lastName = value;
        break;
    }
  }

  if (!options.username || !options.email || !options.password) {
    console.error('❌ Missing required arguments');
    console.error('Usage: npx ts-node scripts/create-admin-user.ts --username <username> --email <email> --password <password>');
    console.error('Optional: --firstName <firstName> --lastName <lastName>');
    process.exit(1);
  }

  return options as AdminUserOptions;
}

async function createAdminUser(options: AdminUserOptions) {
  try {
    console.log(`\n🔍 Checking for existing user: ${options.username}`);

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: options.username, mode: 'insensitive' } },
          { email: { equals: options.email, mode: 'insensitive' } }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.username.toLowerCase() === options.username.toLowerCase()) {
        console.log(`👤 User "${options.username}" already exists (ID: ${existingUser.user_id})`);
        
        if (existingUser.role === UserRole.admin) {
          console.log('✅ User is already an admin!');
        } else {
          console.log('⬆️  Promoting user to admin role...');
          await prisma.user.update({
            where: { user_id: existingUser.user_id },
            data: { role: UserRole.admin }
          });
          console.log('✅ User promoted to admin successfully!');
        }
        return;
      } else {
        console.error(`❌ Email "${options.email}" is already in use by another account`);
        process.exit(1);
      }
    }

    console.log('📝 Creating new admin user...');
    
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(options.password, saltRounds);

    const newUser = await prisma.user.create({
      data: {
        username: options.username,
        email: options.email,
        password_hash: passwordHash,
        role: UserRole.admin,
        first_name: options.firstName || null,
        last_name: options.lastName || null
      }
    });

    console.log('\n✅ Admin user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   User ID:  ${newUser.user_id}`);
    console.log(`   Username: ${newUser.username}`);
    console.log(`   Email:    ${newUser.email}`);
    console.log(`   Role:     ${newUser.role}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

const options = parseArgs();
createAdminUser(options);
