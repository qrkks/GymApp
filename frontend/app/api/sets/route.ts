import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sets, workoutSets, workouts, exercises } from '@/lib/db/schema';
import { requireAuth } from '@/lib/auth-helpers';
import { eq, and } from 'drizzle-orm';

// GET /api/sets - Get sets by workout date and exercise name
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const workoutDate = searchParams.get('workout_date');
    const exerciseName = searchParams.get('exercise_name');

    if (!workoutDate || !exerciseName) {
      return NextResponse.json(
        { error: 'workout_date and exercise_name are required' },
        { status: 400 }
      );
    }

    // Get workout
    const workout = await db
      .select()
      .from(workouts)
      .where(and(
        eq(workouts.userId, user.id),
        eq(workouts.date, workoutDate)
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

    // Get workout set
    const workoutSet = await db
      .select()
      .from(workoutSets)
      .where(and(
        eq(workoutSets.workoutId, workout[0].id),
        eq(workoutSets.exerciseId, exercise[0].id)
      ))
      .limit(1);

    if (workoutSet.length === 0) {
      return NextResponse.json(
        { error: 'WorkoutSet not found' },
        { status: 404 }
      );
    }

    // Get sets
    const setsList = await db
      .select({
        id: sets.id,
        reps: sets.reps,
        weight: sets.weight,
      })
      .from(sets)
      .where(eq(sets.workoutSetId, workoutSet[0].id))
      .orderBy(sets.setNumber);

    return NextResponse.json(setsList);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

