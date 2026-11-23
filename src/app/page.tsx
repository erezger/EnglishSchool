import { redirect } from 'next/navigation';
import LegacyApp from '@/components/LegacyApp';
import { getProgress } from '@/lib/progress';
import { getKidSettings } from '@/lib/kid-settings';
import { getCurrentUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

/** Students play here; guardians go to their dashboard; everyone else logs in. */
export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'student') redirect('/parent');

  const [progress, settings] = await Promise.all([getProgress(user.id), getKidSettings(user.id)]);
  return (
    <LegacyApp
      boot={{
        user: { id: user.id, username: user.username, displayName: user.displayName },
        progress,
        settings,
      }}
    />
  );
}
