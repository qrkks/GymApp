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

// 存储初始化状态
const initializedSchemas = new Set<string>();

/**
 * 获取测试数据库实例
 * 为每个测试文件创建独立的schema，确保完全隔离
 */
export async function getTestDbAsync(testPath?: string): Promise<ReturnType<typeof drizzle>> {
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
      max: 1, // 每个测试文件只使用1个连接，避免连接数过多
      idleTimeoutMillis: 5000,
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
    
    // 等待初始化完成
    await initializeTestDb(testPath);
    initializedSchemas.add(testPath);
  } else if (!initializedSchemas.has(testPath)) {
    // 如果数据库已创建但未初始化，等待初始化
    await initializeTestDb(testPath);
    initializedSchemas.add(testPath);
  }

  return testDbs.get(testPath)!;
}

/**
 * 同步版本的 getTestDb（向后兼容）
 * 注意：首次调用时可能表结构还未创建，建议在 beforeAll 中调用 initializeTestDb
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
      max: 1, // 每个测试文件只使用1个连接，避免连接数过多
      idleTimeoutMillis: 5000,
      connectionTimeoutMillis: 5000,
      allowExitOnIdle: true, // 允许在空闲时退出
    };

    const pool = new Pool(testConfig);
    testPools.set(testPath, pool);

    // 标记是否已初始化
    let isInitialized = false;
    const initPromise = initializeTestDb(testPath).then(() => {
      isInitialized = true;
      initializedSchemas.add(testPath);
    }).catch((error) => {
      console.error(`❌ 初始化测试数据库失败 (${testPath}):`, error);
    });

    // 创建schema并设置search_path
    pool.on('connect', async (client) => {
      try {
        // 创建schema（如果不存在）
        await client.query(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);

        // 设置search_path只到我们的测试schema，不包含public，确保完全隔离
        // 这样可以确保测试数据不会影响默认schema（public）中的用户
        await client.query(`SET search_path TO ${schemaName}`);

        // 等待初始化完成（如果还未完成）
        if (!isInitialized) {
          await initPromise;
        }

        // console.log(`✅ Created and switched to schema: ${schemaName}`);
      } catch (error) {
        console.error(`❌ Failed to setup schema ${schemaName}:`, error);
      }
    });

    // 创建drizzle实例
    const db = drizzle(pool, { schema });
    testDbs.set(testPath, db);
  } else if (!initializedSchemas.has(testPath)) {
    // 如果数据库已创建但未初始化，启动初始化
    initializeTestDb(testPath).then(() => {
      initializedSchemas.add(testPath);
    }).catch((error) => {
      console.error(`❌ 初始化测试数据库失败 (${testPath}):`, error);
    });
  }

  return testDbs.get(testPath)!;
}

/**
 * 初始化测试数据库
 * 创建必要的表结构（通过迁移或手动创建）
 */
export async function initializeTestDb(testPath?: string) {
  const targetPath = testPath || 'global';
  const pool = testPools.get(targetPath);
  
  if (!pool) {
    getTestDb(targetPath); // 确保连接已创建
    return initializeTestDb(targetPath); // 递归调用
  }

  try {
    const schemaName = generateSchemaName(targetPath);
    const client = await pool.connect();
    
    try {
      // 创建schema（如果不存在）
      await client.query(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);
      
      // 设置 search_path 到测试 schema（每次执行SQL前都设置，确保使用正确的schema）
      await client.query(`SET search_path TO ${schemaName}`);
      
      // 读取并执行迁移 SQL
      const fs = require('fs');
      const path = require('path');
      const migrationPath = path.join(__dirname, '../../drizzle/0000_shiny_iron_lad.sql');
      
      if (fs.existsSync(migrationPath)) {
        const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
        
        // 分割 SQL 语句（按 --> statement-breakpoint 分割）
        const statements = migrationSQL
          .split(/--> statement-breakpoint/)
          .map((stmt: string) => stmt.trim())
          .filter((stmt: string) => stmt.length > 0 && !stmt.startsWith('--'));
        
        // 分离 CREATE TABLE 和 ALTER TABLE 语句
        const createStatements: string[] = [];
        const alterStatements: string[] = [];
        
        for (const statement of statements) {
          if (statement.trim()) {
            if (statement.toUpperCase().startsWith('CREATE TABLE')) {
              createStatements.push(statement);
            } else if (statement.toUpperCase().startsWith('ALTER TABLE')) {
              alterStatements.push(statement);
            } else {
              // 其他语句（如索引等）在CREATE之后执行
              createStatements.push(statement);
            }
          }
        }
        
        // 先执行所有 CREATE TABLE 语句
        for (const statement of createStatements) {
          try {
            // 确保每次执行前都设置search_path
            await client.query(`SET search_path TO ${schemaName}`);
            await client.query(statement);
          } catch (error: any) {
            // 忽略 "already exists" 错误
            if (!error.message.includes('already exists') && 
                !error.message.includes('duplicate')) {
              console.warn(`⚠️ CREATE TABLE 执行警告:`, error.message);
            }
          }
        }
        
        // 然后执行所有 ALTER TABLE 语句（外键约束）
        for (const statement of alterStatements) {
          try {
            // 确保每次执行前都设置search_path
            await client.query(`SET search_path TO ${schemaName}`);
            
            // 替换所有 "public"."table" 为当前 schema 中的表名
            // 在测试 schema 中，表在当前 schema 中，不需要 "public." 前缀
            let fixedStatement = statement
              .replace(/"public"\./g, '')
              .replace(/'public'\./g, '');
            
            await client.query(fixedStatement);
          } catch (error: any) {
            // 忽略 "already exists" 和 "duplicate" 错误
            if (!error.message.includes('already exists') && 
                !error.message.includes('duplicate') &&
                !error.message.includes('不存在') &&
                !error.message.includes('does not exist')) {
              console.warn(`⚠️ ALTER TABLE 执行警告:`, error.message);
            }
          }
        }
      } else {
        console.warn(`⚠️ 迁移文件不存在: ${migrationPath}`);
      }
      
      console.log(`✅ 测试数据库表结构已创建 (${targetPath})`);
    } finally {
      client.release();
    }
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

