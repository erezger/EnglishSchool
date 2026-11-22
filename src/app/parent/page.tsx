import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import ParentDashboard from '@/components/parent/ParentDashboard';
import { getCurrentUser } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'אזור הורים | אנגלית בקליק PRO' };

export default async function ParentPage({ searchParams }: { searchParams: Promise<{ familyId?: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role === 'student') redirect('/login?next=/parent&mode=parent');

  const { familyId } = await searchParams;
  // Admin may open any family; a parent always sees only their own (enforced again by the API).
  const scopedFamily = user.role === 'admin' ? familyId || undefined : undefined;
  if (user.role === 'admin' && !scopedFamily && !user.familyId) redirect('/admin');

  return (
    <ParentDashboard
      me={{ id: user.id, displayName: user.displayName, username: user.username, role: user.role }}
      familyId={scopedFamily}
    />
  );
}
