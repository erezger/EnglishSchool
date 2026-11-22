import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import DailyReview from '@/components/review/DailyReview';
import { meaningIndex } from '@/lib/checks';
import { getProgress } from '@/lib/progress';
import { buildExercises, dailyReviewOf, planSession, todayStr } from '@/lib/review';
import { getCurrentUser } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: '5 דקות ביום | אנגלית בקליק PRO' };

/** Daily spaced-repetition review — students only. */
export default async function DailyPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'student' || !user.familyId) redirect('/parent');

  const progress = await getProgress(user.id);
  if (!progress) redirect('/');
  const meanings = await meaningIndex(user.familyId);
  const today = todayStr();
  const plan = planSession(progress.data, meanings, today);

  return (
    <DailyReview
      displayName={user.displayName}
      progress={{ data: progress.data, version: progress.version }}
      today={today}
      exercises={buildExercises(plan.keys, meanings)}
      dueCount={plan.dueCount}
      newCount={plan.newCount}
      daily={dailyReviewOf(progress.data)}
    />
  );
}
