import { audit } from '@/lib/audit';
import { query, withTransaction } from '@/lib/db';
import { createGuardian } from '@/lib/family';
import { HttpError, json, readJson, requireUser, route } from '@/lib/http';

export const dynamic = 'force-dynamic';

/** GET /api/admin/families — all families with member counts (admin only). */
export const GET = route(async () => {
  await requireUser('admin');
  const { rows } = await query<{ id: string; name: string; created_at: Date; students: string; guardians: string }>(
    `SELECT f.id, f.name, f.created_at,
            count(u.id) FILTER (WHERE u.role = 'student') AS students,
            count(u.id) FILTER (WHERE u.role <> 'student') AS guardians
       FROM families f LEFT JOIN users u ON u.family_id = f.id
      GROUP BY f.id ORDER BY f.created_at`,
  );
  return json({
    families: rows.map((r) => ({
      id: r.id,
      name: r.name,
      createdAt: r.created_at.toISOString(),
      students: Number(r.students),
      guardians: Number(r.guardians),
    })),
  });
});

/** POST /api/admin/families { name, parent: { username, displayName, password } } */
export const POST = route(async (req) => {
  const admin = await requireUser('admin');
  const body = await readJson<{ name?: unknown; parent?: Record<string, unknown> }>(req, 4096);
  const name = String(body.name ?? '').trim().replace(/\s+/g, ' ');
  if (name.length < 1 || name.length > 60) throw new HttpError(400, 'invalid_name', 'שם משפחה: 1-60 תווים');
  if (!body.parent || typeof body.parent !== 'object') throw new HttpError(400, 'parent_required', 'חסרים פרטי הורה');

  const result = await withTransaction(async (client) => {
    const fam = await client.query<{ id: string }>('INSERT INTO families (name) VALUES ($1) RETURNING id', [name]);
    const familyId = fam.rows[0].id;
    const parent = await createGuardian(admin, familyId, body.parent!, client);
    await audit(admin.id, 'family.create', familyId, { name }, client);
    return { id: familyId, name, parent };
  });
  return json(result, 201);
});
