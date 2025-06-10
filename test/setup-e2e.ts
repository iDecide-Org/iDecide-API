import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Global E2E test setup
beforeAll(async () => {
  // Set increased timeout for E2E tests
  jest.setTimeout(120000); // 2 minutes for E2E tests
}, 30000);

afterAll(async () => {
  // Global cleanup for E2E tests
  await new Promise((resolve) => setTimeout(resolve, 1000));
});

// E2E specific console configuration
global.console = {
  ...global.console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: (...args) => {
    // Allow error logs for debugging E2E tests
    console.error(...args);
  },
};
