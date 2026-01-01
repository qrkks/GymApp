// Jest setup file
// This file runs before each test file

// Mock environment variables
process.env.DATABASE_PATH = ':memory:';
process.env.NEXTAUTH_SECRET = 'test-secret';

