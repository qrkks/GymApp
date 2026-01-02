/**
 * User Repository Commands 单元测试
 */
import { createTestDb, cleanupTestDb } from '@/tests/setup/test-db';
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
      const result = await userCommands.insertUser({
        id: 'test-user-user-commands',
        email: 'test@example.com',
        username: 'Test User',
      });
      
      expect(result).toBeDefined();
      expect(result.id).toBe('test-user-user-commands');
      expect(result.email).toBe('test@example.com');
      expect(result.username).toBe('Test User');
    });

    it('should create user with optional fields', async () => {
      const result = await userCommands.insertUser({
        id: 'test-user-2',
        email: 'test2@example.com',
        username: 'Test User 2',
        image: 'https://example.com/avatar.jpg',
      });
      
      expect(result.image).toBe('https://example.com/avatar.jpg');
    });
  });

  describe('updateUser', () => {
    it('should update user', async () => {
      const created = await userCommands.insertUser({
        id: 'test-user-user-commands',
        email: 'test@example.com',
        username: 'Test User',
      });
      
      const updated = await userCommands.updateUser('test-user-user-commands', {
        username: 'Updated Name',
      });
      
      expect(updated).not.toBeNull();
      expect(updated?.username).toBe('Updated Name');
      expect(updated?.email).toBe('test@example.com');
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
      const created = await userCommands.insertUser({
        id: 'test-user-user-commands',
        email: 'test@example.com',
        username: 'Test User',
      });
      
      const deleted = await userCommands.deleteUser('test-user-user-commands');
      
      expect(deleted).toBe(true);
      
      const found = await userQueries.findUserById('test-user-user-commands');
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

