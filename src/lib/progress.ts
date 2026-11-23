import type { PoolClient } from 'pg';
import { AVATARS, PETS, THEMES } from './catalog';
import { audit } from './audit';
import { query, withTransaction } from './db';
import { addDays, todayStr } from './review';

export type ProgressData = Record<string, unknown>;
export type Progress = { data: ProgressData; version: number; updatedAt: string };

/** Keys the game is not allowed to write: rewards/redemptions live in their own tables now. */
const SERVER_OWNED_KEYS = ['parentRewards', 'redemptionHistory', 'pendingResetTarget', 'parentRewardProfileId'];

export const MAX_PROGRESS_BYTES = 256 * 1024;

const AVATAR_CHOICES: readonly string[] = AVATARS.map((a) => a.id);
const PET_CHOICES: readonly string[] = PETS.map((p) => p.id);
const THEME_CHOICES: readonly string[] = THEMES.map((t) => t.id);

export const DEFAULT_REWARDS = [
  { title: 'גלידה טעימה 🍦', cost: 100 },
  { title: 'בחירת סרט משפחתי 🎬', cost: 250 },
  { title: '20 ₪ אמיתיים לקופה 💵', cost: 500 },
];

export function defaultProgress(opts: { avatar?: string; pet?: string; theme?: string } = {}): ProgressData {
  const avatar = AVATAR_CHOICES.includes(opts.avatar ?? '') ? opts.avatar! : 'av_girl';
  const pet = PET_CHOICES.includes(opts.pet ?? '') ? opts.pet! : 'pet_dog';
  const theme = THEME_CHOICES.includes(opts.theme ?? '') ? opts.theme! : 'theme-classic';
  return {
    coins: 0,
    dailyStreak: 1,
    lastActiveDate: new Date().toISOString().slice(0, 10),
    completedLevels: [],
    learnedLetters: [],
    readWords: [],
    readSentences: [],
    mistakes: [],
    bdBestScore: 0,
    slowSpeech: false,
    sfxMuted: false,
    preferredVoiceName: '',
    ownedItems: Array.from(new Set(['av_girl', 'pet_dog', 'theme-classic', avatar, pet, theme])),
    equippedAvatar: avatar,
    equippedPet: pet,
    equippedTheme: theme,
  };
}

export function stripServerOwned(data: ProgressData): ProgressData {
  const copy = { ...data };
  for (const key of SERVER_OWNED_KEYS) delete copy[key];
  return copy;
}

type Row = { data: ProgressData; version: string; updated_at: Date };
const toProgress = (r: Row): Progress => ({
  data: r.data,
  version: Number(r.version),
  updatedAt: r.updated_at.toISOString(),
});

export async function getProgress(studentId: string): Promise<Progress | null> {
  const { rows } = await query<Row>('SELECT data, version, updated_at FROM student_progress WHERE user_id = $1', [
    studentId,
  ]);
  return rows[0] ? toProgress(rows[0]) : null;
}

export type SaveResult = { ok: true; version: number; coins: number } | { ok: false; current: Progress };

/**
 * Optimistic concurrency: the write only lands if the client saw the latest version.
 * If a parent reset (or another device) changed it meanwhile, the client gets the
 * current server copy back instead of silently overwriting it.
 */
/**
 * Coin guard: the game client reports coins, so a save may add at most MAX_GAIN_PER_SAVE
 * coins and at most MAX_GAIN_PER_HOUR per hour (server-side coins from checks, redemptions
 * and parents don't count). Anything above is clamped and audited.
 */
export const MAX_GAIN_PER_SAVE = 100;
export const MAX_GAIN_PER_HOUR = 400;
const hourlyGains = new Map<string, { since: number; total: number }>();

function allowedGain(studentId: string, wanted: number): number {
  const now = Date.now();
  let g = hourlyGains.get(studentId);
  if (!g || now - g.since > 60 * 60_000) {
    g = { since: now, total: 0 };
    hourlyGains.set(studentId, g);
  }
  const allowed = Math.max(0, Math.min(wanted, MAX_GAIN_PER_SAVE, MAX_GAIN_PER_HOUR - g.total));
  g.total += allowed;
  return allowed;
}

