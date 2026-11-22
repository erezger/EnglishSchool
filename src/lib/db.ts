import { Pool } from 'pg';

// One pool per server process (survives Next.js dev hot reloads via globalThis).
const globalForDb = globalThis as unknown as {
  pgPool?: Pool;
  schemaReady?: Promise<void>;
};

export function getPool(): Pool {
  if (!globalForDb.pgPool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is not set');
    }
    globalForDb.pgPool = new Pool({
      connectionString,
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });
    globalForDb.pgPool.on('error', (err) => {
      console.error('[db] idle client error', err);
    });
  }
  return globalForDb.pgPool;
}

const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS profiles (
    id          TEXT PRIMARY KEY,
    data        JSONB NOT NULL,
    version     BIGINT NOT NULL DEFAULT 1,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
  );
`;

/** Creates the table on first use. Safe to call on every request. */
export function ensureSchema(): Promise<void> {
  if (!globalForDb.schemaReady) {
    globalForDb.schemaReady = getPool()
      .query(SCHEMA_SQL)
      .then(() => undefined)
      .catch((err) => {
        globalForDb.schemaReady = undefined; // retry on next request
        throw err;
      });
  }
  return globalForDb.schemaReady;
}
