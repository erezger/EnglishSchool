import { audit } from './audit';
import { query, withTransaction } from './db';
import { isUuid } from './family';
import { HttpError } from './http';
import { adjustCoins } from './progress';
import type { SessionUser } from './session';

export type Reward = { id: string; title: string; cost: number };
export type Redemption = {
  id: string;
  title: string;
  cost: number;
  status: 'pending' | 'fulfilled' | 'cancelled';
  requestedAt: string;
  resolvedAt: string | null;
};

export async function listRewardsForStudent(studentId: string) {
  const [rewards, redemptions] = await Promise.all([
    query<Reward>('SELECT id, title, cost FROM rewards WHERE student_id = $1 ORDER BY cost, created_at', [studentId]),
    query<{ id: string; title: string; cost: number; status: Redemption['status']; requested_at: Date; resolved_at: Date | null }>(
      `SELECT id, title, cost, status, requested_at, resolved_at FROM redemptions
        WHERE student_id = $1 AND (status = 'pending' OR requested_at > now() - interval '60 days')
        ORDER BY (status = 'pending') DESC, requested_at DESC LIMIT 30`,
      [studentId],
    ),
  ]);
  return {
    rewards: rewards.rows,
    redemptions: redemptions.rows.map<Redemption>((r) => ({
      id: r.id,
      title: r.title,
      cost: r.cost,
      status: r.status,
      requestedAt: r.requested_at.toISOString(),
      resolvedAt: r.resolved_at?.toISOString() ?? null,
    })),
  };
}

export async function createReward(actor: SessionUser, studentId: string, body: Record<string, unknown>) {
  const title = String(body.title ?? '').normalize('NFC').trim().replace(/\s+/g, ' ');
  const cost = Number(body.cost);
  if (title.length < 1 || title.length > 60) throw new HttpError(400, 'invalid_title', 'שם הפרס: 1-60 תווים');
  if (!Number.isInteger(cost) || cost < 1 || cost > 100_000) {
    throw new HttpError(400, 'invalid_cost', 'מחיר: מספר שלם בין 1 ל-100,000');
  }
  const { rows } = await query<Reward>(
    'INSERT INTO rewards (student_id, title, cost, created_by) VALUES ($1, $2, $3, $4) RETURNING id, title, cost',
    [studentId, title, cost, actor.id],
  );
  await audit(actor.id, 'reward.create', studentId, { title, cost });
  return rows[0];
}

/** Deletes a reward only if it belongs to a student of the given family. */
export async function deleteReward(actor: SessionUser, familyId: string, rewardId: string) {
  if (!isUuid(rewardId)) throw new HttpError(404, 'not_found', 'הפרס לא נמצא');
  const { rows } = await query<{ title: string; student_id: string }>(
    `DELETE FROM rewards r USING users u
      WHERE r.id = $1 AND u.id = r.student_id AND u.family_id = $2
      RETURNING r.title, r.student_id`,
    [rewardId, familyId],
  );
  if (!rows[0]) throw new HttpError(404, 'not_found', 'הפרס לא נמצא');
  await audit(actor.id, 'reward.delete', rows[0].student_id, { title: rows[0].title });
}

/** Student redeems a reward: coins are deducted now, the parent marks it fulfilled later. */
export async function redeemReward(student: SessionUser, rewardId: unknown) {
  if (typeof rewardId !== 'string' || !isUuid(rewardId)) throw new HttpError(404, 'not_found', 'הפרס לא נמצא');
  return withTransaction(async (client) => {
    const reward = await client.query<Reward>('SELECT id, title, cost FROM rewards WHERE id = $1 AND student_id = $2', [
      rewardId,
      student.id,
    ]);
    if (!reward.rows[0]) throw new HttpError(404, 'not_found', 'הפרס לא נמצא');
    const { title, cost } = reward.rows[0];

    const progress = await client.query<{ coins: string }>(
      "SELECT COALESCE((data->>'coins')::int, 0) AS coins FROM student_progress WHERE user_id = $1 FOR UPDATE",
      [student.id],
    );
    if (Number(progress.rows[0]?.coins ?? 0) < cost) {
      throw new HttpError(409, 'not_enough_coins', 'אין מספיק מטבעות לפרס הזה');
    }
    const after = await adjustCoins(client, student.id, -cost);
    const { rows } = await client.query<{ id: string }>(
      'INSERT INTO redemptions (student_id, reward_id, title, cost) VALUES ($1, $2, $3, $4) RETURNING id',
      [student.id, rewardId, title, cost],
    );
    await audit(student.id, 'redemption.request', student.id, { title, cost }, client);
    return { redemptionId: rows[0].id, coins: after.coins, version: after.version };
  });
}

/** Parent marks a pending redemption as fulfilled, or cancels it and refunds the coins. */
export async function resolveRedemption(
  actor: SessionUser,
  familyId: string,
  redemptionId: string,
  action: unknown,
) {
  if (action !== 'fulfill' && action !== 'cancel') throw new HttpError(400, 'invalid_action');
  if (!isUuid(redemptionId)) throw new HttpError(404, 'not_found', 'הבקשה לא נמצאה');
  return withTransaction(async (client) => {
    const { rows } = await client.query<{ student_id: string; cost: number; title: string; status: string }>(
      `SELECT d.student_id, d.cost, d.title, d.status FROM redemptions d JOIN users u ON u.id = d.student_id
        WHERE d.id = $1 AND u.family_id = $2 FOR UPDATE OF d`,
      [redemptionId, familyId],
    );
    const d = rows[0];
    if (!d) throw new HttpError(404, 'not_found', 'הבקשה לא נמצאה');
    if (d.status !== 'pending') throw new HttpError(409, 'already_resolved', 'הבקשה כבר טופלה');

    await client.query(
      'UPDATE redemptions SET status = $2, resolved_at = now(), resolved_by = $3 WHERE id = $1',
      [redemptionId, action === 'fulfill' ? 'fulfilled' : 'cancelled', actor.id],
    );
    if (action === 'cancel') await adjustCoins(client, d.student_id, d.cost);
    await audit(
      actor.id,
      action === 'fulfill' ? 'redemption.fulfill' : 'redemption.cancel',
      d.student_id,
      { title: d.title, cost: d.cost },
      client,
    );
  });
}
