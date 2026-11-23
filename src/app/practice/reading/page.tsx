import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Reading from '@/components/reading/Reading';
import { query } from '@/lib/db';
import { getProgress } from '@/lib/progress';
import { requireModule } from '@/lib/kid-settings';
import { getCurrentUser } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'קוראים ומבינים | אנגלית בקליק PRO' };

/** Reading comprehension stories — students only. */
export default async function ReadingPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'student') redirect('/parent');
  await requireModule(user.id, 'reading');
  const [progress, gradeRow] = await Promise.all([
    getProgress(user.id),
    query<{ grade: number | null }>('SELECT grade FROM users WHERE id = $1', [user.id]),
  ]);
  if (!progress) redirect('/');
  return <Reading displayName={user.displayName} progress={{ data: progress.data, version: progress.version }} grade={gradeRow.rows[0]?.grade ?? null} />;
}
