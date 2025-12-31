/**
 * BodyPart Repository Queries 单元测试
 */
import { getTestDb } from '@/tests/setup/test-db';
import * as bodyPartQueries from '../body-part.repository';
import * as bodyPartCommands from '../../commands/body-part.repository';
import * as userCommands from '@domain/user/repository/commands/user.repository';
import { bodyParts, users } from '@/lib/db/schema';

// Mock the database module
jest.mock('@/lib/db', () => {
  const { getTestDb } = require('@/tests/setup/test-db');
  return {
    db: getTestDb(),
  };
});

describe('BodyPart Repository - Queries', () => {
  const db = getTestDb();
  const testUserId = 'test-user-1';

  beforeEach(async () => {
    // 清理数据库
    await db.delete(bodyParts);
    await db.delete(users);
    // 创建测试用户（body_parts 需要外键引用 users）
    await userCommands.insertUser({
      id: testUserId,
      email: 'test@example.com',
      name: 'Test User',
    });
  });

  describe('getBodyPartList', () => {
    it('should return empty array when no body parts exist', async () => {
      const result = await bodyPartQueries.getBodyPartList(testUserId);
      expect(result).toEqual([]);
    });

    it('should return all body parts for a user', async () => {
      // 创建测试数据
      await bodyPartCommands.insertBodyPart(testUserId, 'Chest');
      await bodyPartCommands.insertBodyPart(testUserId, 'Back');

      const result = await bodyPartQueries.getBodyPartList(testUserId);
      expect(result).toHaveLength(2);
      expect(result.map((bp) => bp.name)).toContain('Chest');
      expect(result.map((bp) => bp.name)).toContain('Back');
    });

    it('should only return body parts for the specified user', async () => {
      const otherUserId = 'test-user-2';
      
      // 创建另一个用户
      await userCommands.insertUser({
        id: otherUserId,
        email: 'other@example.com',
        name: 'Other User',
      });
      
      await bodyPartCommands.insertBodyPart(testUserId, 'Chest');
      await bodyPartCommands.insertBodyPart(otherUserId, 'Back');

      const result = await bodyPartQueries.getBodyPartList(testUserId);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Chest');
    });
  });

  describe('findBodyPartById', () => {
    it('should return null when body part does not exist', async () => {
      const result = await bodyPartQueries.findBodyPartById(999, testUserId);
      expect(result).toBeNull();
    });

    it('should return body part when found', async () => {
      const created = await bodyPartCommands.insertBodyPart(testUserId, 'Chest');
      const result = await bodyPartQueries.findBodyPartById(created.id, testUserId);
      
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Chest');
      expect(result?.userId).toBe(testUserId);
    });

    it('should return null when body part belongs to different user', async () => {
      const otherUserId = 'test-user-2';
      
      // 创建另一个用户
      await userCommands.insertUser({
        id: otherUserId,
        email: 'other@example.com',
        name: 'Other User',
      });
      
      const created = await bodyPartCommands.insertBodyPart(otherUserId, 'Chest');
      
      const result = await bodyPartQueries.findBodyPartById(created.id, testUserId);
      expect(result).toBeNull();
    });
  });

  describe('findBodyPartByName', () => {
    it('should return null when body part does not exist', async () => {
      const result = await bodyPartQueries.findBodyPartByName(testUserId, 'NonExistent');
      expect(result).toBeNull();
    });

    it('should return body part when found by name', async () => {
      await bodyPartCommands.insertBodyPart(testUserId, 'Chest');
      const result = await bodyPartQueries.findBodyPartByName(testUserId, 'Chest');
      
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Chest');
      expect(result?.userId).toBe(testUserId);
    });

    it('should return null when body part belongs to different user', async () => {
      const otherUserId = 'test-user-2';
      
      // 创建另一个用户
      await userCommands.insertUser({
        id: otherUserId,
        email: 'other@example.com',
        name: 'Other User',
      });
      
      await bodyPartCommands.insertBodyPart(otherUserId, 'Chest');
      
      const result = await bodyPartQueries.findBodyPartByName(testUserId, 'Chest');
      expect(result).toBeNull();
    });
  });
});

