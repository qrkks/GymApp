import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

// Lazy initialization to avoid database connection during build
let sqliteInstance: InstanceType<typeof Database> | null = null;
let dbInstance: ReturnType<typeof drizzle> | null = null;

function getDatabase(): InstanceType<typeof Database> {
  if (!sqliteInstance) {
    const dbPath = process.env.DATABASE_PATH || './db.sqlite';
    sqliteInstance = new Database(dbPath, {
      // 生产环境优化配置
      ...(process.env.NODE_ENV === 'production' && {
        // 启用WAL模式以提高并发性能
        // WAL模式允许多个读取器和一个写入器同时工作
      })
    });

    // 仅在生产环境应用优化
    if (process.env.NODE_ENV === 'production') {
      try {
        // 验证并应用数据库优化
        sqliteInstance.pragma('journal_mode = WAL');
        sqliteInstance.pragma('synchronous = NORMAL');
        sqliteInstance.pragma('cache_size = 1000000'); // 1GB cache
        sqliteInstance.pragma('temp_store = memory');
        sqliteInstance.pragma('mmap_size = 268435456'); // 256MB memory map

        console.log('✅ SQLite production optimizations applied');
      } catch (error) {
        console.warn('⚠️ Failed to apply SQLite optimizations:', error);
      }
    }
  }
  return sqliteInstance;
}

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    if (!dbInstance) {
      dbInstance = drizzle(getDatabase(), { schema });
    }
    return (dbInstance as any)[prop];
  },
});

