import { createGuardian, guardianContext } from '@/lib/family';
import { json, readJson, route } from '@/lib/http';

export const dynamic = 'force-dynamic';

/** POST /api/family/guardians { username, displayName, password } — add a parent/teacher/mentor. */
export const POST = route(async (req) => {
  const { user, familyId } = await guardianContext(req);
  return json(await createGuardian(user, familyId, await readJson(req, 4096)), 201);
});
