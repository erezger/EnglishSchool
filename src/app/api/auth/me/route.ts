import { json, requireUser, route } from '@/lib/http';

export const dynamic = 'force-dynamic';

/** GET /api/auth/me — the logged-in user (401 if not logged in). */
export const GET = route(async () => {
  const user = await requireUser();
  return json({ user });
});
