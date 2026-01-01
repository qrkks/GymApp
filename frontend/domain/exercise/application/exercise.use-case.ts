/**
 * Exercise Application Service (Use Cases)
 * 协调 Repository 和 Domain Service，处理完整用例
 */
import { Result, success, failure } from '@domain/shared/error-types';
import * as exerciseQueries from '@domain/exercise/repository/queries/exercise.repository';
import * as exerciseCommands from '@domain/exercise/repository/commands/exercise.repository';
import * as bodyPartQueries from '@domain/body-part/repository/queries/body-part.repository';
import { Exercise as ExerciseEntity } from '@domain/exercise/model/exercise.entity';
import { ExerciseName } from '@domain/exercise/model/exercise-name.value-object';
import { db } from '@/lib/db';
import { bodyParts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export type Exercise = exerciseQueries.ExerciseWithBodyPart;
export type CreateExerciseData = exerciseCommands.CreateExerciseData;

/**
 * 获取动作列表
 */
export async function getExerciseList(
  userId: string,
  bodyPartName?: string
): Promise<Result<Exercise[]>> {
  try {
    // 如果指定了 body_part_name，先验证身体部位是否存在
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

/**
 * 根据身体部位名称获取动作列表
 */
export async function getExercisesByBodyPartName(
  userId: string,
  bodyPartName: string
): Promise<Result<Exercise[]>> {
  try {
    // 验证身体部位是否存在
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

/**
 * 创建动作（如果已存在则返回现有的）
 */
export async function createExercise(
  userId: string,
  data: CreateExerciseData
): Promise<Result<Exercise>> {
  try {
    // 使用值对象进行验证
    let exerciseName: ExerciseName;
    try {
      exerciseName = ExerciseName.create(data.name);
    } catch (error: any) {
      return failure(
        'VALIDATION_ERROR',
        'Exercise name cannot be empty'
      );
    }

    // 业务规则：检查身体部位是否存在
    const bodyPart = await bodyPartQueries.findBodyPartById(data.bodyPartId, userId);
    if (!bodyPart) {
      return failure(
        'BODY_PART_NOT_FOUND',
        'Body part not found'
      );
    }

    // 业务规则：如果动作已存在，返回现有的
    const existing = await exerciseQueries.findExerciseByName(userId, exerciseName.getValue());
    if (existing) {
      // 使用实体封装业务逻辑
      const existingEntity = ExerciseEntity.fromPersistence(existing);
      
      // 获取身体部位信息
      const [bodyPartData] = await db
        .select()
        .from(bodyParts)
        .where(eq(bodyParts.id, existingEntity.bodyPartId))
        .limit(1);

      return success({
        id: existingEntity.id,
        name: existingEntity.getName(),
        description: existingEntity.description,
        body_part: {
          id: bodyPartData.id,
          name: bodyPartData.name,
        },
      });
    }

    // 创建动作
    const exerciseData = await exerciseCommands.insertExercise(userId, {
      ...data,
      name: exerciseName.getValue(),
    });

    // 使用实体封装业务逻辑
    const exercise = ExerciseEntity.fromPersistence(exerciseData);

    // 获取身体部位信息
    const [bodyPartData] = await db
      .select()
      .from(bodyParts)
      .where(eq(bodyParts.id, exercise.bodyPartId))
      .limit(1);

    return success({
      id: exercise.id,
      name: exercise.getName(),
      description: exercise.description,
      body_part: {
        id: bodyPartData.id,
        name: bodyPartData.name,
      },
    });
  } catch (error: any) {
    // 捕获值对象验证异常
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

/**
 * 更新动作名称
 */
export async function updateExerciseName(
  id: number,
  userId: string,
  name: string
): Promise<Result<Exercise>> {
  try {
    // 使用值对象进行验证
    let exerciseName: ExerciseName;
    try {
      exerciseName = ExerciseName.create(name);
    } catch (error: any) {
      return failure(
        'VALIDATION_ERROR',
        'Exercise name cannot be empty'
      );
    }

    // 业务规则：检查动作是否存在
    const existingData = await exerciseQueries.findExerciseById(id, userId);
    if (!existingData) {
      return failure(
        'EXERCISE_NOT_FOUND',
        'Exercise not found'
      );
    }

    // 使用实体封装业务逻辑
    const existing = ExerciseEntity.fromPersistence(existingData);

    // 更新动作名称
    const updatedData = await exerciseCommands.updateExerciseName(id, userId, exerciseName.getValue());
    if (!updatedData) {
      return failure(
        'EXERCISE_NOT_FOUND',
        'Exercise not found'
      );
    }

    // 使用实体封装业务逻辑
    const updated = ExerciseEntity.fromPersistence(updatedData);

    // 获取身体部位信息
    const [bodyPartData] = await db
      .select()
      .from(bodyParts)
      .where(eq(bodyParts.id, updated.bodyPartId))
      .limit(1);

    return success({
      id: updated.id,
      name: updated.getName(),
      description: updated.description,
      body_part: {
        id: bodyPartData.id,
        name: bodyPartData.name,
      },
    });
  } catch (error: any) {
    // 捕获值对象验证异常
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

/**
 * 删除动作
 */
export async function deleteExercise(
  id: number,
  userId: string
): Promise<Result<void>> {
  try {
    // 业务规则：检查动作是否存在
    const existingData = await exerciseQueries.findExerciseById(id, userId);
    if (!existingData) {
      return failure(
        'EXERCISE_NOT_FOUND',
        'Exercise not found'
      );
    }

    // 使用实体封装业务逻辑（可选，用于验证）
    const existing = ExerciseEntity.fromPersistence(existingData);

    // 删除动作
    const deleted = await exerciseCommands.deleteExercise(id, userId);
    if (!deleted) {
      return failure(
        'EXERCISE_NOT_FOUND',
        'Exercise not found'
      );
    }

    return success(undefined);
  } catch (error) {
    return failure(
      'INTERNAL_ERROR',
      'Failed to delete exercise',
      error
    );
  }
}

/**
 * 删除用户的所有动作
 */
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
