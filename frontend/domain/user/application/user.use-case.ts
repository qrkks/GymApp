/**
 * User Application Service (Use Cases)
 * 协调 Repository 和 Domain Service，处理完整用例
 */
import { Result, success, failure } from '@domain/shared/error-types';
import * as userQueries from '@domain/user/repository/queries/user.repository';
import * as userCommands from '@domain/user/repository/commands/user.repository';
import bcrypt from 'bcrypt';

export type User = userQueries.User;

/**
 * 根据 ID 获取用户
 */
export async function getUserById(id: string): Promise<Result<User>> {
  try {
    const user = await userQueries.findUserById(id);
    if (!user) {
      return failure('USER_NOT_FOUND', '用户不存在');
    }
    // 返回用户时移除密码字段
    const { password: _, ...userWithoutPassword } = user;
    return success(userWithoutPassword as User);
  } catch (error) {
    console.error('获取用户失败:', error);
    return failure('INTERNAL_ERROR', '获取用户失败，服务器内部错误，请稍后重试');
  }
}

/**
 * 根据邮箱获取用户
 */
export async function getUserByEmail(email: string): Promise<Result<User>> {
  try {
    const user = await userQueries.findUserByEmail(email);
    if (!user) {
      return failure('USER_NOT_FOUND', '用户不存在');
    }
    return success(user);
  } catch (error) {
    console.error('获取用户失败:', error);
    return failure('INTERNAL_ERROR', '获取用户失败，服务器内部错误，请稍后重试');
  }
}

/**
 * 创建用户（注册）
 */
export async function createUser(
  data: userCommands.CreateUserData & { password: string }
): Promise<Result<User>> {
  try {
    // 业务规则：验证邮箱格式
    if (!data.email || !data.email.includes('@')) {
      return failure('INVALID_EMAIL', '邮箱格式不正确，请输入有效的邮箱地址');
    }

    // 业务规则：验证用户名
    if (!data.username || data.username.trim().length === 0) {
      return failure('VALIDATION_ERROR', '用户名不能为空，请输入用户名');
    }

    // 业务规则：验证密码
    if (!data.password || data.password.length < 6) {
      return failure('VALIDATION_ERROR', '密码长度至少为 6 个字符');
    }

    // 业务规则：检查用户名是否已存在
    const existingByUsername = await userQueries.findUserByUsername(data.username);
    if (existingByUsername) {
      return failure('USER_ALREADY_EXISTS', `用户名 ${data.username} 已被使用，请选择其他用户名`);
    }

    // 业务规则：检查邮箱是否已存在
    const existing = await userQueries.findUserByEmail(data.email);
    if (existing) {
      return failure('USER_ALREADY_EXISTS', `该邮箱 ${data.email} 已被注册，请使用其他邮箱或直接登录`);
    }

    // 业务规则：检查 ID 是否已存在
    const existingById = await userQueries.findUserById(data.id);
    if (existingById) {
      return failure('USER_ALREADY_EXISTS', '该用户已存在，请使用其他邮箱注册');
    }

    // 业务规则：哈希密码
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // 创建用户
    const user = await userCommands.insertUser({
      ...data,
      password: hashedPassword,
    });
    
    // 返回用户时移除密码字段
    const { password: _, ...userWithoutPassword } = user;
    return success(userWithoutPassword as User);
  } catch (error) {
    console.error('创建用户失败:', error);
    return failure('INTERNAL_ERROR', '注册失败，服务器内部错误，请稍后重试');
  }
}

/**
 * 验证用户密码
 * 支持使用邮箱或用户名登录
 */
