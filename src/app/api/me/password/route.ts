import { audit } from '@/lib/audit';
import { query } from '@/lib/db';
import { confirmActorPassword } from '@/lib/family';
import { HttpError, json, readJson, requireUser, route } from '@/lib/http';
import { hashSecret, isValidPassword } from '@/lib/passwords';
import { allow } from '@/lib/rate-limit';
import { destroyOtherSessions } from '@/lib/session';

export const dynamic = 'force-dynamic';

/** POST /api/me/password { currentPassword, newPassword } — parents/admin change their own password. */
export const POST = route(async (req) => {
  const user = await requireUser('parent', 'admin');
  if (!allow(`pw:${user.id}`, 10, 10 * 60_000)) throw new HttpError(429, 'rate_limited', 'יותר מדי ניסיונות');
  const body = await readJson(req, 2048);
  await confirmActorPassword(user, body.currentPassword);
  if (!isValidPassword(body.newPassword)) throw new HttpError(400, 'invalid_password', 'סיסמה: לפחות 8 תווים');
  await query('UPDATE users SET secret_hash = $2 WHERE id = $1', [user.id, await hashSecret(body.newPassword)]);
  await destroyOtherSessions(user.id); // log out other devices, keep this one
  await audit(user.id, 'user.secret_change', user.id);
  return json({ ok: true });
});
