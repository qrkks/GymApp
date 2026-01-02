// 强制动态渲染，因为使用了认证和headers
export const dynamic = 'force-dynamic';

/**
 * Exercise API Routes
 * 仅处理 HTTP 请求/响应，调用 Application Service
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { z } from 'zod';
import {
  getExerciseList,
  createExercise,
  deleteAllExercises,
} from '@domain/exercise/application/exercise.use-case';
import { toHttpResponse } from '@domain/shared/error-types';

const exerciseSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  body_part_id: z.number(),
});

/**
 * GET /api/exercise - Get all exercises (optionally filtered by body_part_name)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const bodyPartName = searchParams.get('body_part_name') || undefined;

    const result = await getExerciseList(user.id, bodyPartName);
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
 * POST /api/exercise - Create a new exercise
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = exerciseSchema.parse(body);

    const result = await createExercise(user.id, {
      name: data.name,
      description: data.description,
      bodyPartId: data.body_part_id,
    });
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
 * DELETE /api/exercise - Delete all exercises for current user
 */
export async function DELETE() {
  try {
    const user = await requireAuth();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await deleteAllExercises(user.id);
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