export async function verifyPassword(
  identifier: string, // 可以是邮箱或用户名
  password: string
): Promise<Result<User>> {
  try {
    // 判断输入是邮箱还是用户名（简单判断：包含 @ 符号则为邮箱）
    const isEmail = identifier.includes('@');
    
    let user: User | null = null;
    if (isEmail) {
      user = await userQueries.findUserByEmail(identifier);
    } else {
      user = await userQueries.findUserByUsername(identifier);
    }

    if (!user) {
      return failure('USER_NOT_FOUND', isEmail 
        ? '该邮箱未注册，请先注册账户' 
        : '该用户名不存在，请检查后重试');
    }

    if (!user.password) {
      return failure('UNAUTHORIZED', '该账户未设置密码，请联系管理员');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return failure('UNAUTHORIZED', '密码错误，请检查后重试');
    }

    // 返回用户时移除密码字段
    const { password: _, ...userWithoutPassword } = user;
    return success(userWithoutPassword as User);
  } catch (error) {
    console.error('验证密码失败:', error);
    return failure('INTERNAL_ERROR', '登录验证失败，服务器内部错误，请稍后重试');
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
      return failure('USER_NOT_FOUND', '用户不存在');
    }

    // 业务规则：如果更新用户名，检查新用户名是否已被其他用户使用
    if (data.username && data.username !== existing.username) {
      if (!data.username || data.username.trim().length === 0) {
        return failure('VALIDATION_ERROR', '用户名不能为空，请输入用户名');
      }

      const usernameConflict = await userQueries.findUserByUsername(data.username);
      if (usernameConflict) {
        return failure('USER_ALREADY_EXISTS', `用户名 ${data.username} 已被使用，请选择其他用户名`);
      }
    }

    // 业务规则：如果更新邮箱，检查新邮箱是否已被其他用户使用
    if (data.email && data.email !== existing.email) {
      if (!data.email.includes('@')) {
        return failure('INVALID_EMAIL', '邮箱格式不正确，请输入有效的邮箱地址');
      }

      const emailConflict = await userQueries.findUserByEmail(data.email);
      if (emailConflict) {
        return failure('USER_ALREADY_EXISTS', `该邮箱 ${data.email} 已被注册，请使用其他邮箱`);
      }
    }

    // 更新用户
    const updated = await userCommands.updateUser(id, data);
    if (!updated) {
      return failure('USER_NOT_FOUND', '用户不存在');
    }

    // 返回用户时移除密码字段
    const { password: _, ...userWithoutPassword } = updated;
    return success(userWithoutPassword as User);
  } catch (error) {
    console.error('更新用户失败:', error);
    return failure('INTERNAL_ERROR', '更新用户失败，服务器内部错误，请稍后重试');
  }
}

/**
 * 获取当前用户（根据 ID）
 * 这是 getUserById 的别名，用于语义清晰
 */
export async function getCurrentUser(id: string): Promise<Result<User>> {
  return getUserById(id);
}

/**
 * 修改密码
 */
export async function changePassword(
  id: string,
  oldPassword: string,
  newPassword: string
): Promise<Result<void>> {
  try {
    // 业务规则：检查用户是否存在
    const user = await userQueries.findUserById(id);
    if (!user) {
      return failure('USER_NOT_FOUND', '用户不存在');
    }

    // 业务规则：验证旧密码
    if (!user.password) {
      return failure('UNAUTHORIZED', '该账户未设置密码，无法修改');
    }

    const isValidOldPassword = await bcrypt.compare(oldPassword, user.password);
    if (!isValidOldPassword) {
      return failure('UNAUTHORIZED', '旧密码错误，请检查后重试');
    }

    // 业务规则：验证新密码
    if (!newPassword || newPassword.length < 6) {
      return failure('VALIDATION_ERROR', '新密码长度至少为 6 个字符');
    }

    // 业务规则：新密码不能与旧密码相同
    if (oldPassword === newPassword) {
      return failure('VALIDATION_ERROR', '新密码不能与旧密码相同');
    }

    // 业务规则：哈希新密码
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // 更新密码
    const updated = await userCommands.updateUser(id, {
      password: hashedNewPassword,
    });

    if (!updated) {
      return failure('USER_NOT_FOUND', '用户不存在');
    }

    return success(undefined);
  } catch (error) {
    console.error('修改密码失败:', error);
    return failure('INTERNAL_ERROR', '修改密码失败，服务器内部错误，请稍后重试');
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
      return failure('USER_NOT_FOUND', '用户不存在');
    }

    // 删除用户（外键约束会自动处理关联数据）
    const deleted = await userCommands.deleteUser(id);
    if (!deleted) {
      return failure('USER_NOT_FOUND', '用户不存在');
    }

    return success(undefined);
  } catch (error) {
    console.error('删除用户失败:', error);
    return failure('INTERNAL_ERROR', '删除用户失败，服务器内部错误，请稍后重试');
  }
}

