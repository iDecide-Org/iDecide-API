import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Global test setup
beforeAll(async () => {
  // Set increased timeout for all tests
  jest.setTimeout(30000); // Adjusted timeout for unit tests
});

afterAll(async () => {
  // Global cleanup if needed
  await new Promise((resolve) => setTimeout(resolve, 500)); // Adjusted timeout
});

// Mock external services if needed for unit tests, otherwise remove
// jest.mock('axios');
// jest.mock('socket.io');

// Suppress console logs during tests unless needed for debugging
// const originalConsole = global.console; // Commented out as it's unused
global.console = {
  ...global.console, // Ensure to spread global.console to preserve other methods
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
