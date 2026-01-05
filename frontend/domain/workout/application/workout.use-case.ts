/**
 * Workout Application Service (Use Cases)
 * 协调 Repository 和 Domain Service，处理完整用例
 * 包含 Workout、ExerciseBlock 和 Set 的所有用例
 */
import { Result, success, failure } from '@domain/shared/error-types';
import * as workoutQueries from '@domain/workout/repository/queries/workout.repository';
import * as workoutCommands from '@domain/workout/repository/commands/workout.repository';
import * as bodyPartQueries from '@domain/body-part/repository/queries/body-part.repository';
import * as exerciseQueries from '@domain/exercise/repository/queries/exercise.repository';
import { Workout as WorkoutEntity } from '@domain/workout/model/workout.entity';
import { ExerciseBlock as ExerciseBlockEntity } from '@domain/workout/model/exercise-block.entity';
import { Set as SetEntity } from '@domain/workout/model/set.entity';
import { db } from '@/lib/db';
import { exercises, bodyParts, workoutSets } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

export type Workout = workoutQueries.WorkoutWithBodyParts;
export type CreateWorkoutData = workoutCommands.CreateWorkoutData;

// ExerciseBlock types
export type ExerciseBlock = workoutQueries.ExerciseBlockWithDetails;
export type FindExerciseBlocksFilters = workoutQueries.FindExerciseBlocksFilters;
export type CreateSetData = workoutCommands.CreateSetData;

// Set types
export type Set = workoutQueries.SetSummary;
export type UpdateSetData = workoutCommands.UpdateSetData;

/**
 * 获取训练列表
 */
export async function getWorkoutList(
  userId: string
): Promise<Result<workoutQueries.Workout[]>> {
  try {
    const workouts = await workoutQueries.findWorkouts(userId);
    return success(workouts);
  } catch (error) {
    return failure(
      'INTERNAL_ERROR',
      'Failed to get workouts',
      error
    );
  }
}

/**
 * 根据日期获取训练（包含身体部位）
 */
export async function getWorkoutByDate(
  userId: string,
  date: string
): Promise<Result<Workout>> {
  try {
    const workout = await workoutQueries.findWorkoutByDateWithBodyParts(userId, date);
    if (!workout) {
      return failure(
        'WORKOUT_NOT_FOUND',
        'Workout not found'
      );
    }
    return success(workout);
  } catch (error) {
    return failure(
      'INTERNAL_ERROR',
      'Failed to get workout',
      error
    );
  }
}

/**
 * 创建训练
 */
export async function createWorkout(
  userId: string,
  data: CreateWorkoutData
): Promise<Result<workoutQueries.Workout & { created: boolean }>> {
  try {
    // 使用实体验证日期格式（会抛出异常如果无效）
    try {
      // 临时创建实体以验证日期格式
      WorkoutEntity.fromPersistence({
        id: 0, // 临时 ID
        userId,
        date: data.date,
        startTime: data.startTime || new Date(),
        endTime: null,
      });
    } catch (error: any) {
      if (error.message?.includes('date') || error.message?.includes('Date')) {
        return failure(
          'VALIDATION_ERROR',
          'Invalid workout date format'
        );
      }
      throw error;
    }

    // 业务规则：检查是否已存在同一天的训练
    const existing = await workoutQueries.findWorkoutByDate(userId, data.date);
    if (existing) {
      // 使用实体封装业务逻辑
      const existingEntity = WorkoutEntity.fromPersistence(existing);
      if (existingEntity.isSameDate(data.date)) {
        return failure(
          'WORKOUT_ALREADY_EXISTS',
          'Workout for this date already exists'
        );
      }
    }

    // 创建训练
    const workout = await workoutCommands.insertWorkout(userId, data);
    
    // 使用实体封装业务逻辑（可选，用于验证）
    const workoutEntity = WorkoutEntity.fromPersistence(workout);
    
    return success({ ...workout, created: true });
  } catch (error: any) {
    return failure(
      'INTERNAL_ERROR',
      'Failed to create workout',
      error
    );
  }
}

