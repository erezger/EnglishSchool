import { getMember, guardianContext, unlockMember } from '@/lib/family';
import { json, route } from '@/lib/http';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/** POST /api/family/students/:id/unlock — clears a lockout after too many wrong codes. */
export const POST = route<Ctx>(async (req, { params }) => {
  const { familyId } = await guardianContext(req);
  const student = await getMember(familyId, (await params).id, 'student');
  await unlockMember(student);
  return json({ ok: true });
});
