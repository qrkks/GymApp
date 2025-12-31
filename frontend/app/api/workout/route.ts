import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { workouts } from '@/lib/db/schema';
import { requireAuth } from '@/lib/auth-helpers';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const workoutSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

// GET /api/workout - Get all workouts for current user
export async function GET() {
  try {
    const user = await requireAuth();
    const result = await db
      .select()
      .from(workouts)
      .where(eq(workouts.userId, user.id))
      .orderBy(workouts.date);

    return NextResponse.json(result);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/workout - Create a new workout
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const data = workoutSchema.parse(body);

    const [result] = await db
      .insert(workouts)
      .values({
        userId: user.id,
        date: data.date,
        startTime: new Date(),
      })
      .returning();

    return NextResponse.json({
      ...result,
      created: true,
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

// DELETE /api/workout - Delete all workouts for current user
export async function DELETE() {
  try {
    const user = await requireAuth();
    await db.delete(workouts).where(eq(workouts.userId, user.id));
    return NextResponse.json({ message: 'ok' });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

