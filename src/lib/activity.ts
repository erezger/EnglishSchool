import type { PoolClient } from 'pg';
import { query } from './db';
import { HttpError } from './http';
import { MODULES } from './modules';
import { addDays, todayStr } from './review';

/** Where activity can come from: the practice modules, the original game, and parent checks. */
export const ACTIVITY_SOURCES = [...MODULES.map((m) => m.id), 'game', 'check'] as const;
export type ActivitySource = (typeof ACTIVITY_SOURCES)[number];

const LIMITS = { answers: 500, seconds: 3600 };

export function cleanActivity(body: Record<string, unknown>) {
  const module = String(body.module ?? '');
  if (!(ACTIVITY_SOURCES as readonly string[]).includes(module)) throw new HttpError(400, 'invalid_module');
  const int = (v: unknown, max: number) => Math.max(0, Math.min(max, Math.round(Number(v) || 0)));
  const answers = int(body.answers, LIMITS.answers);
  const correct = Math.min(answers, int(body.correct, LIMITS.answers));
  const seconds = int(body.seconds, LIMITS.seconds);
  return { module: module as ActivitySource, answers, correct, seconds };
}

/** Adds to today's row for this kid + module. */
export async function recordActivity(
  studentId: string,
  a: { module: ActivitySource; answers: number; correct: number; seconds: number },
  client?: PoolClient,
) {
  if (!a.answers && !a.seconds) return;
  const sql = `INSERT INTO activity (student_id, day, module, answers, correct, seconds) VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (student_id, day, module) DO UPDATE
       SET answers = activity.answers + EXCLUDED.answers,
           correct = activity.correct + EXCLUDED.correct,
           seconds = LEAST(activity.seconds + EXCLUDED.seconds, 86400)`;
  const params = [studentId, todayStr(), a.module, a.answers, a.correct, a.seconds];
  if (client) await client.query(sql, params);
  else await query(sql, params);
}

export async function minutesToday(studentId: string): Promise<number> {
  const { rows } = await query<{ s: string | null }>('SELECT sum(seconds) AS s FROM activity WHERE student_id = $1 AND day = $2', [
    studentId,
    todayStr(),
  ]);
  return Math.floor(Number(rows[0]?.s ?? 0) / 60);
}

export type DayRow = { day: string; minutes: number; answers: number; correct: number };
export type ModuleRow = { module: string; minutes: number; answers: number; correct: number; prevMinutes: number; prevAnswers: number };

/** Last 7 days (oldest first, every day present) + per-module totals vs the 7 days before. */
export async function weekActivity(studentId: string) {
  const today = todayStr();
  const from = addDays(today, -13);
  const { rows } = await query<{ day: string; module: string; answers: number; correct: number; seconds: number }>(
    `SELECT day::text AS day, module, answers, correct, seconds FROM activity WHERE student_id = $1 AND day >= $2 ORDER BY day`,
    [studentId, from],
  );
  const thisWeekStart = addDays(today, -6);
  const days: DayRow[] = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(thisWeekStart, i);
    const r = rows.filter((x) => x.day === day);
    return {
      day,
      minutes: Math.round(r.reduce((s, x) => s + x.seconds, 0) / 60),
      answers: r.reduce((s, x) => s + x.answers, 0),
      correct: r.reduce((s, x) => s + x.correct, 0),
    };
  });
  const modules = new Map<string, ModuleRow>();
  for (const r of rows) {
    const m = modules.get(r.module) ?? { module: r.module, minutes: 0, answers: 0, correct: 0, prevMinutes: 0, prevAnswers: 0 };
    if (r.day >= thisWeekStart) {
      m.minutes += r.seconds / 60;
      m.answers += r.answers;
      m.correct += r.correct;
    } else {
      m.prevMinutes += r.seconds / 60;
      m.prevAnswers += r.answers;
    }
    modules.set(r.module, m);
  }
  const moduleRows = [...modules.values()]
    .map((m) => ({ ...m, minutes: Math.round(m.minutes), prevMinutes: Math.round(m.prevMinutes) }))
    .sort((a, b) => b.minutes - a.minutes || b.answers - a.answers);
  return { days, modules: moduleRows };
}
