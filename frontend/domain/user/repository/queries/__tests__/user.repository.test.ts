/**
 * User Repository Queries 单元测试
 */
import { getTestDb } from '@/tests/setup/test-db';
import * as userQueries from '../user.repository';
import * as userCommands from '../../commands/user.repository';
import { users } from '@/lib/db/schema';

// Mock the database module
jest.mock('@/lib/db', () => {
  const { getTestDb } = require('@/tests/setup/test-db');
  return {
    db: getTestDb(),
  };
});

describe('User Repository - Queries', () => {
  const db = getTestDb();

  beforeEach(async () => {
    // 清理数据库
    await db.delete(users);
  });

  describe('findUserById', () => {
    it('should return null when user does not exist', async () => {
      const result = await userQueries.findUserById('non-existent-id');
      expect(result).toBeNull();
    });

    it('should return user when found', async () => {
      const created = await userCommands.insertUser({
        id: 'test-user-1',
        email: 'test@example.com',
        username: 'Test User',
      });
      
      const result = await userQueries.findUserById('test-user-1');
      
      expect(result).not.toBeNull();
      expect(result?.id).toBe('test-user-1');
      expect(result?.email).toBe('test@example.com');
    });
  });

  describe('findUserByEmail', () => {
    it('should return null when user does not exist', async () => {
      const result = await userQueries.findUserByEmail('nonexistent@example.com');
      expect(result).toBeNull();
    });

    it('should return user when found by email', async () => {
      await userCommands.insertUser({
        id: 'test-user-1',
        email: 'test@example.com',
        username: 'Test User',
      });
      
      const result = await userQueries.findUserByEmail('test@example.com');
      
      expect(result).not.toBeNull();
      expect(result?.email).toBe('test@example.com');
    });
  });
});

