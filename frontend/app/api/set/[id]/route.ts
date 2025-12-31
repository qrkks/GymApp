import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sets, workoutSets } from '@/lib/db/schema';
import { requireAuth } from '@/lib/auth-helpers';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const setUpdateSchema = z.object({
  weight: z.number(),
  reps: z.number(),
});

// PUT /api/set/[id] - Update a set
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const data = setUpdateSchema.parse(body);
    const id = parseInt(params.id);

    // Verify set belongs to user
    const setToUpdate = await db
      .select()
      .from(sets)
      .innerJoin(workoutSets, eq(sets.workoutSetId, workoutSets.id))
      .where(and(
        eq(sets.id, id),
        eq(workoutSets.userId, user.id)
      ))
      .limit(1);

    if (setToUpdate.length === 0) {
      return NextResponse.json(
        { error: 'Set not found' },
        { status: 404 }
      );
    }

    const [result] = await db
      .update(sets)
      .set({
        weight: data.weight,
        reps: data.reps,
      })
      .where(eq(sets.id, id))
      .returning();

    return NextResponse.json({
      id: result.id,
      set_number: result.setNumber,
      weight: result.weight,
      reps: result.reps,
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

// DELETE /api/set/[id] - Delete a set and reorder remaining sets
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const id = parseInt(params.id);

    // Verify set belongs to user and get workout set
    const setToDelete = await db
      .select({
        setId: sets.id,
        workoutSetId: sets.workoutSetId,
        setNumber: sets.setNumber,
      })
      .from(sets)
      .innerJoin(workoutSets, eq(sets.workoutSetId, workoutSets.id))
      .where(and(
        eq(sets.id, id),
        eq(workoutSets.userId, user.id)
      ))
      .limit(1);

    if (setToDelete.length === 0) {
      return NextResponse.json(
        { error: 'Set not found' },
        { status: 404 }
      );
    }

    const workoutSetId = setToDelete[0].workoutSetId;

    // Delete the set
    await db.delete(sets).where(eq(sets.id, id));

    // Reorder remaining sets
    const remainingSets = await db
      .select()
      .from(sets)
      .where(eq(sets.workoutSetId, workoutSetId))
      .orderBy(sets.setNumber);

    for (let i = 0; i < remainingSets.length; i++) {
      await db
        .update(sets)
        .set({ setNumber: i + 1 })
        .where(eq(sets.id, remainingSets[i].id));
    }

    return NextResponse.json({
      success: true,
      message: 'Set deleted and numbers reordered',
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

