/**
 * BodyPart 实体
 * 封装身体部位的业务规则
 */
import { BodyPartName } from './body-part-name.value-object';

export interface BodyPartPersistence {
  id: number;
  userId: string;
  name: string;
}

export class BodyPart {
  private constructor(
    public readonly id: number,
    public readonly userId: string,
    private readonly name: BodyPartName
  ) {
    this.validate();
  }

  /**
   * 业务规则：验证身体部位数据
   */
  private validate(): void {
    if (!this.id || this.id <= 0) {
      throw new Error('Body part ID must be a positive number');
    }
    if (!this.userId || this.userId.trim().length === 0) {
      throw new Error('User ID cannot be empty');
    }
  }

  /**
   * 从数据库模型创建实体
   */
  static fromPersistence(data: BodyPartPersistence): BodyPart {
    // 业务规则：name 是必选的
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Body part name is required');
    }

    return new BodyPart(
      data.id,
      data.userId,
      BodyPartName.create(data.name)
    );
  }

  /**
   * 转换为数据库模型
   */
  toPersistence(): BodyPartPersistence {
    return {
      id: this.id,
      userId: this.userId,
      name: this.name.getValue(),
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
}

