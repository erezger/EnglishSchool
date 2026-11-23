import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import SpellingGame from '@/components/spelling/SpellingGame';
import { WORD_BANK } from '@/content/wordbank';
import { query } from '@/lib/db';
import { getProgress } from '@/lib/progress';
import { requireModule } from '@/lib/kid-settings';
import { getCurrentUser } from '@/lib/session';
import { studentWordLists } from '@/lib/words';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'שומעים ומאייתים | אנגלית בקליק PRO' };

/** Spelling practice — students only. */
export default async function SpellPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'student' || !user.familyId) redirect('/parent');
  await requireModule(user.id, 'spell');

  const [progress, lists, gradeRow] = await Promise.all([
    getProgress(user.id),
    studentWordLists(user.familyId, user.id),
    query<{ grade: number | null }>('SELECT grade FROM users WHERE id = $1', [user.id]),
  ]);
  if (!progress) redirect('/');

  return (
    <SpellingGame
      displayName={user.displayName}
      progress={{ data: progress.data, version: progress.version }}
      grade={gradeRow.rows[0]?.grade ?? null}
      lists={lists}
      bank={WORD_BANK}
    />
  );
}
