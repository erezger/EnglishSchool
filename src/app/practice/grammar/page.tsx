import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import GrammarGame from '@/components/grammar/GrammarGame';
import { getProgress } from '@/lib/progress';
import { requireModule } from '@/lib/kid-settings';
import { getCurrentUser } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'דקדוק | אנגלית בקליק PRO' };

/** Grammar mini-games — students only. */
export default async function GrammarPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'student') redirect('/parent');
  await requireModule(user.id, 'grammar');
  const progress = await getProgress(user.id);
  if (!progress) redirect('/');
  return <GrammarGame displayName={user.displayName} progress={{ data: progress.data, version: progress.version }} />;
}
