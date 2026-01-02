/**
 * Workout API Routes - Body Parts Management
 * 仅处理 HTTP 请求/响应，调用 Application Service
 */
import { NextRequest, NextResponse } from 'next/server';

// 强制动态渲染，因为使用了认证和headers
export const dynamic = 'force-dynamic';
import { requireAuth } from '@/lib/auth-helpers';
import { z } from 'zod';
import {
  addBodyPartsToWorkout,
  removeBodyPartsFromWorkout,
} from '@domain/workout/application/workout.use-case';
import { toHttpResponse } from '@domain/shared/error-types';

const bodyPartNamesSchema = z.object({
  body_part_names: z.array(z.string()),
});

/**
 * POST /api/workout/[date]/body-parts - Add body parts to workout
 */
export async function POST(
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
    const data = bodyPartNamesSchema.parse(body);

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

/**
 * DELETE /api/workout/[date]/body-parts - Remove body parts from workout
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
    const body = await request.json();
    const data = bodyPartNamesSchema.parse(body);

    const result = await removeBodyPartsFromWorkout(user.id, date, data.body_part_names);
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

