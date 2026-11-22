import { guardianContext } from '@/lib/family';
import { json, readJson, route } from '@/lib/http';
import { deleteWord, updateWord } from '@/lib/words';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/family/words/:id { word?, hebrew?, emoji?, exampleEn?, exampleHe? } — also marks it reviewed. */
export const PATCH = route<Ctx>(async (req, { params }) => {
  const { familyId } = await guardianContext(req);
  await updateWord(familyId, (await params).id, await readJson(req, 4096));
  return json({ ok: true });
});

/** DELETE /api/family/words/:id */
export const DELETE = route<Ctx>(async (req, { params }) => {
  const { familyId } = await guardianContext(req);
  await deleteWord(familyId, (await params).id);
  return json({ ok: true });
});
