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
      name TEXT,
      email TEXT UNIQUE,
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

