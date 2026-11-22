import { cancelCheck } from '@/lib/checks';
import { guardianContext } from '@/lib/family';
import { json, route } from '@/lib/http';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/** DELETE /api/family/checks/:id — cancel a check that wasn't finished yet. */
export const DELETE = route<Ctx>(async (req, { params }) => {
  const { familyId } = await guardianContext(req);
  await cancelCheck(familyId, (await params).id);
  return json({ ok: true });
});
