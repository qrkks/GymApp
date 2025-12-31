/**
 * 清空并重新初始化数据库
 * 警告：此脚本会删除所有数据！
 */
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../lib/db/schema';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

const dbPath = process.env.DATABASE_PATH || './db.sqlite';

async function resetDatabase() {
  try {
    console.log('🗑️  正在清空数据库...');

    // 如果数据库文件存在，先关闭所有连接并删除
    if (fs.existsSync(dbPath)) {
      // 尝试关闭可能存在的连接
      try {
        const tempDb = new Database(dbPath);
        tempDb.close();
      } catch (e) {
        // 忽略错误，继续删除文件
      }
      
      fs.unlinkSync(dbPath);
      console.log('✅ 已删除旧数据库文件');
    }

    // 创建新的数据库连接
    const sqlite = new Database(dbPath);
    const db = drizzle(sqlite, { schema });

    console.log('📦 正在创建数据库表...');

    // 创建 users 表（包含 password 字段和 username 唯一约束）
    sqlite.exec(`
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
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS body_parts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, name)
      );
    `);

    // 创建 exercises 表
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

    // 创建 workouts 表
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

    // 创建 workout_body_parts 表
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS workout_body_parts (
        workout_id INTEGER NOT NULL,
        body_part_id INTEGER NOT NULL,
        PRIMARY KEY (workout_id, body_part_id),
        FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE,
        FOREIGN KEY (body_part_id) REFERENCES body_parts(id) ON DELETE CASCADE
      );
    `);

    // 创建 workout_sets 表
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

    // 创建 sets 表
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

    sqlite.close();

    console.log('✅ 数据库重置成功！');
    console.log(`📁 数据库位置: ${path.resolve(dbPath)}`);
    console.log('⚠️  注意：所有数据已被清空');
  } catch (error) {
    console.error('❌ 重置数据库失败:', error);
    process.exit(1);
  }
}

// 运行脚本
resetDatabase();

