import { db } from '@/lib/db';
import { workoutSets, workouts, sets, exercises } from '@/lib/db/schema';
import { eq, and, ne, desc } from 'drizzle-orm';

export interface LastWorkoutExerciseFilter {
  exerciseId?: number;
  exerciseName?: string;
}

export interface LastWorkoutSetHeader {
  workoutSetId: number;
  workoutDate: string;
}

export interface LastWorkoutSetRow {
  setNumber: number;
  weight: number;
  reps: number;
  note: string | null;
}

export async function findLastWorkoutSetHeader(
  userId: string,
  exerciseFilter: LastWorkoutExerciseFilter,
  today: string
): Promise<LastWorkoutSetHeader | null> {
  const conditions = [
    eq(workoutSets.userId, userId),
    ne(workouts.date, today),
  ];

  if (exerciseFilter.exerciseId !== undefined) {
    conditions.push(eq(exercises.id, exerciseFilter.exerciseId));
  } else if (exerciseFilter.exerciseName) {
    conditions.push(eq(exercises.name, exerciseFilter.exerciseName));
  }

  const [result] = await db
    .select({
      workoutSetId: workoutSets.id,
      workoutDate: workouts.date,
    })
    .from(workoutSets)
    .innerJoin(workouts, eq(workoutSets.workoutId, workouts.id))
    .innerJoin(exercises, eq(workoutSets.exerciseId, exercises.id))
    .where(and(...conditions))
    .orderBy(desc(workouts.date))
    .limit(1);

  return result || null;
}

export async function findSetsByWorkoutSetId(
  workoutSetId: number
): Promise<LastWorkoutSetRow[]> {
  return db
    .select({
      setNumber: sets.setNumber,
      weight: sets.weight,
      reps: sets.reps,
      note: sets.note,
    })
    .from(sets)
    .where(eq(sets.workoutSetId, workoutSetId))
    .orderBy(sets.setNumber);
}
