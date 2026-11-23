import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import ReportView from '@/components/report/ReportView';
import { query } from '@/lib/db';
import { isUuid } from '@/lib/ids';
import { buildReport } from '@/lib/report';
import { getCurrentUser } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'דוח שבועי | אנגלית בקליק PRO' };

/** Weekly report for one kid — guardians of that kid's family (or admin). */
export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role === 'student') redirect('/login?next=/parent&mode=parent');
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const { rows } = await query<{ display_name: string; family_id: string }>(
    "SELECT display_name, family_id FROM users WHERE id = $1 AND role = 'student'",
    [id],
  );
  const kid = rows[0];
  // Parents only see kids of their own family; admin sees any.
  if (!kid || (user.role !== 'admin' && kid.family_id !== user.familyId)) notFound();

  const report = await buildReport(id, kid.family_id);
  const back = user.role === 'admin' && kid.family_id !== user.familyId ? `/parent?familyId=${kid.family_id}` : '/parent';
  return <ReportView name={kid.display_name} report={report} backHref={back} />;
}
