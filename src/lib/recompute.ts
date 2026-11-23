import type { SessionUser } from './session';
import { audit } from './audit';
import { query, withTransaction } from './db';
import { COINS, withPaidOnce } from './earning';
import { HttpError } from './http';
import { DAILY_BONUS } from './review';
import { GRAMMAR } from '@/content/grammar';
import { STORIES } from '@/content/stories';
import { SHOP_AVATARS, SHOP_PETS, SHOP_THEMES } from '@/content/game';

/**
 * "What would this kid's balance be under the current coin rules?" — computed from what progress
 * records (letters learned, words read, levels and tests finished, practice stats) plus the server
 * history (parent tests, parent coin changes, redeemed rewards). Every learning item counts once
 * (as if practised on one day) and every test once, so it is a fair floor, not an exact replay:
 * the game never logged each coin, and things that leave no trace (e.g. building words) aren't counted.
 * The parent sees each line and can edit the result before applying it.
 */
export type RecomputeLine = { label: string; detail: string; coins: number };

type Data = Record<string, unknown>;
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const obj = (v: unknown): Record<string, Record<string, number>> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, Record<string, number>>) : {};

/** Shop prices were ×5 when these rules started; items bought before were paid at the old price. */
const PRICE_BEFORE_RULES = 5;
const SHOP_COST = new Map([...SHOP_AVATARS, ...SHOP_PETS, ...SHOP_THEMES].map((i) => [i.id, i.cost]));

export function estimateFromProgress(d: Data): RecomputeLine[] {
  const lines: RecomputeLine[] = [];
  const add = (label: string, count: number, each: number, unit = '') => {
    if (count > 0) lines.push({ label, detail: `${count}${unit} × ${each}`, coins: count * each });
  };

  add('אותיות שנלמדו', arr(d.learnedLetters).length, COINS.learnLetter);
  add('מילים שנקראו', arr(d.readWords).length, COINS.newWord);

  const done = arr(d.completedLevels).map(Number);
  const skipped = Number((d.placement as { passedThrough?: unknown } | undefined)?.passedThrough) || 0;
  const quizzes = done.filter((id) => id >= 1 && id <= 6 && id > skipped).length;
  add('חידוני שלבים (פעם ראשונה)', quizzes, 6 * COINS.quizPerCorrect + COINS.quizDone);
  add('משפטים בשלב 7', arr(d.readSentences).length, COINS.sentence);
  if (done.includes(7)) lines.push({ label: 'סיום שלב המשפטים', detail: '', coins: COINS.sentencesLevel });

  const bd = Number(d.bdBestScore) || 0;
  if (bd > 0) lines.push({ label: 'אתגר b/d/p/q (פעם ראשונה)', detail: `${bd} נכונות`, coins: bd * COINS.bdPerCorrect + (bd >= 8 ? COINS.bdChampion : 0) });

  const spelled = Object.values(obj(d.spellingStats)).filter((s) => (s?.c ?? 0) > 0).length;
  add('איות – מילים שאויתו נכון', spelled, COINS.spelling.practiceClean);
  const dictated = Object.values(obj(d.dictationStats)).filter((s) => (s?.c ?? 0) > 0).length;
  add('הכתבה – משפטים מושלמים', dictated, COINS.dictationPerfect);

  let grammar = 0;
  for (const [topicId, s] of Object.entries(obj(d.grammarStats))) {
    const size = GRAMMAR.find((t) => t.id === topicId)?.questions.length ?? 0;
    grammar += Math.min(s?.c ?? 0, size) * COINS.grammarCorrect + ((s?.best ?? 0) >= 80 ? COINS.grammarRound : 0);
  }
  if (grammar > 0) lines.push({ label: 'דקדוק', detail: '', coins: grammar });

  let reading = 0;
  for (const [storyId, s] of Object.entries(obj(d.readingStats))) {
    const q = STORIES.find((st) => st.id === storyId)?.questions.length ?? 0;
    const best = s?.best ?? 0;
    reading += Math.round((best / 100) * q) * COINS.readingCorrect + (best === 100 ? COINS.readingPerfect : 0);
  }
  if (reading > 0) lines.push({ label: 'הבנת הנקרא', detail: '', coins: reading });

  add('מילים מהירות', Object.values(obj(d.sightStats)).filter((s) => (s?.c ?? 0) > 0).length, COINS.sightCorrect);
  add('דיבור', Object.values(obj(d.speakingStats)).filter((s) => (s?.ok ?? 0) > 0).length, COINS.speakingOk);

  const bought = arr(d.ownedItems)
    .map((id) => Math.round((SHOP_COST.get(String(id)) ?? 0) / PRICE_BEFORE_RULES))
    .filter((c) => c > 0);
  if (bought.length) lines.push({ label: 'קניות בחנות (המחיר ששולם)', detail: `${bought.length} פריטים`, coins: -bought.reduce((a, b) => a + b, 0) });
  return lines;
}

