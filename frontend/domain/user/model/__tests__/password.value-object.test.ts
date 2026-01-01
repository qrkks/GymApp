/**
 * Password Value Object 单元测试
 */
import { Password } from '../password.value-object';

describe('Password Value Object', () => {
  describe('create', () => {
    it('should create password from valid string', () => {
      const password = Password.create('password123');
      expect(password.getValue()).toBe('password123');
    });

    it('should throw error if password is empty', () => {
      expect(() => {
        Password.create('');
      }).toThrow('Password must be at least 6 characters long');
    });

    it('should throw error if password is too short', () => {
      expect(() => {
        Password.create('12345');
      }).toThrow('Password must be at least 6 characters long');
    });

    it('should accept password with exactly 6 characters', () => {
      const password = Password.create('123456');
      expect(password.getValue()).toBe('123456');
    });
  });

  describe('getValue', () => {
    it('should return password value', () => {
      const password = Password.create('password123');
      expect(password.getValue()).toBe('password123');
    });
  });

  describe('equals', () => {
    it('should return true for same password', () => {
      const password1 = Password.create('password123');
      const password2 = Password.create('password123');
      expect(password1.equals(password2)).toBe(true);
    });

    it('should return false for different passwords', () => {
      const password1 = Password.create('password123');
      const password2 = Password.create('password456');
      expect(password1.equals(password2)).toBe(false);
    });
  });

  describe('isSameAs', () => {
    it('should return true for same password', () => {
      const password1 = Password.create('password123');
      const password2 = Password.create('password123');
      expect(password1.isSameAs(password2)).toBe(true);
    });

    it('should return false for different passwords', () => {
      const password1 = Password.create('password123');
      const password2 = Password.create('password456');
      expect(password1.isSameAs(password2)).toBe(false);
    });
  });
});

