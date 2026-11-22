import { NextResponse } from 'next/server';
import { getPool, ready } from '@/lib/db';

export const dynamic = 'force-dynamic';

/** GET /api/health — 200 when the app and Postgres are both reachable. */
export async function GET() {
  try {
    await ready();
    await getPool().query('SELECT 1');
    return NextResponse.json({ ok: true, db: 'up' }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    console.error('[health] database check failed', err);
    return NextResponse.json({ ok: false, db: 'down' }, { status: 503 });
  }
}