/**
 * 创建或获取训练（按日期）
 */
export async function createOrGetWorkout(
  userId: string,
  date: string
): Promise<Result<workoutQueries.Workout & { created: boolean }>> {
  try {
    // 尝试获取现有的训练
    const existing = await workoutQueries.findWorkoutByDate(userId, date);
    if (existing) {
      return success({ ...existing, created: false });
    }

    // 创建新训练
    const workout = await workoutCommands.insertWorkout(userId, {
      date,
      startTime: new Date(),
    });
    return success({ ...workout, created: true });
  } catch (error) {
    return failure(
      'INTERNAL_ERROR',
      'Failed to create or get workout',
      error
    );
  }
}

/**
 * 添加身体部位到训练
 */
export async function addBodyPartsToWorkout(
  userId: string,
  date: string,
  bodyPartNames: string[]
): Promise<Result<Workout>> {
  try {
    // 获取训练
    const workout = await workoutQueries.findWorkoutByDate(userId, date);
    if (!workout) {
      return failure(
        'WORKOUT_NOT_FOUND',
        'Workout not found'
      );
    }

    // 获取身体部位
    const bodyPartsList = [];
    for (const name of bodyPartNames) {
      const bodyPart = await bodyPartQueries.findBodyPartByName(userId, name);
      if (bodyPart) {
        bodyPartsList.push(bodyPart);
      }
    }

    if (bodyPartsList.length === 0) {
      return failure(
        'BODY_PART_NOT_FOUND',
        'No body parts found'
      );
    }

    // 添加身体部位到训练
    await workoutCommands.addBodyPartsToWorkout(
      workout.id,
      bodyPartsList.map(bp => bp.id)
    );

    // 获取更新后的训练（包含身体部位）
    const updatedWorkout = await workoutQueries.findWorkoutByDateWithBodyParts(userId, date);
    if (!updatedWorkout) {
      return failure(
        'WORKOUT_NOT_FOUND',
        'Workout not found'
      );
    }

    return success(updatedWorkout);
  } catch (error) {
    return failure(
      'INTERNAL_ERROR',
      'Failed to add body parts to workout',
      error
    );
  }
}

/**
 * 从训练中移除身体部位（同时删除相关的 exercise blocks）
 */
export async function removeBodyPartsFromWorkout(
  userId: string,
  date: string,
  bodyPartNames: string[]
): Promise<Result<Workout>> {
  try {
    // 获取训练
    const workout = await workoutQueries.findWorkoutByDate(userId, date);
    if (!workout) {
      return failure(
        'WORKOUT_NOT_FOUND',
        'Workout not found'
      );
    }

    // 获取要移除的身体部位
    const bodyPartsToRemove = [];
    for (const name of bodyPartNames) {
      const bodyPart = await bodyPartQueries.findBodyPartByName(userId, name);
      if (bodyPart) {
        bodyPartsToRemove.push(bodyPart);
      }
    }

    if (bodyPartsToRemove.length === 0) {
      return failure(
        'BODY_PART_NOT_FOUND',
        'No body parts found'
      );
    }

    const bodyPartIds = bodyPartsToRemove.map(bp => bp.id);

    // 获取这些身体部位的动作
    const exercisesToRemove = await db
      .select()
      .from(exercises)
      .where(and(
        eq(exercises.userId, userId),
        inArray(exercises.bodyPartId, bodyPartIds)
      ));

    const exerciseIds = exercisesToRemove.map(e => e.id);

    // 删除相关的 exercise blocks
    if (exerciseIds.length > 0) {
      const exerciseBlocks = await db
        .select()
        .from(workoutSets)
        .where(and(
          eq(workoutSets.workoutId, workout.id),
          inArray(workoutSets.exerciseId, exerciseIds)
        ));

      for (const exerciseBlock of exerciseBlocks) {
        await workoutCommands.deleteExerciseBlock(exerciseBlock.id, userId);
      }
    }

    // 从训练中移除身体部位
    await workoutCommands.removeBodyPartsFromWorkout(
      workout.id,
      bodyPartIds
    );

    // 获取更新后的训练（包含身体部位）
    const updatedWorkout = await workoutQueries.findWorkoutByDateWithBodyParts(userId, date);
    if (!updatedWorkout) {
      return failure(
        'WORKOUT_NOT_FOUND',
        'Workout not found'
      );
    }

    return success(updatedWorkout);
  } catch (error) {
    return failure(
      'INTERNAL_ERROR',
      'Failed to remove body parts from workout',
      error
    );
  }
}

