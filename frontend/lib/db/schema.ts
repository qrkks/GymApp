import { pgTable, text, serial, integer, real, boolean, timestamp, unique, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// User table (for NextAuth.js)
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(), // 用户名，必选且唯一
  email: text('email').unique(),
  password: text('password'), // 密码哈希
  emailVerified: boolean('emailVerified'),
  image: text('image'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

// BodyPart table
export const bodyParts = pgTable('body_parts', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
}, (table) => ({
  uniqueUserBodyPart: unique().on(table.userId, table.name),
}));

// Exercise table
export const exercises = pgTable('exercises', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  bodyPartId: integer('body_part_id').notNull().references(() => bodyParts.id, { onDelete: 'cascade' }),
}, (table) => ({
  uniqueUserExercise: unique().on(table.userId, table.name),
}));

// Workout table
export const workouts = pgTable('workouts', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  date: text('date').notNull(), // Keep as text for flexibility
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
}, (table) => ({
  uniqueUserDate: unique().on(table.userId, table.date),
}));

// WorkoutBodyPart junction table (many-to-many relationship)
export const workoutBodyParts = pgTable('workout_body_parts', {
  workoutId: integer('workout_id').notNull().references(() => workouts.id, { onDelete: 'cascade' }),
  bodyPartId: integer('body_part_id').notNull().references(() => bodyParts.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.workoutId, table.bodyPartId] }),
}));

// WorkoutSet table
export const workoutSets = pgTable('workout_sets', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  workoutId: integer('workout_id').notNull().references(() => workouts.id, { onDelete: 'cascade' }),
  exerciseId: integer('exercise_id').notNull().references(() => exercises.id, { onDelete: 'cascade' }),
}, (table) => ({
  uniqueWorkoutExercise: unique().on(table.workoutId, table.exerciseId),
}));

// Set table
export const sets = pgTable('sets', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  workoutSetId: integer('workout_set_id').notNull().references(() => workoutSets.id, { onDelete: 'cascade' }),
  setNumber: integer('set_number').notNull(),
  weight: real('weight').notNull(),
  reps: integer('reps').notNull(),
});

// Relations
export const bodyPartsRelations = relations(bodyParts, ({ one, many }) => ({
  user: one(users, {
    fields: [bodyParts.userId],
    references: [users.id],
  }),
  exercises: many(exercises),
}));

export const exercisesRelations = relations(exercises, ({ one, many }) => ({
  user: one(users, {
    fields: [exercises.userId],
    references: [users.id],
  }),
  bodyPart: one(bodyParts, {
    fields: [exercises.bodyPartId],
    references: [bodyParts.id],
  }),
  workoutSets: many(workoutSets),
}));

export const workoutsRelations = relations(workouts, ({ one, many }) => ({
  user: one(users, {
    fields: [workouts.userId],
    references: [users.id],
  }),
  workoutSets: many(workoutSets),
  bodyParts: many(workoutBodyParts),
}));

export const workoutSetsRelations = relations(workoutSets, ({ one, many }) => ({
  user: one(users, {
    fields: [workoutSets.userId],
    references: [users.id],
  }),
  workout: one(workouts, {
    fields: [workoutSets.workoutId],
    references: [workouts.id],
  }),
  exercise: one(exercises, {
    fields: [workoutSets.exerciseId],
    references: [exercises.id],
  }),
  sets: many(sets),
}));

export const setsRelations = relations(sets, ({ one }) => ({
  user: one(users, {
    fields: [sets.userId],
    references: [users.id],
  }),
  workoutSet: one(workoutSets, {
    fields: [sets.workoutSetId],
    references: [workoutSets.id],
  }),
}));

export const workoutBodyPartsRelations = relations(workoutBodyParts, ({ one }) => ({
  workout: one(workouts, {
    fields: [workoutBodyParts.workoutId],
    references: [workouts.id],
  }),
  bodyPart: one(bodyParts, {
    fields: [workoutBodyParts.bodyPartId],
    references: [bodyParts.id],
  }),
}));

