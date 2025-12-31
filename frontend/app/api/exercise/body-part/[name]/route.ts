import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { exercises, bodyParts } from '@/lib/db/schema';
import { requireAuth } from '@/lib/auth-helpers';
import { eq, and } from 'drizzle-orm';

// GET /api/exercise/body-part/[name] - Get exercises by body part name
export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const user = await requireAuth();
    const bodyPartName = decodeURIComponent(params.name);

    // First verify body part exists
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

    const result = await db
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
      .where(and(
        eq(exercises.userId, user.id),
        eq(bodyParts.name, bodyPartName)
      ));

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'No exercises found for this body part' },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

