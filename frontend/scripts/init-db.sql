-- Initialize database schema

-- Users table (for NextAuth.js)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  emailVerified INTEGER,
  image TEXT,
  createdAt INTEGER,
  updatedAt INTEGER
);

-- Body parts table
CREATE TABLE IF NOT EXISTS body_parts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, name)
);

-- Exercises table
CREATE TABLE IF NOT EXISTS exercises (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  body_part_id INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (body_part_id) REFERENCES body_parts(id) ON DELETE CASCADE,
  UNIQUE(user_id, name)
);

-- Workouts table
CREATE TABLE IF NOT EXISTS workouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  start_time INTEGER NOT NULL,
  end_time INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, date)
);

-- Workout body parts junction table
CREATE TABLE IF NOT EXISTS workout_body_parts (
  workout_id INTEGER NOT NULL,
  body_part_id INTEGER NOT NULL,
  PRIMARY KEY (workout_id, body_part_id),
  FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE,
  FOREIGN KEY (body_part_id) REFERENCES body_parts(id) ON DELETE CASCADE
);

-- Workout sets table
CREATE TABLE IF NOT EXISTS workout_sets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  workout_id INTEGER NOT NULL,
  exercise_id INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE,
  FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE,
  UNIQUE(workout_id, exercise_id)
);

-- Sets table
CREATE TABLE IF NOT EXISTS sets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  workout_set_id INTEGER NOT NULL,
  set_number INTEGER NOT NULL,
  weight REAL NOT NULL,
  reps INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (workout_set_id) REFERENCES workout_sets(id) ON DELETE CASCADE
);

