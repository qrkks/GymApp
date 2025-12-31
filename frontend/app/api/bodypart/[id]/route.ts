import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bodyParts } from '@/lib/db/schema';
import { requireAuth } from '@/lib/auth-helpers';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const patchSchema = z.object({
  bodypart_name: z.string().min(1),
});

// PATCH /api/bodypart/[id] - Update body part name
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const data = patchSchema.parse(body);
    const id = parseInt(params.id);

    const [result] = await db
      .update(bodyParts)
      .set({ name: data.bodypart_name })
      .where(and(
        eq(bodyParts.id, id),
        eq(bodyParts.userId, user.id)
      ))
      .returning();

    if (!result) {
      return NextResponse.json(
        { error: 'Body part not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/bodypart/[id] - Delete a body part
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const id = parseInt(params.id);

    const [result] = await db
      .delete(bodyParts)
      .where(and(
        eq(bodyParts.id, id),
        eq(bodyParts.userId, user.id)
      ))
      .returning();

    if (!result) {
      return NextResponse.json(
        { error: 'Body part not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'ok' });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

