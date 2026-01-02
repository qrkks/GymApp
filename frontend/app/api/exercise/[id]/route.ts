/**
 * Exercise API Routes - Single Exercise
 * 仅处理 HTTP 请求/响应，调用 Application Service
 */
import { NextRequest, NextResponse } from 'next/server';

// 强制动态渲染，因为使用了认证和headers
export const dynamic = 'force-dynamic';
import { requireAuth } from '@/lib/auth-helpers';
import { z } from 'zod';
import {
  updateExerciseName,
  deleteExercise,
} from '@domain/exercise/application/exercise.use-case';
import { toHttpResponse } from '@domain/shared/error-types';

const patchSchema = z.object({
  exerciseName: z.string().min(1),
});

/**
 * PATCH /api/exercise/[id] - Update exercise name
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    // Support both camelCase and snake_case for backward compatibility
    const normalizedBody = {
      exerciseName: body.exerciseName || body.exercise_name,
    };
    const data = patchSchema.parse(normalizedBody);
    const id = parseInt(params.id);

    const result = await updateExerciseName(id, user.id, data.exerciseName);
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
 * DELETE /api/exercise/[id] - Delete an exercise
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid exercise ID' },
        { status: 400 }
      );
    }

    const result = await deleteExercise(id, user.id);
    
    if (!result.success) {
      console.error('删除训练动作失败:', {
        id,
        userId: user.id,
        errorCode: result.error.code,
        errorMessage: result.error.message,
        errorDetails: result.error.details,
      });
    }
    
    const response = toHttpResponse(result);

    if (response.status === 204) {
      return NextResponse.json(null, { status: 204 });
    }
    return NextResponse.json(response.body, { status: response.status });
  } catch (error: any) {
    console.error('删除训练动作时发生异常:', {
      error: error.message,
      stack: error.stack,
      id: params.id,
    });
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
