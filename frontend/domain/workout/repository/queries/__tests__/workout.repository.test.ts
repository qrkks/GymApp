/**
 * Workout Repository Queries unit tests
 */
import { createTestDb, cleanupTestDb } from '@/tests/setup/test-db';
import * as workoutQueries from '../workout.repository';
import * as workoutCommands from '../../commands/workout.repository';
import * as userCommands from '@domain/user/repository/commands/user.repository';
import * as bodyPartCommands from '@domain/body-part/repository/commands/body-part.repository';
import * as exerciseCommands from '@domain/exercise/repository/commands/exercise.repository';
import { workouts, users, bodyParts, workoutBodyParts, exercises, workoutSets, sets } from '@/lib/db/schema';

jest.mock('@/lib/db', () => ({
  db: createTestDb(__filename),
}));

describe('Workout Repository - Queries', () => {
  const testDb = createTestDb(__filename);
  const testUserId = 'test-user-workout-queries';

  beforeEach(async () => {
    await testDb.delete(sets);
    await testDb.delete(workoutSets);
    await testDb.delete(exercises);
    await testDb.delete(workoutBodyParts);
    await testDb.delete(workouts);
    await testDb.delete(bodyParts);
    await testDb.delete(users);

    await userCommands.insertUser({
      id: testUserId,
      email: 'test@example.com',
      username: 'testuser-workout-queries',
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

  describe('findWorkouts', () => {
    it('should return empty array when no workouts exist', async () => {
      const result = await workoutQueries.findWorkouts(testUserId);
      expect(result).toEqual([]);
    });

    it('should return all workouts for a user', async () => {
      await workoutCommands.insertWorkout(testUserId, {
        date: '2024-01-15',
      });
      await workoutCommands.insertWorkout(testUserId, {
        date: '2024-01-16',
      });

      const result = await workoutQueries.findWorkouts(testUserId);

      expect(result).toHaveLength(2);
      expect(result.map((workout) => workout.date)).toContain('2024-01-15');
      expect(result.map((workout) => workout.date)).toContain('2024-01-16');
    });
  });

  describe('findWorkoutByDate', () => {
    it('should return null when workout does not exist', async () => {
      const result = await workoutQueries.findWorkoutByDate(testUserId, '2024-01-15');
      expect(result).toBeNull();
    });

    it('should return workout when found', async () => {
      await workoutCommands.insertWorkout(testUserId, {
        date: '2024-01-15',
      });

      const result = await workoutQueries.findWorkoutByDate(testUserId, '2024-01-15');

      expect(result).not.toBeNull();
      expect(result?.date).toBe('2024-01-15');
      expect(result?.userId).toBe(testUserId);
    });
  });

  describe('findWorkoutByDateWithBodyParts', () => {
    it('should return null when workout does not exist', async () => {
      const result = await workoutQueries.findWorkoutByDateWithBodyParts(testUserId, '2024-01-15');
      expect(result).toBeNull();
    });

    it('should return workout with body parts', async () => {
      const { workout, bodyPart } = await createTestData();

      await workoutCommands.addBodyPartsToWorkout(workout.id, [bodyPart.id]);

      const result = await workoutQueries.findWorkoutByDateWithBodyParts(testUserId, '2024-01-15');

      expect(result).not.toBeNull();
      expect(result?.date).toBe('2024-01-15');
      expect(result?.body_parts).toHaveLength(1);
      expect(result?.body_parts[0].name).toBe('Chest');
    });
  });

  describe('findExerciseBlocksByWorkoutAndBodyPartIds', () => {
    it('should return exercise blocks matching the provided body part ids', async () => {
      const { workout, bodyPart } = await createTestData();
      const backBodyPart = await bodyPartCommands.insertBodyPart(testUserId, 'Back');

      const chestExercise = await exerciseCommands.insertExercise(testUserId, {
        name: 'Bench Press',
        bodyPartId: bodyPart.id,
      });
      const backExercise = await exerciseCommands.insertExercise(testUserId, {
        name: 'Row',
        bodyPartId: backBodyPart.id,
      });

      await workoutCommands.insertExerciseBlock(testUserId, workout.id, chestExercise.id);
      await workoutCommands.insertExerciseBlock(testUserId, workout.id, backExercise.id);

      const result = await workoutQueries.findExerciseBlocksByWorkoutAndBodyPartIds(
        testUserId,
        workout.id,
        [bodyPart.id]
      );

      expect(result).toHaveLength(1);
      expect(result[0]?.exercise.name).toBe('Bench Press');
      expect(result[0]?.exercise.body_part.name).toBe('Chest');
    });
  });

  afterAll(async () => {
    await cleanupTestDb(__filename);
  });
});
