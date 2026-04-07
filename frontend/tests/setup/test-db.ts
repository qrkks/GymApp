/**
 * Test database setup.
 * Each test file gets its own isolated PostgreSQL schema.
 */
import fs from 'fs';
import path from 'path';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@/lib/db/schema';

const testDbs = new Map<string, ReturnType<typeof drizzle>>();
const testPools = new Map<string, Pool>();
const initializedSchemas = new Set<string>();
const schemaNames = new Map<string, string>();
const initializationPromises = new Map<string, Promise<void>>();

function normalizeTestPath(testPath?: string): string {
  return (testPath ?? 'global').replace(/\\/g, '/');
}

function generateSchemaName(testPath: string): string {
  const parts = testPath.split(/[/\\]/);
  const fileName = parts[parts.length - 1].replace('.test.ts', '').replace('.spec.ts', '');
  const domain = parts[parts.length - 3] || 'unknown';
  const randomId = Math.random().toString(36).substring(2, 8).replace(/[^a-z0-9]/g, '');
  const cleanFileName = fileName.replace(/[^a-z0-9]/g, '_');
  const cleanDomain = domain.replace(/[^a-z0-9]/g, '_');

  return `test_${cleanDomain}_${cleanFileName}_${randomId}`;
}

function getSchemaName(testPath?: string): string {
  const normalizedPath = normalizeTestPath(testPath);
  const existing = schemaNames.get(normalizedPath);

  if (existing) {
    return existing;
  }

  const schemaName = generateSchemaName(normalizedPath);
  schemaNames.set(normalizedPath, schemaName);
  return schemaName;
}

function createPool() {
  return new Pool({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    database: process.env.POSTGRES_TEST_DB || 'gymapp',
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    max: 1,
    idleTimeoutMillis: 5000,
    connectionTimeoutMillis: 5000,
    allowExitOnIdle: true,
  });
}

function registerSchemaSearchPath(pool: Pool, schemaName: string) {
  pool.on('connect', async (client) => {
    try {
      await client.query(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);
      await client.query(`SET search_path TO ${schemaName}`);
    } catch (error: any) {
      if (error?.message?.includes('Connection terminated')) {
        return;
      }
      console.error(`Failed to setup schema ${schemaName}:`, error);
    }
  });
}

function ensureInitialized(testPath?: string): Promise<void> {
  const normalizedPath = normalizeTestPath(testPath);

  if (initializedSchemas.has(normalizedPath)) {
    return Promise.resolve();
  }

  const existingPromise = initializationPromises.get(normalizedPath);
  if (existingPromise) {
    return existingPromise;
  }

  const initPromise = initializeTestDb(normalizedPath)
    .then(() => {
      initializedSchemas.add(normalizedPath);
    })
    .finally(() => {
      initializationPromises.delete(normalizedPath);
    });

  initializationPromises.set(normalizedPath, initPromise);
  return initPromise;
}

function ensureTestDb(testPath?: string): ReturnType<typeof drizzle> {
  const normalizedPath = normalizeTestPath(testPath);

  if (!testDbs.has(normalizedPath)) {
    const schemaName = getSchemaName(normalizedPath);
    const pool = createPool();

    registerSchemaSearchPath(pool, schemaName);
    testPools.set(normalizedPath, pool);
    testDbs.set(normalizedPath, drizzle(pool, { schema }));
  }

  return testDbs.get(normalizedPath)!;
}

export function createTestDb(testFilePath: string) {
  return getTestDb(testFilePath);
}

export async function getTestDbAsync(testPath?: string): Promise<ReturnType<typeof drizzle>> {
  const normalizedPath = normalizeTestPath(testPath);
  const db = ensureTestDb(normalizedPath);
  await ensureInitialized(normalizedPath);
  return db;
}

export function getTestDb(testPath?: string): ReturnType<typeof drizzle> {
  const normalizedPath = normalizeTestPath(testPath);
  const db = ensureTestDb(normalizedPath);

  void ensureInitialized(normalizedPath).catch((error) => {
    console.error(`Failed to initialize test database (${normalizedPath}):`, error);
  });

  return db;
}

