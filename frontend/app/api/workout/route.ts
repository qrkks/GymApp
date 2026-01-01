/**
 * Workout API Routes
 * 仅处理 HTTP 请求/响应，调用 Application Service
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { z } from 'zod';
import {
  getWorkoutList,
  createWorkout,
  createOrGetWorkout,
  deleteAllWorkouts,
} from '@domain/workout/application/workout.use-case';
import { toHttpResponse } from '@domain/shared/error-types';

const workoutSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

/**
 * GET /api/workout - Get all workouts for current user
 */
export async function GET() {
  try {
    const user = await requireAuth();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await getWorkoutList(user.id);
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

/**
 * POST /api/workout - Create a new workout or get existing one
 * Supports both create and createOrGet via query parameter
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = workoutSchema.parse(body);
    
    // Check if createOrGet is requested via query parameter
    const searchParams = request.nextUrl.searchParams;
    const createOrGet = searchParams.get('createOrGet') === 'true';

    let result;
    if (createOrGet) {
      // Use createOrGetWorkout (returns existing if exists, creates if not)
      result = await createOrGetWorkout(user.id, data.date);
    } else {
      // Use createWorkout (fails if already exists)
      result = await createWorkout(user.id, {
        date: data.date,
        startTime: new Date(),
      });
    }
    
    const response = toHttpResponse(result);
    return NextResponse.json(response.body, { status: response.status });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
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
 * DELETE /api/workout - Delete all workouts for current user
 */
export async function DELETE() {
  try {
    const user = await requireAuth();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await deleteAllWorkouts(user.id);
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
