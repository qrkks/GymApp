/**
 * Workout Repository - Commands (写操作)
 * 包含 Workout、ExerciseBlock 和 Set 的命令操作
 */
import { db } from '@/lib/db';
import { workouts, workoutBodyParts, workoutSets, sets } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

export type Workout = typeof workouts.$inferSelect;

export interface CreateWorkoutData {
  date: string;
  startTime?: Date;
}

// ExerciseBlock types
export type ExerciseBlock = typeof workoutSets.$inferSelect;

export interface CreateSetData {
  weight: number;
  reps: number;
}

// Set types
export type Set = typeof sets.$inferSelect;

export interface UpdateSetData {
  weight: number;
  reps: number;
}

/**
 * 创建训练
 */
export async function insertWorkout(
  userId: string,
  data: CreateWorkoutData
): Promise<Workout> {
  const [result] = await db
    .insert(workouts)
    .values({
      userId,
      date: data.date,
      startTime: data.startTime || new Date(),
    })
    .returning();

  return result;
}

/**
 * 更新训练结束时间
 */
export async function updateWorkoutEndTime(
  id: number,
  userId: string,
  endTime: Date
): Promise<Workout | null> {
  const [result] = await db
    .update(workouts)
    .set({ endTime })
    .where(and(eq(workouts.id, id), eq(workouts.userId, userId)))
    .returning();

  return result || null;
}

/**
 * 添加身体部位到训练
 */
export async function addBodyPartsToWorkout(
  workoutId: number,
  bodyPartIds: number[]
): Promise<void> {
  // Insert only if not exists (ignore duplicates)
  for (const bodyPartId of bodyPartIds) {
    try {
      await db.insert(workoutBodyParts).values({
        workoutId,
        bodyPartId,
      });
    } catch (e) {
      // Ignore duplicate key errors
    }
  }
}

/**
 * 从训练中移除身体部位
 */
export async function removeBodyPartsFromWorkout(
  workoutId: number,
  bodyPartIds: number[]
): Promise<void> {
  await db
    .delete(workoutBodyParts)
    .where(and(
      eq(workoutBodyParts.workoutId, workoutId),
      inArray(workoutBodyParts.bodyPartId, bodyPartIds)
    ));
}

/**
 * 删除训练
 */
export async function deleteWorkout(
  id: number,
  userId: string
): Promise<boolean> {
  const [result] = await db
    .delete(workouts)
    .where(and(eq(workouts.id, id), eq(workouts.userId, userId)))
    .returning();

  return !!result;
}

/**
 * 根据日期删除训练
 */
export async function deleteWorkoutByDate(
  userId: string,
  date: string
): Promise<boolean> {
  const [result] = await db
    .delete(workouts)
    .where(and(eq(workouts.userId, userId), eq(workouts.date, date)))
    .returning();

  return !!result;
}

/**
 * 删除用户的所有训练
 */
export async function deleteAllWorkouts(userId: string): Promise<void> {
  await db.delete(workouts).where(eq(workouts.userId, userId));
}

// ========== ExerciseBlock Commands ==========

/**
 * 创建训练动作块
 */
export async function insertExerciseBlock(
  userId: string,
  workoutId: number,
  exerciseId: number
): Promise<ExerciseBlock> {
  const [result] = await db
    .insert(workoutSets)
    .values({
      userId,
      workoutId,
      exerciseId,
    })
    .returning();

  return result;
}

/**
 * 为训练动作块添加组
 */
export async function addSetsToExerciseBlock(
  userId: string,
  workoutSetId: number,
  setsData: CreateSetData[]
): Promise<Set[]> {
  // Get max set number
  const existingSets = await db
    .select()
    .from(sets)
    .where(eq(sets.workoutSetId, workoutSetId))
    .orderBy(sets.setNumber);

  const maxSetNumber = existingSets.length > 0
    ? existingSets[existingSets.length - 1].setNumber
    : 0;

  // Create sets
  const newSets: Set[] = [];
  for (let i = 0; i < setsData.length; i++) {
    const setData = setsData[i];
    const [setResult] = await db
      .insert(sets)
      .values({
        userId,
        workoutSetId,
        setNumber: maxSetNumber + i + 1,
        weight: setData.weight,
        reps: setData.reps,
      })
      .returning();

    newSets.push(setResult);
  }

  return newSets;
}

