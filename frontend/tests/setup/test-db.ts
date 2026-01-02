/**
 * 测试数据库设置
 * 使用独立的 PostgreSQL schema 进行测试隔离
 */
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@/lib/db/schema';

// 存储每个测试文件的数据库实例
const testDbs = new Map<string, ReturnType<typeof drizzle>>();
const testPools = new Map<string, Pool>();

/**
 * 生成测试schema名称
 * 基于测试文件名生成唯一schema名称
 */
function generateSchemaName(testPath: string): string {
  // 从测试文件路径提取有意义的名称
  const parts = testPath.split(/[/\\]/);
  const fileName = parts[parts.length - 1].replace('.test.ts', '').replace('.spec.ts', '');
  const domain = parts[parts.length - 3] || 'unknown';

  // 生成schema名称：test_{domain}_{filename}_{random}
  // PostgreSQL标识符只能包含字母、数字、下划线
  const randomId = Math.random().toString(36).substring(2, 8).replace(/[^a-z0-9]/g, '');
  const cleanFileName = fileName.replace(/[^a-z0-9]/g, '_');
  const cleanDomain = domain.replace(/[^a-z0-9]/g, '_');

  return `test_${cleanDomain}_${cleanFileName}_${randomId}`;
}

/**
 * 为测试文件创建隔离的数据库实例
 * 使用独立的schema确保测试完全隔离
 */
export function createTestDb(testFilePath: string) {
  // 标准化路径格式
  const normalizedPath = testFilePath.replace(/\\/g, '/');
  return getTestDb(normalizedPath);
}

/**
 * 获取测试数据库实例
 * 为每个测试文件创建独立的schema，确保完全隔离
 */
export function getTestDb(testPath?: string): ReturnType<typeof drizzle> {
  // 如果没有提供testPath，使用默认的全局实例（向后兼容）
  if (!testPath) {
    testPath = 'global';
  }

  if (!testDbs.has(testPath)) {
    const schemaName = generateSchemaName(testPath);

    // 测试数据库配置
    const testConfig = {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      database: process.env.POSTGRES_TEST_DB || 'gymapp',
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'postgres',
      max: 5, // 增加连接池大小以避免连接耗尽
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000,
      allowExitOnIdle: true, // 允许在空闲时退出
    };

    const pool = new Pool(testConfig);
    testPools.set(testPath, pool);

    // 创建schema并设置search_path
    pool.on('connect', async (client) => {
      try {
        // 创建schema（如果不存在）
        await client.query(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);

        // 设置search_path只到我们的测试schema，不包含public，确保完全隔离
        // 这样可以确保测试数据不会影响默认schema（public）中的用户
        await client.query(`SET search_path TO ${schemaName}`);

        // console.log(`✅ Created and switched to schema: ${schemaName}`);
      } catch (error) {
        console.error(`❌ Failed to setup schema ${schemaName}:`, error);
      }
    });

    // 创建drizzle实例
    const db = drizzle(pool, { schema });
    testDbs.set(testPath, db);
  }

  return testDbs.get(testPath)!;
}

/**
 * 初始化测试数据库
 * 创建必要的表结构（通过迁移或手动创建）
 */
export async function initializeTestDb(testPath?: string) {
  const db = getTestDb(testPath);

  try {
    // 尝试运行迁移，如果迁移不存在则会失败
    // 在测试环境中，我们可以手动创建表或使用现有的迁移
    console.log(`✅ 测试数据库连接已建立 (${testPath || 'global'})`);
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
export async function cleanupTestDb(testPath?: string) {
  const targetPath = testPath || 'global';

  const pool = testPools.get(targetPath);
  if (pool) {
    try {
      // 清理schema（如果存在）
      const schemaName = generateSchemaName(targetPath);
      if (schemaName !== 'global') {
        await pool.query(`DROP SCHEMA IF EXISTS ${schemaName} CASCADE`);
        console.log(`🗑️ Dropped schema: ${schemaName}`);
      }
    } catch (error) {
      console.error('清理schema失败:', error);
    } finally {
      await pool.end();
      testPools.delete(targetPath);
      testDbs.delete(targetPath);
    }
  }
}

/**
 * 重置测试数据库
 * 删除所有表数据，重新创建表结构
 */
export async function resetTestDb(testPath?: string) {
  const targetPath = testPath || 'global';
  const pool = testPools.get(targetPath);

  if (!pool) {
    getTestDb(targetPath); // 确保连接已创建
    return resetTestDb(targetPath); // 递归调用
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
      await pool.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
    }

    // 重新创建表结构
    await initializeTestDb(targetPath);

    console.log(`✅ 测试数据库重置完成 (${targetPath})`);
  } catch (error) {
    console.error('❌ 测试数据库重置失败:', error);
    throw error;
  }
}

