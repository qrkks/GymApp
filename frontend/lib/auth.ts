/**
 * 认证相关函数
 * 使用 User Application Service
 */
import * as userUseCase from '@domain/user/application/user.use-case';

/**
 * 根据 ID 获取用户（兼容旧代码）
 * @deprecated 使用 getUserById from '@domain/user/application/user.use-case' 代替
 */
export async function getUserById(id: string) {
  const result = await userUseCase.getUserById(id);
  if (!result.success) {
    return null;
  }
  return result.data;
}

/**
 * 根据邮箱获取用户（兼容旧代码）
 * @deprecated 使用 getUserByEmail from '@domain/user/application/user.use-case' 代替
 */
export async function getUserByEmail(email: string) {
  const result = await userUseCase.getUserByEmail(email);
  if (!result.success) {
    return null;
  }
  return result.data;
}

/**
 * 创建用户（兼容旧代码）
 * @deprecated 使用 createUser from '@domain/user/application/user.use-case' 代替
 */
export async function createUser(data: {
  id: string;
  email: string;
  name?: string;
  image?: string;
}) {
  const result = await userUseCase.createUser(data);
  if (!result.success) {
    throw new Error(result.error.message);
  }
  return result.data;
}
