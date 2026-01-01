/**
 * Workout Repository - Queries (读操作)
 * 包含 Workout、ExerciseBlock 和 Set 的查询操作
 */
import { db } from '@/lib/db';
import { workouts, workoutBodyParts, bodyParts, workoutSets, exercises, sets } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export type Workout = typeof workouts.$inferSelect;

export interface WorkoutWithBodyParts extends Workout {
  body_parts: Array<{
    id: number;
    name: string;
  }>;
}

// ExerciseBlock types
export type ExerciseBlock = typeof workoutSets.$inferSelect;

export interface ExerciseBlockWithDetails {
  id: number;
  workout: {
    id: number;
    date: string;
    startTime: Date | null;
    endTime: Date | null;
  };
  exercise: {
    id: number;
    name: string;
    description: string | null;
    body_part: {
      id: number;
      name: string;
    };
  };
  sets: Array<{
    id: number;
    setNumber: number;
    weight: number;
    reps: number;
  }>;
}

export interface FindExerciseBlocksFilters {
  workoutDate?: string;
  exerciseName?: string;
  bodyPartName?: string;
}

// Set types
export type Set = typeof sets.$inferSelect;

export interface SetSummary {
  id: number;
  reps: number;
  weight: number;
}

/**
 * 根据用户 ID 获取所有训练
 */
export async function findWorkouts(userId: string): Promise<Workout[]> {
  return await db
    .select()
    .from(workouts)
    .where(eq(workouts.userId, userId))
    .orderBy(workouts.date);
}

/**
 * 根据 ID 查找训练
 */
export async function findWorkoutById(
  id: number,
  userId: string
): Promise<Workout | null> {
  const [result] = await db
    .select()
    .from(workouts)
    .where(and(eq(workouts.id, id), eq(workouts.userId, userId)))
    .limit(1);

  return result || null;
}

/**
 * 根据日期查找训练
 */
export async function findWorkoutByDate(
  userId: string,
  date: string
): Promise<Workout | null> {
  const [result] = await db
    .select()
    .from(workouts)
    .where(and(eq(workouts.userId, userId), eq(workouts.date, date)))
    .limit(1);

  return result || null;
}

/**
 * 根据日期查找训练（包含身体部位）
 */
export async function findWorkoutByDateWithBodyParts(
  userId: string,
  date: string
): Promise<WorkoutWithBodyParts | null> {
  const workout = await findWorkoutByDate(userId, date);
  if (!workout) {
    return null;
  }

  // Get associated body parts
  const associatedBodyParts = await db
    .select({
      id: bodyParts.id,
      name: bodyParts.name,
    })
    .from(workoutBodyParts)
    .innerJoin(bodyParts, eq(workoutBodyParts.bodyPartId, bodyParts.id))
    .where(eq(workoutBodyParts.workoutId, workout.id));

  return {
    ...workout,
    body_parts: associatedBodyParts,
  };
}

/**
 * 获取训练的身体部位列表
 */
export async function getWorkoutBodyParts(
  workoutId: number
): Promise<Array<{ id: number; name: string }>> {
  return await db
    .select({
      id: bodyParts.id,
      name: bodyParts.name,
    })
    .from(workoutBodyParts)
    .innerJoin(bodyParts, eq(workoutBodyParts.bodyPartId, bodyParts.id))
    .where(eq(workoutBodyParts.workoutId, workoutId));
}

// ========== ExerciseBlock Queries ==========

/**
 * 根据用户 ID 和过滤条件获取训练动作块列表
 */
export async function findExerciseBlocks(
  userId: string,
  filters?: FindExerciseBlocksFilters
): Promise<ExerciseBlockWithDetails[]> {
  // 构建where条件
  const conditions = [eq(workoutSets.userId, userId)];
  
  if (filters?.workoutDate) {
    conditions.push(eq(workouts.date, filters.workoutDate));
  }

  if (filters?.exerciseName) {
    conditions.push(eq(exercises.name, filters.exerciseName));
  }

  if (filters?.bodyPartName) {
    conditions.push(eq(bodyParts.name, filters.bodyPartName));
  }

  const workoutSetsList = await db
    .select({
      id: workoutSets.id,
      workout: {
        id: workouts.id,
        date: workouts.date,
        startTime: workouts.startTime,
        endTime: workouts.endTime,
      },
      exercise: {
        id: exercises.id,
        name: exercises.name,
        description: exercises.description,
        body_part: {
          id: bodyParts.id,
          name: bodyParts.name,
        } as any,
      },
    })
    .from(workoutSets)
    .innerJoin(workouts, eq(workoutSets.workoutId, workouts.id))
    .innerJoin(exercises, eq(workoutSets.exerciseId, exercises.id))
    .innerJoin(bodyParts, eq(exercises.bodyPartId, bodyParts.id))
    .where(conditions.length > 1 ? and(...conditions) : conditions[0]!);

  // Get sets for each workout set
  const result = await Promise.all(
    workoutSetsList.map(async (ws) => {
      const setsList = await db
        .select()
        .from(sets)
        .where(eq(sets.workoutSetId, ws.id as number))
        .orderBy(sets.setNumber);

      return {
        id: ws.id as number,
        workout: ws.workout as ExerciseBlockWithDetails['workout'],
        exercise: ws.exercise as ExerciseBlockWithDetails['exercise'],
        sets: setsList,
      };
    })
  );

  return result;
}

