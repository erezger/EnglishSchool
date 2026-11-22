import { openCheckFor } from '@/lib/checks';
import { json, requireUser, route } from '@/lib/http';

export const dynamic = 'force-dynamic';

/** GET /api/me/check — the open check (questions without answers), or null. */
export const GET = route(async () => {
  const student = await requireUser('student');
  return json({ check: await openCheckFor(student.id) });
});
