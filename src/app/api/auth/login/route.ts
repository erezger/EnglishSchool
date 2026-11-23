import type { NextRequest } from 'next/server';
import { audit } from '@/lib/audit';
import { query } from '@/lib/db';
import { clientIp, HttpError, json, readJson, route } from '@/lib/http';
import { burnVerifyTime, normalizeUsername, verifySecret } from '@/lib/passwords';
import { allow } from '@/lib/rate-limit';
import { createSession, destroySession, pruneExpiredSessions, type Role } from '@/lib/session';

export const dynamic = 'force-dynamic';

/** Login attempts per IP per 10 minutes (raise only for automated test runs). */
const LOGIN_IP_LIMIT = Number(process.env.LOGIN_IP_LIMIT) || 30;
const MAX_FAILS_BEFORE_LOCK = 5;
const BASE_LOCK_MINUTES = 5;
const MAX_LOCK_MINUTES = 60;

type UserRow = {
  id: string;
  role: Role;
  display_name: string;
  secret_hash: string | null;
  failed_logins: number;
  locked_until: Date | null;
  disabled: boolean;
};

const BAD_CREDENTIALS = new HttpError(401, 'bad_credentials', 'שם משתמש או קוד/סיסמה שגויים');

/** POST /api/auth/login  { username, secret }  — secret is the 4-digit PIN (kids) or password (parents). */
export const POST = route(async (req) => {
  if (!allow(`login:ip:${clientIp(req)}`, LOGIN_IP_LIMIT, 10 * 60_000)) {
    throw new HttpError(429, 'rate_limited', 'יותר מדי ניסיונות. נסו שוב בעוד כמה דקות');
  }

  const body = await readJson(req, 4096);
  const username = normalizeUsername(body.username);
  const secret = typeof body.secret === 'string' ? body.secret : '';
  if (!username || !secret || secret.length > 128) throw BAD_CREDENTIALS;

  // One attempt at a time per username, so parallel guesses can't slip past the lockout.
  return serialized(username, () => attemptLogin(req, username, secret));
});

const userQueues = new Map<string, Promise<unknown>>();
function serialized<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prev = userQueues.get(key) ?? Promise.resolve();
  const next = prev.catch(() => {}).then(fn);
  userQueues.set(key, next);
  next.finally(() => {
    if (userQueues.get(key) === next) userQueues.delete(key);
  }).catch(() => {});
  return next;
}

async function attemptLogin(req: NextRequest, username: string, secret: string) {
  const { rows } = await query<UserRow>(
    `SELECT id, role, display_name, secret_hash, failed_logins, locked_until, disabled
       FROM users WHERE lower(username) = $1`,
    [username],
  );
  const user = rows[0];
  if (!user || user.disabled || !user.secret_hash) {
    await burnVerifyTime(secret); // same timing as a real check
    throw BAD_CREDENTIALS;
  }

  if (user.locked_until && user.locked_until.getTime() > Date.now()) {
    const minutes = Math.ceil((user.locked_until.getTime() - Date.now()) / 60_000);
    throw new HttpError(423, 'locked', `יותר מדי ניסיונות שגויים. נסו שוב בעוד ${minutes} דקות, או בקשו מהורה לשחרר`);
  }

  if (!(await verifySecret(secret, user.secret_hash))) {
    const fails = user.failed_logins + 1;
    let lockedUntil: Date | null = null;
    if (fails >= MAX_FAILS_BEFORE_LOCK) {
      const minutes = Math.min(MAX_LOCK_MINUTES, BASE_LOCK_MINUTES * 2 ** (fails - MAX_FAILS_BEFORE_LOCK));
      lockedUntil = new Date(Date.now() + minutes * 60_000);
    }
    await query('UPDATE users SET failed_logins = $2, locked_until = $3 WHERE id = $1', [user.id, fails, lockedUntil]);
    await audit(null, lockedUntil ? 'login.locked' : 'login.failed', user.id, { ip: clientIp(req), fails });
    throw BAD_CREDENTIALS;
  }

  await query('UPDATE users SET failed_logins = 0, locked_until = NULL, last_login_at = now() WHERE id = $1', [user.id]);
  await destroySession(); // drop whoever was logged in on this device before
  await createSession(user.id, req.headers.get('user-agent'));
  pruneExpiredSessions().catch(() => {});

  return json({ ok: true, role: user.role, displayName: user.display_name });
}
