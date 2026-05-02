/**
 * Exercise Application Service (Use Cases)
 */
import { Result, success, failure } from '@domain/shared/error-types';
import * as exerciseQueries from '@domain/exercise/repository/queries/exercise.repository';
import * as exerciseCommands from '@domain/exercise/repository/commands/exercise.repository';
import * as bodyPartQueries from '@domain/body-part/repository/queries/body-part.repository';
import { Exercise as ExerciseEntity } from '@domain/exercise/model/exercise.entity';
import { ExerciseName } from '@domain/exercise/model/exercise-name.value-object';

export type Exercise = exerciseQueries.ExerciseWithBodyPart;
export type CreateExerciseData = exerciseCommands.CreateExerciseData;

export async function getExerciseList(
  userId: string,
  bodyPartName?: string
): Promise<Result<Exercise[]>> {
  try {
    if (bodyPartName) {
      const bodyPart = await bodyPartQueries.findBodyPartByName(userId, bodyPartName);
      if (!bodyPart) {
        return failure(
          'BODY_PART_NOT_FOUND',
          'Body part not found'
        );
      }
    }

    const exercises = await exerciseQueries.findExercises(userId, bodyPartName);
    return success(exercises);
  } catch (error) {
    return failure(
      'INTERNAL_ERROR',
      'Failed to get exercises',
      error
    );
  }
}

export async function getExercisesByBodyPartName(
  userId: string,
  bodyPartName: string
): Promise<Result<Exercise[]>> {
  try {
    const bodyPart = await bodyPartQueries.findBodyPartByName(userId, bodyPartName);
    if (!bodyPart) {
      return failure(
        'BODY_PART_NOT_FOUND',
        'Body part not found'
      );
    }

    const exercises = await exerciseQueries.findExercisesByBodyPartName(userId, bodyPartName);

    if (exercises.length === 0) {
      return failure(
        'NOT_FOUND',
        'No exercises found for this body part'
      );
    }

    return success(exercises);
  } catch (error) {
    return failure(
      'INTERNAL_ERROR',
      'Failed to get exercises by body part',
      error
    );
  }
}

export async function createExercise(
  userId: string,
  data: CreateExerciseData
): Promise<Result<Exercise>> {
  try {
    let exerciseName: ExerciseName;
    try {
      exerciseName = ExerciseName.create(data.name);
    } catch {
      return failure(
        'VALIDATION_ERROR',
        'Exercise name cannot be empty'
      );
    }

    const bodyPart = await bodyPartQueries.findBodyPartById(data.bodyPartId, userId);
    if (!bodyPart) {
      return failure(
        'BODY_PART_NOT_FOUND',
        'Body part not found'
      );
    }

    const existing = await exerciseQueries.findExerciseWithBodyPartByName(
      userId,
      exerciseName.getValue()
    );
    if (existing) {
      return success(existing);
    }

    const exerciseData = await exerciseCommands.insertExercise(userId, {
      ...data,
      name: exerciseName.getValue(),
    });

    ExerciseEntity.fromPersistence(exerciseData);

    const createdExercise = await exerciseQueries.findExerciseWithBodyPartById(userId, exerciseData.id);
    if (!createdExercise) {
      return failure(
        'EXERCISE_NOT_FOUND',
        'Exercise not found'
      );
    }

    return success(createdExercise);
  } catch (error: any) {
    if (error.message?.includes('name') || error.message?.includes('Name')) {
      return failure(
        'VALIDATION_ERROR',
        'Exercise name cannot be empty'
      );
    }

    return failure(
      'INTERNAL_ERROR',
      'Failed to create exercise',
      error
    );
  }
}

export async function updateExerciseName(
  id: number,
  userId: string,
  name: string
): Promise<Result<Exercise>> {
  try {
    let exerciseName: ExerciseName;
    try {
      exerciseName = ExerciseName.create(name);
    } catch {
      return failure(
        'VALIDATION_ERROR',
        'Exercise name cannot be empty'
      );
    }

    const existingData = await exerciseQueries.findExerciseById(id, userId);
    if (!existingData) {
      return failure(
        'EXERCISE_NOT_FOUND',
        'Exercise not found'
      );
    }

    ExerciseEntity.fromPersistence(existingData);

    const updatedData = await exerciseCommands.updateExerciseName(id, userId, exerciseName.getValue());
    if (!updatedData) {
      return failure(
        'EXERCISE_NOT_FOUND',
        'Exercise not found'
      );
    }

    ExerciseEntity.fromPersistence(updatedData);

    const updatedExercise = await exerciseQueries.findExerciseWithBodyPartById(userId, updatedData.id);
    if (!updatedExercise) {
      return failure(
        'EXERCISE_NOT_FOUND',
        'Exercise not found'
      );
    }

    return success(updatedExercise);
  } catch (error: any) {
    if (error.message?.includes('name') || error.message?.includes('Name')) {
      return failure(
        'VALIDATION_ERROR',
        'Exercise name cannot be empty'
      );
    }

    return failure(
      'INTERNAL_ERROR',
      'Failed to update exercise',
      error
    );
  }
}

export async function deleteExercise(
  id: number,
  userId: string
): Promise<Result<void>> {
  try {
    const existingData = await exerciseQueries.findExerciseById(id, userId);
    if (!existingData) {
      return failure(
        'EXERCISE_NOT_FOUND',
        'Exercise not found'
      );
    }

    ExerciseEntity.fromPersistence(existingData);

    const deleted = await exerciseCommands.deleteExercise(id, userId);
    if (!deleted) {
      return failure(
        'EXERCISE_NOT_FOUND',
        'Exercise not found'
      );
    }

    return success(undefined);
  } catch (error: any) {
    console.error('Delete exercise use case error:', {
      id,
      userId,
      error: error.message,
      code: error.code,
      detail: error.detail,
      constraint: error.constraint,
      stack: error.stack,
    });

    if (error.code === '23503' || error.constraint) {
      return failure(
        'INTERNAL_ERROR',
        'Cannot delete exercise: it is still being used in workouts',
        {
          code: error.code,
          constraint: error.constraint,
          detail: error.detail,
        }
      );
    }

    return failure(
      'INTERNAL_ERROR',
      'Failed to delete exercise',
      {
        message: error.message,
        code: error.code,
        detail: error.detail,
      }
    );
  }
}

export async function deleteAllExercises(userId: string): Promise<Result<void>> {
  try {
    await exerciseCommands.deleteAllExercises(userId);
    return success(undefined);
  } catch (error) {
    return failure(
      'INTERNAL_ERROR',
      'Failed to delete all exercises',
      error
    );
  }
}
