/**
 * User 实体
 * 封装用户的业务规则
 */
import { Email } from './email.value-object';
import { Username } from './username.value-object';

export interface UserPersistence {
  id: string;
  email: string;
  username: string; // 必选，有唯一性约束
  password: string | null;
  emailVerified: boolean | null;
  image: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export class User {
  private constructor(
    public readonly id: string,
    private readonly email: Email,
    private readonly username: Username, // 必选
    private readonly password: string | null, // 已哈希的密码
    public readonly emailVerified: boolean | null,
    public readonly image: string | null,
    public readonly createdAt: Date | null,
    public readonly updatedAt: Date | null
  ) {
    this.validate();
  }

  /**
   * 业务规则：验证用户数据
   */
  private validate(): void {
    if (!this.id || this.id.trim().length === 0) {
      throw new Error('User ID cannot be empty');
    }
    // username 是必选的，由 Username 值对象验证
  }

  /**
   * 从数据库模型创建实体
   */
  static fromPersistence(data: UserPersistence): User {
    // 业务规则：username 是必选的
    if (!data.username || data.username.trim().length === 0) {
      throw new Error('Username is required');
    }

    return new User(
      data.id,
      Email.create(data.email),
      Username.create(data.username),
      data.password,
      data.emailVerified,
      data.image,
      data.createdAt,
      data.updatedAt
    );
  }

  /**
   * 转换为数据库模型
   */
  toPersistence(): UserPersistence {
    return {
      id: this.id,
      email: this.email.getValue(),
      username: this.username.getValue(),
      password: this.password,
      emailVerified: this.emailVerified,
      image: this.image,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * 获取邮箱
   */
  getEmail(): string {
    return this.email.getValue();
  }

  /**
   * 获取用户名
   */
  getUsername(): string {
    return this.username.getValue();
  }

  /**
   * 检查是否有密码
   */
  hasPassword(): boolean {
    return this.password !== null && this.password.length > 0;
  }

  /**
   * 业务规则：检查是否属于指定用户 ID
   */
  belongsTo(userId: string): boolean {
    return this.id === userId;
  }

  /**
   * 业务规则：检查邮箱是否匹配
   */
  hasEmail(email: string): boolean {
    return this.email.getValue() === email;
  }

  /**
   * 业务规则：检查用户名是否匹配
   */
  hasUsername(username: string): boolean {
    return this.username.getValue() === username;
  }

  /**
   * 业务规则：检查邮箱是否已验证
   */
  isEmailVerified(): boolean {
    return this.emailVerified === true;
  }

  /**
   * 创建不包含密码的用户对象（用于返回给客户端）
   */
  withoutPassword(): Omit<UserPersistence, 'password'> {
    const persistence = this.toPersistence();
    const { password, ...userWithoutPassword } = persistence;
    return userWithoutPassword;
  }
}

