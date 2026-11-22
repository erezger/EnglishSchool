import { LETTERS, PHONICS_WORDS } from '@/content/phonics';
import { WORD_BANK } from '@/content/wordbank';
import { audit } from './audit';
import { query, withTransaction } from './db';
import { isUuid } from './ids';
import { HttpError } from './http';
import type { ProgressData } from './progress';
import type { SessionUser } from './session';

/**
 * Mastery checks ("מבחן אמת"): a parent sends a short test built from what the kid
 * marked as known. Questions and correct answers live only on the server; grading and
 * the effects on progress happen server-side when the kid finishes.
 */
export const CHECK_SCOPES = ['letters', 'words', 'spelling'] as const;
export type CheckScope = (typeof CHECK_SCOPES)[number];

type StoredQuestion =
  | { type: 'letter'; letter: string; options: string[]; answer: string }
  | { type: 'meaning'; word: string; emoji: string; options: string[]; answer: string }
  | { type: 'spell'; hebrew: string; emoji: string; answer: string };

export type PublicQuestion =
  | { type: 'letter'; letter: string; options: string[] }
  | { type: 'meaning'; word: string; emoji: string; options: string[] }
  | { type: 'spell'; hebrew: string; emoji: string; length: number; audio: string };

type ResultItem = { type: StoredQuestion['type']; label: string; answer: string; given: string; correct: boolean };

const SIZES = [5, 10, 15, 20];

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/** Not secret, just keeps the spelling answer out of plain sight in the page data (TTS needs the word). */
const obfuscate = (s: string) => Buffer.from(s.split('').reverse().join(''), 'utf8').toString('base64');

function distractors(correct: string, pool: string[], n = 3): string[] {
  return shuffle([...new Set(pool.filter((p) => p && p !== correct))]).slice(0, n);
}

/** Every word we know a meaning for: phonics words, grade banks, the family's lists. */
async function meaningIndex(familyId: string): Promise<Map<string, { hebrew: string; emoji: string }>> {
  const map = new Map<string, { hebrew: string; emoji: string }>();
  for (const w of PHONICS_WORDS) map.set(w.word.toLowerCase(), { hebrew: w.hebrew, emoji: w.emoji });
  for (const topics of Object.values(WORD_BANK)) {
    for (const t of topics) for (const w of t.words) map.set(w.word.toLowerCase(), { hebrew: w.hebrew, emoji: w.emoji });
  }
  const { rows } = await query<{ word: string; hebrew: string; emoji: string }>(
    `SELECT w.word, w.hebrew, w.emoji FROM words w JOIN word_lists l ON l.id = w.list_id WHERE l.family_id = $1`,
    [familyId],
  );
  for (const r of rows) if (r.hebrew) map.set(r.word.toLowerCase(), { hebrew: r.hebrew, emoji: r.emoji });
  return map;
}

function arr(data: ProgressData, key: string): string[] {
  return Array.isArray(data[key]) ? (data[key] as unknown[]).filter((x): x is string => typeof x === 'string') : [];
}

function spellingStats(data: ProgressData): Record<string, { c: number; w: number; s: number; t: number }> {
  return data.spellingStats && typeof data.spellingStats === 'object'
    ? (data.spellingStats as Record<string, { c: number; w: number; s: number; t: number }>)
    : {};
}

/** What the kid can be checked on, per scope. */
async function candidates(familyId: string, data: ProgressData) {
  const letters = arr(data, 'learnedLetters').filter((l) => LETTERS.some((x) => x.key === l));
  const phonics = new Map(PHONICS_WORDS.map((w) => [w.word, w]));
  const words = arr(data, 'readWords').filter((w) => phonics.has(w));
  const meanings = await meaningIndex(familyId);
  const spelling = Object.entries(spellingStats(data))
    .filter(([, st]) => (st?.s ?? 0) >= 3)
    .map(([w]) => w)
    .filter((w) => meanings.has(w));
  return { letters, words, spelling, meanings };
}

export async function availableToCheck(familyId: string, data: ProgressData) {
  const c = await candidates(familyId, data);
  return { letters: c.letters.length, words: c.words.length, spelling: c.spelling.length };
}

/* ------------------------------------------------------------------ parent */

