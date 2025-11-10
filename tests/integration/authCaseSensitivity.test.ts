/**
 * Authentication Case Sensitivity Test
 * Tests that username login is case-insensitive
 * 
 * This test verifies that:
 * - "admin" works
 * - "Admin" also works (case-insensitive)
 * 
 * Uses the actual server and HTTP requests to test the full stack
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

describe('Username Case Sensitivity Test', () => {
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

  describe('Login with case-insensitive username via HTTP', () => {
    it('should successfully login with exact lowercase username', async () => {
      // Create a test user with lowercase username
      const testPassword = 'testpass123';
      const timestamp = Date.now();
      const testUser = await prisma.user.create({
        data: {
          username: `testuser_${timestamp}`,
          email: `testuser_${timestamp}@example.com`,
          password_hash: await bcrypt.hash(testPassword, 10),
          role: 'user',
          first_name: 'Test',
          last_name: 'User'
        }
      });
      testUserIds.push(testUser.user_id);

      // Verify user exists before login
      const verifyUser = await prisma.user.findUnique({
        where: { user_id: testUser.user_id }
      });
      expect(verifyUser).toBeDefined();

      // Verify case-insensitive query works (same as controller uses)
      const caseInsensitiveUser = await prisma.user.findFirst({
        where: {
          OR: [
            { 
              username: {
                equals: `testuser_${timestamp}`,
                mode: 'insensitive' as const
              }
            },
            { 
              email: {
                equals: `testuser_${timestamp}`,
                mode: 'insensitive' as const
              }
            }
          ]
        }
      });
      expect(caseInsensitiveUser).toBeDefined();
      expect(caseInsensitiveUser?.user_id).toBe(testUser.user_id);

      // Make HTTP POST request to login endpoint (form-encoded like a real form)
      const response = await request(app)
        .post('/auth/login')
        .type('form')
        .send({
          username: `testuser_${timestamp}`, // Exact match
          password: testPassword
        });

      // Debug: log the response
      if (response.status !== 302 || response.headers['location']?.includes('error')) {
        console.log('Login failed. Status:', response.status, 'Location:', response.headers['location']);
      }

      expect(response.status).toBe(302);
      // Should redirect successfully (not to login error page)
      expect(response.headers['location']).not.toContain('error=Invalid username or password');
      expect(response.headers['location']).toContain('/auth/profile');
    });

    it('should successfully login with different case username', async () => {
      // Create a test user with lowercase username
      const testPassword = 'testpass123';
      const timestamp = Date.now();
      const testUser = await prisma.user.create({
        data: {
          username: `testuser2_${timestamp}`,
          email: `testuser2_${timestamp}@example.com`,
          password_hash: await bcrypt.hash(testPassword, 10),
          role: 'user',
          first_name: 'Test',
          last_name: 'User'
        }
      });
      testUserIds.push(testUser.user_id);

      // Make HTTP POST request with different case username (form-encoded)
      const response = await request(app)
        .post('/auth/login')
        .type('form')
        .send({
          username: `TestUser2_${timestamp}`, // Different case
          password: testPassword
        })
        .expect(302); // Should redirect on success

      // Should redirect successfully (not to login error page)
      expect(response.headers['location']).not.toContain('error=Invalid username or password');
      expect(response.headers['location']).toContain('/auth/profile');
    });

    it('should successfully login with uppercase username when stored as lowercase', async () => {
      // Create a test user with lowercase username
      const testPassword = 'testpass123';
      const timestamp = Date.now();
      const testUser = await prisma.user.create({
        data: {
          username: `lowercaseuser_${timestamp}`,
          email: `lowercaseuser_${timestamp}@example.com`,
          password_hash: await bcrypt.hash(testPassword, 10),
          role: 'user',
          first_name: 'Test',
          last_name: 'User'
        }
      });
      testUserIds.push(testUser.user_id);

      // Make HTTP POST request with uppercase username (form-encoded)
      const response = await request(app)
        .post('/auth/login')
        .type('form')
        .send({
          username: `LOWERCASEUSER_${timestamp}`, // All uppercase
          password: testPassword
        })
        .expect(302); // Should redirect on success

      // Should redirect successfully (not to login error page)
      expect(response.headers['location']).not.toContain('error=Invalid username or password');
      expect(response.headers['location']).toContain('/auth/profile');
    });

    it('should successfully login with mixed case username when stored as lowercase', async () => {
      // Create a test user with lowercase username
      const testPassword = 'testpass123';
      const timestamp = Date.now();
      const testUser = await prisma.user.create({
        data: {
          username: `mixedcase_${timestamp}`,
          email: `mixedcase_${timestamp}@example.com`,
          password_hash: await bcrypt.hash(testPassword, 10),
          role: 'user',
          first_name: 'Test',
          last_name: 'User'
        }
      });
      testUserIds.push(testUser.user_id);

      // Make HTTP POST request with mixed case username (form-encoded)
      const response = await request(app)
        .post('/auth/login')
        .type('form')
        .send({
          username: `MixedCase_${timestamp}`, // Mixed case
          password: testPassword
        })
        .expect(302); // Should redirect on success

      // Should redirect successfully (not to login error page)
      expect(response.headers['location']).not.toContain('error=Invalid username or password');
      expect(response.headers['location']).toContain('/auth/profile');
    });

    it('should verify Prisma query with case-insensitive mode works', async () => {
      // Create a test user with lowercase username
      const timestamp = Date.now();
      const testUser = await prisma.user.create({
        data: {
          username: `casesensitivetest_${timestamp}`,
          email: `casesensitivetest_${timestamp}@example.com`,
          password_hash: await bcrypt.hash('testpass123', 10),
          role: 'user',
          first_name: 'Test',
          last_name: 'User'
        }
      });
      testUserIds.push(testUser.user_id);

      // Test exact match (should find user)
      const exactMatch = await prisma.user.findFirst({
        where: {
          OR: [
            { username: { equals: `casesensitivetest_${timestamp}`, mode: 'insensitive' as const } },
            { email: { equals: `casesensitivetest_${timestamp}`, mode: 'insensitive' as const } }
          ]
        }
      });
      expect(exactMatch).toBeDefined();
      expect(exactMatch?.username).toBe(`casesensitivetest_${timestamp}`);

      // Test different case with case-insensitive mode (should find user)
      const differentCase = await prisma.user.findFirst({
        where: {
          OR: [
            { username: { equals: `CaseSensitiveTest_${timestamp}`, mode: 'insensitive' as const } },
            { email: { equals: `CaseSensitiveTest_${timestamp}`, mode: 'insensitive' as const } }
          ]
        }
      });
      expect(differentCase).toBeDefined(); // Should find user because it's case-insensitive
      expect(differentCase?.username).toBe(`casesensitivetest_${timestamp}`);
    });
  });
});
