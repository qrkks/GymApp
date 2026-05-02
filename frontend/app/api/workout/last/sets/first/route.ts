export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { toHttpResponse } from '@domain/shared/error-types';
import { getLastWorkoutFirstSet } from '@domain/workout/application/last-workout.use-case';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const exerciseId = searchParams.get('exercise_id');
    const exerciseName = searchParams.get('exercise_name');

    if (!exerciseId && !exerciseName) {
      return NextResponse.json(
        { error: 'exercise_id or exercise_name is required' },
        { status: 400 }
      );
    }

    const result = await getLastWorkoutFirstSet(user.id, {
      exerciseId: exerciseId ? parseInt(exerciseId, 10) : undefined,
      exerciseName: exerciseName || undefined,
    });

    const response = toHttpResponse(result);
    const body = result.success
      ? {
          weight: result.data.weight,
          reps: result.data.reps,
          date: result.data.date,
          note: result.data.note,
        }
      : response.body;

    return NextResponse.json(body, { status: response.status });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
