import { guardianContext } from '@/lib/family';
import { json, readJson, route } from '@/lib/http';
import { deleteList, updateList } from '@/lib/words';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/family/word-lists/:id { title, studentId? } */
export const PATCH = route<Ctx>(async (req, { params }) => {
  const { familyId } = await guardianContext(req);
  await updateList(familyId, (await params).id, await readJson(req, 2048));
  return json({ ok: true });
});

/** DELETE /api/family/word-lists/:id */
export const DELETE = route<Ctx>(async (req, { params }) => {
  const { user, familyId } = await guardianContext(req);
  await deleteList(user, familyId, (await params).id);
  return json({ ok: true });
});
