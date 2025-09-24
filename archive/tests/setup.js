// Test setup file
require('dotenv').config();

// Set test environment
process.env.NODE_ENV = 'test';

// Import browser API mocks
require('./mocks/browserAPIs');

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Global test timeout
jest.setTimeout(10000);


