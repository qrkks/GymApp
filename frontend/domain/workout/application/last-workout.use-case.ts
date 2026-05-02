import { failure, Result, success } from '@domain/shared/error-types';
import * as lastWorkoutQueries from '@domain/workout/repository/queries/last-workout.repository';

export interface LastWorkoutExerciseFilter {
  exerciseId?: number;
  exerciseName?: string;
}

export interface LastWorkoutSetsResult {
  date: string;
  sets: Array<{
    setNumber: number;
    weight: number;
    reps: number;
    note: string | null;
  }>;
}

export interface LastWorkoutFirstSetResult {
  date: string;
  weight: number;
  reps: number;
  note: string | null;
}

export async function getLastWorkoutSets(
  userId: string,
  exerciseFilter: LastWorkoutExerciseFilter
): Promise<Result<LastWorkoutSetsResult>> {
  try {
    const today = new Date().toISOString().split('T')[0]!;
    const header = await lastWorkoutQueries.findLastWorkoutSetHeader(userId, exerciseFilter, today);

    if (!header) {
      return failure(
        'NOT_FOUND',
        'No previous workout found for this exercise'
      );
    }

    const sets = await lastWorkoutQueries.findSetsByWorkoutSetId(header.workoutSetId);
    if (sets.length === 0) {
      return failure(
        'NOT_FOUND',
        'No sets found for this exercise'
      );
    }

    return success({
      date: header.workoutDate,
      sets,
    });
  } catch (error) {
    return failure(
      'INTERNAL_ERROR',
      'Failed to get last workout sets',
      error
    );
  }
}

export async function getLastWorkoutFirstSet(
  userId: string,
  exerciseFilter: LastWorkoutExerciseFilter
): Promise<Result<LastWorkoutFirstSetResult>> {
  const result = await getLastWorkoutSets(userId, exerciseFilter);
  if (!result.success) {
    return result;
  }

  const firstSet = result.data.sets[0];
  if (!firstSet) {
    return failure(
      'NOT_FOUND',
      'No sets found for this exercise'
    );
  }

  return success({
    date: result.data.date,
    weight: firstSet.weight,
    reps: firstSet.reps,
    note: firstSet.note,
  });
}
