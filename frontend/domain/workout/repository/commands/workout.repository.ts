/**
 * Workout Repository - Commands
 * Includes write operations for workouts, exercise blocks, and sets.
 */
import { db } from '@/lib/db';
import { workouts, workoutBodyParts, workoutSets, sets } from '@/lib/db/schema';
import { and, eq, inArray, sql } from 'drizzle-orm';

export type Workout = typeof workouts.$inferSelect;

export interface CreateWorkoutData {
  date: string;
  startTime?: Date;
}

export type ExerciseBlock = typeof workoutSets.$inferSelect;

export interface CreateSetData {
  weight: number;
  reps: number;
}

export type Set = typeof sets.$inferSelect;

export interface UpdateSetData {
  weight: number;
  reps: number;
}

async function syncWorkoutIdSequence(): Promise<void> {
  await db.execute(sql`
    SELECT setval(
      pg_get_serial_sequence('workouts', 'id'),
      COALESCE((SELECT MAX(id) FROM workouts), 0) + 1,
      false
    )
  `);
}

async function syncWorkoutSetIdSequence(): Promise<void> {
  await db.execute(sql`
    SELECT setval(
      pg_get_serial_sequence('workout_sets', 'id'),
      COALESCE((SELECT MAX(id) FROM workout_sets), 0) + 1,
      false
    )
  `);
}

async function syncSetIdSequence(): Promise<void> {
  await db.execute(sql`
    SELECT setval(
      pg_get_serial_sequence('sets', 'id'),
      COALESCE((SELECT MAX(id) FROM sets), 0) + 1,
      false
    )
  `);
}

function isDuplicateSetPrimaryKeyError(error: unknown): boolean {
  return (
    !!error &&
    typeof error === 'object' &&
    'code' in error &&
    'constraint' in error &&
    (error as { code?: string }).code === '23505' &&
    (error as { constraint?: string }).constraint === 'sets_pkey'
  );
}

function isDuplicateWorkoutPrimaryKeyError(error: unknown): boolean {
  return (
    !!error &&
    typeof error === 'object' &&
    'code' in error &&
    'constraint' in error &&
    (error as { code?: string }).code === '23505' &&
    (error as { constraint?: string }).constraint === 'workouts_pkey'
  );
}

function isDuplicateWorkoutSetPrimaryKeyError(error: unknown): boolean {
  return (
    !!error &&
    typeof error === 'object' &&
    'code' in error &&
    'constraint' in error &&
    (error as { code?: string }).code === '23505' &&
    (error as { constraint?: string }).constraint === 'workout_sets_pkey'
  );
}

async function insertSetWithSequenceRecovery(values: {
  userId: string;
  workoutSetId: number;
  setNumber: number;
  weight: number;
  reps: number;
}): Promise<Set> {
  try {
    const [setResult] = await db.insert(sets).values(values).returning();
    return setResult;
  } catch (error) {
    if (!isDuplicateSetPrimaryKeyError(error)) {
      throw error;
    }

    await syncSetIdSequence();
    const [retriedSetResult] = await db.insert(sets).values(values).returning();
    return retriedSetResult;
  }
}

export async function insertWorkout(
  userId: string,
  data: CreateWorkoutData
): Promise<Workout> {
  const values = {
    userId,
    date: data.date,
    startTime: data.startTime || new Date(),
  };

  let result: Workout | undefined;

  try {
    [result] = await db
      .insert(workouts)
      .values(values)
      .returning();
  } catch (error) {
    if (!isDuplicateWorkoutPrimaryKeyError(error)) {
      throw error;
    }

    await syncWorkoutIdSequence();
    [result] = await db
      .insert(workouts)
      .values(values)
      .returning();
  }

  return result;
}

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

export async function addBodyPartsToWorkout(
  workoutId: number,
  bodyPartIds: number[]
): Promise<void> {
  if (bodyPartIds.length === 0) {
    return;
  }

  await db
    .insert(workoutBodyParts)
    .values(
      bodyPartIds.map((bodyPartId) => ({
        workoutId,
        bodyPartId,
      }))
    )
    .onConflictDoNothing();
}

export async function removeBodyPartsFromWorkout(
  workoutId: number,
  bodyPartIds: number[]
): Promise<void> {
  await db
    .delete(workoutBodyParts)
    .where(
      and(
        eq(workoutBodyParts.workoutId, workoutId),
        inArray(workoutBodyParts.bodyPartId, bodyPartIds)
      )
    );
}

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

