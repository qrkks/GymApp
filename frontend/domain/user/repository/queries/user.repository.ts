/**
 * User Repository - Queries (读操作)
 */
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export type User = typeof users.$inferSelect;

/**
 * 根据 ID 查找用户
 */
export async function findUserById(id: string): Promise<User | null> {
  const [result] = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return result || null;
}

/**
 * 根据邮箱查找用户
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  const [result] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return result || null;
}

/**
 * 根据用户名查找用户
 */
export async function findUserByUsername(username: string): Promise<User | null> {
  const [result] = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  return result || null;
}

