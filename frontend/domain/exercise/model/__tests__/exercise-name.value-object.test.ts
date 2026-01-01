/**
 * ExerciseName Value Object 单元测试
 */
import { ExerciseName } from '../exercise-name.value-object';

describe('ExerciseName Value Object', () => {
  describe('create', () => {
    it('should create exercise name from valid string', () => {
      const name = ExerciseName.create('Bench Press');
      expect(name.getValue()).toBe('Bench Press');
    });

    it('should throw error if name is empty', () => {
      expect(() => {
        ExerciseName.create('');
      }).toThrow('Exercise name cannot be empty');
    });

    it('should throw error if name is only whitespace', () => {
      expect(() => {
        ExerciseName.create('   ');
      }).toThrow('Exercise name cannot be empty');
    });

    it('should throw error if name exceeds 100 characters', () => {
      const longName = 'a'.repeat(101);
      expect(() => {
        ExerciseName.create(longName);
      }).toThrow('Exercise name cannot exceed 100 characters');
    });

    it('should accept name with exactly 100 characters', () => {
      const name = 'a'.repeat(100);
      const exerciseName = ExerciseName.create(name);
      expect(exerciseName.getValue()).toBe(name);
    });
  });

  describe('getValue', () => {
    it('should return name value', () => {
      const name = ExerciseName.create('Bench Press');
      expect(name.getValue()).toBe('Bench Press');
    });
  });

  describe('toString', () => {
    it('should return name as string', () => {
      const name = ExerciseName.create('Bench Press');
      expect(name.toString()).toBe('Bench Press');
    });
  });

  describe('equals', () => {
    it('should return true for same name', () => {
      const name1 = ExerciseName.create('Bench Press');
      const name2 = ExerciseName.create('Bench Press');
      expect(name1.equals(name2)).toBe(true);
    });

    it('should return false for different names', () => {
      const name1 = ExerciseName.create('Bench Press');
      const name2 = ExerciseName.create('Squat');
      expect(name1.equals(name2)).toBe(false);
    });
  });
});

