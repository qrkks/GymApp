/**
 * Exercise Repository - Commands (写操作)
 */
import { db } from '@/lib/db';
import { exercises } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export type Exercise = typeof exercises.$inferSelect;

export interface CreateExerciseData {
  name: string;
  description?: string;
  bodyPartId: number;
}

/**
 * 创建动作
 */
export async function insertExercise(
  userId: string,
  data: CreateExerciseData
): Promise<Exercise> {
  const [result] = await db
    .insert(exercises)
    .values({
      userId,
      name: data.name,
      description: data.description || '',
      bodyPartId: data.bodyPartId,
    })
    .returning();

  return result;
}

/**
 * 更新动作名称
 */
export async function updateExerciseName(
  id: number,
  userId: string,
  name: string
): Promise<Exercise | null> {
  const [result] = await db
    .update(exercises)
    .set({ name })
    .where(and(eq(exercises.id, id), eq(exercises.userId, userId)))
    .returning();

  return result || null;
}

/**
 * 更新动作
 */
export async function updateExercise(
  id: number,
  userId: string,
  data: Partial<CreateExerciseData>
): Promise<Exercise | null> {
  const updateData: Partial<typeof exercises.$inferInsert> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.bodyPartId !== undefined) updateData.bodyPartId = data.bodyPartId;

  const [result] = await db
    .update(exercises)
    .set(updateData)
    .where(and(eq(exercises.id, id), eq(exercises.userId, userId)))
    .returning();

  return result || null;
}

/**
 * 删除动作
 */
export async function deleteExercise(
  id: number,
  userId: string
): Promise<boolean> {
  const [result] = await db
    .delete(exercises)
    .where(and(eq(exercises.id, id), eq(exercises.userId, userId)))
    .returning();

  return !!result;
}

/**
 * 删除用户的所有动作
 */
export async function deleteAllExercises(userId: string): Promise<void> {
  await db.delete(exercises).where(eq(exercises.userId, userId));
}

