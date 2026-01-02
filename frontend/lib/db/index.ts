import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Lazy initialization to avoid database connection during build
let poolInstance: Pool | null = null;
let dbInstance: ReturnType<typeof drizzle> | null = null;

// PostgreSQL connection configuration
function getDatabase(): Pool {
  if (!poolInstance) {
    // Production: Use DATABASE_URL
    if (process.env.DATABASE_URL) {
      poolInstance = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' && process.env.POSTGRES_HOST !== 'localhost' ? { rejectUnauthorized: false } : false,
      });
    } else {
      // Development: Construct from individual environment variables
      const config = {
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432'),
        database: process.env.POSTGRES_DB || 'gymapp',
        user: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || 'postgres',
        max: process.env.NODE_ENV === 'production' ? 10 : 5, // Max connections
        idleTimeoutMillis: 20000, // Close idle connections after 20s
        connectionTimeoutMillis: 10000, // Connection timeout 10s
        ssl: process.env.NODE_ENV === 'production' && process.env.POSTGRES_HOST !== 'localhost' ? { rejectUnauthorized: false } : false,
      };

      if (!config.password) {
        throw new Error('POSTGRES_PASSWORD environment variable is required');
      }

      poolInstance = new Pool(config);
    }

    // Connection health check
    if (process.env.NODE_ENV === 'production') {
      console.log('✅ PostgreSQL connection pool initialized');
    }
  }
  return poolInstance;
}

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    if (!dbInstance) {
      dbInstance = drizzle(getDatabase(), { schema });
    }
    return (dbInstance as any)[prop];
  },
});

// Graceful shutdown handler
if (typeof process !== 'undefined') {
  process.on('SIGINT', async () => {
    if (poolInstance) {
      console.log('🔄 Closing PostgreSQL connections...');
      await poolInstance.end();
      console.log('✅ PostgreSQL connections closed');
    }
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    if (poolInstance) {
      console.log('🔄 Closing PostgreSQL connections...');
      await poolInstance.end();
      console.log('✅ PostgreSQL connections closed');
    }
    process.exit(0);
  });
}
