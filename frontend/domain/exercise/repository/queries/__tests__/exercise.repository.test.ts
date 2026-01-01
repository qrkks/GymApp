/**
 * Exercise Repository Queries 单元测试
 */
import { getTestDb } from '@/tests/setup/test-db';
import * as exerciseQueries from '../exercise.repository';
import * as exerciseCommands from '../../commands/exercise.repository';
import * as userCommands from '@domain/user/repository/commands/user.repository';
import * as bodyPartCommands from '@domain/body-part/repository/commands/body-part.repository';
import { exercises, users, bodyParts } from '@/lib/db/schema';

// Mock the database module
jest.mock('@/lib/db', () => {
  const { getTestDb } = require('@/tests/setup/test-db');
  return {
    db: getTestDb(),
  };
});

describe('Exercise Repository - Queries', () => {
  const testDb = getTestDb();
  const testUserId = 'test-user-1';

  beforeEach(async () => {
    // 清理数据库
    await testDb.delete(exercises);
    await testDb.delete(bodyParts);
    await testDb.delete(users);
    
    // 创建测试用户
    await userCommands.insertUser({
      id: testUserId,
      email: 'test@example.com',
      username: 'testuser',
    });
  });

  async function createTestData() {
    const bodyPart = await bodyPartCommands.insertBodyPart(testUserId, 'Chest');
    const exercise = await exerciseCommands.insertExercise(testUserId, {
      name: 'Bench Press',
      description: 'Chest exercise',
      bodyPartId: bodyPart.id,
    });
    return { bodyPart, exercise };
  }

  describe('findExercises', () => {
    it('should return empty array when no exercises exist', async () => {
      const result = await exerciseQueries.findExercises(testUserId);
      expect(result).toEqual([]);
    });

    it('should return all exercises for a user', async () => {
      const { exercise } = await createTestData();
      
      const result = await exerciseQueries.findExercises(testUserId);
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Bench Press');
      expect(result[0].body_part.name).toBe('Chest');
    });

    it('should filter by body part name', async () => {
      const { bodyPart } = await createTestData();
      
      const backBodyPart = await bodyPartCommands.insertBodyPart(testUserId, 'Back');
      await exerciseCommands.insertExercise(testUserId, {
        name: 'Deadlift',
        description: 'Back exercise',
        bodyPartId: backBodyPart.id,
      });
      
      const result = await exerciseQueries.findExercises(testUserId, 'Chest');
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Bench Press');
      expect(result[0].body_part.name).toBe('Chest');
    });
  });

  describe('findExerciseById', () => {
    it('should return null when exercise does not exist', async () => {
      const result = await exerciseQueries.findExerciseById(999, testUserId);
      expect(result).toBeNull();
    });

    it('should return exercise when found', async () => {
      const { exercise } = await createTestData();
      
      const result = await exerciseQueries.findExerciseById(exercise.id, testUserId);
      
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Bench Press');
      expect(result?.userId).toBe(testUserId);
    });
  });

  describe('findExerciseByName', () => {
    it('should return null when exercise does not exist', async () => {
      const result = await exerciseQueries.findExerciseByName(testUserId, 'NonExistent');
      expect(result).toBeNull();
    });

    it('should return exercise when found by name', async () => {
      await createTestData();
      
      const result = await exerciseQueries.findExerciseByName(testUserId, 'Bench Press');
      
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Bench Press');
    });
  });

  describe('findExercisesByBodyPartName', () => {
    it('should return exercises for a body part', async () => {
      await createTestData();
      
      const result = await exerciseQueries.findExercisesByBodyPartName(testUserId, 'Chest');
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Bench Press');
      expect(result[0].body_part.name).toBe('Chest');
    });
  });
});

