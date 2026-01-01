/**
 * Exercise 实体
 * 封装动作的业务规则
 */
import { ExerciseName } from './exercise-name.value-object';

export interface ExercisePersistence {
  id: number;
  userId: string;
  name: string;
  description: string | null;
  bodyPartId: number;
}

export class Exercise {
  private constructor(
    public readonly id: number,
    public readonly userId: string,
    private readonly name: ExerciseName,
    public readonly description: string | null,
    public readonly bodyPartId: number
  ) {
    this.validate();
  }

  /**
   * 业务规则：验证动作数据
   */
  private validate(): void {
    if (!this.id || this.id <= 0) {
      throw new Error('Exercise ID must be a positive number');
    }
    if (!this.userId || this.userId.trim().length === 0) {
      throw new Error('User ID cannot be empty');
    }
    if (!this.bodyPartId || this.bodyPartId <= 0) {
      throw new Error('Body part ID must be a positive number');
    }
  }

  /**
   * 从数据库模型创建实体
   */
  static fromPersistence(data: ExercisePersistence): Exercise {
    // 业务规则：name 是必选的
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Exercise name is required');
    }

    return new Exercise(
      data.id,
      data.userId,
      ExerciseName.create(data.name),
      data.description,
      data.bodyPartId
    );
  }

  /**
   * 转换为数据库模型
   */
  toPersistence(): ExercisePersistence {
    return {
      id: this.id,
      userId: this.userId,
      name: this.name.getValue(),
      description: this.description,
      bodyPartId: this.bodyPartId,
    };
  }

  /**
   * 获取名称
   */
  getName(): string {
    return this.name.getValue();
  }

  /**
   * 业务规则：检查是否属于指定用户
   */
  belongsTo(userId: string): boolean {
    return this.userId === userId;
  }

  /**
   * 业务规则：检查名称是否匹配
   */
  hasName(name: string): boolean {
    return this.name.getValue() === name;
  }

  /**
   * 业务规则：检查是否属于指定身体部位
   */
  belongsToBodyPart(bodyPartId: number): boolean {
    return this.bodyPartId === bodyPartId;
  }
}

