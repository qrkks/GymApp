/**
 * User Application Service (Use Cases)
 * 协调 Repository 和 Domain Service，处理完整用例
 */
import { Result, success, failure } from '@domain/shared/error-types';
import * as userQueries from '@domain/user/repository/queries/user.repository';
import * as userCommands from '@domain/user/repository/commands/user.repository';
import { User as UserEntity, UserPersistence } from '@domain/user/model/user.entity';
import { Email } from '@domain/user/model/email.value-object';
import { Username } from '@domain/user/model/username.value-object';
import { Password } from '@domain/user/model/password.value-object';
import bcrypt from 'bcrypt';

// 导出类型：使用 repository 的原始类型（用于 API 层）
export type User = userQueries.User;

/**
 * 根据 ID 获取用户
 */
export async function getUserById(id: string): Promise<Result<User>> {
  try {
    const userData = await userQueries.findUserById(id);
    if (!userData) {
      return failure('USER_NOT_FOUND', '用户不存在');
    }
    
    // 使用实体封装业务逻辑
    const user = UserEntity.fromPersistence(userData);
    
    // 返回用户时移除密码字段
    const userWithoutPassword = user.withoutPassword();
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
    const userData = await userQueries.findUserByEmail(email);
    if (!userData) {
      return failure('USER_NOT_FOUND', '用户不存在');
    }
    
    // 使用实体封装业务逻辑
    const user = UserEntity.fromPersistence(userData);
    
    // 返回用户时移除密码字段
    const userWithoutPassword = user.withoutPassword();
    return success(userWithoutPassword as User);
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
    // 使用值对象进行验证（会抛出异常如果无效）
    let email: Email;
    let username: Username;
    let password: Password;
    
    try {
      email = Email.create(data.email || '');
    } catch (error: any) {
      return failure('INVALID_EMAIL', '邮箱格式不正确，请输入有效的邮箱地址');
    }

    try {
      username = Username.create(data.username!);
    } catch (error: any) {
      return failure('VALIDATION_ERROR', '用户名不能为空，请输入用户名');
    }

    try {
      password = Password.create(data.password);
    } catch (error: any) {
      return failure('VALIDATION_ERROR', '密码长度至少为 6 个字符');
    }

    // 业务规则：检查用户名是否已存在
    const existingByUsername = await userQueries.findUserByUsername(username.getValue());
    if (existingByUsername) {
      return failure('USER_ALREADY_EXISTS', `用户名 ${username.getValue()} 已被使用，请选择其他用户名`);
    }

    // 业务规则：检查邮箱是否已存在
    const existing = await userQueries.findUserByEmail(email.getValue());
    if (existing) {
      return failure('USER_ALREADY_EXISTS', `该邮箱 ${email.getValue()} 已被注册，请使用其他邮箱或直接登录`);
    }

    // 业务规则：检查 ID 是否已存在
    const existingById = await userQueries.findUserById(data.id);
    if (existingById) {
      return failure('USER_ALREADY_EXISTS', '该用户已存在，请使用其他邮箱注册');
    }

    // 业务规则：哈希密码
    const hashedPassword = await bcrypt.hash(password.getValue(), 10);

    // 创建用户
    const userData = await userCommands.insertUser({
      ...data,
      email: email.getValue(),
      username: username.getValue(),
      password: hashedPassword,
    });
    
    // 使用实体封装业务逻辑
    const user = UserEntity.fromPersistence(userData);
    
    // 返回用户时移除密码字段
    const userWithoutPassword = user.withoutPassword();
    return success(userWithoutPassword as User);
  } catch (error: any) {
    // 捕获值对象验证异常
    if (error.message?.includes('email') || error.message?.includes('Email')) {
      return failure('INVALID_EMAIL', '邮箱格式不正确，请输入有效的邮箱地址');
    }
    if (error.message?.includes('username') || error.message?.includes('Username')) {
      return failure('VALIDATION_ERROR', '用户名不能为空，请输入用户名');
    }
    if (error.message?.includes('password') || error.message?.includes('Password')) {
      return failure('VALIDATION_ERROR', '密码长度至少为 6 个字符');
    }
    
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
    // 使用值对象验证密码
    let passwordVO: Password;
    try {
      passwordVO = Password.create(password);
    } catch (error: any) {
      return failure('VALIDATION_ERROR', '密码长度至少为 6 个字符');
    }

    // 判断输入是邮箱还是用户名（简单判断：包含 @ 符号则为邮箱）
    const isEmail = identifier.includes('@');
    
    let userData: userQueries.User | null = null;
    if (isEmail) {
      // 验证邮箱格式
      try {
        Email.create(identifier);
      } catch (error: any) {
        return failure('INVALID_EMAIL', '邮箱格式不正确');
      }
      userData = await userQueries.findUserByEmail(identifier);
    } else {
      // 验证用户名格式
      try {
        Username.create(identifier);
      } catch (error: any) {
        return failure('VALIDATION_ERROR', '用户名格式不正确');
      }
      userData = await userQueries.findUserByUsername(identifier);
    }

    if (!userData) {
      return failure('USER_NOT_FOUND', isEmail 
        ? '该邮箱未注册，请先注册账户' 
        : '该用户名不存在，请检查后重试');
    }

    // 使用实体封装业务逻辑
    const user = UserEntity.fromPersistence(userData);

    if (!user.hasPassword()) {
      return failure('UNAUTHORIZED', '该账户未设置密码，请联系管理员');
    }

    const isValid = await bcrypt.compare(passwordVO.getValue(), userData.password!);
    if (!isValid) {
      return failure('UNAUTHORIZED', '密码错误，请检查后重试');
    }

    // 返回用户时移除密码字段
    const userWithoutPassword = user.withoutPassword();
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
    const existingData = await userQueries.findUserById(id);
    if (!existingData) {
      return failure('USER_NOT_FOUND', '用户不存在');
    }

    // 使用实体封装业务逻辑
    const existing = UserEntity.fromPersistence(existingData);

    // 业务规则：如果更新用户名，检查新用户名是否已被其他用户使用
    if (data.username && data.username !== existing.getUsername()) {
      let newUsername: Username;
      try {
        newUsername = Username.create(data.username);
      } catch (error: any) {
        return failure('VALIDATION_ERROR', '用户名不能为空，请输入用户名');
      }

      const usernameConflict = await userQueries.findUserByUsername(newUsername.getValue());
      if (usernameConflict) {
        return failure('USER_ALREADY_EXISTS', `用户名 ${newUsername.getValue()} 已被使用，请选择其他用户名`);
      }
    }

    // 业务规则：如果更新邮箱，检查新邮箱是否已被其他用户使用
    if (data.email && data.email !== existing.getEmail()) {
      let newEmail: Email;
      try {
        newEmail = Email.create(data.email);
      } catch (error: any) {
        return failure('INVALID_EMAIL', '邮箱格式不正确，请输入有效的邮箱地址');
      }

      const emailConflict = await userQueries.findUserByEmail(newEmail.getValue());
      if (emailConflict) {
        return failure('USER_ALREADY_EXISTS', `该邮箱 ${newEmail.getValue()} 已被注册，请使用其他邮箱`);
      }
    }

    // 更新用户
    const updatedData = await userCommands.updateUser(id, data);
    if (!updatedData) {
      return failure('USER_NOT_FOUND', '用户不存在');
    }

    // 使用实体封装业务逻辑
    const updated = UserEntity.fromPersistence(updatedData);
    
    // 返回用户时移除密码字段
    const userWithoutPassword = updated.withoutPassword();
    return success(userWithoutPassword as User);
  } catch (error: any) {
    // 捕获值对象验证异常
    if (error.message?.includes('email') || error.message?.includes('Email')) {
      return failure('INVALID_EMAIL', '邮箱格式不正确，请输入有效的邮箱地址');
    }
    if (error.message?.includes('username') || error.message?.includes('Username')) {
      return failure('VALIDATION_ERROR', '用户名不能为空，请输入用户名');
    }
    
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
    const userData = await userQueries.findUserById(id);
    if (!userData) {
      return failure('USER_NOT_FOUND', '用户不存在');
    }

    // 使用实体封装业务逻辑
    const user = UserEntity.fromPersistence(userData);

    // 业务规则：验证旧密码
    if (!user.hasPassword()) {
      return failure('UNAUTHORIZED', '该账户未设置密码，无法修改');
    }

    const isValidOldPassword = await bcrypt.compare(oldPassword, userData.password!);
    if (!isValidOldPassword) {
      return failure('UNAUTHORIZED', '旧密码错误，请检查后重试');
    }

    // 使用值对象验证新密码
    let newPasswordVO: Password;
    let oldPasswordVO: Password;
    try {
      oldPasswordVO = Password.create(oldPassword);
      newPasswordVO = Password.create(newPassword);
    } catch (error: any) {
      return failure('VALIDATION_ERROR', '密码长度至少为 6 个字符');
    }

    // 业务规则：新密码不能与旧密码相同
    if (oldPasswordVO.isSameAs(newPasswordVO)) {
      return failure('VALIDATION_ERROR', '新密码不能与旧密码相同');
    }

    // 业务规则：哈希新密码
    const hashedNewPassword = await bcrypt.hash(newPasswordVO.getValue(), 10);

    // 更新密码
    const updated = await userCommands.updateUser(id, {
      password: hashedNewPassword,
    });

    if (!updated) {
      return failure('USER_NOT_FOUND', '用户不存在');
    }

    return success(undefined);
  } catch (error: any) {
    // 捕获值对象验证异常
    if (error.message?.includes('password') || error.message?.includes('Password')) {
      return failure('VALIDATION_ERROR', '密码长度至少为 6 个字符');
    }
    
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
    const existingData = await userQueries.findUserById(id);
    if (!existingData) {
      return failure('USER_NOT_FOUND', '用户不存在');
    }

    // 使用实体封装业务逻辑（可选，用于验证）
    const existing = UserEntity.fromPersistence(existingData);

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
