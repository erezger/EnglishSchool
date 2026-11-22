import { allow } from '@/lib/rate-limit';
import { HttpError, json, readJson, requireUser, route } from '@/lib/http';
import { redeemReward } from '@/lib/rewards';

export const dynamic = 'force-dynamic';

/** POST /api/me/redemptions { rewardId } — coins deducted now; shows as pending until a parent marks it done. */
export const POST = route(async (req) => {
  const student = await requireUser('student');
  if (!allow(`redeem:${student.id}`, 20, 60_000)) throw new HttpError(429, 'rate_limited', 'רגע, לאט לאט 🙂');
  const body = await readJson(req, 1024);
  return json(await redeemReward(student, body.rewardId));
});
