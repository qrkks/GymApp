/**
 * Workout API Routes - Last Workout Sets
 * 仅处理 HTTP 请求/响应，调用 Application Service
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { workoutSets, workouts, sets, exercises } from '@/lib/db/schema';
import { requireAuth } from '@/lib/auth-helpers';
import { eq, and, ne, desc } from 'drizzle-orm';

/**
 * GET /api/workout/last/sets - Get all sets from last workout for an exercise
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const exerciseId = searchParams.get('exercise_id');
    const exerciseName = searchParams.get('exercise_name');

    if (!exerciseId && !exerciseName) {
      return NextResponse.json(
        { error: 'exercise_id or exercise_name is required' },
        { status: 400 }
      );
    }

    // Get today's date
    const today = new Date().toISOString().split('T')[0];

    // 构建 where 条件
    const baseConditions = [
      eq(workoutSets.userId, user.id),
      ne(workouts.date, today),
    ];

    if (exerciseId) {
      baseConditions.push(eq(exercises.id, parseInt(exerciseId)));
    } else if (exerciseName) {
      baseConditions.push(eq(exercises.name, exerciseName));
    }

    const query = db
      .select({
        workoutSetId: workoutSets.id,
        workoutDate: workouts.date,
        exerciseId: exercises.id,
        exerciseName: exercises.name,
      })
      .from(workoutSets)
      .innerJoin(workouts, eq(workoutSets.workoutId, workouts.id))
      .innerJoin(exercises, eq(workoutSets.exerciseId, exercises.id))
      .where(and(...baseConditions));

    const lastWorkoutSet = await query
      .orderBy(desc(workouts.date))
      .limit(1);

    if (lastWorkoutSet.length === 0) {
      return NextResponse.json(
        { error: '未找到包含该练习动作的上一次训练数据' },
        { status: 404 }
      );
    }

    // Get all sets from last workout
    const allSets = await db
      .select()
      .from(sets)
      .where(eq(sets.workoutSetId, lastWorkoutSet[0].workoutSetId))
      .orderBy(sets.setNumber);

    if (allSets.length === 0) {
      return NextResponse.json(
        { error: '未找到该练习的训练组数据' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      date: lastWorkoutSet[0].workoutDate,
      sets: allSets.map(s => ({
        set_number: s.setNumber,
        weight: s.weight,
        reps: s.reps,
      })),
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

