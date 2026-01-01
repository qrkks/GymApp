/**
 * Username 值对象
 * 封装用户名的业务规则
 */
export class Username {
  private constructor(private readonly value: string) {
    this.validate();
  }

  /**
   * 业务规则：验证用户名
   */
  private validate(): void {
    if (!this.value || this.value.trim().length === 0) {
      throw new Error('Username cannot be empty');
    }
    
    // 可以添加更多验证规则，如长度限制、字符限制等
    const trimmed = this.value.trim();
    if (trimmed.length < 1) {
      throw new Error('Username cannot be empty');
    }
  }

  /**
   * 从字符串创建 Username 值对象
   */
  static create(value: string): Username {
    return new Username(value);
  }

  /**
   * 获取用户名值
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
  equals(other: Username): boolean {
    return this.value === other.value;
  }
}

