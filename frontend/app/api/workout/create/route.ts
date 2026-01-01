/**
 * Workout API Routes - Create or Get
 * 仅处理 HTTP 请求/响应，调用 Application Service
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { z } from 'zod';
import {
  createOrGetWorkout,
} from '@domain/workout/application/workout.use-case';
import { toHttpResponse } from '@domain/shared/error-types';

const workoutCreateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

/**
 * POST /api/workout/create - Create or get workout by date
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = workoutCreateSchema.parse(body);

    const result = await createOrGetWorkout(user.id, data.date);
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
