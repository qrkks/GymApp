import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { workoutSets, workouts, exercises, bodyParts, sets } from '@/lib/db/schema';
import { requireAuth } from '@/lib/auth-helpers';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { sql } from 'drizzle-orm';

const setSchema = z.object({
  weight: z.number(),
  reps: z.number(),
});

const workoutSetSchema = z.object({
  workout_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  exercise_name: z.string(),
  sets: z.array(setSchema).optional(),
});

// GET /api/workoutset - Get workout sets (with optional filters)
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const workoutDate = searchParams.get('workout_date');
    const exerciseName = searchParams.get('exercise_name');
    const bodyPartName = searchParams.get('body_part_name');

    let query = db
      .select({
        id: workoutSets.id,
        workout: {
          id: workouts.id,
          date: workouts.date,
          startTime: workouts.startTime,
          endTime: workouts.endTime,
        },
        exercise: {
          id: exercises.id,
          name: exercises.name,
          description: exercises.description,
          body_part: {
            id: bodyParts.id,
            name: bodyParts.name,
          },
        },
      })
      .from(workoutSets)
      .innerJoin(workouts, eq(workoutSets.workoutId, workouts.id))
      .innerJoin(exercises, eq(workoutSets.exerciseId, exercises.id))
      .innerJoin(bodyParts, eq(exercises.bodyPartId, bodyParts.id))
      .where(eq(workoutSets.userId, user.id));

    if (workoutDate) {
      query = query.where(and(
        eq(workoutSets.userId, user.id),
        eq(workouts.date, workoutDate)
      ));
    }

    if (exerciseName) {
      query = query.where(and(
        eq(workoutSets.userId, user.id),
        eq(exercises.name, exerciseName)
      ));
    }

    if (bodyPartName) {
      query = query.where(and(
        eq(workoutSets.userId, user.id),
        eq(bodyParts.name, bodyPartName)
      ));
    }

    const workoutSetsList = await query;

    // Get sets for each workout set
    const result = await Promise.all(
      workoutSetsList.map(async (ws) => {
        const setsList = await db
          .select()
          .from(sets)
          .where(eq(sets.workoutSetId, ws.id))
          .orderBy(sets.setNumber);

        return {
          id: ws.id,
          workout: ws.workout,
          exercise: ws.exercise,
          sets: setsList,
        };
      })
    );

    return NextResponse.json(result);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/workoutset - Create a new workout set
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const data = workoutSetSchema.parse(body);

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

    // Get or create workout set
    let workoutSet = await db
      .select()
      .from(workoutSets)
      .where(and(
        eq(workoutSets.workoutId, workout[0].id),
        eq(workoutSets.exerciseId, exercise[0].id)
      ))
      .limit(1);

    let created = false;
    if (workoutSet.length === 0) {
      const [newWorkoutSet] = await db
        .insert(workoutSets)
        .values({
          userId: user.id,
          workoutId: workout[0].id,
          exerciseId: exercise[0].id,
        })
        .returning();
      workoutSet = [newWorkoutSet];
      created = true;
    }

    const setsToReturn = [];
    if (data.sets && data.sets.length > 0) {
      // Get max set number
      const existingSets = await db
        .select()
        .from(sets)
        .where(eq(sets.workoutSetId, workoutSet[0].id))
        .orderBy(sets.setNumber);

      const maxSetNumber = existingSets.length > 0
        ? existingSets[existingSets.length - 1].setNumber
        : 0;

      // Create sets
      for (let i = 0; i < data.sets.length; i++) {
        const setData = data.sets[i];
        const [setResult] = await db
          .insert(sets)
          .values({
            userId: user.id,
            workoutSetId: workoutSet[0].id,
            setNumber: maxSetNumber + i + 1,
            weight: setData.weight,
            reps: setData.reps,
          })
          .returning();

        setsToReturn.push({
          id: setResult.id,
          set_number: setResult.setNumber,
          weight: setResult.weight,
          reps: setResult.reps,
        });
      }
    }

    // Get exercise with body part
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
      created,
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

// DELETE /api/workoutset - Delete all workout sets for current user
export async function DELETE() {
  try {
    const user = await requireAuth();
    await db.delete(workoutSets).where(eq(workoutSets.userId, user.id));
    return NextResponse.json(null, { status: 204 });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

