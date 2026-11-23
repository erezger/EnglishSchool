import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import PlacementTest from '@/components/placement/PlacementTest';
import { buildPlacement } from '@/lib/placement';
import { getProgress } from '@/lib/progress';
import { requireModule } from '@/lib/kid-settings';
import { getCurrentUser } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'מבחן מיקום | אנגלית בקליק PRO' };

/** Placement test — students only. */
export default async function PlacementPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'student') redirect('/parent');
  await requireModule(user.id, 'placement');
  const progress = await getProgress(user.id);
  if (!progress) redirect('/');
  return (
    <PlacementTest
      displayName={user.displayName}
      progress={{ data: progress.data, version: progress.version }}
      levels={buildPlacement()}
    />
  );
}