export async function createCheck(actor: SessionUser, familyId: string, studentId: string, body: Record<string, unknown>) {
  const scopes = Array.isArray(body.scopes)
    ? [...new Set(body.scopes.filter((s): s is CheckScope => (CHECK_SCOPES as readonly string[]).includes(String(s))))]
    : [];
  if (!scopes.length) throw new HttpError(400, 'invalid_scopes', 'צריך לבחור לפחות נושא אחד');
  const size = Number(body.size);
  if (!SIZES.includes(size)) throw new HttpError(400, 'invalid_size', 'מספר שאלות לא תקין');

  const open = await query("SELECT 1 FROM checks WHERE student_id = $1 AND status IN ('assigned', 'in_progress')", [studentId]);
  if (open.rows[0]) throw new HttpError(409, 'check_open', 'כבר יש מבחן פתוח לילד/ה הזה/הזו');

  const { rows } = await query<{ data: ProgressData }>('SELECT data FROM student_progress WHERE user_id = $1', [studentId]);
  const data = rows[0]?.data ?? {};
  const c = await candidates(familyId, data);

  // Round-robin over the chosen scopes that have something to check
  const pools: Record<CheckScope, string[]> = {
    letters: shuffle(c.letters),
    words: shuffle(c.words),
    spelling: shuffle(c.spelling),
  };
  const active = scopes.filter((s) => pools[s].length);
  if (!active.length) {
    throw new HttpError(400, 'nothing_to_check', 'עוד אין מה לבדוק בנושאים שנבחרו (הילד/ה לא סימן/ה שלמד/ה פריטים כאלה)');
  }
  const picked: { scope: CheckScope; item: string }[] = [];
  while (picked.length < size && active.some((s) => pools[s].length)) {
    for (const s of active) {
      const item = pools[s].pop();
      if (item && picked.length < size) picked.push({ scope: s, item });
    }
  }

  const letterNames = LETTERS.map((l) => l.hebrewName);
  const allMeanings = [...new Set([...c.meanings.values()].map((m) => m.hebrew))];
  const questions: StoredQuestion[] = shuffle(picked).map(({ scope, item }) => {
    if (scope === 'letters') {
      const answer = LETTERS.find((l) => l.key === item)!.hebrewName;
      return { type: 'letter', letter: item, answer, options: shuffle([answer, ...distractors(answer, letterNames)]) };
    }
    if (scope === 'words') {
      const w = PHONICS_WORDS.find((x) => x.word === item)!;
      return { type: 'meaning', word: w.word, emoji: w.emoji, answer: w.hebrew, options: shuffle([w.hebrew, ...distractors(w.hebrew, allMeanings)]) };
    }
    const m = c.meanings.get(item)!;
    return { type: 'spell', hebrew: m.hebrew, emoji: m.emoji, answer: item };
  });

  const ins = await query<{ id: string }>(
    'INSERT INTO checks (student_id, created_by, scopes, questions, total) VALUES ($1, $2, $3, $4::jsonb, $5) RETURNING id',
    [studentId, actor.id, scopes, JSON.stringify(questions), questions.length],
  );
  return { id: ins.rows[0].id, total: questions.length };
}

export async function cancelCheck(familyId: string, checkId: string) {
  if (!isUuid(checkId)) throw new HttpError(404, 'not_found', 'המבחן לא נמצא');
  const { rowCount } = await query(
    `UPDATE checks c SET status = 'cancelled', finished_at = now()
       FROM users u
      WHERE c.id = $1 AND u.id = c.student_id AND u.family_id = $2 AND c.status IN ('assigned', 'in_progress')`,
    [checkId, familyId],
  );
  if (!rowCount) throw new HttpError(404, 'not_found', 'אין מבחן פתוח כזה');
}

export type CheckSummary = {
  id: string;
  status: string;
  total: number;
  score: number | null;
  coinsAwarded: number | null;
  createdAt: string;
  finishedAt: string | null;
  failed: string[];
};

export async function recentChecks(familyId: string): Promise<Map<string, CheckSummary[]>> {
  const { rows } = await query<{
    id: string;
    student_id: string;
    status: string;
    total: number;
    score: number | null;
    coins_awarded: number | null;
    created_at: Date;
    finished_at: Date | null;
    results: ResultItem[] | null;
  }>(
    `SELECT c.id, c.student_id, c.status, c.total, c.score, c.coins_awarded, c.created_at, c.finished_at, c.results
       FROM checks c JOIN users u ON u.id = c.student_id
      WHERE u.family_id = $1 AND c.status <> 'cancelled' AND c.created_at > now() - interval '90 days'
      ORDER BY c.created_at DESC`,
    [familyId],
  );
  const map = new Map<string, CheckSummary[]>();
  for (const r of rows) {
    const list = map.get(r.student_id) ?? [];
    if (list.length >= 5) continue;
    list.push({
      id: r.id,
      status: r.status,
      total: r.total,
      score: r.score,
      coinsAwarded: r.coins_awarded,
      createdAt: r.created_at.toISOString(),
      finishedAt: r.finished_at?.toISOString() ?? null,
      failed: (r.results ?? []).filter((x) => !x.correct).map((x) => x.label),
    });
    map.set(r.student_id, list);
  }
  return map;
}

