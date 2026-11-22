import { finishCheck } from '@/lib/checks';
import { json, requireUser, route } from '@/lib/http';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/** POST /api/me/check/:id/finish — grades on the server and applies the result to progress. */
export const POST = route<Ctx>(async (_req, { params }) => {
  const student = await requireUser('student');
  return json(await finishCheck(student.id, (await params).id));
});
