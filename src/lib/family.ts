import type { NextRequest } from 'next/server';
import type { PoolClient } from 'pg';
import { audit } from './audit';
import { availableToCheck, recentAdjustments, recentChecks } from './checks';
import { isUuid } from './ids';
import { query, withTransaction } from './db';
import { HttpError, requireUser } from './http';
import {
  cleanDisplayName,
  hashSecret,
  isValidPassword,
  isValidPin,
  isValidUsername,
  normalizeUsername,
  verifySecret,
} from './passwords';
import { allow } from './rate-limit';
import { DEFAULT_REWARDS, defaultProgress, insertProgress, summarize, type ProgressData } from './progress';
import { destroyAllSessionsOf, type SessionUser } from './session';

/**
 * Which family a guardian request acts on.
 * Parents: always their own family (any familyId in the URL is ignored).
 * Admin: ?familyId=... or their own family.
 */
export function resolveFamilyId(user: SessionUser, req: NextRequest): string {
  if (user.role === 'admin') {
    const fromQuery = req.nextUrl.searchParams.get('familyId');
    const id = fromQuery || user.familyId;
    if (!id) throw new HttpError(400, 'family_required', 'לא נבחרה משפחה');
    return id;
  }
  if (user.role !== 'parent' || !user.familyId) throw new HttpError(403, 'forbidden', 'אין הרשאה');
  return user.familyId;
}

/** Standard start of every /api/family/* handler: must be a guardian, scoped to one family. */
export async function guardianContext(req: NextRequest): Promise<{ user: SessionUser; familyId: string }> {
  const user = await requireUser('parent', 'admin');
  const familyId = resolveFamilyId(user, req);
  if (user.role === 'admin') await assertFamilyExists(familyId);
  return { user, familyId };
}

export async function assertFamilyExists(familyId: string): Promise<void> {
  if (!isUuid(familyId)) throw new HttpError(404, 'not_found', 'המשפחה לא נמצאה');
  const { rows } = await query('SELECT 1 FROM families WHERE id = $1', [familyId]);
  if (!rows[0]) throw new HttpError(404, 'not_found', 'המשפחה לא נמצאה');
}

export { isUuid } from './ids';

type MemberRow = {
  id: string;
  role: 'admin' | 'parent' | 'student';
  username: string;
  display_name: string;
  family_id: string | null;
};

/** Loads a member of the family; 404 if it belongs to another family (no leaking). */
export async function getMember(
  familyId: string,
  memberId: string,
  role?: 'student' | 'guardian',
): Promise<MemberRow> {
  if (!isUuid(memberId)) throw new HttpError(404, 'not_found', 'המשתמש לא נמצא');
  const { rows } = await query<MemberRow>(
    'SELECT id, role, username, display_name, family_id FROM users WHERE id = $1 AND family_id = $2',
    [memberId, familyId],
  );
  const m = rows[0];
  if (!m) throw new HttpError(404, 'not_found', 'המשתמש לא נמצא');
  if (role === 'student' && m.role !== 'student') throw new HttpError(404, 'not_found', 'המשתמש לא נמצא');
  if (role === 'guardian' && m.role === 'student') throw new HttpError(404, 'not_found', 'המשתמש לא נמצא');
  return m;
}

/** Sensitive actions require the acting guardian to re-enter their password. */
export async function confirmActorPassword(actor: SessionUser, password: unknown): Promise<void> {
  if (!allow(`confirm:${actor.id}`, 10, 10 * 60_000)) {
    throw new HttpError(429, 'rate_limited', 'יותר מדי ניסיונות. נסו שוב בעוד כמה דקות');
  }
  const { rows } = await query<{ secret_hash: string | null }>('SELECT secret_hash FROM users WHERE id = $1', [
    actor.id,
  ]);
  if (typeof password !== 'string' || !(await verifySecret(password, rows[0]?.secret_hash ?? null))) {
    throw new HttpError(403, 'bad_password', 'הסיסמה שלך שגויה');
  }
}

function usernameTaken(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: string }).code === '23505';
}

function requireUsername(raw: unknown): string {
  const username = normalizeUsername(raw);
  if (!isValidUsername(username)) {
    throw new HttpError(400, 'invalid_username', 'שם משתמש: 2-32 תווים, אותיות/ספרות/נקודה/מקף');
  }
  return username;
}

/** Grade 1-12, or null for "not set". */
export function cleanGrade(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === '') return null;
  const g = Number(raw);
  if (!Number.isInteger(g) || g < 1 || g > 12) throw new HttpError(400, 'invalid_grade', 'כיתה לא תקינה');
  return g;
}

