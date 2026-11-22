import type { PoolClient } from 'pg';
import { getPool } from './db';
import { hashSecret, isValidPassword, isValidUsername, normalizeUsername } from './passwords';
import { DEFAULT_REWARDS, stripServerOwned, type ProgressData } from './progress';

// NOTE: runs inside ready() — must use getPool() directly, never query()/withTransaction().

const LEGACY_NAMES: Record<string, string> = { avigail: 'אביגיל', rani: 'רני' };
const DEFAULT_FAMILY_NAME = 'המשפחה שלי';

async function tx<T>(fn: (c: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const out = await fn(client);
    await client.query('COMMIT');
    return out;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

/**
 * One-time import of the pre-auth data (table `profiles`, rows 'avigail'/'rani')
 * into a family with student accounts. Students are created WITHOUT a PIN —
 * a parent sets it in the dashboard. Progress, rewards and history are preserved.
 */
async function importLegacyProfiles(): Promise<void> {
  await tx(async (c) => {
    await c.query('SELECT pg_advisory_xact_lock(727276)');
    const done = await c.query("SELECT 1 FROM app_meta WHERE key = 'legacy_import_done'");
    if (done.rows[0]) return;

    const legacy = await c.query<{ id: string; data: ProgressData }>('SELECT id, data FROM profiles ORDER BY id');
    if (legacy.rows.length) {
      const fam = await c.query<{ id: string }>('INSERT INTO families (name) VALUES ($1) RETURNING id', [
        process.env.FAMILY_NAME || DEFAULT_FAMILY_NAME,
      ]);
      const familyId = fam.rows[0].id;

      for (const row of legacy.rows) {
        const username = normalizeUsername(row.id);
        const user = await c.query<{ id: string }>(
          `INSERT INTO users (family_id, role, username, display_name, secret_hash)
           VALUES ($1, 'student', $2, $3, NULL) RETURNING id`,
          [familyId, username, LEGACY_NAMES[row.id] ?? row.id],
        );
        const studentId = user.rows[0].id;

        const { writeId: _w, editorId: _e, updatedAt: _u, ...rest } = row.data ?? {};
        await c.query('INSERT INTO student_progress (user_id, data) VALUES ($1, $2::jsonb)', [
          studentId,
          JSON.stringify(stripServerOwned(rest)),
        ]);

        const oldRewards = Array.isArray(row.data?.parentRewards)
          ? (row.data.parentRewards as { title?: unknown; cost?: unknown }[])
          : DEFAULT_REWARDS;
        for (const r of oldRewards) {
          const title = String(r.title ?? '').trim().slice(0, 60);
          const cost = Math.round(Number(r.cost));
          if (title && cost > 0) {
            await c.query('INSERT INTO rewards (student_id, title, cost) VALUES ($1, $2, $3)', [studentId, title, cost]);
          }
        }

        const history = Array.isArray(row.data?.redemptionHistory)
          ? (row.data.redemptionHistory as { title?: unknown; cost?: unknown }[])
          : [];
        for (const h of history) {
          await c.query(
            `INSERT INTO redemptions (student_id, title, cost, status, resolved_at)
             VALUES ($1, $2, $3, 'fulfilled', now())`,
            [studentId, String(h.title ?? '').slice(0, 60) || 'פרס', Math.max(0, Math.round(Number(h.cost) || 0))],
          );
        }
      }
      console.log(`[bootstrap] imported ${legacy.rows.length} legacy profile(s) into family ${familyId}`);
    }
    await c.query("INSERT INTO app_meta (key, value) VALUES ('legacy_import_done', now()::text)");
  });
}

/** Creates the first admin from ADMIN_USERNAME / ADMIN_PASSWORD if no admin exists yet. */
async function ensureAdmin(): Promise<void> {
  await tx(async (c) => {
    await c.query('SELECT pg_advisory_xact_lock(727275)');
    const existing = await c.query("SELECT 1 FROM users WHERE role = 'admin' LIMIT 1");
    if (existing.rows[0]) return;

    const username = normalizeUsername(process.env.ADMIN_USERNAME);
    const password = process.env.ADMIN_PASSWORD;
    if (!isValidUsername(username) || !isValidPassword(password)) {
      console.warn(
        '[bootstrap] No admin account exists. Set ADMIN_USERNAME and ADMIN_PASSWORD (8+ chars) in .env and restart.',
      );
      return;
    }

    // Attach the admin to the only family if there is exactly one (the imported one), else create one.
    const fams = await c.query<{ id: string }>('SELECT id FROM families ORDER BY created_at LIMIT 2');
    let familyId = fams.rows.length === 1 ? fams.rows[0].id : null;
    if (!familyId) {
      const fam = await c.query<{ id: string }>('INSERT INTO families (name) VALUES ($1) RETURNING id', [
        process.env.FAMILY_NAME || DEFAULT_FAMILY_NAME,
      ]);
      familyId = fam.rows[0].id;
    }
    await c.query(
      `INSERT INTO users (family_id, role, username, display_name, secret_hash)
       VALUES ($1, 'admin', $2, $3, $4)`,
      [familyId, username, process.env.ADMIN_DISPLAY_NAME || 'מנהל', await hashSecret(password)],
    );
    console.log(`[bootstrap] created admin account "${username}"`);
  });
}

export async function runBootstrap(): Promise<void> {
  await importLegacyProfiles();
  await ensureAdmin();
}
