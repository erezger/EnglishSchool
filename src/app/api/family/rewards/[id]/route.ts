import { guardianContext } from '@/lib/family';
import { json, route } from '@/lib/http';
import { deleteReward } from '@/lib/rewards';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/** DELETE /api/family/rewards/:id */
export const DELETE = route<Ctx>(async (req, { params }) => {
  const { user, familyId } = await guardianContext(req);
  await deleteReward(user, familyId, (await params).id);
  return json({ ok: true });
});
