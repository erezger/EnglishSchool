import { NextResponse } from 'next/server';
import { listProfiles } from '@/lib/profiles';

export const dynamic = 'force-dynamic';

/** GET /api/profiles — both profiles with their server version. */
export async function GET() {
  try {
    const profiles = await listProfiles();
    return NextResponse.json({ profiles }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    console.error('[api] GET /api/profiles failed', err);
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }
}
