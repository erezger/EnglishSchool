import type { PoolClient } from 'pg';
import { query } from './db';

export type AuditAction =
  | 'login.failed'
  | 'login.locked'
  | 'user.create'
  | 'user.update'
  | 'user.delete'
  | 'user.secret_change'
  | 'progress.reset'
  | 'reward.create'
  | 'reward.delete'
  | 'redemption.request'
  | 'redemption.fulfill'
  | 'redemption.cancel'
  | 'family.create';

export async function audit(
  actorId: string | null,
  action: AuditAction,
  targetId: string | null = null,
  details: Record<string, unknown> | null = null,
  client?: PoolClient,
): Promise<void> {
  const sql = 'INSERT INTO audit_log (actor_id, action, target_id, details) VALUES ($1, $2, $3, $4)';
  const params = [actorId, action, targetId, details ? JSON.stringify(details) : null];
  try {
    if (client) await client.query(sql, params);
    else await query(sql, params);
  } catch (err) {
    // Auditing must never break the actual operation
    console.error('[audit] failed to write', action, err);
  }
}
