/**
 * Username Value Object 单元测试
 */
import { Username } from '../username.value-object';

describe('Username Value Object', () => {
  describe('create', () => {
    it('should create username from valid string', () => {
      const username = Username.create('testuser');
      expect(username.getValue()).toBe('testuser');
    });

    it('should throw error if username is empty', () => {
      expect(() => {
        Username.create('');
      }).toThrow('Username cannot be empty');
    });

    it('should throw error if username is only whitespace', () => {
      expect(() => {
        Username.create('   ');
      }).toThrow('Username cannot be empty');
    });
  });

  describe('getValue', () => {
    it('should return username value', () => {
      const username = Username.create('testuser');
      expect(username.getValue()).toBe('testuser');
    });
  });

  describe('toString', () => {
    it('should return username as string', () => {
      const username = Username.create('testuser');
      expect(username.toString()).toBe('testuser');
    });
  });

  describe('equals', () => {
    it('should return true for same username', () => {
      const username1 = Username.create('testuser');
      const username2 = Username.create('testuser');
      expect(username1.equals(username2)).toBe(true);
    });

    it('should return false for different usernames', () => {
      const username1 = Username.create('testuser');
      const username2 = Username.create('otheruser');
      expect(username1.equals(username2)).toBe(false);
    });
  });
});

