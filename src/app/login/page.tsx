import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import LoginForm from '@/components/LoginForm';
import { getCurrentUser } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'כניסה | אנגלית בקליק PRO' };

type Search = Promise<{ next?: string; mode?: string; expired?: string }>;

export default async function LoginPage({ searchParams }: { searchParams: Search }) {
  const { next, mode, expired } = await searchParams;
  const user = await getCurrentUser();

  // Already logged in and nothing else requested -> straight to the right place
  if (user && !next && !mode) {
    redirect(user.role === 'student' ? '/' : '/parent');
  }

  const notice =
    expired === '1'
      ? 'החיבור הסתיים, צריך להתחבר שוב'
      : next === '/parent' && user?.role === 'student'
        ? 'אזור ההורים דורש התחברות של הורה'
        : undefined;

  return <LoginForm initialMode={mode === 'parent' ? 'parent' : 'student'} next={next} notice={notice} />;
}
