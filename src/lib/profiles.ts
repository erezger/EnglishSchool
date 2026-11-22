import { ensureSchema, getPool } from './db';

export const PROFILE_IDS = ['avigail', 'rani'] as const;
export type ProfileId = (typeof PROFILE_IDS)[number];

/** A profile blob is ~2-10 KB; anything far larger is a bug or abuse. */
export const MAX_PROFILE_BYTES = 256 * 1024;

export type ProfileRow = {
  id: ProfileId;
  data: Record<string, unknown>;
  version: number;
  updatedAt: string;
};

export function isProfileId(value: string): value is ProfileId {
  return (PROFILE_IDS as readonly string[]).includes(value);
}

type DbRow = { id: ProfileId; data: Record<string, unknown>; version: string; updated_at: Date };

function toProfileRow(row: DbRow): ProfileRow {
  return {
    id: row.id,
    data: row.data,
    version: Number(row.version),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function listProfiles(): Promise<ProfileRow[]> {
  await ensureSchema();
  const { rows } = await getPool().query<DbRow>(
    'SELECT id, data, version, updated_at FROM profiles WHERE id = ANY($1) ORDER BY id',
    [PROFILE_IDS as unknown as string[]],
  );
  return rows.map(toProfileRow);
}

export async function getProfile(id: ProfileId): Promise<ProfileRow | null> {
  await ensureSchema();
  const { rows } = await getPool().query<DbRow>(
    'SELECT id, data, version, updated_at FROM profiles WHERE id = $1',
    [id],
  );
  return rows[0] ? toProfileRow(rows[0]) : null;
}

/** Insert or replace a profile; bumps the version so other devices pick it up. */
export async function saveProfile(id: ProfileId, data: Record<string, unknown>): Promise<ProfileRow> {
  await ensureSchema();
  const { rows } = await getPool().query<DbRow>(
    `INSERT INTO profiles (id, data, version, updated_at)
     VALUES ($1, $2::jsonb, 1, now())
     ON CONFLICT (id) DO UPDATE
       SET data = EXCLUDED.data,
           version = profiles.version + 1,
           updated_at = now()
     RETURNING id, data, version, updated_at`,
    [id, JSON.stringify(data)],
  );
  return toProfileRow(rows[0]);
}
