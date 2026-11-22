import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser, type Role, type SessionUser } from './session';

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message?: string, // Hebrew, safe to show to the user
  ) {
    super(message ?? code);
  }
}

const NO_STORE = { 'Cache-Control': 'no-store' };

export function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE });
}

type Handler<C> = (req: NextRequest, ctx: C) => Promise<Response>;

/**
 * Wraps a route handler: same-origin check for writes, uniform error responses.
 * Every handler still does its own authorization (requireUser / family checks).
 */
export function route<C>(handler: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    try {
      if (req.method !== 'GET' && req.method !== 'HEAD') assertSameOrigin(req);
      return await handler(req, ctx);
    } catch (err) {
      if (err instanceof HttpError) {
        return json({ error: err.code, message: err.message }, err.status);
      }
      console.error(`[api] ${req.method} ${req.nextUrl.pathname} failed`, err);
      return json({ error: 'server_error', message: 'שגיאת שרת, נסו שוב' }, 500);
    }
  };
}

/** CSRF defense in addition to SameSite=Lax cookies: writes must come from our own pages. */
function assertSameOrigin(req: NextRequest) {
  const origin = req.headers.get('origin');
  if (!origin) return; // non-browser clients; the session cookie is still required
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new HttpError(403, 'bad_origin');
  }
  if (!host || originHost !== host) throw new HttpError(403, 'bad_origin');
}

export async function readJson<T = Record<string, unknown>>(req: NextRequest, maxBytes = 64 * 1024): Promise<T> {
  const raw = await req.text();
  if (raw.length > maxBytes) throw new HttpError(413, 'payload_too_large');
  try {
    const parsed = raw ? JSON.parse(raw) : {};
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error();
    return parsed as T;
  } catch {
    throw new HttpError(400, 'invalid_json');
  }
}

export async function requireUser(...roles: Role[]): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, 'unauthenticated', 'צריך להתחבר מחדש');
  if (roles.length && !roles.includes(user.role)) throw new HttpError(403, 'forbidden', 'אין הרשאה לפעולה הזו');
  return user;
}

export function clientIp(req: NextRequest): string {
  // The app is only reachable through the host nginx, which sets these headers.
  return (
    req.headers.get('x-real-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  );
}