/* ----------------------------------------------------------------- student */

function toPublic(q: StoredQuestion): PublicQuestion {
  if (q.type === 'letter') return { type: 'letter', letter: q.letter, options: q.options };
  if (q.type === 'meaning') return { type: 'meaning', word: q.word, emoji: q.emoji, options: q.options };
  return { type: 'spell', hebrew: q.hebrew, emoji: q.emoji, length: q.answer.length, audio: obfuscate(q.answer) };
}

type CheckRow = {
  id: string;
  status: string;
  questions: StoredQuestion[];
  answers: Record<string, string>;
  total: number;
  created_at: Date;
};

export async function openCheckFor(studentId: string) {
  const { rows } = await query<CheckRow>(
    `SELECT id, status, questions, answers, total, created_at FROM checks
      WHERE student_id = $1 AND status IN ('assigned', 'in_progress') ORDER BY created_at LIMIT 1`,
    [studentId],
  );
  const c = rows[0];
  if (!c) return null;
  return {
    id: c.id,
    status: c.status,
    total: c.total,
    answered: Object.keys(c.answers).map(Number),
    questions: c.questions.map(toPublic),
    createdAt: c.created_at.toISOString(),
  };
}

async function loadOwnOpenCheck(studentId: string, checkId: string): Promise<CheckRow> {
  if (!isUuid(checkId)) throw new HttpError(404, 'not_found', 'המבחן לא נמצא');
  const { rows } = await query<CheckRow>(
    `SELECT id, status, questions, answers, total, created_at FROM checks
      WHERE id = $1 AND student_id = $2 AND status IN ('assigned', 'in_progress')`,
    [checkId, studentId],
  );
  if (!rows[0]) throw new HttpError(404, 'not_found', 'המבחן לא נמצא או שכבר הסתיים');
  return rows[0];
}

/** Records one answer. The first answer to a question counts (no changing answers). */
export async function answerQuestion(studentId: string, checkId: string, index: unknown, answer: unknown) {
  const check = await loadOwnOpenCheck(studentId, checkId);
  const i = Number(index);
  if (!Number.isInteger(i) || i < 0 || i >= check.total) throw new HttpError(400, 'invalid_index');
  const given = String(answer ?? '').normalize('NFC').trim().slice(0, 60);
  await query(
    `UPDATE checks SET answers = CASE WHEN answers ? $2 THEN answers ELSE jsonb_set(answers, ARRAY[$2], to_jsonb($3::text)) END,
            status = 'in_progress', started_at = COALESCE(started_at, now())
      WHERE id = $1`,
    [checkId, String(i), given],
  );
  return { ok: true };
}

const BONUS_THRESHOLD = 0.9;
const BONUS = 5;

/**
 * Grades the check and applies the result to progress (server-side, atomically):
 * - failed letters are un-marked as learned, failed words go to the review bank,
 * - spelling words: failed -> streak reset, passed -> streak +1,
 * - +1 coin per correct answer, +5 bonus at 90%+.
 */
export async function finishCheck(studentId: string, checkId: string) {
  return withTransaction(async (client) => {
    const { rows } = await client.query<CheckRow>(
      `SELECT id, status, questions, answers, total, created_at FROM checks
        WHERE id = $1 AND student_id = $2 AND status IN ('assigned', 'in_progress') FOR UPDATE`,
      [checkId, studentId],
    );
    const check = rows[0];
    if (!check) throw new HttpError(404, 'not_found', 'המבחן לא נמצא או שכבר הסתיים');

    const results: ResultItem[] = check.questions.map((q, i) => {
      const given = check.answers[String(i)] ?? '';
      const correct =
        q.type === 'spell'
          ? given.toLowerCase().replace(/\s+/g, ' ').trim() === q.answer.toLowerCase()
          : given === q.answer;
      const label = q.type === 'letter' ? q.letter : q.type === 'meaning' ? q.word : q.answer;
      return { type: q.type, label, answer: q.answer, given, correct };
    });
    const score = results.filter((r) => r.correct).length;
    const coins = score + (score / check.total >= BONUS_THRESHOLD ? BONUS : 0);

    const prog = await client.query<{ data: ProgressData }>(
      'SELECT data FROM student_progress WHERE user_id = $1 FOR UPDATE',
      [studentId],
    );
    const data: ProgressData = { ...(prog.rows[0]?.data ?? {}) };
    const failed = (type: string) => results.filter((r) => r.type === type && !r.correct).map((r) => r.label);
    const failedLetters = failed('letter');
    const failedWords = failed('meaning');
    data.learnedLetters = arr(data, 'learnedLetters').filter((l) => !failedLetters.includes(l));
    data.mistakes = [...new Set([...arr(data, 'mistakes'), ...failedWords])];
    const stats = { ...spellingStats(data) };
    for (const r of results.filter((x) => x.type === 'spell')) {
      const prev = stats[r.label] ?? { c: 0, w: 0, s: 0, t: 0 };
      stats[r.label] = r.correct
        ? { c: prev.c + 1, w: prev.w, s: prev.s + 1, t: Date.now() }
        : { c: prev.c, w: prev.w + 1, s: 0, t: Date.now() };
    }
    data.spellingStats = stats;
    data.coins = (Number(data.coins) || 0) + coins;
    await client.query(
      'UPDATE student_progress SET data = $2::jsonb, version = version + 1, updated_at = now() WHERE user_id = $1',
      [studentId, JSON.stringify(data)],
    );
    await client.query(
      `UPDATE checks SET status = 'done', results = $2::jsonb, score = $3, coins_awarded = $4, finished_at = now(),
              started_at = COALESCE(started_at, now())
        WHERE id = $1`,
      [checkId, JSON.stringify(results), score, coins],
    );
    return { score, total: check.total, coins, results };
  });
}

