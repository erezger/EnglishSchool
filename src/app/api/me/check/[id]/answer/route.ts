import { answerQuestion } from '@/lib/checks';
import { HttpError, json, readJson, requireUser, route } from '@/lib/http';
import { allow } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/** POST /api/me/check/:id/answer { index, answer } — first answer to a question counts. */
export const POST = route<Ctx>(async (req, { params }) => {
  const student = await requireUser('student');
  if (!allow(`check-answer:${student.id}`, 120, 60_000)) throw new HttpError(429, 'rate_limited');
  const body = await readJson(req, 1024);
  return json(await answerQuestion(student.id, (await params).id, body.index, body.answer));
});
