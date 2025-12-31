/**
 * User Application Service (Use Cases)
 * 协调 Repository 和 Domain Service，处理完整用例
 */
import { Result, success, failure } from '@domain/shared/error-types';
import * as userQueries from '@domain/user/repository/queries/user.repository';
import * as userCommands from '@domain/user/repository/commands/user.repository';

export type User = userQueries.User;

/**
 * 根据 ID 获取用户
 */
export async function getUserById(id: string): Promise<Result<User>> {
  try {
    const user = await userQueries.findUserById(id);
    if (!user) {
      return failure('USER_NOT_FOUND', 'User not found');
    }
    return success(user);
  } catch (error) {
    return failure('INTERNAL_ERROR', 'Failed to get user', error);
  }
}

/**
 * 根据邮箱获取用户
 */
export async function getUserByEmail(email: string): Promise<Result<User>> {
  try {
    const user = await userQueries.findUserByEmail(email);
    if (!user) {
      return failure('USER_NOT_FOUND', 'User not found');
    }
    return success(user);
  } catch (error) {
    return failure('INTERNAL_ERROR', 'Failed to get user', error);
  }
}

/**
 * 创建用户
 */
export async function createUser(
  data: userCommands.CreateUserData
): Promise<Result<User>> {
  try {
    // 业务规则：验证邮箱格式（简单验证）
    if (!data.email || !data.email.includes('@')) {
      return failure('INVALID_EMAIL', 'Invalid email format');
    }

    // 业务规则：检查邮箱是否已存在
    const existing = await userQueries.findUserByEmail(data.email);
    if (existing) {
      return failure('USER_ALREADY_EXISTS', 'User with this email already exists');
    }

    // 业务规则：检查 ID 是否已存在
    const existingById = await userQueries.findUserById(data.id);
    if (existingById) {
      return failure('USER_ALREADY_EXISTS', 'User with this ID already exists');
    }

    // 创建用户
    const user = await userCommands.insertUser(data);
    return success(user);
  } catch (error) {
    return failure('INTERNAL_ERROR', 'Failed to create user', error);
  }
}

/**
 * 更新用户
 */
export async function updateUser(
  id: string,
  data: Partial<Omit<userCommands.CreateUserData, 'id'>>
): Promise<Result<User>> {
  try {
    // 业务规则：检查用户是否存在
    const existing = await userQueries.findUserById(id);
    if (!existing) {
      return failure('USER_NOT_FOUND', 'User not found');
    }

    // 业务规则：如果更新邮箱，检查新邮箱是否已被其他用户使用
    if (data.email && data.email !== existing.email) {
      if (!data.email.includes('@')) {
        return failure('INVALID_EMAIL', 'Invalid email format');
      }

      const emailConflict = await userQueries.findUserByEmail(data.email);
      if (emailConflict) {
        return failure('USER_ALREADY_EXISTS', 'User with this email already exists');
      }
    }

    // 更新用户
    const updated = await userCommands.updateUser(id, data);
    if (!updated) {
      return failure('USER_NOT_FOUND', 'User not found');
    }

    return success(updated);
  } catch (error) {
    return failure('INTERNAL_ERROR', 'Failed to update user', error);
  }
}

/**
 * 删除用户
 */
export async function deleteUser(id: string): Promise<Result<void>> {
  try {
    // 业务规则：检查用户是否存在
    const existing = await userQueries.findUserById(id);
    if (!existing) {
      return failure('USER_NOT_FOUND', 'User not found');
    }

    // 删除用户（外键约束会自动处理关联数据）
    const deleted = await userCommands.deleteUser(id);
    if (!deleted) {
      return failure('USER_NOT_FOUND', 'User not found');
    }

    return success(undefined);
  } catch (error) {
    return failure('INTERNAL_ERROR', 'Failed to delete user', error);
  }
}

