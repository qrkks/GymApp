# Ant-Corruption Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the current anti-corruption leaks so `application` and API layers stop directly depending on `db/schema`, making future features safer to add.

**Architecture:** Keep the existing modular monolith shape and tighten boundaries instead of redesigning the project. Move database-aware joins and persistence DTO assembly down into repository functions, keep use cases focused on orchestration and business rules, and make API routes call use cases only.

**Tech Stack:** Next.js App Router, TypeScript, Drizzle ORM, Jest, PostgreSQL

---

## File Map

**Create**
- `frontend/domain/workout/repository/queries/last-workout.repository.ts`
- `frontend/domain/workout/application/last-workout.use-case.ts`

**Modify**
- `frontend/domain/workout/application/workout.use-case.ts`
- `frontend/domain/workout/repository/queries/workout.repository.ts`
- `frontend/domain/exercise/application/exercise.use-case.ts`
- `frontend/domain/exercise/repository/queries/exercise.repository.ts`
- `frontend/app/api/workout/last/sets/route.ts`
- `frontend/app/api/workout/last/sets/first/route.ts`
- `frontend/domain/workout/application/__tests__/workout.use-case.test.ts`
- `frontend/domain/exercise/application/__tests__/exercise.use-case.test.ts`

**Optional follow-up (only if needed during implementation)**
- `frontend/domain/shared/error-types.ts`

---

### Task 1: Close `workout` application leaks

**Files:**
- Modify: `frontend/domain/workout/application/workout.use-case.ts`
- Modify: `frontend/domain/workout/repository/queries/workout.repository.ts`
- Test: `frontend/domain/workout/application/__tests__/workout.use-case.test.ts`

- [ ] **Step 1: Write failing tests for repository-backed lookups**

Add tests covering the cases currently powered by direct `db/schema` access inside the use case:

```ts
it('should create exercise block when workout and exercise exist', async () => {
  const result = await createExerciseBlock(testUserId, '2024-01-15', 'Bench Press');

  expect(result.success).toBe(true);
  if (result.success) {
    expect(result.data.exercise.name).toBe('Bench Press');
  }
});

it('should return BODY_PART_NOT_FOUND when adding a missing body part', async () => {
  const result = await addBodyPartsToWorkout(testUserId, '2024-01-15', ['Missing']);

  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error.code).toBe('BODY_PART_NOT_FOUND');
  }
});
```

- [ ] **Step 2: Run the workout use-case test file**

Run:

```bash
corepack pnpm exec jest frontend/domain/workout/application/__tests__/workout.use-case.test.ts --runInBand
```

Expected: at least one failing case or existing assertions that prove the current file depends on direct persistence details.

- [ ] **Step 3: Add repository helpers so the use case no longer queries tables directly**

Extend `frontend/domain/workout/repository/queries/workout.repository.ts` with focused query functions:

```ts
export async function findBodyPartByNameForWorkout(
  userId: string,
  name: string
): Promise<{ id: number; name: string } | null> {
  const [result] = await db
    .select({ id: bodyParts.id, name: bodyParts.name })
    .from(bodyParts)
    .where(and(eq(bodyParts.userId, userId), eq(bodyParts.name, name)))
    .limit(1);

  return result || null;
}

export async function findExerciseBlockByWorkoutAndExercise(
  userId: string,
  workoutId: number,
  exerciseId: number
): Promise<ExerciseBlockWithDetails | null> {
  const blocks = await findExerciseBlocks(userId, {});
  return blocks.find(
    (block) => block.workout.id === workoutId && block.exercise.id === exerciseId
  ) || null;
}
```

Use a tighter implementation than the sample if a more direct query is easy; the key is that the query belongs in the repository, not the use case.

- [ ] **Step 4: Refactor the workout use case to consume repository functions only**

Replace direct imports like:

```ts
import { db } from '@/lib/db';
import { exercises, bodyParts, workoutSets } from '@/lib/db/schema';
```

with repository calls such as:

```ts
const exercise = await exerciseQueries.findExerciseByName(userId, exerciseName);
if (!exercise) {
  return failure('EXERCISE_NOT_FOUND', 'Exercise not found');
}

const createdBlock = await workoutCommands.insertExerciseBlock(
  userId,
  workout.id,
  exercise.id
);
```

Also ensure every post-insert readback uses repository functions instead of hand-written joins in `workout.use-case.ts`.

- [ ] **Step 5: Re-run workout use-case tests**

Run:

```bash
corepack pnpm exec jest frontend/domain/workout/application/__tests__/workout.use-case.test.ts --runInBand
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add frontend/domain/workout/application/workout.use-case.ts frontend/domain/workout/repository/queries/workout.repository.ts frontend/domain/workout/application/__tests__/workout.use-case.test.ts
git commit -m "refactor: remove direct db access from workout use cases"
```

---

### Task 2: Close `exercise` application leaks

