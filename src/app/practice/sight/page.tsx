import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import SightWords from '@/components/sight/SightWords';
import { requireModule } from '@/lib/kid-settings';
import { getProgress } from '@/lib/progress';
import { getCurrentUser } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'קריאה מהירה | אנגלית בקליק PRO' };

/** Sight-word speed reading — students only. */
export default async function SightPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'student') redirect('/parent');
  await requireModule(user.id, 'sight');
  const progress = await getProgress(user.id);
  if (!progress) redirect('/');
  return <SightWords displayName={user.displayName} progress={{ data: progress.data, version: progress.version }} />;
}
