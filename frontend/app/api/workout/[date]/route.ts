/**
 * Workout API Routes - By Date
 * 仅处理 HTTP 请求/响应，调用 Application Service
 */
import { NextRequest, NextResponse } from 'next/server';

// 强制动态渲染，因为使用了认证和headers
export const dynamic = 'force-dynamic';
import { requireAuth } from '@/lib/auth-helpers';
import {
  getWorkoutByDate,
  deleteWorkout,
} from '@domain/workout/application/workout.use-case';
import { toHttpResponse } from '@domain/shared/error-types';

// Helper function to transform body_parts to bodyParts
function transformWorkout(workout: any): any {
  if (!workout) return workout;
  if (workout.body_parts && Array.isArray(workout.body_parts)) {
    return {
      ...workout,
      bodyParts: workout.body_parts,
      body_parts: undefined, // Remove the snake_case version
    };
  }
  return workout;
}

/**
 * GET /api/workout/[date] - Get workout by date
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { date: string } }
) {
  try {
    const user = await requireAuth();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const date = params.date;
    const result = await getWorkoutByDate(user.id, date);
    const response = toHttpResponse(result);

    // Transform body_parts to bodyParts
    const transformedBody = response.body ? transformWorkout(response.body) : response.body;
    return NextResponse.json(transformedBody, { status: response.status });
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

/**
 * DELETE /api/workout/[date] - Delete workout by date
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { date: string } }
) {
  try {
    const user = await requireAuth();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const date = params.date;
    const result = await deleteWorkout(user.id, date);
    const response = toHttpResponse(result);

    if (response.status === 204) {
      return NextResponse.json({ message: 'ok' }, { status: 200 });
    }
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
