import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../lib/db/schema';
import { sql } from 'drizzle-orm';

const dbPath = process.env.DATABASE_PATH || './db.sqlite';
const sqlite = new Database(dbPath);
const db = drizzle(sqlite, { schema });

async function initDatabase() {
  try {
    console.log('Initializing database...');

    // Create users table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT,
        email TEXT UNIQUE,
        emailVerified INTEGER,
        image TEXT,
        createdAt INTEGER,
        updatedAt INTEGER
      );
    `);

    // Create body_parts table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS body_parts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, name)
      );
    `);

    // Create exercises table
    sqlite.exec(`
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
    `);

    // Create workouts table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS workouts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        date TEXT NOT NULL,
        start_time INTEGER NOT NULL,
        end_time INTEGER,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, date)
      );
    `);

    // Create workout_body_parts table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS workout_body_parts (
        workout_id INTEGER NOT NULL,
        body_part_id INTEGER NOT NULL,
        PRIMARY KEY (workout_id, body_part_id),
        FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE,
        FOREIGN KEY (body_part_id) REFERENCES body_parts(id) ON DELETE CASCADE
      );
    `);

    // Create workout_sets table
    sqlite.exec(`
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
    `);

    // Create sets table
    sqlite.exec(`
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
    `);

    console.log('✅ Database initialized successfully!');
    console.log(`Database location: ${dbPath}`);
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  } finally {
    sqlite.close();
  }
}

initDatabase();

