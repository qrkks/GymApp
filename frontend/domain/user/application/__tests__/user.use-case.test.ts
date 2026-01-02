/**
 * User Application Service 单元测试
 */
import { createTestDb, cleanupTestDb } from '@/tests/setup/test-db';
import {
  getUserById,
  getUserByEmail,
  createUser,
  updateUser,
  deleteUser,
} from '../user.use-case';
import { users } from '@/lib/db/schema';

// Mock the database module - 使用独立的schema进行测试隔离
jest.mock('@/lib/db', () => ({
  db: createTestDb(__filename),
}));

describe('User Application Service', () => {
  const db = createTestDb(__filename);

  beforeEach(async () => {
    // 清理数据库
    await db.delete(users);
  });

  describe('getUserById', () => {
    it('should return success with user when found', async () => {
      await db.insert(users).values({
        id: 'test-user-user-app',
        email: 'test@example.com',
        username: 'testuser-user-app',
      });
      
      const result = await getUserById('test-user-user-app');
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('test-user-user-app');
      }
    });

    it('should return failure when user not found', async () => {
      const result = await getUserById('non-existent');
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('USER_NOT_FOUND');
      }
    });
  });

  describe('getUserByEmail', () => {
    it('should return success with user when found', async () => {
      await db.insert(users).values({
        id: 'test-user-user-app',
        email: 'test@example.com',
        username: 'testuser-user-app',
      });
      
      const result = await getUserByEmail('test@example.com');
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('test@example.com');
      }
    });

    it('should return failure when user not found', async () => {
      const result = await getUserByEmail('nonexistent@example.com');
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('USER_NOT_FOUND');
      }
    });
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      const result = await createUser({
        id: 'test-user-user-app',
        email: 'test@example.com',
        username: 'testuser-user-app',
        password: 'password123',
      });
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('test@example.com');
      }
    });

    it('should return failure when email is invalid', async () => {
      const result = await createUser({
        id: 'test-user-user-app',
        email: 'invalid-email',
        username: 'testuser-user-app',
        password: 'password123',
      });
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_EMAIL');
      }
    });

    it('should return failure when email already exists', async () => {
      await db.insert(users).values({
        id: 'existing-user',
        email: 'test@example.com',
        username: 'Existing User',
      });
      
      const result = await createUser({
        id: 'test-user-user-app',
        email: 'test@example.com',
        username: 'testuser-user-app',
        password: 'password123',
      });
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('USER_ALREADY_EXISTS');
      }
    });

    it('should return failure when id already exists', async () => {
      await db.insert(users).values({
        id: 'test-user-user-app',
        email: 'existing@example.com',
        username: 'Existing User',
      });
      
      const result = await createUser({
        id: 'test-user-user-app',
        email: 'test@example.com',
        username: 'testuser-user-app',
        password: 'password123',
      });
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('USER_ALREADY_EXISTS');
      }
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      await db.insert(users).values({
        id: 'test-user-user-app',
        email: 'test@example.com',
        username: 'testuser-user-app',
      });
      
      const result = await updateUser('test-user-user-app', {
        username: 'Updated Name',
      });
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.username).toBe('Updated Name');
      }
    });

    it('should return failure when user not found', async () => {
      const result = await updateUser('non-existent', {
        username: 'New Name',
      });
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('USER_NOT_FOUND');
      }
    });

    it('should return failure when new email conflicts', async () => {
      await db.insert(users).values({
        id: 'test-user-user-app',
        email: 'test@example.com',
        username: 'testuser-user-app',
      });
      await db.insert(users).values({
        id: 'test-user-2',
        email: 'other@example.com',
        username: 'Other User',
      });
      
      const result = await updateUser('test-user-user-app', {
        email: 'other@example.com',
      });
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('USER_ALREADY_EXISTS');
      }
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      await db.insert(users).values({
        id: 'test-user-user-app',
        email: 'test@example.com',
        username: 'testuser-user-app',
      });
      
      const result = await deleteUser('test-user-user-app');
      
      expect(result.success).toBe(true);
    });

    it('should return failure when user not found', async () => {
      const result = await deleteUser('non-existent');
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('USER_NOT_FOUND');
      }
    });
  });

  // 清理测试数据库schema
  afterAll(async () => {
    await cleanupTestDb(__filename);
  });
});

