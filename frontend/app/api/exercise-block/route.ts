// 强制动态渲染，因为使用了认证和headers
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import * as workoutUseCase from '@domain/workout/application/workout.use-case';
import { toHttpResponse } from '@domain/shared/error-types';
import { z } from 'zod';

// Preprocess to convert string to number before validation
const positiveNumber = z.preprocess(
  (val) => (typeof val === 'string' && val.trim() !== '' ? Number(val) : val),
  z.number().positive('Value must be a positive number')
);

// >= 0 的非负数（允许 0）
const nonNegativeNumber = z.preprocess(
  (val) => (typeof val === 'string' && val.trim() !== '' ? Number(val) : val),
  z.number().nonnegative('Value must be a non-negative number')
);

const setSchema = z.object({
  weight: nonNegativeNumber,
  reps: positiveNumber,
});

const exerciseBlockCreateSchema = z.object({
  workoutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  exerciseName: z.string(),
  sets: z.array(setSchema).optional(),
});

// GET /api/exercise-block - Get exercise blocks (with optional filters)
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const workoutDate = searchParams.get('workoutDate') || searchParams.get('workout_date');
    const exerciseName = searchParams.get('exerciseName') || searchParams.get('exercise_name');
    const bodyPartName = searchParams.get('bodyPartName') || searchParams.get('body_part_name');

    const filters: workoutUseCase.FindExerciseBlocksFilters = {};
    if (workoutDate) filters.workoutDate = workoutDate;
    if (exerciseName) filters.exerciseName = exerciseName;
    if (bodyPartName) filters.bodyPartName = bodyPartName;

    const result = await workoutUseCase.getExerciseBlockList(user.id, filters);
    const response = toHttpResponse(result);
    return NextResponse.json(response.body, { status: response.status });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/exercise-block - Create a new exercise block
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    console.log('📥 /api/exercise-block POST raw body:', body);
    
    // Support both camelCase and snake_case for backward compatibility
    const normalizedBody = {
      workoutDate: body.workoutDate || body.workout_date,
      exerciseName: body.exerciseName || body.exercise_name,
      sets: body.sets,
    };

    console.log('📥 /api/exercise-block POST normalized body:', normalizedBody);

    const data = exerciseBlockCreateSchema.parse(normalizedBody);
    console.log('✅ /api/exercise-block POST validated body:', data);

    const result = await workoutUseCase.createExerciseBlock(
      user.id,
      data.workoutDate,
      data.exerciseName,
      data.sets
    );

    const response = toHttpResponse(result);
    return NextResponse.json(response.body, { status: response.status });
  } catch (error: any) {
    console.error('=== 后端错误 ===');
    console.error('错误类型:', error.constructor.name);
    console.error('错误对象:', error);
    
    if (error instanceof z.ZodError) {
      console.error('Zod 验证错误详情:');
      error.errors.forEach((err, index) => {
        console.error(`  错误 ${index + 1}:`, {
          path: err.path,
          message: err.message,
          code: err.code,
        });
      });
      
      // 将 Zod 错误数组转换为可读的错误消息
      const errorMessages = error.errors.map((err) => {
        const path = err.path.join('.');
        return `${path}: ${err.message}`;
      });
      const errorResponse = { 
        error: errorMessages.join('; ') || '数据验证失败' 
      };
      console.error('返回的错误响应:', errorResponse);
      return NextResponse.json(errorResponse, { status: 400 });
    }
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('其他错误:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/exercise-block - Delete all exercise blocks for current user
export async function DELETE() {
  try {
    const user = await requireAuth();
    const result = await workoutUseCase.deleteAllExerciseBlocks(user.id);
    const response = toHttpResponse(result);
    return NextResponse.json(response.body, { status: response.status });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

