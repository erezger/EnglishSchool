import { cleanActivity, recordActivity } from '@/lib/activity';
import { HttpError, json, readJson, requireUser, route } from '@/lib/http';
import { allow } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

/** POST /api/me/activity { module, answers, correct, seconds } — adds to today's activity. */
export const POST = route(async (req) => {
  const student = await requireUser('student');
  if (!allow(`activity:${student.id}`, 60, 60_000)) throw new HttpError(429, 'rate_limited');
  await recordActivity(student.id, cleanActivity(await readJson(req, 1024)));
  return json({ ok: true });
});
