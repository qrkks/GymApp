/**
 * ExerciseName 值对象
 * 封装动作名称的业务规则
 */
export class ExerciseName {
  private constructor(private readonly value: string) {
    this.validate();
  }

  /**
   * 业务规则：验证动作名称
   */
  private validate(): void {
    if (!this.value || this.value.trim().length === 0) {
      throw new Error('Exercise name cannot be empty');
    }
    
    // 可以添加更多验证规则，如长度限制、字符限制等
    const trimmed = this.value.trim();
    if (trimmed.length < 1) {
      throw new Error('Exercise name cannot be empty');
    }
    
    // 可以添加长度限制
    if (trimmed.length > 100) {
      throw new Error('Exercise name cannot exceed 100 characters');
    }
  }

  /**
   * 从字符串创建 ExerciseName 值对象
   */
  static create(value: string): ExerciseName {
    return new ExerciseName(value);
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
  equals(other: ExerciseName): boolean {
    return this.value === other.value;
  }
}

