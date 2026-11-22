import { createStudent, guardianContext } from '@/lib/family';
import { json, readJson, route } from '@/lib/http';

export const dynamic = 'force-dynamic';

/** POST /api/family/students { username, displayName, pin, avatar?, pet?, theme? } */
export const POST = route(async (req) => {
  const { user, familyId } = await guardianContext(req);
  const body = await readJson(req, 4096);
  return json(await createStudent(user, familyId, body), 201);
});
