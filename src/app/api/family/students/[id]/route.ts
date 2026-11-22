import { confirmActorPassword, deleteMember, getMember, guardianContext, renameMember } from '@/lib/family';
import { json, readJson, route } from '@/lib/http';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/family/students/:id { displayName } */
export const PATCH = route<Ctx>(async (req, { params }) => {
  const { user, familyId } = await guardianContext(req);
  const student = await getMember(familyId, (await params).id, 'student');
  await renameMember(user, student, await readJson(req, 1024));
  return json({ ok: true });
});

/** DELETE /api/family/students/:id { confirmPassword } — removes the kid and all their progress. */
export const DELETE = route<Ctx>(async (req, { params }) => {
  const { user, familyId } = await guardianContext(req);
  const student = await getMember(familyId, (await params).id, 'student');
  const body = await readJson(req, 1024);
  await confirmActorPassword(user, body.confirmPassword);
  await deleteMember(user, familyId, student);
  return json({ ok: true });
});
