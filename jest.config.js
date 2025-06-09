module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    '!src/**/*.spec.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.dto.ts',
    '!src/**/*.entity.ts',
    '!src/main.ts',
  ],
  coverageDirectory: './coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
  },
  // Clean up after each test
  clearMocks: true,

  // Define projects for unit and integration tests
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/src/**/*.spec.ts'],
      setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
      moduleFileExtensions: ['js', 'json', 'ts'],
      rootDir: '.',
      testEnvironment: 'node',
      timeout: 30000, // 30 seconds for unit tests
      transform: {
        '^.+\\.(t|j)s$': 'ts-jest',
      },
      moduleNameMapper: {
        '^src/(.*)$': '<rootDir>/src/$1',
      },
      clearMocks: true,
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/test/**/*.e2e-spec.ts'],
      setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
      moduleFileExtensions: ['js', 'json', 'ts'],
      rootDir: '.',
      testEnvironment: 'node',
      timeout: 120000, // 2 minutes for integration tests
      transform: {
        '^.+\\.(t|j)s$': 'ts-jest',
      },
      moduleNameMapper: {
        '^src/(.*)$': '<rootDir>/src/$1',
      },
      clearMocks: true,
      // Run integration tests serially to avoid database conflicts
      maxWorkers: 1,
    },
  ],
};
