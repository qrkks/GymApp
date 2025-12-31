/**
 * BodyPart Application Service 单元测试
 */
import { getTestDb } from '@/tests/setup/test-db';
import {
  getBodyPartList,
  createBodyPart,
  updateBodyPart,
  deleteBodyPart,
  deleteAllBodyParts,
} from '../bodypart.use-case';
import * as bodyPartCommands from '../../repository/commands/bodypart.repository';
import { bodyParts, users } from '@/lib/db/schema';

// Mock the database module
jest.mock('@/lib/db', () => {
  const { getTestDb } = require('@/tests/setup/test-db');
  return {
    db: getTestDb(),
  };
});

describe('BodyPart Application Service', () => {
  const db = getTestDb();
  const testUserId = 'test-user-1';

  beforeEach(async () => {
    // 清理数据库
    await db.delete(bodyParts);
    // 创建测试用户（body_parts 需要外键引用 users）
    await db.insert(users).values({
      id: testUserId,
      email: 'test@example.com',
      name: 'Test User',
    }).onConflictDoNothing();
  });

  describe('getBodyPartList', () => {
    it('should return success with empty array when no body parts exist', async () => {
      const result = await getBodyPartList(testUserId);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });

    it('should return success with all body parts', async () => {
      await bodyPartCommands.insertBodyPart(testUserId, 'Chest');
      await bodyPartCommands.insertBodyPart(testUserId, 'Back');
      
      const result = await getBodyPartList(testUserId);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
      }
    });
  });

  describe('createBodyPart', () => {
    it('should create body part successfully', async () => {
      const result = await createBodyPart(testUserId, 'Chest');
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Chest');
        expect(result.data.userId).toBe(testUserId);
      }
    });

    it('should return failure when body part name already exists', async () => {
      await bodyPartCommands.insertBodyPart(testUserId, 'Chest');
      
      const result = await createBodyPart(testUserId, 'Chest');
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('BODY_PART_ALREADY_EXISTS');
        expect(result.error.message).toContain('already exists');
      }
    });
  });

  describe('updateBodyPart', () => {
    it('should update body part successfully', async () => {
      const created = await bodyPartCommands.insertBodyPart(testUserId, 'Chest');
      const result = await updateBodyPart(created.id, testUserId, 'Upper Chest');
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Upper Chest');
      }
    });

    it('should return failure when body part does not exist', async () => {
      const result = await updateBodyPart(999, testUserId, 'New Name');
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('BODY_PART_NOT_FOUND');
      }
    });

    it('should return failure when new name conflicts with existing body part', async () => {
      const created = await bodyPartCommands.insertBodyPart(testUserId, 'Chest');
      await bodyPartCommands.insertBodyPart(testUserId, 'Back');
      
      const result = await updateBodyPart(created.id, testUserId, 'Back');
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('BODY_PART_ALREADY_EXISTS');
      }
    });

    it('should allow updating to the same name', async () => {
      const created = await bodyPartCommands.insertBodyPart(testUserId, 'Chest');
      const result = await updateBodyPart(created.id, testUserId, 'Chest');
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Chest');
      }
    });
  });

  describe('deleteBodyPart', () => {
    it('should delete body part successfully', async () => {
      const created = await bodyPartCommands.insertBodyPart(testUserId, 'Chest');
      const result = await deleteBodyPart(created.id, testUserId);
      
      expect(result.success).toBe(true);
    });

    it('should return failure when body part does not exist', async () => {
      const result = await deleteBodyPart(999, testUserId);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('BODY_PART_NOT_FOUND');
      }
    });
  });

  describe('deleteAllBodyParts', () => {
    it('should delete all body parts successfully', async () => {
      await bodyPartCommands.insertBodyPart(testUserId, 'Chest');
      await bodyPartCommands.insertBodyPart(testUserId, 'Back');
      
      const result = await deleteAllBodyParts(testUserId);
      
      expect(result.success).toBe(true);
    });
  });
});

