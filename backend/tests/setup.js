// Test setup file
require('dotenv').config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';

// Disable console logs during tests (optional)
// console.log = jest.fn();
// console.error = jest.fn();

// Global test timeout
jest.setTimeout(30000);