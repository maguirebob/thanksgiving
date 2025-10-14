module.exports = {
  preset: 'ts-jest',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/tests/e2e/' // Exclude Playwright tests
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/server.ts', // Exclude main server file from coverage
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 10000,
  projects: [
    {
      displayName: 'node',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/tests/models/**/*.test.ts',
        '<rootDir>/tests/controllers/**/*.test.ts',
        '<rootDir>/tests/middleware/**/*.test.ts',
        '<rootDir>/tests/routes/**/*.test.ts',
        '<rootDir>/tests/integration/**/*.test.ts',
        '<rootDir>/tests/smoke/**/*.test.ts'
      ],
      transform: {
        '^.+\\.ts$': 'ts-jest',
      },
      setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
      testTimeout: 10000,
    },
    {
      displayName: 'jsdom',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      testMatch: [
        '<rootDir>/tests/navigation.test.ts'
      ],
      transform: {
        '^.+\\.ts$': 'ts-jest',
      },
      setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
      testTimeout: 10000,
    }
  ]
};