/* ------------------------------------------------------------------ coins */

/** Parent adds/removes coins with a reason the kid will see. Coins never go below 0. */
export async function adjustCoinsWithReason(actor: SessionUser, studentId: string, body: Record<string, unknown>) {
  const amount = Number(body.amount);
  if (!Number.isInteger(amount) || amount === 0 || Math.abs(amount) > 10_000) {
    throw new HttpError(400, 'invalid_amount', 'סכום: מספר שלם שאינו 0 (עד 10,000)');
  }
  const reason = String(body.reason ?? '').normalize('NFC').trim().replace(/\s+/g, ' ').slice(0, 120);
  if (!reason) throw new HttpError(400, 'reason_required', 'צריך לכתוב סיבה (הילד/ה יראה/תראה אותה)');

  return withTransaction(async (client) => {
    const { rows } = await client.query<{ coins: string }>(
      "SELECT COALESCE((data->>'coins')::int, 0) AS coins FROM student_progress WHERE user_id = $1 FOR UPDATE",
      [studentId],
    );
    if (!rows[0]) throw new HttpError(404, 'not_found');
    const before = Number(rows[0].coins);
    const after = Math.max(0, before + amount);
    await client.query(
      `UPDATE student_progress SET data = jsonb_set(data, '{coins}', to_jsonb($2::int)), version = version + 1, updated_at = now()
        WHERE user_id = $1`,
      [studentId, after],
    );
    await client.query(
      'INSERT INTO coin_adjustments (student_id, amount, applied, reason, created_by) VALUES ($1, $2, $3, $4, $5)',
      [studentId, amount, after - before, reason, actor.id],
    );
    await audit(actor.id, 'coins.adjust', studentId, { amount, applied: after - before, reason }, client);
    return { coins: after, applied: after - before };
  });
}

export async function unseenAdjustments(studentId: string) {
  const { rows } = await query<{ id: string; applied: number; reason: string; created_at: Date }>(
    `SELECT id, applied, reason, created_at FROM coin_adjustments
      WHERE student_id = $1 AND seen_at IS NULL ORDER BY created_at LIMIT 10`,
    [studentId],
  );
  return rows.map((r) => ({ id: r.id, amount: r.applied, reason: r.reason, createdAt: r.created_at.toISOString() }));
}

export async function markAdjustmentsSeen(studentId: string, ids: unknown) {
  const list = Array.isArray(ids) ? ids.filter((x): x is string => typeof x === 'string' && isUuid(x)).slice(0, 50) : [];
  if (!list.length) return;
  await query('UPDATE coin_adjustments SET seen_at = now() WHERE student_id = $1 AND id = ANY($2) AND seen_at IS NULL', [
    studentId,
    list,
  ]);
}

export async function recentAdjustments(familyId: string) {
  const { rows } = await query<{ student_id: string; applied: number; amount: number; reason: string; created_at: Date; seen_at: Date | null }>(
    `SELECT a.student_id, a.applied, a.amount, a.reason, a.created_at, a.seen_at
       FROM coin_adjustments a JOIN users u ON u.id = a.student_id
      WHERE u.family_id = $1 AND a.created_at > now() - interval '60 days'
      ORDER BY a.created_at DESC LIMIT 100`,
    [familyId],
  );
  const map = new Map<string, { amount: number; reason: string; createdAt: string; seen: boolean }[]>();
  for (const r of rows) {
    const list = map.get(r.student_id) ?? [];
    if (list.length < 5) list.push({ amount: r.applied, reason: r.reason, createdAt: r.created_at.toISOString(), seen: !!r.seen_at });
    map.set(r.student_id, list);
  }
  return map;
}
