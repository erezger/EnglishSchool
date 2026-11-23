import { markAdjustmentsSeen } from '@/lib/checks';
import { json, readJson, requireUser, route } from '@/lib/http';

export const dynamic = 'force-dynamic';

/** POST /api/me/notices/seen { ids } */
export const POST = route(async (req) => {
  const student = await requireUser('student');
  const body = await readJson(req, 4096);
  await markAdjustmentsSeen(student.id, body.ids);
  return json({ ok: true });
});
