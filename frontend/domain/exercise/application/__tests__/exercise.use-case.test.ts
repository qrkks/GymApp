/**
 * Exercise Application Service 单元测试
 */
import { createTestDb, cleanupTestDb } from '@/tests/setup/test-db';
import { generateTestUserIdentifiers } from '@/tests/setup/test-helpers';
import {
  getExerciseList,
  getExercisesByBodyPartName,
  createExercise,
  updateExerciseName,
  deleteExercise,
  deleteAllExercises,
} from '../exercise.use-case';
import * as exerciseCommands from '../../repository/commands/exercise.repository';
import * as userCommands from '@domain/user/repository/commands/user.repository';
import * as bodyPartCommands from '@domain/body-part/repository/commands/body-part.repository';
import { exercises, users, bodyParts } from '@/lib/db/schema';

// Mock the database module - 使用独立的schema进行测试隔离
jest.mock('@/lib/db', () => ({
  db: createTestDb(__filename),
}));

describe('Exercise Application Service', () => {
  const testDb = createTestDb(__filename);
  const { userId: testUserId, email: testUserEmail, username: testUsername } = generateTestUserIdentifiers(__filename);

  beforeEach(async () => {
    // 清理数据库
    await testDb.delete(exercises);
    await testDb.delete(bodyParts);
    await testDb.delete(users);
    
    // 创建测试用户
    await userCommands.insertUser({
      id: testUserId,
      email: testUserEmail,
      username: testUsername,
    });
  });

  async function createTestData() {
    const bodyPart = await bodyPartCommands.insertBodyPart(testUserId, 'Chest');
    return { bodyPart };
  }

  describe('getExerciseList', () => {
    it('should return success with empty array when no exercises exist', async () => {
      const result = await getExerciseList(testUserId);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });

    it('should return success with all exercises', async () => {
      const { bodyPart } = await createTestData();
      
      await exerciseCommands.insertExercise(testUserId, {
        name: 'Bench Press',
        bodyPartId: bodyPart.id,
      });
      
      const result = await getExerciseList(testUserId);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
      }
    });

    it('should return failure when body part not found', async () => {
      const result = await getExerciseList(testUserId, 'NonExistent');
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('BODY_PART_NOT_FOUND');
      }
    });
  });

  describe('getExercisesByBodyPartName', () => {
    it('should return exercises for a body part', async () => {
      const { bodyPart } = await createTestData();
      
      await exerciseCommands.insertExercise(testUserId, {
        name: 'Bench Press',
        bodyPartId: bodyPart.id,
      });
      
      const result = await getExercisesByBodyPartName(testUserId, 'Chest');
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].name).toBe('Bench Press');
      }
    });

    it('should return failure when body part not found', async () => {
      const result = await getExercisesByBodyPartName(testUserId, 'NonExistent');
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('BODY_PART_NOT_FOUND');
      }
    });
  });

  describe('createExercise', () => {
    it('should create exercise successfully', async () => {
      const { bodyPart } = await createTestData();
      
      const result = await createExercise(testUserId, {
        name: 'Bench Press',
        description: 'Chest exercise',
        bodyPartId: bodyPart.id,
      });
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Bench Press');
        expect(result.data.body_part.name).toBe('Chest');
      }
    });

    it('should return existing exercise if already exists', async () => {
      const { bodyPart } = await createTestData();
      
      await exerciseCommands.insertExercise(testUserId, {
        name: 'Bench Press',
        bodyPartId: bodyPart.id,
      });
      
      const result = await createExercise(testUserId, {
        name: 'Bench Press',
        bodyPartId: bodyPart.id,
      });
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Bench Press');
      }
    });

    it('should return failure when body part not found', async () => {
      const result = await createExercise(testUserId, {
        name: 'Bench Press',
        bodyPartId: 999,
      });
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('BODY_PART_NOT_FOUND');
      }
    });
  });

  describe('updateExerciseName', () => {
    it('should update exercise name successfully', async () => {
      const { bodyPart } = await createTestData();
      
      const created = await exerciseCommands.insertExercise(testUserId, {
        name: 'Bench Press',
        bodyPartId: bodyPart.id,
      });
      
      const result = await updateExerciseName(created.id, testUserId, 'Incline Bench Press');
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Incline Bench Press');
      }
    });

    it('should return failure when exercise not found', async () => {
      const result = await updateExerciseName(999, testUserId, 'New Name');
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('EXERCISE_NOT_FOUND');
      }
    });
  });

  describe('deleteExercise', () => {
    it('should delete exercise successfully', async () => {
      const { bodyPart } = await createTestData();
      
      const created = await exerciseCommands.insertExercise(testUserId, {
        name: 'Bench Press',
        bodyPartId: bodyPart.id,
      });
      
      const result = await deleteExercise(created.id, testUserId);
      
      expect(result.success).toBe(true);
    });

    it('should return failure when exercise not found', async () => {
      const result = await deleteExercise(999, testUserId);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('EXERCISE_NOT_FOUND');
      }
    });
  });

  describe('deleteAllExercises', () => {
    it('should delete all exercises successfully', async () => {
      const { bodyPart } = await createTestData();
      
      await exerciseCommands.insertExercise(testUserId, {
        name: 'Bench Press',
        bodyPartId: bodyPart.id,
      });
      
      const result = await deleteAllExercises(testUserId);
      
      expect(result.success).toBe(true);
    });
  });

  afterAll(async () => {
    await cleanupTestDb(__filename);
  });
});

