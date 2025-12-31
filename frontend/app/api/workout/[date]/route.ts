import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { workouts, workoutBodyParts, bodyParts } from '@/lib/db/schema';
import { requireAuth } from '@/lib/auth-helpers';
import { eq, and } from 'drizzle-orm';

// GET /api/workout/[date] - Get workout by date
export async function GET(
  request: NextRequest,
  { params }: { params: { date: string } }
) {
  try {
    const user = await requireAuth();
    const date = params.date;

    const workout = await db
      .select()
      .from(workouts)
      .where(and(
        eq(workouts.userId, user.id),
        eq(workouts.date, date)
      ))
      .limit(1);

    if (workout.length === 0) {
      return NextResponse.json(
        { error: 'Workout not found' },
        { status: 404 }
      );
    }

    // Get associated body parts
    const associatedBodyParts = await db
      .select({
        id: bodyParts.id,
        name: bodyParts.name,
      })
      .from(workoutBodyParts)
      .innerJoin(bodyParts, eq(workoutBodyParts.bodyPartId, bodyParts.id))
      .where(eq(workoutBodyParts.workoutId, workout[0].id));

    return NextResponse.json({
      ...workout[0],
      body_parts: associatedBodyParts,
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/workout/[date] - Delete workout by date
export async function DELETE(
  request: NextRequest,
  { params }: { params: { date: string } }
) {
  try {
    const user = await requireAuth();
    const date = params.date;

    const [result] = await db
      .delete(workouts)
      .where(and(
        eq(workouts.userId, user.id),
        eq(workouts.date, date)
      ))
      .returning();

    if (!result) {
      return NextResponse.json(
        { error: 'Workout not found' },
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

