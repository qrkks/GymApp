// 强制动态渲染，因为使用了认证和headers
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import * as workoutUseCase from '@domain/workout/application/workout.use-case';
import { toHttpResponse } from '@domain/shared/error-types';
import { z } from 'zod';

const setSchema = z.object({
  weight: z.number(),
  reps: z.number(),
});

const exerciseBlockCreateSchema = z.object({
  workout_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  exercise_name: z.string(),
  sets: z.array(setSchema).optional(),
});

// GET /api/exercise-block - Get exercise blocks (with optional filters)
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const workoutDate = searchParams.get('workout_date');
    const exerciseName = searchParams.get('exercise_name');
    const bodyPartName = searchParams.get('body_part_name');

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
    const data = exerciseBlockCreateSchema.parse(body);

    const result = await workoutUseCase.createExerciseBlock(
      user.id,
      data.workout_date,
      data.exercise_name,
      data.sets
    );

    const response = toHttpResponse(result);
    return NextResponse.json(response.body, { status: response.status });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
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