function requireDisplayName(raw: unknown): string {
  const name = cleanDisplayName(raw);
  if (!name) throw new HttpError(400, 'invalid_name', 'שם תצוגה: 1-40 תווים');
  return name;
}

/* ---------------- overview ---------------- */

export async function getFamilyOverview(familyId: string) {
  const [family, members, rewards, redemptions] = await Promise.all([
    query<{ id: string; name: string }>('SELECT id, name FROM families WHERE id = $1', [familyId]),
    query<
      MemberRow & {
        has_secret: boolean;
        grade: number | null;
        last_login_at: Date | null;
        locked_until: Date | null;
        data: ProgressData | null;
      }
    >(
      `SELECT u.id, u.role, u.username, u.display_name, u.family_id,
              u.secret_hash IS NOT NULL AS has_secret, u.grade, u.last_login_at, u.locked_until, p.data
         FROM users u LEFT JOIN student_progress p ON p.user_id = u.id
        WHERE u.family_id = $1
        ORDER BY u.role DESC, u.created_at`,
      [familyId],
    ),
    query<{ id: string; student_id: string; title: string; cost: number }>(
      `SELECT r.id, r.student_id, r.title, r.cost FROM rewards r
         JOIN users u ON u.id = r.student_id
        WHERE u.family_id = $1 ORDER BY r.cost, r.created_at`,
      [familyId],
    ),
    query<{
      id: string;
      student_id: string;
      title: string;
      cost: number;
      status: string;
      requested_at: Date;
      resolved_at: Date | null;
    }>(
      `SELECT d.id, d.student_id, d.title, d.cost, d.status, d.requested_at, d.resolved_at
         FROM redemptions d JOIN users u ON u.id = d.student_id
        WHERE u.family_id = $1 AND (d.status = 'pending' OR d.requested_at > now() - interval '60 days')
        ORDER BY (d.status = 'pending') DESC, d.requested_at DESC
        LIMIT 100`,
      [familyId],
    ),
  ]);
  if (!family.rows[0]) throw new HttpError(404, 'not_found', 'המשפחה לא נמצאה');

  const [checks, adjustments] = await Promise.all([recentChecks(familyId), recentAdjustments(familyId)]);
  const now = Date.now();
  const studentRows = members.rows.filter((m) => m.role === 'student');
  const checkable = new Map(
    await Promise.all(studentRows.map(async (m) => [m.id, await availableToCheck(familyId, m.data ?? {})] as const)),
  );
  const students = members.rows
    .filter((m) => m.role === 'student')
    .map((m) => ({
      id: m.id,
      username: m.username,
      displayName: m.display_name,
      hasPin: m.has_secret,
      grade: m.grade,
      locked: !!m.locked_until && new Date(m.locked_until).getTime() > now,
      lastLoginAt: m.last_login_at?.toISOString() ?? null,
      progress: summarize(m.data ?? undefined),
      rewards: rewards.rows.filter((r) => r.student_id === m.id).map(({ id, title, cost }) => ({ id, title, cost })),
      checks: checks.get(m.id) ?? [],
      coinAdjustments: adjustments.get(m.id) ?? [],
      checkable: checkable.get(m.id) ?? { letters: 0, words: 0, spelling: 0 },
    }));
  const guardians = members.rows
    .filter((m) => m.role !== 'student')
    .map((m) => ({
      id: m.id,
      username: m.username,
      displayName: m.display_name,
      role: m.role,
      lastLoginAt: m.last_login_at?.toISOString() ?? null,
    }));
  return {
    family: family.rows[0],
    students,
    guardians,
    redemptions: redemptions.rows.map((d) => ({
      id: d.id,
      studentId: d.student_id,
      title: d.title,
      cost: d.cost,
      status: d.status,
      requestedAt: d.requested_at.toISOString(),
      resolvedAt: d.resolved_at?.toISOString() ?? null,
    })),
  };
}

/* ---------------- members ---------------- */