export async function initializeTestDb(testPath?: string) {
  const normalizedPath = normalizeTestPath(testPath);
  ensureTestDb(normalizedPath);

  const pool = testPools.get(normalizedPath);
  if (!pool) {
    throw new Error(`Missing test pool for ${normalizedPath}`);
  }

  const schemaName = getSchemaName(normalizedPath);
  const client = await pool.connect();

  try {
    await client.query(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);
    await client.query(`SET search_path TO ${schemaName}`);

    const migrationPath = path.join(__dirname, '../../drizzle/0000_shiny_iron_lad.sql');
    if (!fs.existsSync(migrationPath)) {
      console.warn(`Migration file not found: ${migrationPath}`);
      return;
    }

    const migrationSql = fs.readFileSync(migrationPath, 'utf-8');
    const statements = migrationSql
      .split(/--> statement-breakpoint/)
      .map((statement) => statement.trim())
      .filter((statement) => statement.length > 0 && !statement.startsWith('--'));

    const createStatements: string[] = [];
    const alterStatements: string[] = [];

    for (const statement of statements) {
      if (statement.toUpperCase().startsWith('ALTER TABLE')) {
        alterStatements.push(statement);
      } else {
        createStatements.push(statement);
      }
    }

    for (const statement of createStatements) {
      try {
        await client.query(`SET search_path TO ${schemaName}`);
        await client.query(statement);
      } catch (error: any) {
        if (!error.message.includes('already exists') && !error.message.includes('duplicate')) {
          console.warn('CREATE statement warning:', error.message);
        }
      }
    }

    for (const statement of alterStatements) {
      try {
        await client.query(`SET search_path TO ${schemaName}`);
        const fixedStatement = statement
          .replace(/"public"\./g, '')
          .replace(/'public'\./g, '');
        await client.query(fixedStatement);
      } catch (error: any) {
        if (
          !error.message.includes('already exists') &&
          !error.message.includes('duplicate') &&
          !error.message.includes('does not exist')
        ) {
          console.warn('ALTER statement warning:', error.message);
        }
      }
    }

    console.log(`Test schema initialized (${normalizedPath})`);
  } catch (error) {
    console.error('Failed to initialize test database:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function cleanupTestDb(testPath?: string) {
  const normalizedPath = normalizeTestPath(testPath);
  const pool = testPools.get(normalizedPath);

  if (!pool) {
    return;
  }

  try {
    const schemaName = getSchemaName(normalizedPath);
    await pool.query(`DROP SCHEMA IF EXISTS ${schemaName} CASCADE`);
    console.log(`Dropped schema: ${schemaName}`);
  } catch (error) {
    console.error('Failed to cleanup schema:', error);
  } finally {
    await pool.end();
    testPools.delete(normalizedPath);
    testDbs.delete(normalizedPath);
    initializedSchemas.delete(normalizedPath);
    schemaNames.delete(normalizedPath);
    initializationPromises.delete(normalizedPath);
  }
}

export async function resetTestDb(testPath?: string) {
  const normalizedPath = normalizeTestPath(testPath);
  const pool = testPools.get(normalizedPath);

  if (!pool) {
    ensureTestDb(normalizedPath);
    return resetTestDb(normalizedPath);
  }

  const tables = [
    'sets',
    'workout_sets',
    'workout_body_parts',
    'workouts',
    'exercises',
    'body_parts',
    'users',
  ];

  try {
    const schemaName = getSchemaName(normalizedPath);

    for (const table of tables) {
      await pool.query(`SET search_path TO ${schemaName}`);
      await pool.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
    }

    initializedSchemas.delete(normalizedPath);
    await ensureInitialized(normalizedPath);
    console.log(`Test database reset (${normalizedPath})`);
  } catch (error) {
    console.error('Failed to reset test database:', error);
    throw error;
  }
}
