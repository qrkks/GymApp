import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { workouts, workoutBodyParts, bodyParts, exercises, workoutSets } from '@/lib/db/schema';
import { requireAuth } from '@/lib/auth-helpers';
import { eq, and, inArray } from 'drizzle-orm';
import { z } from 'zod';

const changeBodyPartSchema = z.object({
  body_part_names: z.array(z.string()),
});

// PUT /api/workout/[date]/remove-body-parts - Remove body parts from workout
export async function PUT(
  request: NextRequest,
  { params }: { params: { date: string } }
) {
  try {
    const user = await requireAuth();
    const date = params.date;
    const body = await request.json();
    const data = changeBodyPartSchema.parse(body);

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

    // Get body parts to remove
    const bodyPartsToRemove = await db
      .select()
      .from(bodyParts)
      .where(and(
        eq(bodyParts.userId, user.id),
        inArray(bodyParts.name, data.body_part_names)
      ));

    if (bodyPartsToRemove.length === 0) {
      return NextResponse.json(
        { error: 'No body parts found' },
        { status: 404 }
      );
    }

    const bodyPartIds = bodyPartsToRemove.map(bp => bp.id);

    // Get exercises for these body parts
    const exercisesToRemove = await db
      .select()
      .from(exercises)
      .where(and(
        eq(exercises.userId, user.id),
        inArray(exercises.bodyPartId, bodyPartIds)
      ));

    const exerciseIds = exercisesToRemove.map(e => e.id);

    // Delete workout sets for these exercises
    if (exerciseIds.length > 0) {
      await db
        .delete(workoutSets)
        .where(and(
          eq(workoutSets.workoutId, workout[0].id),
          inArray(workoutSets.exerciseId, exerciseIds)
        ));
    }

    // Remove body parts from workout
    await db
      .delete(workoutBodyParts)
      .where(and(
        eq(workoutBodyParts.workoutId, workout[0].id),
        inArray(workoutBodyParts.bodyPartId, bodyPartIds)
      ));

    // Get updated body parts
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
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