export async function saveProgressIfVersion(
  studentId: string,
  data: ProgressData,
  baseVersion: number,
): Promise<SaveResult> {
  const outcome = await withTransaction(async (client) => {
    const cur = await client.query<{ data: ProgressData; version: string }>(
      'SELECT data, version FROM student_progress WHERE user_id = $1 FOR UPDATE',
      [studentId],
    );
    const row = cur.rows[0];
    if (!row) throw new Error('progress row missing');
    if (Number(row.version) !== baseVersion) return null; // stale -> conflict

    const next = stripServerOwned(data);
    const before = Number(row.data.coins) || 0;
    const wanted = Number(next.coins);
    if (Number.isFinite(wanted) && wanted > before) {
      const gain = allowedGain(studentId, wanted - before);
      if (gain < wanted - before) {
        next.coins = before + gain;
        await audit(null, 'coins.suspicious', studentId, { before, wanted, allowed: before + gain }, client);
      }
    } else if (!Number.isFinite(wanted) || wanted < 0) {
      next.coins = Math.max(0, before);
    }

    const upd = await client.query<{ version: string }>(
      'UPDATE student_progress SET data = $2::jsonb, version = version + 1, updated_at = now() WHERE user_id = $1 RETURNING version',
      [studentId, JSON.stringify(next)],
    );
    return { version: Number(upd.rows[0].version), coins: Number(next.coins) || 0 };
  });
  if (outcome) return { ok: true, version: outcome.version, coins: outcome.coins };
  const current = await getProgress(studentId);
  if (!current) throw new Error('progress row missing');
  return { ok: false, current };
}

export async function insertProgress(client: PoolClient, studentId: string, data: ProgressData): Promise<void> {
  await client.query('INSERT INTO student_progress (user_id, data) VALUES ($1, $2::jsonb)', [
    studentId,
    JSON.stringify(stripServerOwned(data)),
  ]);
}

/** Replace progress with a fresh start but keep the kid's look (avatar/pet/theme). Bumps version. */
export async function resetProgress(client: PoolClient, studentId: string): Promise<void> {
  const { rows } = await client.query<{ data: ProgressData }>(
    'SELECT data FROM student_progress WHERE user_id = $1 FOR UPDATE',
    [studentId],
  );
  const old = rows[0]?.data ?? {};
  const fresh = defaultProgress({
    avatar: String(old.equippedAvatar ?? ''),
    pet: String(old.equippedPet ?? ''),
    theme: String(old.equippedTheme ?? ''),
  });
  await client.query(
    `INSERT INTO student_progress (user_id, data) VALUES ($1, $2::jsonb)
     ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data, version = student_progress.version + 1, updated_at = now()`,
    [studentId, JSON.stringify(fresh)],
  );
}

/** Adds (or with a negative amount removes) coins atomically. Returns the new state. */
export async function adjustCoins(
  client: PoolClient,
  studentId: string,
  delta: number,
): Promise<{ coins: number; version: number }> {
  const { rows } = await client.query<{ coins: string; version: string }>(
    `UPDATE student_progress
        SET data = jsonb_set(data, '{coins}', to_jsonb(GREATEST(0, COALESCE((data->>'coins')::int, 0) + $2))),
            version = version + 1, updated_at = now()
      WHERE user_id = $1
      RETURNING data->>'coins' AS coins, version`,
    [studentId, delta],
  );
  if (!rows[0]) throw new Error('progress row missing');
  return { coins: Number(rows[0].coins), version: Number(rows[0].version) };
}

