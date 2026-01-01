/**
 * User Entity 单元测试
 */
import { User } from '../user.entity';
import { Email } from '../email.value-object';
import { Username } from '../username.value-object';

describe('User Entity', () => {
  describe('fromPersistence', () => {
    it('should create user from persistence data', () => {
      const persistence = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashed_password',
        emailVerified: false,
        image: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const user = User.fromPersistence(persistence);

      expect(user.id).toBe('user-1');
      expect(user.getEmail()).toBe('test@example.com');
      expect(user.getUsername()).toBe('testuser');
      expect(user.hasPassword()).toBe(true);
    });

    it('should throw error if username is null', () => {
      const persistence = {
        id: 'user-1',
        email: 'test@example.com',
        username: null as any, // username 是必选的，不能为 null
        password: null,
        emailVerified: false,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(() => {
        User.fromPersistence(persistence);
      }).toThrow('Username is required');
    });
  });

  describe('toPersistence', () => {
    it('should convert user to persistence data', () => {
      const persistence = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashed_password',
        emailVerified: false,
        image: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const user = User.fromPersistence(persistence);
      const result = user.toPersistence();

      expect(result).toEqual(persistence);
    });
  });

  describe('business rules', () => {
    it('should check if user belongs to userId', () => {
      const user = User.fromPersistence({
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashed_password',
        emailVerified: false,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(user.belongsTo('user-1')).toBe(true);
      expect(user.belongsTo('user-2')).toBe(false);
    });

    it('should check if user has email', () => {
      const user = User.fromPersistence({
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashed_password',
        emailVerified: false,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(user.hasEmail('test@example.com')).toBe(true);
      expect(user.hasEmail('other@example.com')).toBe(false);
    });

    it('should check if user has username', () => {
      const user = User.fromPersistence({
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashed_password',
        emailVerified: false,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(user.hasUsername('testuser')).toBe(true);
      expect(user.hasUsername('otheruser')).toBe(false);
    });

    it('should check if email is verified', () => {
      const verifiedUser = User.fromPersistence({
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashed_password',
        emailVerified: true,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const unverifiedUser = User.fromPersistence({
        id: 'user-2',
        email: 'test2@example.com',
        username: 'testuser2',
        password: 'hashed_password',
        emailVerified: false,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(verifiedUser.isEmailVerified()).toBe(true);
      expect(unverifiedUser.isEmailVerified()).toBe(false);
    });

    it('should check if user has password', () => {
      const userWithPassword = User.fromPersistence({
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashed_password',
        emailVerified: false,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const userWithoutPassword = User.fromPersistence({
        id: 'user-2',
        email: 'test2@example.com',
        username: 'testuser2',
        password: null,
        emailVerified: false,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(userWithPassword.hasPassword()).toBe(true);
      expect(userWithoutPassword.hasPassword()).toBe(false);
    });

    it('should return user without password', () => {
      const user = User.fromPersistence({
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashed_password',
        emailVerified: false,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const userWithoutPassword = user.withoutPassword();

      expect(userWithoutPassword).not.toHaveProperty('password');
      expect(userWithoutPassword.id).toBe('user-1');
      expect(userWithoutPassword.email).toBe('test@example.com');
    });
  });

  describe('validation', () => {
    it('should throw error if id is empty', () => {
      expect(() => {
        User.fromPersistence({
          id: '',
          email: 'test@example.com',
          username: 'testuser',
          password: 'hashed_password',
          emailVerified: false,
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }).toThrow('User ID cannot be empty');
    });

    it('should throw error if email is invalid', () => {
      expect(() => {
        User.fromPersistence({
          id: 'user-1',
          email: 'invalid-email',
          username: 'testuser',
          password: 'hashed_password',
          emailVerified: false,
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }).toThrow('Invalid email format');
    });

    it('should throw error if username is empty string', () => {
      expect(() => {
        User.fromPersistence({
          id: 'user-1',
          email: 'test@example.com',
          username: '', // 空字符串会触发验证
          password: 'hashed_password',
          emailVerified: false,
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }).toThrow('Username is required');
    });

    it('should throw error if username is missing', () => {
      expect(() => {
        User.fromPersistence({
          id: 'user-1',
          email: 'test@example.com',
          username: undefined as any, // username 是必选的
          password: 'hashed_password',
          emailVerified: false,
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }).toThrow('Username is required');
    });
  });
});

