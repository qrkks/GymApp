import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import * as workoutUseCase from '@domain/workout/application/workout.use-case';
import { toHttpResponse } from '@domain/shared/error-types';

// DELETE /api/exercise-block/[date]/[exercise] - Delete exercise block by date and exercise name
export async function DELETE(
  request: NextRequest,
  { params }: { params: { date: string; exercise: string } }
) {
  try {
    const user = await requireAuth();
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

