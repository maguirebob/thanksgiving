module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    'models/**/*.js',
    'server.js',
    '!**/node_modules/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 10000,
  maxWorkers: 1,
  // Browser API mocks
  globals: {
    FileReader: true,
    File: true,
    Blob: true,
    URL: true,
    Image: true,
    alert: true,
    TextEncoder: true,
    TextDecoder: true
  }
};
