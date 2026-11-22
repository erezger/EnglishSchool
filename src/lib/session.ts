import { createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { query } from './db';

export const SESSION_COOKIE = 'ec_session';
const SESSION_TTL_DAYS = 30;
const TOUCH_AFTER_MS = 24 * 60 * 60 * 1000; // extend expiry at most once a day

export type Role = 'admin' | 'parent' | 'student';

export type SessionUser = {
  id: string;
  role: Role;
  username: string;
  displayName: string;
  familyId: string | null;
};

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function cookieSecure(): boolean {
  if (process.env.COOKIE_SECURE === 'false') return false;
  if (process.env.COOKIE_SECURE === 'true') return true;
  return process.env.NODE_ENV === 'production';
}

function expiryDate(): Date {
  return new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
}

export async function createSession(userId: string, userAgent: string | null): Promise<void> {
  const token = randomBytes(32).toString('base64url');
  const expires = expiryDate();
  await query(
    'INSERT INTO sessions (token_hash, user_id, expires_at, user_agent) VALUES ($1, $2, $3, $4)',
    [hashToken(token), userId, expires, userAgent?.slice(0, 300) ?? null],
  );
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: 'lax',
    path: '/',
    expires,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await query('DELETE FROM sessions WHERE token_hash = $1', [hashToken(token)]);
  }
  jar.delete(SESSION_COOKIE);
}

/** Ends every session of a user (after password/PIN change, removal, etc.). */
export async function destroyAllSessionsOf(userId: string): Promise<void> {
  await query('DELETE FROM sessions WHERE user_id = $1', [userId]);
}

/** Ends every other session of the user, keeping the one making this request. */
export async function destroyOtherSessions(userId: string): Promise<void> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value ?? '';
  await query('DELETE FROM sessions WHERE user_id = $1 AND token_hash <> $2', [userId, hashToken(token)]);
}

type Row = {
  id: string;
  role: Role;
  username: string;
  display_name: string;
  family_id: string | null;
  last_seen_at: Date;
};

/** Current user from the session cookie, or null. Works in route handlers and server components. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || token.length > 100) return null;
  const tokenHash = hashToken(token);
  const { rows } = await query<Row>(
    `SELECT u.id, u.role, u.username, u.display_name, u.family_id, s.last_seen_at
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = $1 AND s.expires_at > now() AND NOT u.disabled`,
    [tokenHash],
  );
  const row = rows[0];
  if (!row) return null;

  if (Date.now() - new Date(row.last_seen_at).getTime() > TOUCH_AFTER_MS) {
    // Sliding expiry: active users stay logged in.
    const expires = expiryDate();
    await query('UPDATE sessions SET last_seen_at = now(), expires_at = $2 WHERE token_hash = $1', [
      tokenHash,
      expires,
    ]);
    try {
      // Allowed in route handlers; throws in server components (the next API call refreshes it).
      (await cookies()).set(SESSION_COOKIE, token, {
        httpOnly: true,
        secure: cookieSecure(),
        sameSite: 'lax',
        path: '/',
        expires,
      });
    } catch {
      /* read-only cookie context */
    }
  }

  return {
    id: row.id,
    role: row.role,
    username: row.username,
    displayName: row.display_name,
    familyId: row.family_id,
  };
}

/** Deletes expired sessions; called opportunistically on login. */
export async function pruneExpiredSessions(): Promise<void> {
  await query('DELETE FROM sessions WHERE expires_at < now()');
}
