/**
 * ExerciseBlock 实体
 * 训练课中的动作块（包含该动作的所有组）
 */
import { Set } from './set.entity';

export interface ExerciseBlockPersistence {
  id: number;
  userId: string;
  workoutId: number;
  exerciseId: number;
}

export class ExerciseBlock {
  constructor(
    public readonly id: number,
    public readonly userId: string,
    public readonly workoutId: number,
    public readonly exerciseId: number,
    public readonly sets: Set[] = []
  ) {}

  /**
   * 从数据库模型创建实体
   */
  static fromPersistence(
    data: ExerciseBlockPersistence,
    sets: Set[] = []
  ): ExerciseBlock {
    return new ExerciseBlock(
      data.id,
      data.userId,
      data.workoutId,
      data.exerciseId,
      sets
    );
  }

  /**
   * 转换为数据库模型
   */
  toPersistence(): ExerciseBlockPersistence {
    return {
      id: this.id,
      userId: this.userId,
      workoutId: this.workoutId,
      exerciseId: this.exerciseId,
    };
  }

  /**
   * 业务规则：添加组
   */
  addSet(userId: string, weight: number, reps: number): ExerciseBlock {
    const nextSetNumber = this.sets.length > 0
      ? this.sets[this.sets.length - 1].setNumber + 1
      : 1;

    const newSet = new Set(
      0, // 临时 ID，保存后会分配真实 ID
      userId,
      this.id,
      nextSetNumber,
      weight,
      reps
    );

    return new ExerciseBlock(
      this.id,
      this.userId,
      this.workoutId,
      this.exerciseId,
      [...this.sets, newSet]
    );
  }

  /**
   * 业务规则：更新组
   */
  updateSet(setId: number, weight: number, reps: number): ExerciseBlock {
    const updatedSets = this.sets.map(set =>
      set.id === setId
        ? new Set(set.id, set.userId, set.exerciseBlockId, set.setNumber, weight, reps)
        : set
    );

    return new ExerciseBlock(
      this.id,
      this.userId,
      this.workoutId,
      this.exerciseId,
      updatedSets
    );
  }

  /**
   * 业务规则：删除组并重新排序
   */
  removeSet(setId: number): ExerciseBlock {
    const filteredSets = this.sets.filter(set => set.id !== setId);
    const reorderedSets = filteredSets.map((set, index) =>
      new Set(set.id, set.userId, set.exerciseBlockId, index + 1, set.weight, set.reps)
    );

    return new ExerciseBlock(
      this.id,
      this.userId,
      this.workoutId,
      this.exerciseId,
      reorderedSets
    );
  }

  /**
   * 业务规则：计算总训练量（Volume = 总重量）
   */
  calculateVolume(): number {
    return this.sets.reduce((total, set) => total + (set.weight * set.reps), 0);
  }

  /**
   * 业务规则：获取组数
   */
  getSetCount(): number {
    return this.sets.length;
  }

  /**
   * 业务规则：检查是否属于指定用户
   */
  belongsTo(userId: string): boolean {
    return this.userId === userId;
  }

  /**
   * 业务规则：检查是否属于指定训练
   */
  belongsToWorkout(workoutId: number): boolean {
    return this.workoutId === workoutId;
  }
}

