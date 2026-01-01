/**
 * Exercise Repository - Queries (读操作)
 */
import { db } from '@/lib/db';
import { exercises, bodyParts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export type Exercise = typeof exercises.$inferSelect;

export interface ExerciseWithBodyPart {
  id: number;
  name: string;
  description: string | null;
  body_part: {
    id: number;
    name: string;
  };
}

/**
 * 根据用户 ID 获取所有动作（可选按身体部位名称过滤）
 */
export async function findExercises(
  userId: string,
  bodyPartName?: string
): Promise<ExerciseWithBodyPart[]> {
  let query = db
    .select({
      id: exercises.id,
      name: exercises.name,
      description: exercises.description,
      body_part: {
        id: bodyParts.id,
        name: bodyParts.name,
      },
    })
    .from(exercises)
    .innerJoin(bodyParts, eq(exercises.bodyPartId, bodyParts.id));

  // 构建where条件
  if (bodyPartName) {
    query = query.where(and(
      eq(exercises.userId, userId),
      eq(bodyParts.name, bodyPartName)
    ));
  } else {
    query = query.where(eq(exercises.userId, userId));
  }

  return await query;
}

/**
 * 根据 ID 查找动作
 */
export async function findExerciseById(
  id: number,
  userId: string
): Promise<Exercise | null> {
  const [result] = await db
    .select()
    .from(exercises)
    .where(and(eq(exercises.id, id), eq(exercises.userId, userId)))
    .limit(1);

  return result || null;
}

/**
 * 根据名称查找动作
 */
export async function findExerciseByName(
  userId: string,
  name: string
): Promise<Exercise | null> {
  const [result] = await db
    .select()
    .from(exercises)
    .where(and(eq(exercises.userId, userId), eq(exercises.name, name)))
    .limit(1);

  return result || null;
}

/**
 * 根据身体部位 ID 查找动作
 */
export async function findExercisesByBodyPartId(
  userId: string,
  bodyPartId: number
): Promise<Exercise[]> {
  return await db
    .select()
    .from(exercises)
    .where(and(
      eq(exercises.userId, userId),
      eq(exercises.bodyPartId, bodyPartId)
    ));
}

/**
 * 根据身体部位名称查找动作（带身体部位信息）
 */
export async function findExercisesByBodyPartName(
  userId: string,
  bodyPartName: string
): Promise<ExerciseWithBodyPart[]> {
  return await db
    .select({
      id: exercises.id,
      name: exercises.name,
      description: exercises.description,
      body_part: {
        id: bodyParts.id,
        name: bodyParts.name,
      },
    })
    .from(exercises)
    .innerJoin(bodyParts, eq(exercises.bodyPartId, bodyParts.id))
    .where(and(
      eq(exercises.userId, userId),
      eq(bodyParts.name, bodyPartName)
    ));
}

