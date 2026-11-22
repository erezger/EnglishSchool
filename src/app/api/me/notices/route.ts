import { openCheckFor, unseenAdjustments } from '@/lib/checks';
import { json, requireUser, route } from '@/lib/http';

export const dynamic = 'force-dynamic';

/** GET /api/me/notices — coin changes by parents not seen yet + whether a check is waiting. */
export const GET = route(async () => {
  const student = await requireUser('student');
  const [adjustments, check] = await Promise.all([unseenAdjustments(student.id), openCheckFor(student.id)]);
  return json({ adjustments, openCheck: check ? { id: check.id, total: check.total } : null });
});
