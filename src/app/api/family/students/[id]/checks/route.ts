import { createCheck } from '@/lib/checks';
import { getMember, guardianContext } from '@/lib/family';
import { json, readJson, route } from '@/lib/http';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/** POST /api/family/students/:id/checks { scopes: ('letters'|'words'|'spelling')[], size: 5|10|15|20 } */
export const POST = route<Ctx>(async (req, { params }) => {
  const { user, familyId } = await guardianContext(req);
  const student = await getMember(familyId, (await params).id, 'student');
  return json(await createCheck(user, familyId, student.id, await readJson(req, 1024)), 201);
});
