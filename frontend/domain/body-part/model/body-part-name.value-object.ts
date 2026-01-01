/**
 * BodyPartName 值对象
 * 封装身体部位名称的业务规则
 */
export class BodyPartName {
  private constructor(private readonly value: string) {
    this.validate();
  }

  /**
   * 业务规则：验证身体部位名称
   */
  private validate(): void {
    if (!this.value || this.value.trim().length === 0) {
      throw new Error('Body part name cannot be empty');
    }
    
    // 可以添加更多验证规则，如长度限制、字符限制等
    const trimmed = this.value.trim();
    if (trimmed.length < 1) {
      throw new Error('Body part name cannot be empty');
    }
    
    // 可以添加长度限制
    if (trimmed.length > 50) {
      throw new Error('Body part name cannot exceed 50 characters');
    }
  }

  /**
   * 从字符串创建 BodyPartName 值对象
   */
  static create(value: string): BodyPartName {
    return new BodyPartName(value);
  }

  /**
   * 获取名称值
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
  equals(other: BodyPartName): boolean {
    return this.value === other.value;
  }
}

