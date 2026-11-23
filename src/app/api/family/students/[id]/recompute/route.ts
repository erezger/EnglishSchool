import { getMember, guardianContext } from '@/lib/family';
import { json, readJson, route } from '@/lib/http';
import { applyRecompute, estimateCoins } from '@/lib/recompute';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/family/students/:id/recompute — what the balance would be under the current coin rules (with the lines). */
export const GET = route<Ctx>(async (req, { params }) => {
  const { familyId } = await guardianContext(req);
  const student = await getMember(familyId, (await params).id, 'student');
  return json(await estimateCoins(student.id));
});

/** POST { target } — sets the balance (the kid sees it as a parent coin change) and marks finished tests as paid. */
export const POST = route<Ctx>(async (req, { params }) => {
  const { user, familyId } = await guardianContext(req);
  const student = await getMember(familyId, (await params).id, 'student');
  return json(await applyRecompute(user, student.id, await readJson(req, 1024)));
});
