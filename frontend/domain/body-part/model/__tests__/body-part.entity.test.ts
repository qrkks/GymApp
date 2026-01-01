/**
 * BodyPart Entity 单元测试
 */
import { BodyPart } from '../body-part.entity';

describe('BodyPart Entity', () => {
  describe('fromPersistence', () => {
    it('should create body part from persistence data', () => {
      const persistence = {
        id: 1,
        userId: 'user-1',
        name: 'Chest',
      };

      const bodyPart = BodyPart.fromPersistence(persistence);

      expect(bodyPart.id).toBe(1);
      expect(bodyPart.userId).toBe('user-1');
      expect(bodyPart.getName()).toBe('Chest');
    });

    it('should throw error if name is empty', () => {
      expect(() => {
        BodyPart.fromPersistence({
          id: 1,
          userId: 'user-1',
          name: '',
        });
      }).toThrow('Body part name is required');
    });

    it('should throw error if name is missing', () => {
      expect(() => {
        BodyPart.fromPersistence({
          id: 1,
          userId: 'user-1',
          name: undefined as any,
        });
      }).toThrow('Body part name is required');
    });
  });

  describe('toPersistence', () => {
    it('should convert body part to persistence data', () => {
      const persistence = {
        id: 1,
        userId: 'user-1',
        name: 'Chest',
      };

      const bodyPart = BodyPart.fromPersistence(persistence);
      const result = bodyPart.toPersistence();

      expect(result).toEqual(persistence);
    });
  });

  describe('business rules', () => {
    it('should check if body part belongs to userId', () => {
      const bodyPart = BodyPart.fromPersistence({
        id: 1,
        userId: 'user-1',
        name: 'Chest',
      });

      expect(bodyPart.belongsTo('user-1')).toBe(true);
      expect(bodyPart.belongsTo('user-2')).toBe(false);
    });

    it('should check if body part has name', () => {
      const bodyPart = BodyPart.fromPersistence({
        id: 1,
        userId: 'user-1',
        name: 'Chest',
      });

      expect(bodyPart.hasName('Chest')).toBe(true);
      expect(bodyPart.hasName('Back')).toBe(false);
    });
  });

  describe('validation', () => {
    it('should throw error if id is invalid', () => {
      expect(() => {
        BodyPart.fromPersistence({
          id: 0,
          userId: 'user-1',
          name: 'Chest',
        });
      }).toThrow('Body part ID must be a positive number');
    });

    it('should throw error if userId is empty', () => {
      expect(() => {
        BodyPart.fromPersistence({
          id: 1,
          userId: '',
          name: 'Chest',
        });
      }).toThrow('User ID cannot be empty');
    });
  });
});

