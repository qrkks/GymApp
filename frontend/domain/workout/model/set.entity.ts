/**
 * Set 实体
 * 训练组（连续完成一定次数动作的集合）
 */
export interface SetPersistence {
  id: number;
  userId: string;
  workoutSetId: number;
  setNumber: number;
  weight: number;
  reps: number;
}

export class Set {
  constructor(
    public readonly id: number,
    public readonly userId: string,
    public readonly exerciseBlockId: number,
    public readonly setNumber: number,
    public readonly weight: number,
    public readonly reps: number
  ) {
    this.validate();
  }

  /**
   * 业务规则：验证组数据
   */
  private validate(): void {
    if (this.weight < 0) {
      throw new Error('Weight must be greater than or equal to 0');
    }
    if (this.reps <= 0) {
      throw new Error('Reps must be greater than 0');
    }
    if (this.setNumber <= 0) {
      throw new Error('Set number must be greater than 0');
    }
  }

  /**
   * 从数据库模型创建实体
   */
  static fromPersistence(data: SetPersistence): Set {
    return new Set(
      data.id,
      data.userId,
      data.workoutSetId,
      data.setNumber,
      data.weight,
      data.reps
    );
  }

  /**
   * 转换为数据库模型
   */
  toPersistence(): SetPersistence {
    return {
      id: this.id,
      userId: this.userId,
      workoutSetId: this.exerciseBlockId,
      setNumber: this.setNumber,
      weight: this.weight,
      reps: this.reps,
    };
  }

  /**
   * 业务规则：计算该组的训练量
   */
  calculateVolume(): number {
    return this.weight * this.reps;
  }

  /**
   * 业务规则：更新重量和次数
   */
  update(weight: number, reps: number): Set {
    return new Set(
      this.id,
      this.userId,
      this.exerciseBlockId,
      this.setNumber,
      weight,
      reps
    );
  }

  /**
   * 业务规则：检查是否属于指定用户
   */
  belongsTo(userId: string): boolean {
    return this.userId === userId;
  }

  /**
   * 业务规则：检查是否属于指定动作块
   */
  belongsToExerciseBlock(exerciseBlockId: number): boolean {
    return this.exerciseBlockId === exerciseBlockId;
  }
}