/**
 * 根据 ID 查找训练动作块
 */
export async function findExerciseBlockById(
  id: number,
  userId: string
): Promise<ExerciseBlockWithDetails | null> {
  const [workoutSet] = await db
    .select()
    .from(workoutSets)
    .where(and(eq(workoutSets.id, id), eq(workoutSets.userId, userId)))
    .limit(1);

  if (!workoutSet) {
    return null;
  }

  // Get workout
  const [workout] = await db
    .select()
    .from(workouts)
    .where(eq(workouts.id, workoutSet.workoutId))
    .limit(1);

  // Get exercise
  const [exercise] = await db
    .select()
    .from(exercises)
    .where(eq(exercises.id, workoutSet.exerciseId))
    .limit(1);

  // Get body part
  const [bodyPart] = await db
    .select()
    .from(bodyParts)
    .where(eq(bodyParts.id, exercise.bodyPartId))
    .limit(1);

  // Get sets
  const setsList = await db
    .select()
    .from(sets)
    .where(eq(sets.workoutSetId, workoutSet.id as number))
    .orderBy(sets.setNumber);

  return {
    id: workoutSet.id,
    workout: {
      id: workout.id,
      date: workout.date,
      startTime: workout.startTime,
      endTime: workout.endTime,
    },
    exercise: {
      id: exercise.id,
      name: exercise.name,
      description: exercise.description,
      body_part: {
        id: bodyPart.id,
        name: bodyPart.name,
      },
    },
    sets: setsList,
  };
}

/**
 * 根据训练日期和动作名称查找训练动作块
 */
export async function findExerciseBlockByWorkoutAndExercise(
  userId: string,
  workoutId: number,
  exerciseId: number
): Promise<ExerciseBlock | null> {
  const [result] = await db
    .select()
    .from(workoutSets)
    .where(and(
      eq(workoutSets.userId, userId),
      eq(workoutSets.workoutId, workoutId),
      eq(workoutSets.exerciseId, exerciseId)
    ))
    .limit(1);

  return result || null;
}

// ========== Set Queries ==========

/**
 * 根据训练动作块 ID 获取所有组
 */
export async function findSetsByExerciseBlockId(
  exerciseBlockId: number
): Promise<Set[]> {
  return await db
    .select()
    .from(sets)
    .where(eq(sets.workoutSetId, exerciseBlockId))
    .orderBy(sets.setNumber);
}

/**
 * 根据训练日期和动作名称获取组
 */
export async function findSetsByWorkoutDateAndExerciseName(
  userId: string,
  workoutDate: string,
  exerciseName: string
): Promise<SetSummary[]> {
  // Get workout
  const [workout] = await db
    .select()
    .from(workouts)
    .where(and(
      eq(workouts.userId, userId),
      eq(workouts.date, workoutDate)
    ))
    .limit(1);

  if (!workout) {
    return [];
  }

  // Get exercise
  const [exercise] = await db
    .select()
    .from(exercises)
    .where(and(
      eq(exercises.userId, userId),
      eq(exercises.name, exerciseName)
    ))
    .limit(1);

  if (!exercise) {
    return [];
  }

  // Get exercise block
  const [exerciseBlock] = await db
    .select()
    .from(workoutSets)
    .where(and(
      eq(workoutSets.workoutId, workout.id),
      eq(workoutSets.exerciseId, exercise.id)
    ))
    .limit(1);

  if (!exerciseBlock) {
    return [];
  }

  // Get sets
  return await db
    .select({
      id: sets.id,
      reps: sets.reps,
      weight: sets.weight,
    })
    .from(sets)
    .where(eq(sets.workoutSetId, exerciseBlock.id))
    .orderBy(sets.setNumber);
}

/**
 * 根据 ID 查找组
 */
export async function findSetById(
  id: number,
  userId: string
): Promise<Set | null> {
  const [result] = await db
    .select()
    .from(sets)
    .innerJoin(workoutSets, eq(sets.workoutSetId, workoutSets.id))
    .where(and(
      eq(sets.id, id),
      eq(workoutSets.userId, userId)
    ))
    .limit(1);

  return result?.sets || null;
}

