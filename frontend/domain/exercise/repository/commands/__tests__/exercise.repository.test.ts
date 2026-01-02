/**
 * Exercise Repository Commands 单元测试
 */
import { createTestDb, cleanupTestDb } from '@/tests/setup/test-db';
import * as exerciseCommands from '../exercise.repository';
import * as exerciseQueries from '../../queries/exercise.repository';
import * as userCommands from '@domain/user/repository/commands/user.repository';
import * as bodyPartCommands from '@domain/body-part/repository/commands/body-part.repository';
import { exercises, users, bodyParts } from '@/lib/db/schema';

// Mock the database module - 使用独立的schema进行测试隔离
jest.mock('@/lib/db', () => ({
  db: createTestDb(__filename),
}));

describe('Exercise Repository - Commands', () => {
  const testDb = createTestDb(__filename);
  const testUserId = 'test-user-exercise-commands';

  beforeEach(async () => {
    // 清理数据库
    await testDb.delete(exercises);
    await testDb.delete(bodyParts);
    await testDb.delete(users);
    
    // 创建测试用户
    await userCommands.insertUser({
      id: testUserId,
      email: 'test@example.com',
      username: 'testuser-exercise-commands',
    });
  });

  async function createTestData() {
    const bodyPart = await bodyPartCommands.insertBodyPart(testUserId, 'Chest');
    return { bodyPart };
  }

  describe('insertExercise', () => {
    it('should create a new exercise', async () => {
      const { bodyPart } = await createTestData();
      
      const result = await exerciseCommands.insertExercise(testUserId, {
        name: 'Bench Press',
        description: 'Chest exercise',
        bodyPartId: bodyPart.id,
      });
      
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe('Bench Press');
      expect(result.userId).toBe(testUserId);
      expect(result.bodyPartId).toBe(bodyPart.id);
    });
  });

  describe('updateExerciseName', () => {
    it('should update exercise name', async () => {
      const { bodyPart } = await createTestData();
      
      const created = await exerciseCommands.insertExercise(testUserId, {
        name: 'Bench Press',
        bodyPartId: bodyPart.id,
      });
      
      const updated = await exerciseCommands.updateExerciseName(
        created.id,
        testUserId,
        'Incline Bench Press'
      );
      
      expect(updated).not.toBeNull();
      expect(updated?.name).toBe('Incline Bench Press');
      expect(updated?.id).toBe(created.id);
    });

    it('should return null when exercise does not exist', async () => {
      const result = await exerciseCommands.updateExerciseName(999, testUserId, 'New Name');
      expect(result).toBeNull();
    });
  });

  describe('deleteExercise', () => {
    it('should delete exercise', async () => {
      const { bodyPart } = await createTestData();
      
      const created = await exerciseCommands.insertExercise(testUserId, {
        name: 'Bench Press',
        bodyPartId: bodyPart.id,
      });
      
      const deleted = await exerciseCommands.deleteExercise(created.id, testUserId);
      
      expect(deleted).toBe(true);
      
      const found = await exerciseQueries.findExerciseById(created.id, testUserId);
      expect(found).toBeNull();
    });

    it('should return false when exercise does not exist', async () => {
      const result = await exerciseCommands.deleteExercise(999, testUserId);
      expect(result).toBe(false);
    });
  });

  describe('deleteAllExercises', () => {
    it('should delete all exercises for a user', async () => {
      const { bodyPart } = await createTestData();
      
      await exerciseCommands.insertExercise(testUserId, {
        name: 'Bench Press',
        bodyPartId: bodyPart.id,
      });
      
      await exerciseCommands.insertExercise(testUserId, {
        name: 'Squat',
        bodyPartId: bodyPart.id,
      });
      
      await exerciseCommands.deleteAllExercises(testUserId);
      
      const result = await exerciseQueries.findExercises(testUserId);
      expect(result).toHaveLength(0);
    });
  });

  // 清理测试数据库schema
  afterAll(async () => {
    await cleanupTestDb(__filename);
  });
});

