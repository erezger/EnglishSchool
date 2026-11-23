import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import PracticeHub, { type HubItem } from '@/components/kid/PracticeHub';
import { meaningIndex, openCheckFor } from '@/lib/checks';
import { getProgress } from '@/lib/progress';
import { dailyReviewOf, planSession, todayStr } from '@/lib/review';
import { minutesToday } from '@/lib/activity';
import { getKidSettings } from '@/lib/kid-settings';
import { moduleEnabled, type ModuleId } from '@/lib/modules';
import { getCurrentUser } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'תרגולים | אנגלית בקליק PRO' };

/** All practice activities in one place — students only. */
export default async function PracticePage({ searchParams }: { searchParams: Promise<{ off?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'student' || !user.familyId) redirect('/parent');

  const [progress, check, meanings, settings] = await Promise.all([
    getProgress(user.id),
    openCheckFor(user.id),
    meaningIndex(user.familyId),
    getKidSettings(user.id),
  ]);
  const todayMinutes = settings.dailyGoalMinutes ? await minutesToday(user.id) : 0;
  const { off } = await searchParams;
  const data = progress?.data ?? {};
  const today = todayStr();
  const review = planSession(data, meanings, today);
  const daily = dailyReviewOf(data);

  const items: HubItem[] = [
    ...(check ? [{ href: '/practice/check', icon: '📝', title: 'מבחן מההורים', desc: `${check.total} שאלות מחכות לך`, badge: 'חדש!', tone: 'amber' as const }] : []),
    {
      href: '/practice/daily',
      icon: '⏰',
      title: '5 דקות ביום',
      desc: daily.last === today ? 'סיימת להיום! 🎉 אפשר עוד סבב' : review.keys.length ? `${review.keys.length} דברים לחזרה היום` : 'אין מה לחזור היום',
      badge: daily.streak > 0 ? `🔥 ${daily.streak}` : undefined,
      tone: 'sky',
    },
    { href: '/practice/spell', icon: '🐝', title: 'שומעים ומאייתים', desc: 'מאייתים מילים לפי שמות האותיות', tone: 'yellow' },
    { href: '/practice/dictation', icon: '✍️', title: 'הכתבה', desc: 'שומעים משפט שלם ומקלידים', tone: 'indigo' },
    { href: '/practice/reading', icon: '📖', title: 'קוראים ומבינים', desc: 'סיפורים קצרים עם שאלות הבנה', tone: 'pink' },
    { href: '/practice/speaking', icon: '🎤', title: 'אומרים בקול', desc: 'אומרים מילים באנגלית למיקרופון', tone: 'amber' },
    { href: '/practice/grammar', icon: '📘', title: 'דקדוק', desc: 'am/is/are, have/has, רבים ועוד', tone: 'emerald' },
    ...(data.placement ? [] : [{ href: '/practice/placement', icon: '🧭', title: 'מבחן מיקום', desc: 'מדלגים על מה שכבר יודעים', tone: 'violet' as const }]),
  ];

  const moduleOf = (href: string) => href.split('/')[2];
  const visible = items.filter((it) => {
    const m = moduleOf(it.href);
    return !m || m === 'check' || moduleEnabled(settings, m as ModuleId);
  });
  return (
    <PracticeHub
      displayName={user.displayName}
      coins={Number(data.coins) || 0}
      items={visible}
      goal={settings.dailyGoalMinutes ? { minutes: todayMinutes, target: settings.dailyGoalMinutes } : undefined}
      notice={off ? 'התרגול הזה סגור כרגע (ההורים קבעו) 🙂' : undefined}
    />
  );
}
