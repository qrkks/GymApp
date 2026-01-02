/**
 * BodyPart API Routes - Single Resource
 * 仅处理 HTTP 请求/响应，调用 Application Service
 */
import { NextRequest, NextResponse } from 'next/server';

// 强制动态渲染，因为使用了认证和headers
export const dynamic = 'force-dynamic';
import { requireAuth } from '@/lib/auth-helpers';
import { z } from 'zod';
import {
  updateBodyPart,
  deleteBodyPart,
} from '@domain/body-part/application/body-part.use-case';
import { toHttpResponse } from '@domain/shared/error-types';

const patchSchema = z.object({
  body_part_name: z.string().min(1),
});

/**
 * PATCH /api/body-part/[id] - Update body part name
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
    const data = patchSchema.parse(body);
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid body part ID' },
        { status: 400 }
      );
    }

    const result = await updateBodyPart(id, user.id, data.body_part_name);
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
 * DELETE /api/body-part/[id] - Delete a body part
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
        { error: 'Invalid body part ID' },
        { status: 400 }
      );
    }

    const result = await deleteBodyPart(id, user.id);
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

