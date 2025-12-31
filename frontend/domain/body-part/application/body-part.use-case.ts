/**
 * BodyPart Application Service (Use Cases)
 * 协调 Repository 和 Domain Service，处理完整用例
 */
import { Result, success, failure } from '@domain/shared/error-types';
import * as bodyPartQueries from '@domain/body-part/repository/queries/body-part.repository';
import * as bodyPartCommands from '@domain/body-part/repository/commands/body-part.repository';

export type BodyPart = bodyPartQueries.BodyPart;

/**
 * 获取用户的所有训练部位
 */
export async function getBodyPartList(
  userId: string
): Promise<Result<BodyPart[]>> {
  try {
    const bodyParts = await bodyPartQueries.getBodyPartList(userId);
    return success(bodyParts);
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
    // 业务规则：检查名称是否已存在
    const existing = await bodyPartQueries.findBodyPartByName(userId, name);
    if (existing) {
      return failure(
        'BODY_PART_ALREADY_EXISTS',
        'Body part with this name already exists'
      );
    }

    // 创建训练部位
    const bodyPart = await bodyPartCommands.insertBodyPart(userId, name);
    return success(bodyPart);
  } catch (error) {
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
    const existing = await bodyPartQueries.findBodyPartById(id, userId);
    if (!existing) {
      return failure(
        'BODY_PART_NOT_FOUND',
        'Body part not found'
      );
    }

    // 业务规则：如果新名称与现有名称不同，检查是否与其他训练部位冲突
    if (name !== existing.name) {
      const nameConflict = await bodyPartQueries.findBodyPartByName(userId, name);
      if (nameConflict) {
        return failure(
          'BODY_PART_ALREADY_EXISTS',
          'Body part with this name already exists'
        );
      }
    }

    // 更新训练部位
    const updated = await bodyPartCommands.updateBodyPart(id, userId, name);
    if (!updated) {
      return failure(
        'BODY_PART_NOT_FOUND',
        'Body part not found'
      );
    }

    return success(updated);
  } catch (error) {
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
    const existing = await bodyPartQueries.findBodyPartById(id, userId);
    if (!existing) {
      return failure(
        'BODY_PART_NOT_FOUND',
        'Body part not found'
      );
    }

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

