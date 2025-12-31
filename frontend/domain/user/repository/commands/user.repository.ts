/**
 * User Repository - Commands (写操作)
 */
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export type User = typeof users.$inferSelect;

export interface CreateUserData {
  id: string;
  email: string;
  username?: string;
  password?: string; // 密码哈希
  image?: string;
}

/**
 * 创建用户
 */
export async function insertUser(data: CreateUserData): Promise<User> {
  const [result] = await db
    .insert(users)
    .values({
      id: data.id,
      email: data.email,
      username: data.username,
      password: data.password,
      image: data.image,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return result;
}

/**
 * 更新用户
 */
export async function updateUser(
  id: string,
  data: Partial<Omit<CreateUserData, 'id'>>
): Promise<User | null> {
  const [result] = await db
    .update(users)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id))
    .returning();

  return result || null;
}

/**
 * 删除用户
 */
export async function deleteUser(id: string): Promise<boolean> {
  const [result] = await db
    .delete(users)
    .where(eq(users.id, id))
    .returning();

  return !!result;
}

