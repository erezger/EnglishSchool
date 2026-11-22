import { getMember, guardianContext } from '@/lib/family';
import { json, readJson, route } from '@/lib/http';
import { createReward } from '@/lib/rewards';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/** POST /api/family/students/:id/rewards { title, cost } — only guardians can define rewards. */
export const POST = route<Ctx>(async (req, { params }) => {
  const { user, familyId } = await guardianContext(req);
  const student = await getMember(familyId, (await params).id, 'student');
  return json(await createReward(user, student.id, await readJson(req, 2048)), 201);
});
