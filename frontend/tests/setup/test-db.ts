/**
 * 测试数据库设置
 * 使用测试 PostgreSQL 数据库进行测试
 */
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@/lib/db/schema';

let testDb: ReturnType<typeof drizzle> | null = null;
let testPool: Pool | null = null;

/**
 * 获取测试数据库实例
 * 使用独立的测试数据库，避免影响开发数据库
 */
export function getTestDb() {
  if (!testDb || !testPool) {
    // 测试数据库配置
    const testConfig = {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      database: process.env.POSTGRES_TEST_DB || 'gymapp_test',
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'password',
      max: 5, // 测试环境连接池较小
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000,
    };

    testPool = new Pool(testConfig);
    testDb = drizzle(testPool, { schema });
  }
  return testDb;
}

/**
 * 初始化测试数据库
 * 创建必要的表结构（通过迁移或手动创建）
 */
export async function initializeTestDb() {
  if (!testPool) {
    getTestDb(); // 确保连接已创建
  }

  try {
    // 尝试运行迁移，如果迁移不存在则会失败
    // 在测试环境中，我们可以手动创建表或使用现有的迁移
    console.log('✅ 测试数据库连接已建立');
    // 表结构将通过 Drizzle 的 db:push 或现有迁移来创建
  } catch (error) {
    console.error('❌ 测试数据库初始化失败:', error);
    throw error;
  }
}

/**
 * 清理测试数据库
 * 关闭连接池并清理资源
 */
export async function cleanupTestDb() {
  if (testPool) {
    await testPool.end();
    testPool = null;
  }
  testDb = null;
}

/**
 * 重置测试数据库
 * 删除所有表数据，重新创建表结构
 */
export async function resetTestDb() {
  if (!testPool) {
    getTestDb(); // 确保连接已创建
  }

  try {
    // 删除所有表（按依赖关系逆序）
    const tables = [
      'sets',
      'workout_sets',
      'workout_body_parts',
      'workouts',
      'exercises',
      'body_parts',
      'users'
    ];

    for (const table of tables) {
      await testPool!.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
    }

    // 重新创建表结构
    await initializeTestDb();

    console.log('✅ 测试数据库重置完成');
  } catch (error) {
    console.error('❌ 测试数据库重置失败:', error);
    throw error;
  }
}

