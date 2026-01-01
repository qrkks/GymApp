/**
 * 密码验证工具
 * 使用 bcrypt 进行密码验证
 */

import bcrypt from 'bcryptjs';

/**
 * 验证密码
 * 
 * @param password 用户输入的原始密码
 * @param hashedPassword 数据库中存储的 bcrypt 哈希密码
 * @returns 是否匹配
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  if (!hashedPassword) {
    return false;
  }

  return bcrypt.compare(password, hashedPassword);
}

