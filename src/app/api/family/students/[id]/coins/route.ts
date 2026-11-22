import { adjustCoinsWithReason } from '@/lib/checks';
import { getMember, guardianContext } from '@/lib/family';
import { json, readJson, route } from '@/lib/http';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/** POST /api/family/students/:id/coins { amount (+/-), reason } — the kid sees the reason. */
export const POST = route<Ctx>(async (req, { params }) => {
  const { user, familyId } = await guardianContext(req);
  const student = await getMember(familyId, (await params).id, 'student');
  return json(await adjustCoinsWithReason(user, student.id, await readJson(req, 1024)));
});
