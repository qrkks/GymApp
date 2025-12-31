/**
 * User Application Service 单元测试
 */
import { getTestDb } from '@/tests/setup/test-db';
import {
  getUserById,
  getUserByEmail,
  createUser,
  updateUser,
  deleteUser,
} from '../user.use-case';
import { users } from '@/lib/db/schema';

// Mock the database module
jest.mock('@/lib/db', () => {
  const { getTestDb } = require('@/tests/setup/test-db');
  return {
    db: getTestDb(),
  };
});

describe('User Application Service', () => {
  const db = getTestDb();

  beforeEach(async () => {
    // 清理数据库
    await db.delete(users);
  });

  describe('getUserById', () => {
    it('should return success with user when found', async () => {
      await db.insert(users).values({
        id: 'test-user-1',
        email: 'test@example.com',
        username: 'Test User',
      });
      
      const result = await getUserById('test-user-1');
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('test-user-1');
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
        id: 'test-user-1',
        email: 'test@example.com',
        username: 'Test User',
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
        id: 'test-user-1',
        email: 'test@example.com',
        username: 'Test User',
      });
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('test@example.com');
      }
    });

    it('should return failure when email is invalid', async () => {
      const result = await createUser({
        id: 'test-user-1',
        email: 'invalid-email',
        username: 'Test User',
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
        id: 'test-user-1',
        email: 'test@example.com',
        username: 'Test User',
      });
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('USER_ALREADY_EXISTS');
      }
    });

    it('should return failure when id already exists', async () => {
      await db.insert(users).values({
        id: 'test-user-1',
        email: 'existing@example.com',
        username: 'Existing User',
      });
      
      const result = await createUser({
        id: 'test-user-1',
        email: 'test@example.com',
        username: 'Test User',
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
        id: 'test-user-1',
        email: 'test@example.com',
        username: 'Test User',
      });
      
      const result = await updateUser('test-user-1', {
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
        id: 'test-user-1',
        email: 'test@example.com',
        username: 'Test User',
      });
      await db.insert(users).values({
        id: 'test-user-2',
        email: 'other@example.com',
        username: 'Other User',
      });
      
      const result = await updateUser('test-user-1', {
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
        id: 'test-user-1',
        email: 'test@example.com',
        username: 'Test User',
      });
      
      const result = await deleteUser('test-user-1');
      
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
});

