import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Speaking, { type SpeakSource } from '@/components/speaking/Speaking';
import { PHONICS_WORDS } from '@/content/phonics';
import { gradeLabel, WORD_BANK } from '@/content/wordbank';
import { meaningIndex } from '@/lib/checks';
import { query } from '@/lib/db';
import { getProgress } from '@/lib/progress';
import { getCurrentUser } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'אומרים בקול | אנגלית בקליק PRO' };

/** Speaking practice (speech recognition) — students only. */
export default async function SpeakingPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'student' || !user.familyId) redirect('/parent');

  const [progress, meanings, gradeRow] = await Promise.all([
    getProgress(user.id),
    meaningIndex(user.familyId),
    query<{ grade: number | null }>('SELECT grade FROM users WHERE id = $1', [user.id]),
  ]);
  if (!progress) redirect('/');
  const data = progress.data;
  const grade = gradeRow.rows[0]?.grade ?? null;

  // "My words": words practiced in spelling or read in the game
  const mine = new Set<string>([
    ...Object.keys((data.spellingStats as Record<string, unknown>) ?? {}),
    ...(Array.isArray(data.readWords) ? (data.readWords as string[]) : []),
  ]);
  const myWords = [...mine]
    .map((w) => ({ word: w, ...(meanings.get(w) ?? { hebrew: '', emoji: '' }) }))
    .filter((w) => w.hebrew);
  const grades = Object.keys(WORD_BANK).map(Number).sort((a, b) => (a === grade ? -1 : b === grade ? 1 : a - b));

  const sources: SpeakSource[] = [
    { id: 'mine', title: 'המילים שלי', icon: '⭐', words: myWords },
    ...grades.map((g) => ({
      id: `grade:${g}`,
      title: `מילים לכיתה ${gradeLabel(g)}`,
      icon: '🎓',
      words: WORD_BANK[g].flatMap((t) => t.words).map((w) => ({ word: w.word, hebrew: w.hebrew, emoji: w.emoji })),
    })),
    { id: 'game', title: 'מילים מהמשחק', icon: '🎮', words: PHONICS_WORDS.map((w) => ({ word: w.word, hebrew: w.hebrew, emoji: w.emoji })) },
  ];

  return <Speaking displayName={user.displayName} progress={{ data, version: progress.version }} sources={sources} />;
}
