import { guardianContext } from '@/lib/family';
import { json, readJson, route } from '@/lib/http';
import { resolveRedemption } from '@/lib/rewards';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/** POST /api/family/redemptions/:id { action: 'fulfill' | 'cancel' } — cancel refunds the coins. */
export const POST = route<Ctx>(async (req, { params }) => {
  const { user, familyId } = await guardianContext(req);
  const body = await readJson(req, 1024);
  await resolveRedemption(user, familyId, (await params).id, body.action);
  return json({ ok: true });
});
