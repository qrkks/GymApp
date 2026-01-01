/**
 * 测试数据库设置
 * 使用内存数据库进行测试
 */
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from '@/lib/db/schema';

let testDb: ReturnType<typeof drizzle> | null = null;
let testSqlite: Database.Database | null = null;
let isInitialized = false;

/**
 * 初始化测试数据库表结构
 */
function initializeTestDb() {
  if (isInitialized || !testSqlite) return;
  
  // 创建 users 表
  testSqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE,
      email TEXT UNIQUE,
      password TEXT,
      emailVerified INTEGER,
      image TEXT,
      createdAt INTEGER,
      updatedAt INTEGER
    );
  `);
  
  // 创建 body_parts 表
  testSqlite.exec(`
    CREATE TABLE IF NOT EXISTS body_parts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, name)
    );
  `);
  
  // 创建 exercises 表
  testSqlite.exec(`
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
  
  // 创建 workouts 表
  testSqlite.exec(`
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
  
  // 创建 workout_sets 表
  testSqlite.exec(`
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
  
  // 创建 sets 表
  testSqlite.exec(`
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
  
  // 创建 workout_body_parts 表
  testSqlite.exec(`
    CREATE TABLE IF NOT EXISTS workout_body_parts (
      workout_id INTEGER NOT NULL,
      body_part_id INTEGER NOT NULL,
      PRIMARY KEY (workout_id, body_part_id),
      FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE,
      FOREIGN KEY (body_part_id) REFERENCES body_parts(id) ON DELETE CASCADE
    );
  `);
  
  isInitialized = true;
}

/**
 * 获取测试数据库实例
 */
export function getTestDb() {
  if (!testDb || !testSqlite) {
    testSqlite = new Database(':memory:');
    testDb = drizzle(testSqlite, { schema });
    // 初始化表结构
    initializeTestDb();
  }
  return testDb;
}

/**
 * 清理测试数据库
 */
export async function cleanupTestDb() {
  if (testSqlite) {
    testSqlite.close();
    testSqlite = null;
  }
  testDb = null;
  isInitialized = false;
}