/**
 * 更新训练动作块的组
 */
export async function updateExerciseBlockSets(
  userId: string,
  workoutSetId: number,
  setsData: CreateSetData[]
): Promise<Set[]> {
  const updatedSets: Set[] = [];

  for (const setData of setsData) {
    // Try to find existing set with same reps
    const existingSet = await db
      .select()
      .from(sets)
      .where(and(
        eq(sets.workoutSetId, workoutSetId),
        eq(sets.reps, setData.reps)
      ))
      .limit(1);

    if (existingSet.length > 0) {
      // Update existing set
      const [updatedSet] = await db
        .update(sets)
        .set({ weight: setData.weight })
        .where(eq(sets.id, existingSet[0].id))
        .returning();

      updatedSets.push(updatedSet);
    } else {
      // Create new set
      const maxSetResult = await db
        .select()
        .from(sets)
        .where(eq(sets.workoutSetId, workoutSetId))
        .orderBy(sets.setNumber);

      const nextSetNumber = maxSetResult.length > 0
        ? maxSetResult[maxSetResult.length - 1].setNumber + 1
        : 1;

      const [newSet] = await db
        .insert(sets)
        .values({
          userId,
          workoutSetId,
          setNumber: nextSetNumber,
          weight: setData.weight,
          reps: setData.reps,
        })
        .returning();

      updatedSets.push(newSet);
    }
  }

  return updatedSets;
}

/**
 * 删除训练动作块
 */
export async function deleteExerciseBlock(
  id: number,
  userId: string
): Promise<boolean> {
  const [result] = await db
    .delete(workoutSets)
    .where(and(eq(workoutSets.id, id), eq(workoutSets.userId, userId)))
    .returning();

  return !!result;
}

/**
 * 根据训练 ID 和动作 ID 删除训练动作块
 */
export async function deleteExerciseBlockByWorkoutAndExercise(
  userId: string,
  workoutId: number,
  exerciseId: number
): Promise<boolean> {
  const [result] = await db
    .delete(workoutSets)
    .where(and(
      eq(workoutSets.userId, userId),
      eq(workoutSets.workoutId, workoutId),
      eq(workoutSets.exerciseId, exerciseId)
    ))
    .returning();

  return !!result;
}

/**
 * 删除用户的所有训练动作块
 */
export async function deleteAllExerciseBlocks(userId: string): Promise<void> {
  await db.delete(workoutSets).where(eq(workoutSets.userId, userId));
}

// ========== Set Commands ==========

/**
 * 更新组
 */
export async function updateSet(
  id: number,
  data: UpdateSetData
): Promise<Set | null> {
  const [result] = await db
    .update(sets)
    .set({
      weight: data.weight,
      reps: data.reps,
    })
    .where(eq(sets.id, id))
    .returning();

  return result || null;
}

/**
 * 删除组
 */
export async function deleteSet(id: number): Promise<boolean> {
  const [result] = await db
    .delete(sets)
    .where(eq(sets.id, id))
    .returning();

  return !!result;
}

/**
 * 重新排序组的编号
 */
export async function reorderSets(exerciseBlockId: number): Promise<void> {
  const remainingSets = await db
    .select()
    .from(sets)
    .where(eq(sets.workoutSetId, exerciseBlockId))
    .orderBy(sets.setNumber);

  for (let i = 0; i < remainingSets.length; i++) {
    await db
      .update(sets)
      .set({ setNumber: i + 1 })
      .where(eq(sets.id, remainingSets[i].id));
  }
}

/**
 * 获取组的训练动作块 ID（用于验证权限）
 */
export async function getExerciseBlockIdBySetId(
  setId: number,
  userId: string
): Promise<number | null> {
  const [result] = await db
    .select({
      workoutSetId: sets.workoutSetId,
    })
    .from(sets)
    .innerJoin(workoutSets, eq(sets.workoutSetId, workoutSets.id))
    .where(and(
      eq(sets.id, setId),
      eq(workoutSets.userId, userId)
    ))
    .limit(1);

  return result?.workoutSetId || null;
}

