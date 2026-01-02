/**
 * User Repository Commands 单元测试
 */
import { createTestDb, cleanupTestDb } from '@/tests/setup/test-db';
import { generateTestUserIdentifiers } from '@/tests/setup/test-helpers';
import * as userCommands from '../user.repository';
import * as userQueries from '../../queries/user.repository';
import { users } from '@/lib/db/schema';

// Mock the database module - 使用独立的schema进行测试隔离
jest.mock('@/lib/db', () => ({
  db: createTestDb(__filename),
}));

describe('User Repository - Commands', () => {
  const db = createTestDb(__filename);

  beforeEach(async () => {
    // 清理数据库
    await db.delete(users);
  });

  describe('insertUser', () => {
    it('should create a new user', async () => {
      const { userId, email, username } = generateTestUserIdentifiers(__filename);
      const result = await userCommands.insertUser({
        id: userId,
        email,
        username,
      });
      
      expect(result).toBeDefined();
      expect(result.id).toBe(userId);
      expect(result.email).toBe(email);
      expect(result.username).toBe(username);
    });

    it('should create user with optional fields', async () => {
      const { userId, email, username } = generateTestUserIdentifiers(__filename, 'optional');
      const result = await userCommands.insertUser({
        id: userId,
        email,
        username,
        image: 'https://example.com/avatar.jpg',
      });
      
      expect(result.image).toBe('https://example.com/avatar.jpg');
    });
  });

  describe('updateUser', () => {
    it('should update user', async () => {
      const { userId, email, username } = generateTestUserIdentifiers(__filename);
      const created = await userCommands.insertUser({
        id: userId,
        email,
        username,
      });
      
      const updated = await userCommands.updateUser(userId, {
        username: 'Updated Name',
      });
      
      expect(updated).not.toBeNull();
      expect(updated?.username).toBe('Updated Name');
      expect(updated?.email).toBe(email);
    });

    it('should return null when user does not exist', async () => {
      const result = await userCommands.updateUser('non-existent', {
        username: 'New Name',
      });
      expect(result).toBeNull();
    });
  });

  describe('deleteUser', () => {
    it('should delete user', async () => {
      const { userId, email, username } = generateTestUserIdentifiers(__filename);
      const created = await userCommands.insertUser({
        id: userId,
        email,
        username,
      });
      
      const deleted = await userCommands.deleteUser(userId);
      
      expect(deleted).toBe(true);
      
      const found = await userQueries.findUserById(userId);
      expect(found).toBeNull();
    });

    it('should return false when user does not exist', async () => {
      const result = await userCommands.deleteUser('non-existent');
      expect(result).toBe(false);
    });
  });

  // 清理测试数据库schema
  afterAll(async () => {
    await cleanupTestDb(__filename);
  });
});

