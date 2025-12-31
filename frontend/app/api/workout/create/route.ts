import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { workouts } from '@/lib/db/schema';
import { requireAuth } from '@/lib/auth-helpers';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const workoutCreateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

// POST /api/workout/create - Create or get workout by date
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const data = workoutCreateSchema.parse(body);

    // Try to get existing workout
    const existing = await db
      .select()
      .from(workouts)
      .where(and(
        eq(workouts.userId, user.id),
        eq(workouts.date, data.date)
      ))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({
        ...existing[0],
        created: false,
      });
    }

    // Create new workout
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

