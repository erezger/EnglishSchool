import { confirmActorPassword, getMember, guardianContext, setStudentPin } from '@/lib/family';
import { json, readJson, route } from '@/lib/http';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/** POST /api/family/students/:id/pin { pin, confirmPassword } — sets/changes the kid's 4-digit code. */
export const POST = route<Ctx>(async (req, { params }) => {
  const { user, familyId } = await guardianContext(req);
  const student = await getMember(familyId, (await params).id, 'student');
  const body = await readJson(req, 1024);
  await confirmActorPassword(user, body.confirmPassword);
  await setStudentPin(user, student, body.pin);
  return json({ ok: true });
});
