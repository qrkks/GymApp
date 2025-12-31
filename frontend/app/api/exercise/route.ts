import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { exercises, bodyParts } from '@/lib/db/schema';
import { requireAuth } from '@/lib/auth-helpers';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const exerciseSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  body_part_id: z.number(),
});

// GET /api/exercise - Get all exercises (optionally filtered by body_part_name)
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const bodyPartName = searchParams.get('body_part_name');

    let query = db
      .select({
        id: exercises.id,
        name: exercises.name,
        description: exercises.description,
        body_part: {
          id: bodyParts.id,
          name: bodyParts.name,
        },
      })
      .from(exercises)
      .innerJoin(bodyParts, eq(exercises.bodyPartId, bodyParts.id))
      .where(eq(exercises.userId, user.id));

    if (bodyPartName) {
      query = query.where(and(
        eq(exercises.userId, user.id),
        eq(bodyParts.name, bodyPartName)
      ));
    }

    const result = await query;

    if (bodyPartName && result.length === 0) {
      // Check if body part exists
      const bodyPart = await db
        .select()
        .from(bodyParts)
        .where(and(
          eq(bodyParts.userId, user.id),
          eq(bodyParts.name, bodyPartName)
        ))
        .limit(1);

      if (bodyPart.length === 0) {
        return NextResponse.json(
          { error: 'Body part not found' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(result);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/exercise - Create a new exercise
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const data = exerciseSchema.parse(body);

    // Verify body part exists and belongs to user
    const bodyPart = await db
      .select()
      .from(bodyParts)
      .where(and(
        eq(bodyParts.id, data.body_part_id),
        eq(bodyParts.userId, user.id)
      ))
      .limit(1);

    if (bodyPart.length === 0) {
      return NextResponse.json(
        { error: 'Body part not found' },
        { status: 404 }
      );
    }

    // Check if exercise with same name already exists for this user
    const existing = await db
      .select()
      .from(exercises)
      .where(and(
        eq(exercises.userId, user.id),
        eq(exercises.name, data.name)
      ))
      .limit(1);

    if (existing.length > 0) {
      // Return existing exercise
      const [exercise] = existing;
      const [bodyPartData] = bodyPart;
      return NextResponse.json({
        id: exercise.id,
        name: exercise.name,
        description: exercise.description,
        body_part: {
          id: bodyPartData.id,
          name: bodyPartData.name,
        },
      });
    }

    const [result] = await db
      .insert(exercises)
      .values({
        userId: user.id,
        name: data.name,
        description: data.description || '',
        bodyPartId: data.body_part_id,
      })
      .returning();

    const [bodyPartData] = bodyPart;
    return NextResponse.json({
      id: result.id,
      name: result.name,
      description: result.description,
      body_part: {
        id: bodyPartData.id,
        name: bodyPartData.name,
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

// DELETE /api/exercise - Delete all exercises for current user
export async function DELETE() {
  try {
    const user = await requireAuth();
    await db.delete(exercises).where(eq(exercises.userId, user.id));
    return NextResponse.json({ message: 'ok' });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

