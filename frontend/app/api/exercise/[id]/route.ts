import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { exercises } from '@/lib/db/schema';
import { requireAuth } from '@/lib/auth-helpers';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const patchSchema = z.object({
  exercise_name: z.string().min(1),
});

// PATCH /api/exercise/[id]/patch - Update exercise name
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
      .update(exercises)
      .set({ name: data.exercise_name })
      .where(and(
        eq(exercises.id, id),
        eq(exercises.userId, user.id)
      ))
      .returning();

    if (!result) {
      return NextResponse.json(
        { error: 'Exercise not found' },
        { status: 404 }
      );
    }

    // Get body part info
    const { bodyParts } = await import('@/lib/db/schema');
    const bodyPart = await db
      .select()
      .from(bodyParts)
      .where(eq(bodyParts.id, result.bodyPartId))
      .limit(1);

    return NextResponse.json({
      id: result.id,
      name: result.name,
      description: result.description,
      body_part: {
        id: bodyPart[0].id,
        name: bodyPart[0].name,
      },
    });
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

// DELETE /api/exercise/[id]/delete - Delete an exercise
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const id = parseInt(params.id);

    const [result] = await db
      .delete(exercises)
      .where(and(
        eq(exercises.id, id),
        eq(exercises.userId, user.id)
      ))
      .returning();

    if (!result) {
      return NextResponse.json(
        { error: 'Exercise not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(null, { status: 204 });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

