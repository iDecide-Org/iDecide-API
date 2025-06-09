import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Global test setup
beforeAll(async () => {
  // Global setup if needed
});

afterAll(async () => {
  // Global cleanup if needed
});

// Mock external services
jest.mock('axios');
jest.mock('socket.io');

// Suppress console logs during tests unless needed
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