export async function createStudent(actor: SessionUser, familyId: string, body: Record<string, unknown>) {
  const username = requireUsername(body.username);
  const displayName = requireDisplayName(body.displayName);
  if (!isValidPin(body.pin)) throw new HttpError(400, 'invalid_pin', 'הקוד חייב להיות 4 ספרות');
  const secretHash = await hashSecret(body.pin);
  try {
    return await withTransaction(async (client) => {
      const { rows } = await client.query<{ id: string }>(
        `INSERT INTO users (family_id, role, username, display_name, secret_hash, grade)
         VALUES ($1, 'student', $2, $3, $4, $5) RETURNING id`,
        [familyId, username, displayName, secretHash, cleanGrade(body.grade)],
      );
      const id = rows[0].id;
      await insertProgress(
        client,
        id,
        defaultProgress({ avatar: String(body.avatar ?? ''), pet: String(body.pet ?? ''), theme: String(body.theme ?? '') }),
      );
      for (const r of DEFAULT_REWARDS) {
        await client.query('INSERT INTO rewards (student_id, title, cost, created_by) VALUES ($1, $2, $3, $4)', [
          id,
          r.title,
          r.cost,
          actor.id,
        ]);
      }
      await audit(actor.id, 'user.create', id, { role: 'student', username }, client);
      return { id, username, displayName };
    });
  } catch (err) {
    if (usernameTaken(err)) throw new HttpError(409, 'username_taken', 'שם המשתמש הזה כבר תפוס');
    throw err;
  }
}

export async function createGuardian(
  actor: SessionUser,
  familyId: string,
  body: Record<string, unknown>,
  client?: PoolClient,
) {
  const username = requireUsername(body.username);
  const displayName = requireDisplayName(body.displayName);
  if (!isValidPassword(body.password)) throw new HttpError(400, 'invalid_password', 'סיסמה: לפחות 8 תווים');
  const secretHash = await hashSecret(body.password);
  const run = async (c: PoolClient) => {
    const { rows } = await c.query<{ id: string }>(
      `INSERT INTO users (family_id, role, username, display_name, secret_hash)
       VALUES ($1, 'parent', $2, $3, $4) RETURNING id`,
      [familyId, username, displayName, secretHash],
    );
    await audit(actor.id, 'user.create', rows[0].id, { role: 'parent', username }, c);
    return { id: rows[0].id, username, displayName };
  };
  try {
    return client ? await run(client) : await withTransaction(run);
  } catch (err) {
    if (usernameTaken(err)) throw new HttpError(409, 'username_taken', 'שם המשתמש הזה כבר תפוס');
    throw err;
  }
}

/** Update a kid's display name and/or grade. */
export async function updateStudent(actor: SessionUser, member: MemberRow, body: Record<string, unknown>) {
  const displayName = body.displayName === undefined ? null : requireDisplayName(body.displayName);
  const setGrade = body.grade !== undefined;
  const grade = setGrade ? cleanGrade(body.grade) : null;
  await query(
    `UPDATE users SET display_name = COALESCE($2, display_name), grade = CASE WHEN $3 THEN $4::smallint ELSE grade END
      WHERE id = $1`,
    [member.id, displayName, setGrade, grade],
  );
  await audit(actor.id, 'user.update', member.id, { displayName, grade });
}

export async function setStudentPin(actor: SessionUser, student: MemberRow, pin: unknown) {
  if (!isValidPin(pin)) throw new HttpError(400, 'invalid_pin', 'הקוד חייב להיות 4 ספרות');
  await query('UPDATE users SET secret_hash = $2, failed_logins = 0, locked_until = NULL WHERE id = $1', [
    student.id,
    await hashSecret(pin),
  ]);
  await destroyAllSessionsOf(student.id);
  await audit(actor.id, 'user.secret_change', student.id);
}

export async function unlockMember(member: MemberRow) {
  await query('UPDATE users SET failed_logins = 0, locked_until = NULL WHERE id = $1', [member.id]);
}

export async function deleteMember(actor: SessionUser, familyId: string, member: MemberRow) {
  if (member.id === actor.id) throw new HttpError(400, 'cannot_delete_self', 'אי אפשר למחוק את עצמך');
  if (member.role === 'admin') throw new HttpError(403, 'forbidden', 'אי אפשר למחוק מנהל מערכת');
  if (member.role === 'parent') {
    const { rows } = await query<{ n: string }>(
      "SELECT count(*) AS n FROM users WHERE family_id = $1 AND role IN ('parent', 'admin')",
      [familyId],
    );
    if (Number(rows[0].n) <= 1) throw new HttpError(400, 'last_guardian', 'חייב להישאר לפחות הורה אחד במשפחה');
  }
  await query('DELETE FROM users WHERE id = $1 AND family_id = $2', [member.id, familyId]);
  await audit(actor.id, 'user.delete', member.id, { username: member.username, role: member.role });
}
