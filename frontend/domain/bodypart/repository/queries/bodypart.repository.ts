/**
 * BodyPart Repository - Queries (读操作)
 */
import { db } from '@/lib/db';
import { bodyParts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export type BodyPart = typeof bodyParts.$inferSelect;

/**
 * 根据用户 ID 获取所有训练部位
 */
export async function getBodyPartList(userId: string): Promise<BodyPart[]> {
  return await db
    .select()
    .from(bodyParts)
    .where(eq(bodyParts.userId, userId));
}

/**
 * 根据 ID 查找训练部位
 */
export async function findBodyPartById(
  id: number,
  userId: string
): Promise<BodyPart | null> {
  const [result] = await db
    .select()
    .from(bodyParts)
    .where(and(eq(bodyParts.id, id), eq(bodyParts.userId, userId)))
    .limit(1);

  return result || null;
}

/**
 * 根据名称查找训练部位
 */
export async function findBodyPartByName(
  userId: string,
  name: string
): Promise<BodyPart | null> {
  const [result] = await db
    .select()
    .from(bodyParts)
    .where(and(eq(bodyParts.userId, userId), eq(bodyParts.name, name)))
    .limit(1);

  return result || null;
}