**Files:**
- Modify: `frontend/domain/exercise/application/exercise.use-case.ts`
- Modify: `frontend/domain/exercise/repository/queries/exercise.repository.ts`
- Test: `frontend/domain/exercise/application/__tests__/exercise.use-case.test.ts`

- [ ] **Step 1: Add a failing test for returning an existing exercise with body-part data**

```ts
it('should return existing exercise with body part details from repository', async () => {
  const { bodyPart } = await createTestData();
  await exerciseCommands.insertExercise(testUserId, {
    name: 'Bench Press',
    bodyPartId: bodyPart.id,
  });

  const result = await createExercise(testUserId, {
    name: 'Bench Press',
    bodyPartId: bodyPart.id,
  });

  expect(result.success).toBe(true);
  if (result.success) {
    expect(result.data.body_part.name).toBe('Chest');
  }
});
```

- [ ] **Step 2: Run the exercise use-case test file**

Run:

```bash
corepack pnpm exec jest frontend/domain/exercise/application/__tests__/exercise.use-case.test.ts --runInBand
```

Expected: PASS or a new failing assertion after the test is added.

- [ ] **Step 3: Move body-part enrichment into repository queries**

Add a repository helper that returns a stable response shape:

```ts
export async function findExerciseWithBodyPartById(
  userId: string,
  id: number
): Promise<ExerciseWithBodyPart | null> {
  const [result] = await db
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
    .where(and(eq(exercises.userId, userId), eq(exercises.id, id)))
    .limit(1);

  return result || null;
}
```

If useful, also add `findExerciseWithBodyPartByName`.

- [ ] **Step 4: Refactor the exercise use case to stop importing `db/schema`**

Remove:

```ts
import { db } from '@/lib/db';
import { bodyParts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
```

Then replace direct table lookups with repository calls so `exercise.use-case.ts` only coordinates:

```ts
const existing = await exerciseQueries.findExerciseWithBodyPartByName(
  userId,
  exerciseName.getValue()
);

if (existing) {
  return success(existing);
}
```

- [ ] **Step 5: Re-run exercise use-case tests**

Run:

```bash
corepack pnpm exec jest frontend/domain/exercise/application/__tests__/exercise.use-case.test.ts --runInBand
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add frontend/domain/exercise/application/exercise.use-case.ts frontend/domain/exercise/repository/queries/exercise.repository.ts frontend/domain/exercise/application/__tests__/exercise.use-case.test.ts
git commit -m "refactor: move exercise persistence reads behind repositories"
```

---

### Task 3: Pull last-workout APIs behind a use case

**Files:**
- Create: `frontend/domain/workout/repository/queries/last-workout.repository.ts`
- Create: `frontend/domain/workout/application/last-workout.use-case.ts`
- Modify: `frontend/app/api/workout/last/sets/route.ts`
- Modify: `frontend/app/api/workout/last/sets/first/route.ts`

- [ ] **Step 1: Capture the current contract in route-level tests**

Create or extend route tests with assertions for both supported query shapes:

```ts
it('returns all sets from the last non-today workout by exercise_name', async () => {
  const response = await GET(
    new NextRequest('http://localhost/api/workout/last/sets?exercise_name=Bench%20Press')
  );

  expect(response.status).toBe(200);
});

it('returns 404 when no previous workout exists', async () => {
  const response = await GET(
    new NextRequest('http://localhost/api/workout/last/sets/first?exercise_name=Bench%20Press')
  );

  expect(response.status).toBe(404);
});
```

- [ ] **Step 2: Run the targeted route tests**

Run:

```bash
corepack pnpm exec jest frontend/app/api/workout/last/sets --runInBand
```

Expected: PASS if tests already exist, otherwise FAIL until the fixtures are in place.

- [ ] **Step 3: Create repository functions for “last workout” reads**

In `frontend/domain/workout/repository/queries/last-workout.repository.ts`, add database-aware queries such as:

```ts
export async function findLastWorkoutSetHeader(
  userId: string,
  exerciseFilter: { exerciseId?: number; exerciseName?: string },
  today: string
): Promise<{ workoutSetId: number; workoutDate: string } | null> {
  // keep the current join logic here
}

export async function findSetsByWorkoutSetId(
  workoutSetId: number
): Promise<Array<{ setNumber: number; weight: number; reps: number }>> {
  // keep the current sets query here
}
```

- [ ] **Step 4: Add a use case that translates repository results into domain errors**

In `frontend/domain/workout/application/last-workout.use-case.ts`:

```ts
export async function getLastWorkoutSets(
  userId: string,
  exerciseFilter: { exerciseId?: number; exerciseName?: string }
) {
  const today = new Date().toISOString().split('T')[0];
  const header = await lastWorkoutQueries.findLastWorkoutSetHeader(userId, exerciseFilter, today);

  if (!header) {
    return failure('LAST_WORKOUT_NOT_FOUND', 'No previous workout found');
  }

  const sets = await lastWorkoutQueries.findSetsByWorkoutSetId(header.workoutSetId);
  if (sets.length === 0) {
    return failure('SETS_NOT_FOUND', 'No sets found');
  }

  return success({ date: header.workoutDate, sets });
}
```

