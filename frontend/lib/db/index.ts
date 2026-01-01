import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

// Lazy initialization to avoid database connection during build
let sqliteInstance: Database | null = null;
let dbInstance: ReturnType<typeof drizzle> | null = null;

function getDatabase(): Database {
  if (!sqliteInstance) {
    const dbPath = process.env.DATABASE_PATH || './db.sqlite';
    sqliteInstance = new Database(dbPath);
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

