import { Pool, type PoolClient } from 'pg';
import { MIGRATIONS } from './migrations';

// One pool per server process (survives Next.js dev hot reloads via globalThis).
const globalForDb = globalThis as unknown as {
  pgPool?: Pool;
  dbReady?: Promise<void>;
};

export function getPool(): Pool {
  if (!globalForDb.pgPool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is not set');
    }
    globalForDb.pgPool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });
    globalForDb.pgPool.on('error', (err) => {
      console.error('[db] idle client error', err);
    });
  }
  return globalForDb.pgPool;
}

/** Runs fn inside a transaction; rolls back on any error. */
export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  await ready();
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

/** Plain query that waits for migrations first. */
export async function query<T extends object = Record<string, unknown>>(text: string, params: unknown[] = []) {
  await ready();
  return getPool().query<T>(text, params);
}

async function runMigrations(): Promise<void> {
  const client = await getPool().connect();
  try {
    // Serialize across processes/containers starting at the same time.
    await client.query('SELECT pg_advisory_lock(727274)');
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id          INT PRIMARY KEY,
        name        TEXT NOT NULL,
        applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    const { rows } = await client.query<{ id: number }>('SELECT id FROM schema_migrations');
    const applied = new Set(rows.map((r) => r.id));
    for (const m of MIGRATIONS) {
      if (applied.has(m.id)) continue;
      console.log(`[db] applying migration ${m.id} ${m.name}`);
      await client.query('BEGIN');
      try {
        await client.query(m.sql);
        await client.query('INSERT INTO schema_migrations (id, name) VALUES ($1, $2)', [m.id, m.name]);
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        throw err;
      }
    }
  } finally {
    await client.query('SELECT pg_advisory_unlock(727274)').catch(() => {});
    client.release();
  }
}

/** Migrations + one-time bootstrap (legacy import, first admin). Memoized; retried after failure. */
export function ready(): Promise<void> {
  if (!globalForDb.dbReady) {
    globalForDb.dbReady = (async () => {
      await runMigrations();
      const { runBootstrap } = await import('./bootstrap');
      await runBootstrap();
    })().catch((err) => {
      globalForDb.dbReady = undefined;
      throw err;
    });
  }
  return globalForDb.dbReady;
}
