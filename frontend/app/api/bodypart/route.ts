import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bodyParts } from '@/lib/db/schema';
import { requireAuth } from '@/lib/auth-helpers';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const bodyPartSchema = z.object({
  name: z.string().min(1),
});

// GET /api/bodypart - Get all body parts for current user
export async function GET() {
  try {
    const user = await requireAuth();
    const result = await db
      .select()
      .from(bodyParts)
      .where(eq(bodyParts.userId, user.id));
    
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

// POST /api/bodypart - Create a new body part
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const data = bodyPartSchema.parse(body);

    // Check if body part with same name already exists for this user
    const existing = await db
      .select()
      .from(bodyParts)
      .where(and(
        eq(bodyParts.userId, user.id),
        eq(bodyParts.name, data.name)
      ))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Body part with this name already exists' },
        { status: 400 }
      );
    }

    const [result] = await db
      .insert(bodyParts)
      .values({
        userId: user.id,
        name: data.name,
      })
      .returning();

    return NextResponse.json(result);
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

// DELETE /api/bodypart - Delete all body parts for current user
export async function DELETE() {
  try {
    const user = await requireAuth();
    await db.delete(bodyParts).where(eq(bodyParts.userId, user.id));
    return NextResponse.json({ message: 'ok' });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