export async function deleteAllWorkouts(userId: string): Promise<void> {
  await db.delete(workouts).where(eq(workouts.userId, userId));
}

export async function insertExerciseBlock(
  userId: string,
  workoutId: number,
  exerciseId: number
) : Promise<ExerciseBlock | null> {
  let result: ExerciseBlock | undefined;

  try {
    [result] = await db
      .insert(workoutSets)
      .values({
        userId,
        workoutId,
        exerciseId,
      })
      .onConflictDoNothing()
      .returning();
  } catch (error) {
    if (!isDuplicateWorkoutSetPrimaryKeyError(error)) {
      throw error;
    }

    await syncWorkoutSetIdSequence();
    [result] = await db
      .insert(workoutSets)
      .values({
        userId,
        workoutId,
        exerciseId,
      })
      .onConflictDoNothing()
      .returning();
  }

  if (result) {
    return result;
  }

  const [existingExerciseBlock] = await db
    .select()
    .from(workoutSets)
    .where(and(
      eq(workoutSets.userId, userId),
      eq(workoutSets.workoutId, workoutId),
      eq(workoutSets.exerciseId, exerciseId)
    ))
    .limit(1);

  return existingExerciseBlock || null;
}

export async function addSetsToExerciseBlock(
  userId: string,
  workoutSetId: number,
  setsData: CreateSetData[]
): Promise<Set[]> {
  const existingSets = await db
    .select()
    .from(sets)
    .where(eq(sets.workoutSetId, workoutSetId))
    .orderBy(sets.setNumber);

  const maxSetNumber =
    existingSets.length > 0 ? existingSets[existingSets.length - 1].setNumber : 0;

  const newSets: Set[] = [];
  for (let i = 0; i < setsData.length; i++) {
    const setData = setsData[i];
    const setResult = await insertSetWithSequenceRecovery({
        userId,
        workoutSetId,
        setNumber: maxSetNumber + i + 1,
        weight: setData.weight,
        reps: setData.reps,
      });

    newSets.push(setResult);
  }

  return newSets;
}

export async function updateExerciseBlockSets(
  userId: string,
  workoutSetId: number,
  setsData: CreateSetData[]
): Promise<Set[]> {
  const updatedSets: Set[] = [];

  for (const setData of setsData) {
    const existingSet = await db
      .select()
      .from(sets)
      .where(and(eq(sets.workoutSetId, workoutSetId), eq(sets.reps, setData.reps)))
      .limit(1);

    if (existingSet.length > 0) {
      const [updatedSet] = await db
        .update(sets)
        .set({ weight: setData.weight })
        .where(eq(sets.id, existingSet[0].id))
        .returning();

      updatedSets.push(updatedSet);
    } else {
      const maxSetResult = await db
        .select()
        .from(sets)
        .where(eq(sets.workoutSetId, workoutSetId))
        .orderBy(sets.setNumber);

      const nextSetNumber =
        maxSetResult.length > 0 ? maxSetResult[maxSetResult.length - 1].setNumber + 1 : 1;

      const newSet = await insertSetWithSequenceRecovery({
          userId,
          workoutSetId,
          setNumber: nextSetNumber,
          weight: setData.weight,
          reps: setData.reps,
        });

      updatedSets.push(newSet);
    }
  }

  return updatedSets;
}

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

export async function deleteExerciseBlockByWorkoutAndExercise(
  userId: string,
  workoutId: number,
  exerciseId: number
): Promise<boolean> {
  const [result] = await db
    .delete(workoutSets)
    .where(
      and(
        eq(workoutSets.userId, userId),
        eq(workoutSets.workoutId, workoutId),
        eq(workoutSets.exerciseId, exerciseId)
      )
    )
    .returning();

  return !!result;
}

export async function deleteAllExerciseBlocks(userId: string): Promise<void> {
  await db.delete(workoutSets).where(eq(workoutSets.userId, userId));
}

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

export async function deleteSet(id: number): Promise<boolean> {
  const [result] = await db
    .delete(sets)
    .where(eq(sets.id, id))
    .returning();

  return !!result;
}

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
    .where(and(eq(sets.id, setId), eq(workoutSets.userId, userId)))
    .limit(1);

  return result?.workoutSetId || null;
}
