/**
 * BodyPart Application Service (Use Cases)
 * 协调 Repository 和 Domain Service，处理完整用例
 */
import { Result, success, failure } from '@domain/shared/error-types';
import * as bodyPartQueries from '@domain/body-part/repository/queries/body-part.repository';
import * as bodyPartCommands from '@domain/body-part/repository/commands/body-part.repository';
import { BodyPart as BodyPartEntity } from '@domain/body-part/model/body-part.entity';
import { BodyPartName } from '@domain/body-part/model/body-part-name.value-object';

// 导出类型：使用 repository 的原始类型（用于 API 层）
export type BodyPart = bodyPartQueries.BodyPart;

/**
 * 获取用户的所有训练部位
 */
export async function getBodyPartList(
  userId: string
): Promise<Result<BodyPart[]>> {
  try {
    const bodyPartsData = await bodyPartQueries.getBodyPartList(userId);
    
    // 使用实体封装业务逻辑（可选，用于验证）
    const bodyParts = bodyPartsData.map(data => BodyPartEntity.fromPersistence(data));
    
    // 返回原始数据（用于 API 层）
    return success(bodyPartsData);
  } catch (error) {
    return failure(
      'INTERNAL_ERROR',
      'Failed to get body parts',
      error
    );
  }
}

/**
 * 创建训练部位
 */
export async function createBodyPart(
  userId: string,
  name: string
): Promise<Result<BodyPart>> {
  try {
    // 使用值对象进行验证（会抛出异常如果无效）
    let bodyPartName: BodyPartName;
    try {
      bodyPartName = BodyPartName.create(name);
    } catch (error: any) {
      return failure(
        'VALIDATION_ERROR',
        'Body part name cannot be empty'
      );
    }

    // 业务规则：检查名称是否已存在
    const existing = await bodyPartQueries.findBodyPartByName(userId, bodyPartName.getValue());
    if (existing) {
      return failure(
        'BODY_PART_ALREADY_EXISTS',
        'Body part with this name already exists'
      );
    }

    // 创建训练部位
    const bodyPartData = await bodyPartCommands.insertBodyPart(userId, bodyPartName.getValue());
    
    // 使用实体封装业务逻辑（可选，用于验证）
    const bodyPart = BodyPartEntity.fromPersistence(bodyPartData);
    
    return success(bodyPartData);
  } catch (error: any) {
    // 捕获值对象验证异常
    if (error.message?.includes('name') || error.message?.includes('Name')) {
      return failure(
        'VALIDATION_ERROR',
        'Body part name cannot be empty'
      );
    }
    
    return failure(
      'INTERNAL_ERROR',
      'Failed to create body part',
      error
    );
  }
}

/**
 * 更新训练部位
 */
export async function updateBodyPart(
  id: number,
  userId: string,
  name: string
): Promise<Result<BodyPart>> {
  try {
    // 业务规则：检查训练部位是否存在
    const existingData = await bodyPartQueries.findBodyPartById(id, userId);
    if (!existingData) {
      return failure(
        'BODY_PART_NOT_FOUND',
        'Body part not found'
      );
    }

    // 使用实体封装业务逻辑
    const existing = BodyPartEntity.fromPersistence(existingData);

    // 使用值对象进行验证
    let newName: BodyPartName;
    try {
      newName = BodyPartName.create(name);
    } catch (error: any) {
      return failure(
        'VALIDATION_ERROR',
        'Body part name cannot be empty'
      );
    }

    // 业务规则：如果新名称与现有名称不同，检查是否与其他训练部位冲突
    if (!existing.hasName(newName.getValue())) {
      const nameConflict = await bodyPartQueries.findBodyPartByName(userId, newName.getValue());
      if (nameConflict) {
        return failure(
          'BODY_PART_ALREADY_EXISTS',
          'Body part with this name already exists'
        );
      }
    }

    // 更新训练部位
    const updatedData = await bodyPartCommands.updateBodyPart(id, userId, newName.getValue());
    if (!updatedData) {
      return failure(
        'BODY_PART_NOT_FOUND',
        'Body part not found'
      );
    }

    // 使用实体封装业务逻辑（可选，用于验证）
    const updated = BodyPartEntity.fromPersistence(updatedData);

    return success(updatedData);
  } catch (error: any) {
    // 捕获值对象验证异常
    if (error.message?.includes('name') || error.message?.includes('Name')) {
      return failure(
        'VALIDATION_ERROR',
        'Body part name cannot be empty'
      );
    }
    
    return failure(
      'INTERNAL_ERROR',
      'Failed to update body part',
      error
    );
  }
}

/**
 * 删除训练部位
 */
export async function deleteBodyPart(
  id: number,
  userId: string
): Promise<Result<void>> {
  try {
    // 业务规则：检查训练部位是否存在
    const existingData = await bodyPartQueries.findBodyPartById(id, userId);
    if (!existingData) {
      return failure(
        'BODY_PART_NOT_FOUND',
        'Body part not found'
      );
    }

    // 使用实体封装业务逻辑（可选，用于验证）
    const existing = BodyPartEntity.fromPersistence(existingData);

    // 删除训练部位
    const deleted = await bodyPartCommands.deleteBodyPart(id, userId);
    if (!deleted) {
      return failure(
        'BODY_PART_NOT_FOUND',
        'Body part not found'
      );
    }

    return success(undefined);
  } catch (error) {
    return failure(
      'INTERNAL_ERROR',
      'Failed to delete body part',
      error
    );
  }
}

/**
 * 删除用户的所有训练部位
 */
export async function deleteAllBodyParts(userId: string): Promise<Result<void>> {
  try {
    await bodyPartCommands.deleteAllBodyParts(userId);
    return success(undefined);
  } catch (error) {
    return failure(
      'INTERNAL_ERROR',
      'Failed to delete all body parts',
      error
    );
  }
}