/** Small summary for the parent dashboard. */
export function summarize(data: ProgressData | undefined) {
  const arr = (k: string) => (Array.isArray(data?.[k]) ? (data![k] as unknown[]) : []);
  return {
    coins: Number(data?.coins) || 0,
    dailyStreak: Number(data?.dailyStreak) || 0,
    lastActiveDate: typeof data?.lastActiveDate === 'string' ? data.lastActiveDate : null,
    completedLevels: arr('completedLevels').length,
    learnedLetters: arr('learnedLetters').filter((l) => typeof l === 'string' && l.length === 1).length,
    readWords: arr('readWords').length,
    readSentences: arr('readSentences').length,
    mistakes: arr('mistakes').length,
    equippedAvatar: typeof data?.equippedAvatar === 'string' ? data.equippedAvatar : 'av_girl',
    equippedPet: typeof data?.equippedPet === 'string' ? data.equippedPet : 'pet_dog',
    ...spellingSummary(data?.spellingStats),
    ...reviewSummary(data),
    placement: placementOf(data),
    ...dictationSummary(data?.dictationStats),
    grammar: grammarSummary(data?.grammarStats),
    ...readingSummary(data?.readingStats),
    ...speakingSummary(data?.speakingStats),
  };
}

function speakingSummary(raw: unknown) {
  const stats = raw && typeof raw === 'object' ? Object.values(raw as Record<string, { ok?: number }>) : [];
  return { speakingTried: stats.length, speakingOk: stats.filter((s) => (s?.ok ?? 0) > 0).length };
}

function readingSummary(raw: unknown) {
  const stats = raw && typeof raw === 'object' ? Object.values(raw as Record<string, { best?: number }>) : [];
  const bests = stats.map((s) => Number(s?.best) || 0);
  return { storiesRead: stats.length, storiesAvg: bests.length ? Math.round(bests.reduce((a, b) => a + b, 0) / bests.length) : 0 };
}

/** Best score per grammar topic (topic id -> %). */
function grammarSummary(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== 'object') return {};
  return Object.fromEntries(Object.entries(raw as Record<string, { best?: number }>).map(([k, v]) => [k, Number(v?.best) || 0]));
}

function dictationSummary(raw: unknown) {
  const stats = raw && typeof raw === 'object' ? Object.values(raw as Record<string, { c?: number }>) : [];
  return { dictationTried: stats.length, dictationPerfect: stats.filter((s) => (s?.c ?? 0) > 0).length };
}

function placementOf(data: ProgressData | undefined): { date: string; passedThrough: number } | null {
  const p = data?.placement as { date?: string; passedThrough?: number } | undefined;
  return p && typeof p.date === 'string' ? { date: p.date, passedThrough: Number(p.passedThrough) || 0 } : null;
}

/** Daily review (spaced repetition) written by /practice/daily. */
function reviewSummary(data: ProgressData | undefined) {
  const daily = (data?.dailyReview ?? {}) as { last?: string; streak?: number };
  const stats = data?.reviewStats && typeof data.reviewStats === 'object' ? Object.values(data.reviewStats as Record<string, { box?: number; due?: string }>) : [];
  const today = todayStr();
  return {
    reviewLast: typeof daily.last === 'string' ? daily.last : null,
    reviewStreak: daily.last === today || daily.last === addDays(today, -1) ? Number(daily.streak) || 0 : 0,
    reviewTracked: stats.length,
    reviewDue: stats.filter((s) => typeof s?.due === 'string' && s.due <= today).length,
    reviewMastered: stats.filter((s) => (s?.box ?? 0) >= 4).length,
  };
}

/** Spelling stats written by /practice/spell: { [word]: { c, w, s, t } }. */
function spellingSummary(raw: unknown) {
  const stats = raw && typeof raw === 'object' ? Object.values(raw as Record<string, { s?: number; w?: number }>) : [];
  return {
    spellingPracticed: stats.length,
    spellingKnown: stats.filter((st) => (st?.s ?? 0) >= 3).length,
    spellingWeak: stats.filter((st) => (st?.w ?? 0) > 0 && (st?.s ?? 0) < 3).length,
  };
}
