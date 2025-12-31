import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { workoutSets, workouts, exercises, bodyParts, sets } from '@/lib/db/schema';
import { requireAuth } from '@/lib/auth-helpers';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const setSchema = z.object({
  weight: z.number(),
  reps: z.number(),
});

const workoutSetUpdateSchema = z.object({
  workout_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  exercise_name: z.string(),
  sets: z.array(setSchema),
});

// PUT /api/workoutset/update - Update workout set
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const data = workoutSetUpdateSchema.parse(body);

    // Get workout
    const workout = await db
      .select()
      .from(workouts)
      .where(and(
        eq(workouts.userId, user.id),
        eq(workouts.date, data.workout_date)
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
        eq(exercises.name, data.exercise_name)
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

    // Update or create sets
    const setsToReturn = [];
    for (const setData of data.sets) {
      // Try to find existing set with same reps
      const existingSet = await db
        .select()
        .from(sets)
        .where(and(
          eq(sets.workoutSetId, workoutSet[0].id),
          eq(sets.reps, setData.reps)
        ))
        .limit(1);

      if (existingSet.length > 0) {
        // Update existing set
        const [updatedSet] = await db
          .update(sets)
          .set({ weight: setData.weight })
          .where(eq(sets.id, existingSet[0].id))
          .returning();

        setsToReturn.push({
          id: updatedSet.id,
          reps: updatedSet.reps,
          weight: updatedSet.weight,
        });
      } else {
        // Create new set
        const maxSetResult = await db
          .select()
          .from(sets)
          .where(eq(sets.workoutSetId, workoutSet[0].id))
          .orderBy(sets.setNumber);

        const nextSetNumber = maxSetResult.length > 0
          ? maxSetResult[maxSetResult.length - 1].setNumber + 1
          : 1;

        const [newSet] = await db
          .insert(sets)
          .values({
            userId: user.id,
            workoutSetId: workoutSet[0].id,
            setNumber: nextSetNumber,
            weight: setData.weight,
            reps: setData.reps,
          })
          .returning();

        setsToReturn.push({
          id: newSet.id,
          reps: newSet.reps,
          weight: newSet.weight,
        });
      }
    }

    // Get body part
    const bodyPart = await db
      .select()
      .from(bodyParts)
      .where(eq(bodyParts.id, exercise[0].bodyPartId))
      .limit(1);

    return NextResponse.json({
      id: workoutSet[0].id,
      workout: workout[0],
      exercise: {
        id: exercise[0].id,
        name: exercise[0].name,
        description: exercise[0].description,
        body_part: {
          id: bodyPart[0].id,
          name: bodyPart[0].name,
        },
      },
      sets: setsToReturn,
      created: false,
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

