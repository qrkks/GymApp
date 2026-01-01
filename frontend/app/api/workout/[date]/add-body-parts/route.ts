/**
 * Workout API Routes - Add Body Parts
 * 仅处理 HTTP 请求/响应，调用 Application Service
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { z } from 'zod';
import {
  addBodyPartsToWorkout,
} from '@domain/workout/application/workout.use-case';
import { toHttpResponse } from '@domain/shared/error-types';

const changeBodyPartSchema = z.object({
  body_part_names: z.array(z.string()),
});

/**
 * PUT /api/workout/[date]/add-body-parts - Add body parts to workout
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { date: string } }
) {
  try {
    const user = await requireAuth();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const date = params.date;
    const body = await request.json();
    const data = changeBodyPartSchema.parse(body);

    const result = await addBodyPartsToWorkout(user.id, date, data.body_part_names);
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
