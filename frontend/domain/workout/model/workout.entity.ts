/**
 * Workout 实体（聚合根）
 * 封装训练课的业务规则
 */
export interface WorkoutPersistence {
  id: number;
  userId: string;
  date: string;
  startTime: Date | null;
  endTime: Date | null;
}

export class Workout {
  constructor(
    public readonly id: number,
    public readonly userId: string,
    public readonly date: string,
    public readonly startTime: Date,
    public readonly endTime: Date | null = null
  ) {
    this.validate();
  }

  /**
   * 业务规则：验证训练课数据
   */
  private validate(): void {
    if (!this.date || !/^\d{4}-\d{2}-\d{2}$/.test(this.date)) {
      throw new Error('Invalid workout date format');
    }
    if (this.endTime && this.endTime < this.startTime) {
      throw new Error('End time must be after start time');
    }
  }

  /**
   * 从数据库模型创建实体
   */
  static fromPersistence(data: WorkoutPersistence): Workout {
    return new Workout(
      data.id,
      data.userId,
      data.date,
      data.startTime || new Date(),
      data.endTime
    );
  }

  /**
   * 转换为数据库模型
   */
  toPersistence(): WorkoutPersistence {
    return {
      id: this.id,
      userId: this.userId,
      date: this.date,
      startTime: this.startTime,
      endTime: this.endTime,
    };
  }

  /**
   * 业务规则：检查是否可以结束训练
   */
  canEnd(): boolean {
    return this.endTime === null;
  }

  /**
   * 业务规则：结束训练
   */
  end(): Workout {
    if (!this.canEnd()) {
      throw new Error('Workout is already ended');
    }
    return new Workout(
      this.id,
      this.userId,
      this.date,
      this.startTime,
      new Date()
    );
  }

  /**
   * 业务规则：检查是否在同一天
   */
  isSameDate(date: string): boolean {
    return this.date === date;
  }

  /**
   * 业务规则：检查是否属于指定用户
   */
  belongsTo(userId: string): boolean {
    return this.userId === userId;
  }
}

