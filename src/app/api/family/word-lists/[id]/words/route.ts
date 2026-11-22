import { guardianContext } from '@/lib/family';
import { json, readJson, route } from '@/lib/http';
import { addWords } from '@/lib/words';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/family/word-lists/:id/words { text }
 * One word per line, optionally "word - תרגום". Duplicates are skipped.
 */
export const POST = route<Ctx>(async (req, { params }) => {
  const { familyId } = await guardianContext(req);
  const body = await readJson(req, 64 * 1024);
  return json(await addWords(familyId, (await params).id, body.text), 201);
});
