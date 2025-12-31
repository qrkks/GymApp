/**
 * BodyPart Repository - Commands (写操作)
 */
import { db } from '@/lib/db';
import { bodyParts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export type BodyPart = typeof bodyParts.$inferSelect;

/**
 * 创建训练部位
 */
export async function insertBodyPart(
  userId: string,
  name: string
): Promise<BodyPart> {
  const [result] = await db
    .insert(bodyParts)
    .values({
      userId,
      name,
    })
    .returning();

  return result;
}

/**
 * 更新训练部位名称
 */
export async function updateBodyPart(
  id: number,
  userId: string,
  name: string
): Promise<BodyPart | null> {
  const [result] = await db
    .update(bodyParts)
    .set({ name })
    .where(and(eq(bodyParts.id, id), eq(bodyParts.userId, userId)))
    .returning();

  return result || null;
}

/**
 * 删除训练部位
 */
export async function deleteBodyPart(
  id: number,
  userId: string
): Promise<boolean> {
  const [result] = await db
    .delete(bodyParts)
    .where(and(eq(bodyParts.id, id), eq(bodyParts.userId, userId)))
    .returning();

  return !!result;
}

/**
 * 删除用户的所有训练部位
 */
export async function deleteAllBodyParts(userId: string): Promise<void> {
  await db.delete(bodyParts).where(eq(bodyParts.userId, userId));
}

