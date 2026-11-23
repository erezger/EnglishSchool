import { aiEnabled } from '@/lib/ai';
import { guardianContext } from '@/lib/family';
import { json, readJson, route } from '@/lib/http';
import { createList, familyWordLists } from '@/lib/words';

export const dynamic = 'force-dynamic';

/** GET /api/family/word-lists — all lists with their words (+ whether AI completion is available). */
export const GET = route(async (req) => {
  const { familyId } = await guardianContext(req);
  return json({ lists: await familyWordLists(familyId), aiEnabled: aiEnabled() });
});

/** POST /api/family/word-lists { title, studentId? } — studentId null/empty = every kid in the family. */
export const POST = route(async (req) => {
  const { user, familyId } = await guardianContext(req);
  return json(await createList(user, familyId, await readJson(req, 2048)), 201);
});
