import { LETTERS, PHONICS_WORDS } from '@/content/phonics';

/**
 * Spaced repetition ("5 דקות ביום"), Leitner style. Pure functions, safe on client and server.
 *
 * Stored in progress JSON (written by the kid's client like the rest of the game data):
 *   reviewStats: { "<kind>:<item>": { box: 0-6, due: "YYYY-MM-DD" } }
 *   dailyReview: { last: "YYYY-MM-DD", streak: n }
 */
export type ReviewKind = 'letter' | 'word' | 'spell';
export type ReviewStat = { box: number; due: string };
export type ReviewExercise =
  | { key: string; kind: 'letter'; letter: string; answer: string; options: string[] }
  | { key: string; kind: 'word'; word: string; emoji: string; answer: string; options: string[] }
  | { key: string; kind: 'spell'; word: string; hebrew: string; emoji: string };

/** Days until the next review for each Leitner box (box 0 = brand new). */
export const INTERVALS = [0, 1, 2, 4, 7, 14, 30];
export const MAX_SESSION = 15;
const NEW_PER_DAY = 5;
export const DAILY_BONUS = 5;
const TIME_ZONE = 'Asia/Jerusalem';

/** Today's date in Israel as YYYY-MM-DD (same on server and client). */
export function todayStr(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

export function addDays(day: string, n: number): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function nextStat(prev: ReviewStat | undefined, correct: boolean, today: string): ReviewStat {
  if (!correct) return { box: 1, due: addDays(today, 1) };
  const box = Math.min((prev?.box ?? 0) + 1, INTERVALS.length - 1);
  return { box, due: addDays(today, INTERVALS[box]) };
}

export function reviewStatsOf(data: Record<string, unknown>): Record<string, ReviewStat> {
  return data.reviewStats && typeof data.reviewStats === 'object' ? (data.reviewStats as Record<string, ReviewStat>) : {};
}

export function dailyReviewOf(data: Record<string, unknown>): { last: string | null; streak: number } {
  const d = data.dailyReview as { last?: string; streak?: number } | undefined;
  return { last: typeof d?.last === 'string' ? d.last : null, streak: Number(d?.streak) || 0 };
}

/** Streak after finishing today's review. */
export function nextDaily(prev: { last: string | null; streak: number }, today: string) {
  if (prev.last === today) return prev;
  const streak = prev.last === addDays(today, -1) ? prev.streak + 1 : 1;
  return { last: today, streak };
}

const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Everything the kid has learned that can be reviewed, as review keys. */
export function reviewableKeys(data: Record<string, unknown>, meanings: Map<string, { hebrew: string; emoji: string }>): string[] {
  const keys = new Set<string>();
  for (const l of strings(data.learnedLetters)) if (LETTERS.some((x) => x.key === l)) keys.add(`letter:${l}`);
  const phonics = new Set(PHONICS_WORDS.map((w) => w.word));
  for (const w of [...strings(data.readWords), ...strings(data.mistakes)]) if (phonics.has(w)) keys.add(`word:${w}`);
  const spelling = data.spellingStats && typeof data.spellingStats === 'object' ? (data.spellingStats as Record<string, { c?: number }>) : {};
  for (const [w, st] of Object.entries(spelling)) if ((st?.c ?? 0) > 0 && meanings.has(w)) keys.add(`spell:${w}`);
  return [...keys];
}

/** Today's session: due items first (oldest first), then up to 5 new ones. */
export function planSession(
  data: Record<string, unknown>,
  meanings: Map<string, { hebrew: string; emoji: string }>,
  today: string,
  rand: () => number = Math.random,
) {
  const stats = reviewStatsOf(data);
  const keys = reviewableKeys(data, meanings);
  const due = keys.filter((k) => stats[k] && stats[k].due <= today).sort((a, b) => stats[a].due.localeCompare(stats[b].due));
  const fresh = shuffle(keys.filter((k) => !stats[k]), rand).slice(0, NEW_PER_DAY);
  const chosen = [...due, ...fresh].slice(0, MAX_SESSION);
  return { keys: shuffle(chosen, rand), dueCount: due.length, newCount: fresh.length, tracked: Object.keys(stats).length };
}

/** Turns review keys into exercises (multiple-choice options drawn from the same content). */
export function buildExercises(
  keys: string[],
  meanings: Map<string, { hebrew: string; emoji: string }>,
  rand: () => number = Math.random,
): ReviewExercise[] {
  const letterNames = LETTERS.map((l) => l.hebrewName);
  const allMeanings = [...new Set([...meanings.values()].map((m) => m.hebrew).filter(Boolean))];
  const pick = (correct: string, pool: string[]) =>
    shuffle([correct, ...shuffle(pool.filter((p) => p !== correct), rand).slice(0, 3)], rand);
  const out: ReviewExercise[] = [];
  for (const key of keys) {
    const [kind, item] = [key.slice(0, key.indexOf(':')), key.slice(key.indexOf(':') + 1)];
    if (kind === 'letter') {
      const l = LETTERS.find((x) => x.key === item);
      if (l) out.push({ key, kind: 'letter', letter: item, answer: l.hebrewName, options: pick(l.hebrewName, letterNames) });
    } else if (kind === 'word') {
      const w = PHONICS_WORDS.find((x) => x.word === item);
      if (w) out.push({ key, kind: 'word', word: w.word, emoji: w.emoji, answer: w.hebrew, options: pick(w.hebrew, allMeanings) });
    } else if (kind === 'spell') {
      const m = meanings.get(item);
      if (m) out.push({ key, kind: 'spell', word: item, hebrew: m.hebrew, emoji: m.emoji });
    }
  }
  return out;
}
