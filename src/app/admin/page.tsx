import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import AdminFamilies from '@/components/AdminFamilies';
import { getCurrentUser } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'ניהול | אנגלית בקליק PRO' };

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/admin&mode=parent');
  if (user.role !== 'admin') redirect(user.role === 'student' ? '/' : '/parent');
  return <AdminFamilies myFamilyId={user.familyId} />;
}
