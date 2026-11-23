import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Dictation, { type DictationSource } from '@/components/dictation/Dictation';
import { DICTATION } from '@/content/dictation';
import { SENTENCES } from '@/content/phonics';
import { gradeLabel } from '@/content/wordbank';
import { query } from '@/lib/db';
import { getProgress } from '@/lib/progress';
import { requireModule } from '@/lib/kid-settings';
import { getCurrentUser } from '@/lib/session';
import { studentWordLists } from '@/lib/words';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'הכתבה | אנגלית בקליק PRO' };

/** Sentence dictation — students only. */
export default async function DictationPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'student' || !user.familyId) redirect('/parent');
  await requireModule(user.id, 'dictation');

  const [progress, lists, gradeRow] = await Promise.all([
    getProgress(user.id),
    studentWordLists(user.familyId, user.id),
    query<{ grade: number | null }>('SELECT grade FROM users WHERE id = $1', [user.id]),
  ]);
  if (!progress) redirect('/');
  const grade = gradeRow.rows[0]?.grade ?? null;

  const fromLists = lists.flatMap((l) =>
    l.words
      .filter((w) => w.exampleEn.trim().split(/\s+/).length >= 3)
      .map((w) => ({ id: `ex:${w.id}`, text: w.exampleEn, hebrew: w.exampleHe, emoji: w.emoji })),
  );
  const grades = Object.keys(DICTATION).map(Number).sort((a, b) => (a === grade ? -1 : b === grade ? 1 : a - b));
  const sources: DictationSource[] = [
    { id: 'lists', title: 'משפטים מהרשימות שלי', icon: '📚', items: fromLists },
    ...grades.map((g) => ({ id: `grade:${g}`, title: `משפטים לכיתה ${gradeLabel(g)}`, icon: '🎓', items: DICTATION[g] })),
    { id: 'game', title: 'משפטים מהמשחק (שלב 7)', icon: '🎮', items: SENTENCES.map((s) => ({ id: `game:${s.id}`, text: s.text, hebrew: s.hebrew, emoji: s.emoji })) },
  ];

  return <Dictation displayName={user.displayName} progress={{ data: progress.data, version: progress.version }} sources={sources} />;
}
