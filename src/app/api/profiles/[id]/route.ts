import { NextResponse, type NextRequest } from 'next/server';
import { getProfile, isProfileId, MAX_PROFILE_BYTES, saveProfile } from '@/lib/profiles';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

const noStore = { 'Cache-Control': 'no-store' };

/** GET /api/profiles/:id */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  if (!isProfileId(id)) {
    return NextResponse.json({ error: 'unknown_profile' }, { status: 404 });
  }
  try {
    const profile = await getProfile(id);
    if (!profile) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    return NextResponse.json(profile, { headers: noStore });
  } catch (err) {
    console.error(`[api] GET /api/profiles/${id} failed`, err);
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }
}

/** PUT /api/profiles/:id  body: { data: {...profile} } */
export async function PUT(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  if (!isProfileId(id)) {
    return NextResponse.json({ error: 'unknown_profile' }, { status: 404 });
  }

  const raw = await req.text();
  if (raw.length > MAX_PROFILE_BYTES) {
    return NextResponse.json({ error: 'payload_too_large' }, { status: 413 });
  }

  let data: unknown;
  try {
    data = (JSON.parse(raw) as { data?: unknown }).data;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return NextResponse.json({ error: 'invalid_profile' }, { status: 400 });
  }

  try {
    const saved = await saveProfile(id, data as Record<string, unknown>);
    return NextResponse.json(
      { id: saved.id, version: saved.version, updatedAt: saved.updatedAt },
      { headers: noStore },
    );
  } catch (err) {
    console.error(`[api] PUT /api/profiles/${id} failed`, err);
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }
}
