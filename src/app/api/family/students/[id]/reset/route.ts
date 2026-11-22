import { audit } from '@/lib/audit';
import { withTransaction } from '@/lib/db';
import { confirmActorPassword, getMember, guardianContext } from '@/lib/family';
import { json, readJson, route } from '@/lib/http';
import { resetProgress } from '@/lib/progress';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/family/students/:id/reset { confirmPassword }
 * Only guardians of the kid's family. Students have no route to this at all.
 */
export const POST = route<Ctx>(async (req, { params }) => {
  const { user, familyId } = await guardianContext(req);
  const student = await getMember(familyId, (await params).id, 'student');
  const body = await readJson(req, 1024);
  await confirmActorPassword(user, body.confirmPassword);
  await withTransaction(async (client) => {
    await resetProgress(client, student.id);
    await audit(user.id, 'progress.reset', student.id, { username: student.username }, client);
  });
  return json({ ok: true });
});
