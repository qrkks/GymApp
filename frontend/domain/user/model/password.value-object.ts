/**
 * Password 值对象
 * 封装密码的业务规则
 * 
 * 注意：密码哈希在应用层处理，这里只验证原始密码
 */
export class Password {
  private constructor(private readonly value: string) {
    this.validate();
  }

  /**
   * 业务规则：验证密码
   */
  private validate(): void {
    if (!this.value || this.value.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }
  }

  /**
   * 从字符串创建 Password 值对象
   */
  static create(value: string): Password {
    return new Password(value);
  }

  /**
   * 获取密码值
   */
  getValue(): string {
    return this.value;
  }

  /**
   * 值对象相等性比较
   */
  equals(other: Password): boolean {
    return this.value === other.value;
  }

  /**
   * 检查密码是否与另一个相同（用于验证新密码不能与旧密码相同）
   */
  isSameAs(other: Password): boolean {
    return this.value === other.value;
  }
}

