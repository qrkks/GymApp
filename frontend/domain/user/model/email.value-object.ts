/**
 * Email 值对象
 * 封装邮箱的业务规则
 */
export class Email {
  private constructor(private readonly value: string) {
    this.validate();
  }

  /**
   * 业务规则：验证邮箱格式
   */
  private validate(): void {
    if (!this.value || !this.value.includes('@')) {
      throw new Error('Invalid email format');
    }
    
    // 基本格式验证：包含 @ 符号，且 @ 前后都有内容
    const parts = this.value.split('@');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      throw new Error('Invalid email format');
    }
  }

  /**
   * 从字符串创建 Email 值对象
   */
  static create(value: string): Email {
    return new Email(value);
  }

  /**
   * 获取邮箱值
   */
  getValue(): string {
    return this.value;
  }

  /**
   * 转换为字符串
   */
  toString(): string {
    return this.value;
  }

  /**
   * 值对象相等性比较
   */
  equals(other: Email): boolean {
    return this.value === other.value;
  }
}

