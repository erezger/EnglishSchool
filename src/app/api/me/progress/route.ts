import { HttpError, json, readJson, requireUser, route } from '@/lib/http';
import { getProgress, MAX_PROGRESS_BYTES, saveProgressIfVersion } from '@/lib/progress';

export const dynamic = 'force-dynamic';

/** GET /api/me/progress — the logged-in student's progress + version. */
export const GET = route(async () => {
  const student = await requireUser('student');
  const progress = await getProgress(student.id);
  if (!progress) throw new HttpError(404, 'not_found');
  return json(progress);
});

/**
 * PUT /api/me/progress  { data, baseVersion }
 * 200 { version }                       — saved
 * 409 { error:'conflict', current }     — server changed meanwhile (e.g. parent reset); client adopts `current`
 */
export const PUT = route(async (req) => {
  const student = await requireUser('student');
  const body = await readJson<{ data?: unknown; baseVersion?: unknown }>(req, MAX_PROGRESS_BYTES);
  const { data } = body;
  const baseVersion = Number(body.baseVersion);
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new HttpError(400, 'invalid_progress');
  if (!Number.isInteger(baseVersion) || baseVersion < 1) throw new HttpError(400, 'invalid_version');

  const result = await saveProgressIfVersion(student.id, data as Record<string, unknown>, baseVersion);
  if (!result.ok) return json({ error: 'conflict', current: result.current }, 409);
  return json({ version: result.version });
});
