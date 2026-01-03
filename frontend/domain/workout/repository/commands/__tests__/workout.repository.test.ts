/**
 * Workout Repository Commands 单元测试
 */
import { createTestDb, cleanupTestDb, getTestDbAsync } from '@/tests/setup/test-db';
import { generateTestUserIdentifiers } from '@/tests/setup/test-helpers';
import * as workoutCommands from '../workout.repository';
import * as workoutQueries from '../../queries/workout.repository';
import * as userCommands from '@domain/user/repository/commands/user.repository';
import * as bodyPartCommands from '@domain/body-part/repository/commands/body-part.repository';
import { workouts, users, bodyParts, workoutBodyParts } from '@/lib/db/schema';

// Mock the database module - 使用独立的schema进行测试隔离
jest.mock('@/lib/db', () => ({
  db: createTestDb(__filename),
}));

describe('Workout Repository - Commands', () => {
  const testDb = createTestDb(__filename);
  const { userId: testUserId, email: testUserEmail, username: testUsername } = generateTestUserIdentifiers(__filename);

  beforeEach(async () => {
    // 确保数据库已初始化
    await getTestDbAsync(__filename);
    
    // 清理数据库 - 按依赖关系逆序删除，使用try-catch避免表不存在时失败
    try {
      await testDb.delete(workoutBodyParts);
    } catch (e: any) {
      // 忽略表不存在的错误
      if (!e?.message?.includes('不存在') && !e?.message?.includes('does not exist')) {
        throw e;
      }
    }
    try {
      await testDb.delete(workouts);
    } catch (e: any) {
      // 忽略表不存在的错误
      if (!e?.message?.includes('不存在') && !e?.message?.includes('does not exist')) {
        throw e;
      }
    }
    try {
      await testDb.delete(bodyParts);
    } catch (e: any) {
      // 忽略表不存在的错误
      if (!e?.message?.includes('不存在') && !e?.message?.includes('does not exist')) {
        throw e;
      }
    }
    try {
      await testDb.delete(users);
    } catch (e: any) {
      // 忽略表不存在的错误
      if (!e?.message?.includes('不存在') && !e?.message?.includes('does not exist')) {
        throw e;
      }
    }
    
    // 创建测试用户
    await userCommands.insertUser({
      id: testUserId,
      email: testUserEmail,
      username: testUsername,
    });
  });

  async function createTestData() {
    const bodyPart = await bodyPartCommands.insertBodyPart(testUserId, 'Chest');
    const workout = await workoutCommands.insertWorkout(testUserId, {
      date: '2024-01-15',
      startTime: new Date('2024-01-15T10:00:00'),
    });
    return { bodyPart, workout };
  }

  describe('insertWorkout', () => {
    it('should create a new workout', async () => {
      const result = await workoutCommands.insertWorkout(testUserId, {
        date: '2024-01-15',
      });
      
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.date).toBe('2024-01-15');
      expect(result.userId).toBe(testUserId);
    });
  });

  describe('addBodyPartsToWorkout', () => {
    it('should add body parts to workout', async () => {
      const { workout, bodyPart } = await createTestData();
      
      await workoutCommands.addBodyPartsToWorkout(workout.id, [bodyPart.id]);
      
      const bodyParts = await workoutQueries.getWorkoutBodyParts(workout.id);
      expect(bodyParts).toHaveLength(1);
      expect(bodyParts[0].name).toBe('Chest');
    });

    it('should ignore duplicate body parts', async () => {
      const { workout, bodyPart } = await createTestData();
      
      await workoutCommands.addBodyPartsToWorkout(workout.id, [bodyPart.id]);
      await workoutCommands.addBodyPartsToWorkout(workout.id, [bodyPart.id]);
      
      const bodyParts = await workoutQueries.getWorkoutBodyParts(workout.id);
      expect(bodyParts).toHaveLength(1);
    });
  });

  describe('removeBodyPartsFromWorkout', () => {
    it('should remove body parts from workout', async () => {
      const { workout, bodyPart } = await createTestData();
      
      await workoutCommands.addBodyPartsToWorkout(workout.id, [bodyPart.id]);
      await workoutCommands.removeBodyPartsFromWorkout(workout.id, [bodyPart.id]);
      
      const bodyParts = await workoutQueries.getWorkoutBodyParts(workout.id);
      expect(bodyParts).toHaveLength(0);
    });
  });

  describe('deleteWorkoutByDate', () => {
    it('should delete workout by date', async () => {
      await workoutCommands.insertWorkout(testUserId, {
        date: '2024-01-15',
      });
      
      const deleted = await workoutCommands.deleteWorkoutByDate(testUserId, '2024-01-15');
      
      expect(deleted).toBe(true);
      
      const found = await workoutQueries.findWorkoutByDate(testUserId, '2024-01-15');
      expect(found).toBeNull();
    });

    it('should return false when workout does not exist', async () => {
      const result = await workoutCommands.deleteWorkoutByDate(testUserId, '2024-01-20');
      expect(result).toBe(false);
    });
  });

  describe('deleteAllWorkouts', () => {
    it('should delete all workouts for a user', async () => {
      await workoutCommands.insertWorkout(testUserId, {
        date: '2024-01-15',
      });
      await workoutCommands.insertWorkout(testUserId, {
        date: '2024-01-16',
      });
      
      await workoutCommands.deleteAllWorkouts(testUserId);
      
      const result = await workoutQueries.findWorkouts(testUserId);
      expect(result).toHaveLength(0);
    });
  });

  // 清理测试数据库schema
  afterAll(async () => {
    await cleanupTestDb(__filename);
  });
});