/**
 * 删除训练
 */
export async function deleteWorkout(
  userId: string,
  date: string
): Promise<Result<void>> {
  try {
    // 业务规则：检查训练是否存在
    const existing = await workoutQueries.findWorkoutByDate(userId, date);
    if (!existing) {
      return failure(
        'WORKOUT_NOT_FOUND',
        'Workout not found'
      );
    }

    // 删除训练
    const deleted = await workoutCommands.deleteWorkoutByDate(userId, date);
    if (!deleted) {
      return failure(
        'WORKOUT_NOT_FOUND',
        'Workout not found'
      );
    }

    return success(undefined);
  } catch (error) {
    return failure(
      'INTERNAL_ERROR',
      'Failed to delete workout',
      error
    );
  }
}

/**
 * 删除用户的所有训练
 */
export async function deleteAllWorkouts(userId: string): Promise<Result<void>> {
  try {
    await workoutCommands.deleteAllWorkouts(userId);
    return success(undefined);
  } catch (error) {
    return failure(
      'INTERNAL_ERROR',
      'Failed to delete all workouts',
      error
    );
  }
}

// ========== ExerciseBlock Use Cases ==========

/**
 * 获取训练动作块列表
 */
export async function getExerciseBlockList(
  userId: string,
  filters?: FindExerciseBlocksFilters
): Promise<Result<ExerciseBlock[]>> {
  try {
    const exerciseBlocks = await workoutQueries.findExerciseBlocks(userId, filters);
    return success(exerciseBlocks);
  } catch (error) {
    return failure(
      'INTERNAL_ERROR',
      'Failed to get exercise blocks',
      error
    );
  }
}

/**
 * 创建训练动作块（如果不存在则创建，并可选添加组）
 */
export async function createExerciseBlock(
  userId: string,
  workoutDate: string,
  exerciseName: string,
  setsData?: CreateSetData[]
): Promise<Result<ExerciseBlock & { created: boolean }>> {
  try {
    // 获取 workout
    const workout = await workoutQueries.findWorkoutByDate(userId, workoutDate);
    if (!workout) {
      return failure(
        'WORKOUT_NOT_FOUND',
        'Workout not found'
      );
    }

    // 获取 exercise
    const exercise = await exerciseQueries.findExerciseByName(userId, exerciseName);
    if (!exercise) {
      return failure(
        'EXERCISE_NOT_FOUND',
        'Exercise not found'
      );
    }

    // 检查是否已存在
    let existingExerciseBlock = await workoutQueries.findExerciseBlockByWorkoutAndExercise(
      userId,
      workout.id,
      exercise.id
    );

    let created = false;
    if (!existingExerciseBlock) {
      // 创建新的 exercise block
      existingExerciseBlock = await workoutCommands.insertExerciseBlock(
        userId,
        workout.id,
        exercise.id
      );
      created = true;
    }

    // 添加组（如果提供）- 通过创建 Entity 自动验证
    let createdSets: Array<{ id: number; setNumber: number; weight: number; reps: number }> = [];
    if (setsData && setsData.length > 0) {
      // 创建 Entity 验证数据（Entity 会自动验证，如果无效会抛出异常）
      const validatedSets = setsData.map((setData, index) => {
        // 临时创建实体以验证数据（setNumber 会在 repository 中重新计算）
        return SetEntity.fromPersistence({
          id: 0, // 临时 ID
          userId,
          workoutSetId: existingExerciseBlock.id,
          setNumber: index + 1, // 临时值，repository 会重新计算
          weight: setData.weight,
          reps: setData.reps,
        });
      });

      // 从已验证的 Entity 获取数据传给 repository
      const validatedSetsData = validatedSets.map(entity => ({
        weight: entity.weight,
        reps: entity.reps,
      }));

      const newSets = await workoutCommands.addSetsToExerciseBlock(
        userId,
        existingExerciseBlock.id,
        validatedSetsData
      );
      createdSets = newSets.map(set => ({
        id: set.id,
        setNumber: set.setNumber,
        weight: set.weight,
        reps: set.reps,
      }));
    }

    // 获取 body part
    const [bodyPart] = await db
      .select()
      .from(bodyParts)
      .where(eq(bodyParts.id, exercise.bodyPartId))
      .limit(1);

    // 返回完整信息
    const result: ExerciseBlock & { created: boolean } = {
      id: existingExerciseBlock.id,
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
      sets: createdSets,
      created,
    };

    return success(result);
  } catch (error) {
    return failure(
      'INTERNAL_ERROR',
      'Failed to create exercise block',
      error
    );
  }
}

