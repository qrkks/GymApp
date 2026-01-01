/**
 * Email Value Object 单元测试
 */
import { Email } from '../email.value-object';

describe('Email Value Object', () => {
  describe('create', () => {
    it('should create email from valid string', () => {
      const email = Email.create('test@example.com');
      expect(email.getValue()).toBe('test@example.com');
    });

    it('should throw error if email is empty', () => {
      expect(() => {
        Email.create('');
      }).toThrow('Invalid email format');
    });

    it('should throw error if email does not contain @', () => {
      expect(() => {
        Email.create('invalid-email');
      }).toThrow('Invalid email format');
    });

    it('should throw error if email has multiple @', () => {
      expect(() => {
        Email.create('test@@example.com');
      }).toThrow('Invalid email format');
    });

    it('should throw error if @ is at the beginning', () => {
      expect(() => {
        Email.create('@example.com');
      }).toThrow('Invalid email format');
    });

    it('should throw error if @ is at the end', () => {
      expect(() => {
        Email.create('test@');
      }).toThrow('Invalid email format');
    });
  });

  describe('getValue', () => {
    it('should return email value', () => {
      const email = Email.create('test@example.com');
      expect(email.getValue()).toBe('test@example.com');
    });
  });

  describe('toString', () => {
    it('should return email as string', () => {
      const email = Email.create('test@example.com');
      expect(email.toString()).toBe('test@example.com');
    });
  });

  describe('equals', () => {
    it('should return true for same email', () => {
      const email1 = Email.create('test@example.com');
      const email2 = Email.create('test@example.com');
      expect(email1.equals(email2)).toBe(true);
    });

    it('should return false for different emails', () => {
      const email1 = Email.create('test@example.com');
      const email2 = Email.create('other@example.com');
      expect(email1.equals(email2)).toBe(false);
    });
  });
});

