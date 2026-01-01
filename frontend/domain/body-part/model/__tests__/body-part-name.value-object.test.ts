/**
 * BodyPartName Value Object 单元测试
 */
import { BodyPartName } from '../body-part-name.value-object';

describe('BodyPartName Value Object', () => {
  describe('create', () => {
    it('should create body part name from valid string', () => {
      const name = BodyPartName.create('Chest');
      expect(name.getValue()).toBe('Chest');
    });

    it('should throw error if name is empty', () => {
      expect(() => {
        BodyPartName.create('');
      }).toThrow('Body part name cannot be empty');
    });

    it('should throw error if name is only whitespace', () => {
      expect(() => {
        BodyPartName.create('   ');
      }).toThrow('Body part name cannot be empty');
    });

    it('should throw error if name exceeds 50 characters', () => {
      const longName = 'a'.repeat(51);
      expect(() => {
        BodyPartName.create(longName);
      }).toThrow('Body part name cannot exceed 50 characters');
    });

    it('should accept name with exactly 50 characters', () => {
      const name = 'a'.repeat(50);
      const bodyPartName = BodyPartName.create(name);
      expect(bodyPartName.getValue()).toBe(name);
    });
  });

  describe('getValue', () => {
    it('should return name value', () => {
      const name = BodyPartName.create('Chest');
      expect(name.getValue()).toBe('Chest');
    });
  });

  describe('toString', () => {
    it('should return name as string', () => {
      const name = BodyPartName.create('Chest');
      expect(name.toString()).toBe('Chest');
    });
  });

  describe('equals', () => {
    it('should return true for same name', () => {
      const name1 = BodyPartName.create('Chest');
      const name2 = BodyPartName.create('Chest');
      expect(name1.equals(name2)).toBe(true);
    });

    it('should return false for different names', () => {
      const name1 = BodyPartName.create('Chest');
      const name2 = BodyPartName.create('Back');
      expect(name1.equals(name2)).toBe(false);
    });
  });
});