/**
 * 更新训练动作块的组
 */
export async function updateExerciseBlock(
  userId: string,
  workoutDate: string,
  exerciseName: string,
  setsData: CreateSetData[]
): Promise<Result<ExerciseBlock & { created: boolean }>> {
  try {
    // 获取 workout
    const workout = await workoutQueries.findWorkoutByDate(userId, workoutDate);
    if (!workout) {
      return failure(
        'WORKOUT_NOT_FOUND',
        'Workout not found'
      );
    }

    // 获取 exercise
    const exercise = await exerciseQueries.findExerciseByName(userId, exerciseName);
    if (!exercise) {
      return failure(
        'EXERCISE_NOT_FOUND',
        'Exercise not found'
      );
    }

    // 获取 exercise block
    const exerciseBlock = await workoutQueries.findExerciseBlockByWorkoutAndExercise(
      userId,
      workout.id,
      exercise.id
    );

    if (!exerciseBlock) {
      return failure(
        'EXERCISE_BLOCK_NOT_FOUND',
        'Exercise block not found'
      );
    }

    // 更新组
    const updatedSets = await workoutCommands.updateExerciseBlockSets(
      userId,
      exerciseBlock.id,
      setsData
    );

    // 获取 body part
    const [bodyPart] = await db
      .select()
      .from(bodyParts)
      .where(eq(bodyParts.id, exercise.bodyPartId))
      .limit(1);

    // 返回完整信息
    const result: ExerciseBlock & { created: boolean } = {
      id: exerciseBlock.id,
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
      sets: updatedSets.map(set => ({
        id: set.id,
        setNumber: set.setNumber,
        weight: set.weight,
        reps: set.reps,
      })),
      created: false,
    };

    return success(result);
  } catch (error) {
    return failure(
      'INTERNAL_ERROR',
      'Failed to update exercise block',
      error
    );
  }
}

/**
 * 删除训练动作块
 */
export async function deleteExerciseBlock(
  userId: string,
  workoutDate: string,
  exerciseName: string
): Promise<Result<void>> {
  try {
    // 获取 workout
    const workout = await workoutQueries.findWorkoutByDate(userId, workoutDate);
    if (!workout) {
      return failure(
        'WORKOUT_NOT_FOUND',
        'Workout not found'
      );
    }

    // 获取 exercise
    const exercise = await exerciseQueries.findExerciseByName(userId, exerciseName);
    if (!exercise) {
      return failure(
        'EXERCISE_NOT_FOUND',
        'Exercise not found'
      );
    }

    // 删除 exercise block
    const deleted = await workoutCommands.deleteExerciseBlockByWorkoutAndExercise(
      userId,
      workout.id,
      exercise.id
    );

    if (!deleted) {
      return failure(
        'EXERCISE_BLOCK_NOT_FOUND',
        'Exercise block not found'
      );
    }

    return success(undefined);
  } catch (error) {
    return failure(
      'INTERNAL_ERROR',
      'Failed to delete exercise block',
      error
    );
  }
}

/**
 * 删除用户的所有训练动作块
 */
