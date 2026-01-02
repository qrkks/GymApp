/**
 * BodyPart Repository Commands 单元测试
 */
import { createTestDb, cleanupTestDb } from '@/tests/setup/test-db';
import { generateTestUserIdentifiers } from '@/tests/setup/test-helpers';
import * as bodyPartCommands from '../body-part.repository';
import * as bodyPartQueries from '../../queries/body-part.repository';
import * as userCommands from '@domain/user/repository/commands/user.repository';
import { bodyParts, users } from '@/lib/db/schema';

// Mock the database module - 使用独立的schema进行测试隔离
jest.mock('@/lib/db', () => ({
  db: createTestDb(__filename),
}));

describe('BodyPart Repository - Commands', () => {
  const db = createTestDb(__filename);
  const { userId: testUserId, email: testUserEmail, username: testUsername } = generateTestUserIdentifiers(__filename);

  beforeEach(async () => {
    // 清理数据库
    await db.delete(bodyParts);
    await db.delete(users);
    // 创建测试用户（body_parts 需要外键引用 users）
    await userCommands.insertUser({
      id: testUserId,
      email: testUserEmail,
      username: testUsername,
    });
  });

  describe('insertBodyPart', () => {
    it('should create a new body part', async () => {
      const result = await bodyPartCommands.insertBodyPart(testUserId, 'Chest');
      
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe('Chest');
      expect(result.userId).toBe(testUserId);
    });

    it('should create multiple body parts', async () => {
      const chest = await bodyPartCommands.insertBodyPart(testUserId, 'Chest');
      const back = await bodyPartCommands.insertBodyPart(testUserId, 'Back');
      
      expect(chest.id).not.toBe(back.id);
      expect(chest.name).toBe('Chest');
      expect(back.name).toBe('Back');
    });
  });

  describe('updateBodyPart', () => {
    it('should update body part name', async () => {
      const created = await bodyPartCommands.insertBodyPart(testUserId, 'Chest');
      const updated = await bodyPartCommands.updateBodyPart(
        created.id,
        testUserId,
        'Upper Chest'
      );
      
      expect(updated).not.toBeNull();
      expect(updated?.name).toBe('Upper Chest');
      expect(updated?.id).toBe(created.id);
    });

    it('should return null when body part does not exist', async () => {
      const result = await bodyPartCommands.updateBodyPart(999, testUserId, 'New Name');
      expect(result).toBeNull();
    });

    it('should return null when body part belongs to different user', async () => {
      const { userId: otherUserId, email: otherUserEmail, username: otherUsername } = generateTestUserIdentifiers(__filename, 'other');
      
      // 创建另一个用户
      await userCommands.insertUser({
        id: otherUserId,
        email: otherUserEmail,
        username: otherUsername,
      });
      
      const created = await bodyPartCommands.insertBodyPart(otherUserId, 'Chest');
      
      const result = await bodyPartCommands.updateBodyPart(
        created.id,
        testUserId,
        'New Name'
      );
      expect(result).toBeNull();
    });
  });

  describe('deleteBodyPart', () => {
    it('should delete body part', async () => {
      const created = await bodyPartCommands.insertBodyPart(testUserId, 'Chest');
      const deleted = await bodyPartCommands.deleteBodyPart(created.id, testUserId);
      
      expect(deleted).toBe(true);
      
      const found = await bodyPartQueries.findBodyPartById(created.id, testUserId);
      expect(found).toBeNull();
    });

    it('should return false when body part does not exist', async () => {
      const result = await bodyPartCommands.deleteBodyPart(999, testUserId);
      expect(result).toBe(false);
    });

    it('should return false when body part belongs to different user', async () => {
      const { userId: otherUserId, email: otherUserEmail, username: otherUsername } = generateTestUserIdentifiers(__filename, 'other');
      
      // 创建另一个用户
      await userCommands.insertUser({
        id: otherUserId,
        email: otherUserEmail,
        username: otherUsername,
      });
      
      const created = await bodyPartCommands.insertBodyPart(otherUserId, 'Chest');
      
      const result = await bodyPartCommands.deleteBodyPart(created.id, testUserId);
      expect(result).toBe(false);
    });
  });

  describe('deleteAllBodyParts', () => {
    it('should delete all body parts for a user', async () => {
      await bodyPartCommands.insertBodyPart(testUserId, 'Chest');
      await bodyPartCommands.insertBodyPart(testUserId, 'Back');
      
      await bodyPartCommands.deleteAllBodyParts(testUserId);
      
      const result = await bodyPartQueries.getBodyPartList(testUserId);
      expect(result).toHaveLength(0);
    });

    it('should only delete body parts for the specified user', async () => {
      const { userId: otherUserId, email: otherUserEmail, username: otherUsername } = generateTestUserIdentifiers(__filename, 'other');
      
      // 创建另一个用户
      await userCommands.insertUser({
        id: otherUserId,
        email: otherUserEmail,
        username: otherUsername,
      });
      
      await bodyPartCommands.insertBodyPart(testUserId, 'Chest');
      await bodyPartCommands.insertBodyPart(otherUserId, 'Back');
      
      await bodyPartCommands.deleteAllBodyParts(testUserId);
      
      const user1Parts = await bodyPartQueries.getBodyPartList(testUserId);
      const user2Parts = await bodyPartQueries.getBodyPartList(otherUserId);
      
      expect(user1Parts).toHaveLength(0);
      expect(user2Parts).toHaveLength(1);
    });
  });

  // 清理测试数据库schema
  afterAll(async () => {
    await cleanupTestDb(__filename);
  });
});

