/**
 * Exercise Entity 单元测试
 */
import { Exercise } from '../exercise.entity';

describe('Exercise Entity', () => {
  describe('fromPersistence', () => {
    it('should create exercise from persistence data', () => {
      const persistence = {
        id: 1,
        userId: 'user-1',
        name: 'Bench Press',
        description: 'Chest exercise',
        bodyPartId: 1,
      };

      const exercise = Exercise.fromPersistence(persistence);

      expect(exercise.id).toBe(1);
      expect(exercise.userId).toBe('user-1');
      expect(exercise.getName()).toBe('Bench Press');
      expect(exercise.description).toBe('Chest exercise');
      expect(exercise.bodyPartId).toBe(1);
    });

    it('should handle null description', () => {
      const persistence = {
        id: 1,
        userId: 'user-1',
        name: 'Bench Press',
        description: null,
        bodyPartId: 1,
      };

      const exercise = Exercise.fromPersistence(persistence);

      expect(exercise.description).toBeNull();
    });

    it('should throw error if name is empty', () => {
      expect(() => {
        Exercise.fromPersistence({
          id: 1,
          userId: 'user-1',
          name: '',
          description: null,
          bodyPartId: 1,
        });
      }).toThrow('Exercise name is required');
    });
  });

  describe('toPersistence', () => {
    it('should convert exercise to persistence data', () => {
      const persistence = {
        id: 1,
        userId: 'user-1',
        name: 'Bench Press',
        description: 'Chest exercise',
        bodyPartId: 1,
      };

      const exercise = Exercise.fromPersistence(persistence);
      const result = exercise.toPersistence();

      expect(result).toEqual(persistence);
    });
  });

  describe('business rules', () => {
    it('should check if exercise belongs to userId', () => {
      const exercise = Exercise.fromPersistence({
        id: 1,
        userId: 'user-1',
        name: 'Bench Press',
        description: null,
        bodyPartId: 1,
      });

      expect(exercise.belongsTo('user-1')).toBe(true);
      expect(exercise.belongsTo('user-2')).toBe(false);
    });

    it('should check if exercise has name', () => {
      const exercise = Exercise.fromPersistence({
        id: 1,
        userId: 'user-1',
        name: 'Bench Press',
        description: null,
        bodyPartId: 1,
      });

      expect(exercise.hasName('Bench Press')).toBe(true);
      expect(exercise.hasName('Squat')).toBe(false);
    });

    it('should check if exercise belongs to body part', () => {
      const exercise = Exercise.fromPersistence({
        id: 1,
        userId: 'user-1',
        name: 'Bench Press',
        description: null,
        bodyPartId: 1,
      });

      expect(exercise.belongsToBodyPart(1)).toBe(true);
      expect(exercise.belongsToBodyPart(2)).toBe(false);
    });
  });

  describe('validation', () => {
    it('should throw error if id is invalid', () => {
      expect(() => {
        Exercise.fromPersistence({
          id: 0,
          userId: 'user-1',
          name: 'Bench Press',
          description: null,
          bodyPartId: 1,
        });
      }).toThrow('Exercise ID must be a positive number');
    });

    it('should throw error if userId is empty', () => {
      expect(() => {
        Exercise.fromPersistence({
          id: 1,
          userId: '',
          name: 'Bench Press',
          description: null,
          bodyPartId: 1,
        });
      }).toThrow('User ID cannot be empty');
    });

    it('should throw error if bodyPartId is invalid', () => {
      expect(() => {
        Exercise.fromPersistence({
          id: 1,
          userId: 'user-1',
          name: 'Bench Press',
          description: null,
          bodyPartId: 0,
        });
      }).toThrow('Body part ID must be a positive number');
    });
  });
});

