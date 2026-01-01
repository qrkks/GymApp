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
  workout_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  exercise_name: z.string(),
  sets: z.array(setSchema),
});

// PUT /api/exercise-block/update - Update exercise block
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const data = exerciseBlockUpdateSchema.parse(body);

    const result = await workoutUseCase.updateExerciseBlock(
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

