import { json, route } from '@/lib/http';
import { destroySession } from '@/lib/session';

export const dynamic = 'force-dynamic';

/** POST /api/auth/logout */
export const POST = route(async () => {
  await destroySession();
  return json({ ok: true });
});
