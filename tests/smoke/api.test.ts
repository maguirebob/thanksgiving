import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { testUtils } from '../setup';

// Import your server (you'll need to export it from server.ts)
// For now, we'll create a simple test server
import express from 'express';

describe('Smoke Tests - API Endpoints', () => {
  let app: express.Application;
  let prisma: PrismaClient;

  beforeAll(async () => {
    // Initialize Prisma client
    prisma = new PrismaClient();
    
    // Create test Express app
    app = express();
    app.use(express.json());
    
    // Add basic routes for testing
    app.get('/api/v1/version/display', (_req, res) => {
      res.json({
        success: true,
        data: {
          version: '2.0.0',
          environment: 'test',
          buildDate: new Date().toISOString()
        }
      });
    });

    app.get('/api/setup-database', async (_req, res) => {
      try {
        // Check if we already have data
        const eventCount = await prisma.event.count();
        const userCount = await prisma.user.count();

        if (eventCount > 0 || userCount > 0) {
          return res.json({
            success: true,
            message: `Database already has data: ${eventCount} events, ${userCount} users`,
            data: { eventCount, userCount }
          });
        }

        // Create sample data for testing
        const testEvent = await testUtils.createTestEvent(prisma);
        const testUser = await testUtils.createTestUser(prisma);

        res.json({
          success: true,
          message: 'Database setup completed successfully!',
          data: {
            eventsCreated: 1,
            usersCreated: 1,
            totalEvents: 1,
            totalUsers: 1
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: 'Database setup failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
  });

  afterAll(async () => {
    await testUtils.cleanupTestData(prisma);
    await prisma.$disconnect();
  });

  describe('Version API', () => {
    test('GET /api/v1/version/display should return version info', async () => {
      const response = await request(app)
        .get('/api/v1/version/display')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          version: '2.0.0',
          environment: 'test'
        }
      });
      expect(response.body.data.buildDate).toBeDefined();
    });
  });

  describe('Database Setup API', () => {
    test('GET /api/setup-database should initialize database', async () => {
      const response = await request(app)
        .get('/api/setup-database')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('Database setup completed')
      });
      expect(response.body.data).toMatchObject({
        eventsCreated: expect.any(Number),
        usersCreated: expect.any(Number),
        totalEvents: expect.any(Number),
        totalUsers: expect.any(Number)
      });
    });

    test('GET /api/setup-database should handle existing data', async () => {
      // First call creates data
      await request(app).get('/api/setup-database');
      
      // Second call should detect existing data
      const response = await request(app)
        .get('/api/setup-database')
        .expect(200);

      expect(response.body.message).toContain('already has data');
    });
  });

  describe('Database Connection', () => {
    test('Prisma client should connect to database', async () => {
      await expect(prisma.$connect()).resolves.not.toThrow();
    });

    test('Should be able to query events table', async () => {
      const count = await prisma.event.count();
      expect(typeof count).toBe('number');
    });

    test('Should be able to query users table', async () => {
      const count = await prisma.user.count();
      expect(typeof count).toBe('number');
    });
  });
});