- [ ] **Step 5: Refactor both routes into thin HTTP adapters**

Each route should keep auth, query parsing, and HTTP formatting only:

```ts
const result = await getLastWorkoutSets(user.id, {
  exerciseId: exerciseId ? parseInt(exerciseId, 10) : undefined,
  exerciseName: exerciseName || undefined,
});

const response = toHttpResponse(result);
return NextResponse.json(response.body, { status: response.status });
```

The `/first` route should call a use case helper that returns only the first set payload while still hiding persistence details from the route.

- [ ] **Step 6: Re-run the route tests**

Run:

```bash
corepack pnpm exec jest frontend/app/api/workout/last/sets --runInBand
```

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add frontend/domain/workout/repository/queries/last-workout.repository.ts frontend/domain/workout/application/last-workout.use-case.ts frontend/app/api/workout/last/sets/route.ts frontend/app/api/workout/last/sets/first/route.ts
git commit -m "refactor: route last-workout api through domain use cases"
```

---

### Task 4: Normalize error translation at the domain boundary

**Files:**
- Modify: `frontend/domain/workout/application/workout.use-case.ts`
- Modify: `frontend/domain/exercise/application/exercise.use-case.ts`
- Optional modify: `frontend/domain/shared/error-types.ts`

- [ ] **Step 1: Add or update tests for stable domain error codes**

Add assertions like:

```ts
expect(result.success).toBe(false);
if (!result.success) {
  expect(result.error.code).toBe('EXERCISE_NOT_FOUND');
}
```

Cover at least:
- missing workout
- missing body part
- missing exercise
- no previous workout data

- [ ] **Step 2: Run the affected test suites**

Run:

```bash
corepack pnpm exec jest frontend/domain/workout/application/__tests__/workout.use-case.test.ts frontend/domain/exercise/application/__tests__/exercise.use-case.test.ts --runInBand
```

Expected: PASS or clear failures where raw persistence errors still leak.

- [ ] **Step 3: Translate persistence-level failures before they reach HTTP**

Use a small helper pattern instead of exposing raw database details:

```ts
function mapUnexpectedError(message: string, error: unknown) {
  return failure('INTERNAL_ERROR', message, error);
}
```

Keep database-specific conflict handling in repository or in tightly-scoped application branches, but return stable domain codes upward.

- [ ] **Step 4: Verify the API layer still only formats responses**

Check that routes use:

```ts
const response = toHttpResponse(result);
return NextResponse.json(response.body, { status: response.status });
```

and do not branch on Drizzle/Postgres-specific error fields.

- [ ] **Step 5: Run lint and type-check**

Run:

```bash
corepack pnpm run lint
corepack pnpm exec tsc --noEmit
```

Expected: both PASS

- [ ] **Step 6: Commit**

```bash
git add frontend/domain/workout/application/workout.use-case.ts frontend/domain/exercise/application/exercise.use-case.ts frontend/domain/shared/error-types.ts
git commit -m "refactor: normalize domain error translation"
```

---

### Task 5: End-to-end verification for the new boundary

**Files:**
- Review only: `frontend/app/api/exercise-block/route.ts`
- Review only: `frontend/app/api/workout/route.ts`
- Review only: `frontend/app/api/workout/last/sets/route.ts`
- Review only: `frontend/app/api/workout/last/sets/first/route.ts`

- [ ] **Step 1: Run the focused domain and route test suites**

Run:

```bash
corepack pnpm exec jest frontend/domain/workout/application/__tests__/workout.use-case.test.ts frontend/domain/exercise/application/__tests__/exercise.use-case.test.ts frontend/app/api/workout/last/sets --runInBand
```

Expected: PASS

- [ ] **Step 2: Run the broader quality gates**

Run:

```bash
corepack pnpm run test
corepack pnpm run lint
corepack pnpm exec tsc --noEmit
corepack pnpm run build
```

Expected:
- tests PASS
- lint PASS
- type-check PASS
- build PASS

- [ ] **Step 3: Manual smoke test**

Verify in the browser:

```text
1. 创建今日训练
2. 添加训练部位
3. 添加训练动作
4. 添加训练组
5. 请求“上次训练组数/首组”接口的页面功能仍正常
```

Expected: no regression in the current workout creation flow.

- [ ] **Step 4: Commit the verification checkpoint if fixes were needed**

```bash
git add .
git commit -m "test: verify anti-corruption refactor boundaries"
```

---

## Self-Review

**Spec coverage:** This plan covers the three current leak categories: application-layer direct DB access, API-layer direct DB access, and unstable error translation.

**Placeholder scan:** No `TODO` or “implement later” placeholders remain. Every task names exact files and commands.

**Type consistency:** The plan consistently uses repository-backed read models, domain `Result` objects, and thin HTTP routes. Keep those naming conventions during implementation.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-02-ant-corruption-refactor.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
