import { json, requireUser, route } from '@/lib/http';
import { listRewardsForStudent } from '@/lib/rewards';

export const dynamic = 'force-dynamic';

/** GET /api/me/rewards — rewards set by parents + recent/pending redemptions. */
export const GET = route(async () => {
  const student = await requireUser('student');
  return json(await listRewardsForStudent(student.id));
});
