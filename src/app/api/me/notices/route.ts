import { meaningIndex, openCheckFor, unseenAdjustments } from '@/lib/checks';
import { json, requireUser, route } from '@/lib/http';
import { getProgress } from '@/lib/progress';
import { getKidSettings } from '@/lib/kid-settings';
import { moduleEnabled } from '@/lib/modules';
import { dailyReviewOf, planSession, todayStr } from '@/lib/review';

export const dynamic = 'force-dynamic';

/** GET /api/me/notices — parent coin changes not seen yet, a waiting check, and today's review. */
export const GET = route(async () => {
  const student = await requireUser('student');
  const [adjustments, check, progress, meanings, settings] = await Promise.all([
    unseenAdjustments(student.id),
    openCheckFor(student.id),
    getProgress(student.id),
    student.familyId ? meaningIndex(student.familyId) : Promise.resolve(new Map()),
    getKidSettings(student.id),
  ]);
  const today = todayStr();
  const data = progress?.data ?? {};
  const plan = planSession(data, meanings, today);
  return json({
    adjustments,
    openCheck: check ? { id: check.id, total: check.total } : null,
    review: { count: moduleEnabled(settings, 'daily') ? plan.keys.length : 0, doneToday: dailyReviewOf(data).last === today, streak: dailyReviewOf(data).streak },
  });
});
