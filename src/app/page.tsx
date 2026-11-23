import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import GameApp from '@/components/game/GameApp';
import { getKidSettings } from '@/lib/kid-settings';
import { defaultProgress, getProgress } from '@/lib/progress';
import { getCurrentUser } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'אנגלית בקליק PRO' };

/** Students play here; guardians go to their dashboard; everyone else logs in. */
export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'student') redirect('/parent');
  const [progress, settings] = await Promise.all([getProgress(user.id), getKidSettings(user.id)]);
  return (
    <GameApp
      user={{ id: user.id, displayName: user.displayName }}
      settings={settings}
      progress={progress ? { data: progress.data, version: progress.version } : { data: defaultProgress(), version: 0 }}
    />
  );
}
