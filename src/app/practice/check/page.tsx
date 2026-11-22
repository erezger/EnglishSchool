import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import CheckRunner from '@/components/check/CheckRunner';
import { openCheckFor } from '@/lib/checks';
import { getCurrentUser } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'מבחן | אנגלית בקליק PRO' };

/** The mastery check a parent sent — students only. */
export default async function CheckPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'student') redirect('/parent');
  const check = await openCheckFor(user.id);
  return <CheckRunner displayName={user.displayName} check={check} />;
}
