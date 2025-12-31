import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { workoutSets, workouts, exercises } from '@/lib/db/schema';
import { requireAuth } from '@/lib/auth-helpers';
import { eq, and } from 'drizzle-orm';

// DELETE /api/workoutset/[date]/[exercise] - Delete workout set by date and exercise name
export async function DELETE(
  request: NextRequest,
  { params }: { params: { date: string; exercise: string } }
) {
  try {
    const user = await requireAuth();
    const date = decodeURIComponent(params.date);
    const exerciseName = decodeURIComponent(params.exercise);

    // Get workout
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

    // Get exercise
    const exercise = await db
      .select()
      .from(exercises)
      .where(and(
        eq(exercises.userId, user.id),
        eq(exercises.name, exerciseName)
      ))
      .limit(1);

    if (exercise.length === 0) {
      return NextResponse.json(
        { error: 'Exercise not found' },
        { status: 404 }
      );
    }

    // Delete workout set
    await db
      .delete(workoutSets)
      .where(and(
        eq(workoutSets.workoutId, workout[0].id),
        eq(workoutSets.exerciseId, exercise[0].id)
      ));

    return NextResponse.json(null, { status: 204 });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

