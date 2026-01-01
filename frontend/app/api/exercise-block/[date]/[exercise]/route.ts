import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import * as workoutUseCase from '@domain/workout/application/workout.use-case';
import { toHttpResponse } from '@domain/shared/error-types';
import { z } from 'zod';

const setSchema = z.object({
  weight: z.number(),
  reps: z.number(),
});

const exerciseBlockUpdateSchema = z.object({
  sets: z.array(setSchema),
});

/**
 * PUT /api/exercise-block/[date]/[exercise] - Update exercise block
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { date: string; exercise: string } }
) {
  try {
    const user = await requireAuth();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const date = decodeURIComponent(params.date);
    const exerciseName = decodeURIComponent(params.exercise);
    const body = await request.json();
    const data = exerciseBlockUpdateSchema.parse(body);

    const result = await workoutUseCase.updateExerciseBlock(
      user.id,
      date,
      exerciseName,
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

/**
 * DELETE /api/exercise-block/[date]/[exercise] - Delete exercise block by date and exercise name
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { date: string; exercise: string } }
) {
  try {
    const user = await requireAuth();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const date = decodeURIComponent(params.date);
    const exerciseName = decodeURIComponent(params.exercise);

    const result = await workoutUseCase.deleteExerciseBlock(
      user.id,
      date,
      exerciseName
    );

    const response = toHttpResponse(result);
    if (response.status === 204) {
      return NextResponse.json(null, { status: 204 });
    }
    return NextResponse.json(response.body, { status: response.status });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
