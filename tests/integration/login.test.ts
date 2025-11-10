/**
 * Basic Login Test
 * Tests that basic login functionality works via HTTP
 */

// Set NODE_ENV BEFORE importing server (DATABASE_URL should come from .env for dev)
process.env['NODE_ENV'] = 'test';
// DATABASE_URL should be set in .env file - don't override it
if (!process.env['DATABASE_URL']) {
  throw new Error('DATABASE_URL not set. Make sure .env file exists with DATABASE_URL for dev database.');
}

import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { app } from '../../src/server';
import { testUtils } from '../setup';
import bcrypt from 'bcryptjs';

describe('Basic Login Test', () => {
  let prisma: PrismaClient;
  let testUserIds: number[] = [];

  beforeAll(async () => {
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    // Clean up test users
    if (testUserIds.length > 0 && testUtils && testUtils.cleanupTestData) {
      await testUtils.cleanupTestData(prisma, { userIds: testUserIds });
    }
    await prisma.$disconnect();
  });

  it('should successfully login with correct credentials', async () => {
    // Create a test user
    const testPassword = 'testpass123';
    const timestamp = Date.now();
    const testUser = await prisma.user.create({
      data: {
        username: `logintest_${timestamp}`,
        email: `logintest_${timestamp}@example.com`,
        password_hash: await bcrypt.hash(testPassword, 10),
        role: 'user',
        first_name: 'Test',
        last_name: 'User'
      }
    });
    testUserIds.push(testUser.user_id);

    // Verify user exists
    const verifyUser = await prisma.user.findUnique({
      where: { user_id: testUser.user_id }
    });
    expect(verifyUser).toBeDefined();

    // Make HTTP POST request to login endpoint (form-encoded like a real form)
    const response = await request(app)
      .post('/auth/login')
      .type('form')
      .send({
        username: `logintest_${timestamp}`,
        password: testPassword
      });

    console.log('Login response status:', response.status);
    console.log('Login response location:', response.headers['location']);

    expect(response.status).toBe(302);
    // Should redirect successfully (not to login error page)
    const location = response.headers['location'] || '';
    expect(location).not.toContain('error=Invalid');
    expect(location).toContain('/auth/profile');
  });

  it('should fail to login with incorrect password', async () => {
    // Create a test user
    const testPassword = 'testpass123';
    const timestamp = Date.now();
    const testUser = await prisma.user.create({
      data: {
        username: `logintest2_${timestamp}`,
        email: `logintest2_${timestamp}@example.com`,
        password_hash: await bcrypt.hash(testPassword, 10),
        role: 'user',
        first_name: 'Test',
        last_name: 'User'
      }
    });
    testUserIds.push(testUser.user_id);

    // Make HTTP POST request with wrong password
    const response = await request(app)
      .post('/auth/login')
      .type('form')
      .send({
        username: `logintest2_${timestamp}`,
        password: 'wrongpassword'
      });

    expect(response.status).toBe(302);
    // Should redirect to login error page (URL encoded)
    expect(response.headers['location']).toContain('error=Invalid%20username%20or%20password');
  });

  it('should fail to login with non-existent username', async () => {
    // Make HTTP POST request with non-existent username
    const response = await request(app)
      .post('/auth/login')
      .type('form')
      .send({
        username: 'nonexistent_user_12345',
        password: 'somepassword'
      });

    expect(response.status).toBe(302);
    // Should redirect to login error page (URL encoded)
    expect(response.headers['location']).toContain('error=Invalid%20username%20or%20password');
  });
});

