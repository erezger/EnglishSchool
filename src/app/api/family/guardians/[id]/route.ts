import { confirmActorPassword, deleteMember, getMember, guardianContext } from '@/lib/family';
import { json, readJson, route } from '@/lib/http';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/** DELETE /api/family/guardians/:id { confirmPassword } */
export const DELETE = route<Ctx>(async (req, { params }) => {
  const { user, familyId } = await guardianContext(req);
  const guardian = await getMember(familyId, (await params).id, 'guardian');
  const body = await readJson(req, 1024);
  await confirmActorPassword(user, body.confirmPassword);
  await deleteMember(user, familyId, guardian);
  return json({ ok: true });
});
