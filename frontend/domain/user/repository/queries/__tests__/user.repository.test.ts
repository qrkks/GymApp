/**
 * User Repository Queries 单元测试
 */
import { createTestDb, cleanupTestDb } from '@/tests/setup/test-db';
import * as userQueries from '../user.repository';
import * as userCommands from '../../commands/user.repository';
import { users } from '@/lib/db/schema';

// Mock the database module - 使用独立的schema进行测试隔离
jest.mock('@/lib/db', () => ({
  db: createTestDb(__filename),
}));

describe('User Repository - Queries', () => {
  const db = createTestDb(__filename);

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
        id: 'test-user-user-queries',
        email: 'test@example.com',
        username: 'testuser-user-queries',
      });
      
      const result = await userQueries.findUserById('test-user-user-queries');
      
      expect(result).not.toBeNull();
      expect(result?.id).toBe('test-user-user-queries');
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
        id: 'test-user-user-queries',
        email: 'test@example.com',
        username: 'testuser-user-queries',
      });
      
      const result = await userQueries.findUserByEmail('test@example.com');
      
      expect(result).not.toBeNull();
      expect(result?.email).toBe('test@example.com');
    });
  });

  // 清理测试数据库schema
  afterAll(async () => {
    await cleanupTestDb(__filename);
  });
});

