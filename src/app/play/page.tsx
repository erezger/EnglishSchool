import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import GameApp from '@/components/game/GameApp';
import { getKidSettings } from '@/lib/kid-settings';
import { getProgress } from '@/lib/progress';
import { getCurrentUser } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'אנגלית בקליק PRO' };

/** The React version of the main game (in progress; "/" still serves the original until it's complete). */
export default async function PlayPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'student') redirect('/parent');
  const [progress, settings] = await Promise.all([getProgress(user.id), getKidSettings(user.id)]);
  if (!progress) redirect('/');
  return (
    <GameApp
      user={{ id: user.id, displayName: user.displayName }}
      settings={settings}
      progress={{ data: progress.data, version: progress.version }}
    />
  );
}
