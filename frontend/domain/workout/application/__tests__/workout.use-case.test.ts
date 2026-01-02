/**
 * Workout Application Service 单元测试
 */
import { createTestDb, cleanupTestDb } from '@/tests/setup/test-db';
import {
  getWorkoutList,
  getWorkoutByDate,
  createWorkout,
  createOrGetWorkout,
  addBodyPartsToWorkout,
  removeBodyPartsFromWorkout,
  deleteWorkout,
  deleteAllWorkouts,
} from '../workout.use-case';
import * as workoutCommands from '../../repository/commands/workout.repository';
import * as userCommands from '@domain/user/repository/commands/user.repository';
import * as bodyPartCommands from '@domain/body-part/repository/commands/body-part.repository';
import { workouts, users, bodyParts, workoutBodyParts } from '@/lib/db/schema';

// Mock the database module - 使用独立的schema进行测试隔离
jest.mock('@/lib/db', () => ({
  db: createTestDb(__filename),
}));

describe('Workout Application Service', () => {
  const testDb = createTestDb(__filename);
  const testUserId = 'test-user-workout-app';

  beforeEach(async () => {
    // 清理数据库
    await testDb.delete(workoutBodyParts);
    await testDb.delete(workouts);
    await testDb.delete(bodyParts);
    await testDb.delete(users);
    
    // 创建测试用户
    await userCommands.insertUser({
      id: testUserId,
      email: 'test@example.com',
      username: 'testuser-workout-app',
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

  describe('getWorkoutList', () => {
    it('should return success with empty array when no workouts exist', async () => {
      const result = await getWorkoutList(testUserId);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });

    it('should return success with all workouts', async () => {
      await workoutCommands.insertWorkout(testUserId, {
        date: '2024-01-15',
      });
      
      const result = await getWorkoutList(testUserId);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
      }
    });
  });

  describe('getWorkoutByDate', () => {
    it('should return success with workout', async () => {
      await workoutCommands.insertWorkout(testUserId, {
        date: '2024-01-15',
      });
      
      const result = await getWorkoutByDate(testUserId, '2024-01-15');
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.date).toBe('2024-01-15');
      }
    });

    it('should return failure when workout not found', async () => {
      const result = await getWorkoutByDate(testUserId, '2024-01-20');
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('WORKOUT_NOT_FOUND');
      }
    });
  });

  describe('createWorkout', () => {
    it('should create workout successfully', async () => {
      const result = await createWorkout(testUserId, {
        date: '2024-01-15',
      });
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.date).toBe('2024-01-15');
        expect(result.data.created).toBe(true);
      }
    });

    it('should return failure when workout already exists', async () => {
      await workoutCommands.insertWorkout(testUserId, {
        date: '2024-01-15',
      });
      
      const result = await createWorkout(testUserId, {
        date: '2024-01-15',
      });
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('WORKOUT_ALREADY_EXISTS');
      }
    });
  });

  describe('createOrGetWorkout', () => {
    it('should create workout if not exists', async () => {
      const result = await createOrGetWorkout(testUserId, '2024-01-15');
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.created).toBe(true);
      }
    });

    it('should return existing workout if exists', async () => {
      await workoutCommands.insertWorkout(testUserId, {
        date: '2024-01-15',
      });
      
      const result = await createOrGetWorkout(testUserId, '2024-01-15');
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.created).toBe(false);
      }
    });
  });

  describe('addBodyPartsToWorkout', () => {
    it('should add body parts to workout successfully', async () => {
      const { workout } = await createTestData();
      const bodyPart = await bodyPartCommands.insertBodyPart(testUserId, 'Back');
      
      const result = await addBodyPartsToWorkout(testUserId, '2024-01-15', ['Chest', 'Back']);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body_parts.length).toBeGreaterThan(0);
      }
    });

    it('should return failure when workout not found', async () => {
      const result = await addBodyPartsToWorkout(testUserId, '2024-01-20', ['Chest']);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('WORKOUT_NOT_FOUND');
      }
    });
  });

  describe('removeBodyPartsFromWorkout', () => {
    it('should remove body parts from workout successfully', async () => {
      const { workout, bodyPart } = await createTestData();
      
      await workoutCommands.addBodyPartsToWorkout(workout.id, [bodyPart.id]);
      
      const result = await removeBodyPartsFromWorkout(testUserId, '2024-01-15', ['Chest']);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body_parts).toHaveLength(0);
      }
    });

    it('should return failure when workout not found', async () => {
      const result = await removeBodyPartsFromWorkout(testUserId, '2024-01-20', ['Chest']);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('WORKOUT_NOT_FOUND');
      }
    });
  });

  describe('deleteWorkout', () => {
    it('should delete workout successfully', async () => {
      await workoutCommands.insertWorkout(testUserId, {
        date: '2024-01-15',
      });
      
      const result = await deleteWorkout(testUserId, '2024-01-15');
      
      expect(result.success).toBe(true);
    });

    it('should return failure when workout not found', async () => {
      const result = await deleteWorkout(testUserId, '2024-01-20');
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('WORKOUT_NOT_FOUND');
      }
    });
  });

  describe('deleteAllWorkouts', () => {
    it('should delete all workouts successfully', async () => {
      await workoutCommands.insertWorkout(testUserId, {
        date: '2024-01-15',
      });
      
      const result = await deleteAllWorkouts(testUserId);
      
      expect(result.success).toBe(true);
    });
  });

  // 清理测试数据库schema
  afterAll(async () => {
    await cleanupTestDb(__filename);
  });
});

