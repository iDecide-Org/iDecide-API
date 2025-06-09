import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Global test setup
beforeAll(async () => {
  // Set increased timeout for all tests
  jest.setTimeout(120000);
});

afterAll(async () => {
  // Global cleanup if needed
  await new Promise((resolve) => setTimeout(resolve, 1000));
});

// Mock external services
jest.mock('axios');
jest.mock('socket.io');

// Increase timeout for async operations
jest.setTimeout(120000);

// Suppress console logs during tests unless needed for debugging
const originalConsole = global.console;
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
