// 强制动态渲染，因为使用了认证和headers
export const dynamic = 'force-dynamic';

/**
 * Set API Routes
 * 仅处理 HTTP 请求/响应，调用 Application Service
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import {
  getSetsByWorkoutDateAndExerciseName,
} from '@domain/workout/application/workout.use-case';
import { toHttpResponse } from '@domain/shared/error-types';

/**
 * GET /api/set - Get sets by workout date and exercise name
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const workoutDate = searchParams.get('workout_date');
    const exerciseName = searchParams.get('exercise_name');

    if (!workoutDate || !exerciseName) {
      return NextResponse.json(
        { error: 'workout_date and exercise_name are required' },
        { status: 400 }
      );
    }

    const result = await getSetsByWorkoutDateAndExerciseName(
      user.id,
      workoutDate,
      exerciseName
    );
    const response = toHttpResponse(result);

    return NextResponse.json(response.body, { status: response.status });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