export async function estimateCoins(studentId: string) {
  const [progress, daily, checks, adjustments, redeemed] = await Promise.all([
    query<{ data: Data }>('SELECT data FROM student_progress WHERE user_id = $1', [studentId]),
    query<{ n: string }>("SELECT count(*) AS n FROM activity WHERE student_id = $1 AND module = 'daily' AND answers > 0", [studentId]),
    query<{ n: string; coins: string }>(
      "SELECT count(*) AS n, COALESCE(sum(coins_awarded), 0) AS coins FROM checks WHERE student_id = $1 AND status = 'done'",
      [studentId],
    ),
    query<{ coins: string }>('SELECT COALESCE(sum(applied), 0) AS coins FROM coin_adjustments WHERE student_id = $1', [studentId]),
    query<{ n: string; coins: string }>(
      "SELECT count(*) AS n, COALESCE(sum(cost), 0) AS coins FROM redemptions WHERE student_id = $1 AND status <> 'cancelled'",
      [studentId],
    ),
  ]);
  const data = progress.rows[0]?.data;
  if (!data) throw new HttpError(404, 'not_found');

  const lines = estimateFromProgress(data);
  const days = Number(daily.rows[0].n);
  if (days) lines.push({ label: 'חזרה יומית', detail: `${days} ימים × ${DAILY_BONUS}`, coins: days * DAILY_BONUS });
  if (Number(checks.rows[0].n)) lines.push({ label: 'מבחנים מההורים', detail: `${checks.rows[0].n} מבחנים`, coins: Number(checks.rows[0].coins) });
  const adj = Number(adjustments.rows[0].coins);
  if (adj) lines.push({ label: 'שינויים שהורים עשו', detail: '', coins: adj });
  if (Number(redeemed.rows[0].n)) lines.push({ label: 'פרסים שמומשו', detail: `${redeemed.rows[0].n} פרסים`, coins: -Number(redeemed.rows[0].coins) });

  return {
    current: Number(data.coins) || 0,
    target: Math.max(0, lines.reduce((s, l) => s + l.coins, 0)),
    lines,
  };
}

const REASON = 'עדכון לפי כללי המטבעות החדשים';

/**
 * Sets the balance to `target` (the parent may have edited the estimate) as a parent coin change the
 * kid is told about, and marks the tests already finished as paid so they don't pay again.
 */
export async function applyRecompute(actor: SessionUser, studentId: string, body: Record<string, unknown>) {
  const target = Number(body.target);
  if (!Number.isInteger(target) || target < 0 || target > 1_000_000) throw new HttpError(400, 'invalid_target', 'יתרה: מספר שלם, 0 ומעלה');

  return withTransaction(async (client) => {
    const { rows } = await client.query<{ data: Data }>('SELECT data FROM student_progress WHERE user_id = $1 FOR UPDATE', [studentId]);
    if (!rows[0]) throw new HttpError(404, 'not_found');
    const before = Number(rows[0].data.coins) || 0;
    const delta = target - before;
    const data = { ...withPaidOnce(rows[0].data), coins: target };
    await client.query('UPDATE student_progress SET data = $2, version = version + 1, updated_at = now() WHERE user_id = $1', [studentId, JSON.stringify(data)]);
    if (delta !== 0) {
      await client.query('INSERT INTO coin_adjustments (student_id, amount, applied, reason, created_by) VALUES ($1, $2, $2, $3, $4)', [
        studentId,
        delta,
        REASON,
        actor.id,
      ]);
    }
    await audit(actor.id, 'coins.recompute', studentId, { before, target }, client);
    return { coins: target, applied: delta };
  });
}
