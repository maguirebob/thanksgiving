import { PrismaClient } from '@prisma/client';
import { config } from './lib/config';

declare global {
  var __prisma: PrismaClient | undefined;
}

// Create Prisma client with proper configuration
const prisma = globalThis.__prisma || new PrismaClient({
  log: config.isDevelopment() ? ['query', 'info', 'warn', 'error'] : ['error'],
  datasources: {
    db: {
      url: config.getConfig().databaseUrl
    }
  }
});

// Prevent multiple instances in development
if (config.isDevelopment()) {
  globalThis.__prisma = prisma;
}

export default prisma;