export async function deleteAllExerciseBlocks(userId: string): Promise<Result<void>> {
  try {
    await workoutCommands.deleteAllExerciseBlocks(userId);
    return success(undefined);
  } catch (error) {
    return failure(
      'INTERNAL_ERROR',
      'Failed to delete all exercise blocks',
      error
    );
  }
}

// ========== Set Use Cases ==========

/**
 * 根据训练日期和动作名称获取组
 */
export async function getSetsByWorkoutDateAndExerciseName(
  userId: string,
  workoutDate: string,
  exerciseName: string
): Promise<Result<Set[]>> {
  try {
    // 验证训练是否存在
    const workout = await workoutQueries.findWorkoutByDate(userId, workoutDate);
    if (!workout) {
      return failure(
        'WORKOUT_NOT_FOUND',
        'Workout not found'
      );
    }

    // 验证动作是否存在
    const exercise = await exerciseQueries.findExerciseByName(userId, exerciseName);
    if (!exercise) {
      return failure(
        'EXERCISE_NOT_FOUND',
        'Exercise not found'
      );
    }

    // 获取组
    const sets = await workoutQueries.findSetsByWorkoutDateAndExerciseName(
      userId,
      workoutDate,
      exerciseName
    );

    return success(sets);
  } catch (error) {
    return failure(
      'INTERNAL_ERROR',
      'Failed to get sets',
      error
    );
  }
}

/**
 * 更新组
 */
export async function updateSet(
  id: number,
  userId: string,
  data: UpdateSetData
): Promise<Result<workoutQueries.Set & { set_number: number }>> {
  try {
    // 业务规则：检查组是否存在且属于用户
    const existingData = await workoutQueries.findSetById(id, userId);
    if (!existingData) {
      return failure(
        'SET_NOT_FOUND',
        'Set not found'
      );
    }

    // 使用实体封装业务逻辑
    const existing = SetEntity.fromPersistence(existingData);
    
    // 使用 Entity 的 update 方法创建新 Entity（自动验证）
    // 如果验证失败，Entity 会抛出异常，外层 catch 会捕获
    const updatedEntity = existing.update(
      data.weight ?? existing.weight,
      data.reps ?? existing.reps
    );

    // 从已验证的 Entity 获取数据传给 repository
    const updateData = {
      weight: updatedEntity.weight,
      reps: updatedEntity.reps,
    };

    // 更新组
    const updatedData = await workoutCommands.updateSet(id, updateData);
    if (!updatedData) {
      return failure(
        'SET_NOT_FOUND',
        'Set not found'
      );
    }

    // 使用实体封装返回数据
    const updated = SetEntity.fromPersistence(updatedData);

    return success({
      ...updatedData,
      set_number: updated.setNumber,
    });
  } catch (error: any) {
    return failure(
      'INTERNAL_ERROR',
      'Failed to update set',
      error
    );
  }
}

/**
 * 删除组并重新排序
 */
export async function deleteSet(
  id: number,
  userId: string
): Promise<Result<{ success: boolean; message: string }>> {
  try {
    // 业务规则：检查组是否存在且属于用户
    const existingData = await workoutQueries.findSetById(id, userId);
    if (!existingData) {
      return failure(
        'SET_NOT_FOUND',
        'Set not found'
      );
    }

    // 使用实体封装业务逻辑
    const existing = SetEntity.fromPersistence(existingData);

    // 获取训练动作块 ID
    const exerciseBlockId = await workoutCommands.getExerciseBlockIdBySetId(id, userId);
    if (!exerciseBlockId) {
      return failure(
        'SET_NOT_FOUND',
        'Set not found'
      );
    }

    // 删除组
    const deleted = await workoutCommands.deleteSet(id);
    if (!deleted) {
      return failure(
        'SET_NOT_FOUND',
        'Set not found'
      );
    }

    // 重新排序剩余的组
    await workoutCommands.reorderSets(exerciseBlockId);

    return success({
      success: true,
      message: 'Set deleted and numbers reordered',
    });
  } catch (error) {
    return failure(
      'INTERNAL_ERROR',
      'Failed to delete set',
      error
    );
  }
}

