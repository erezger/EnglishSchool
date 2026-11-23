/**
 * Coin rules (shared by the game and the practice pages):
 *  - learning pays per item at most once a day ("daily" keys, reset every Israel day) — practice tomorrow pays again;
 *  - tests / quizzes / challenges pay only the first time ever ("once" keys);
 *  - no daily cap.
 * The bookkeeping lives in progress data (`earnedToday`, `paidOnce`), and every check runs inside the
 * progress op, so a save that is re-applied after a conflict can never pay twice.
 */
import { todayStr } from './review';

type Data = Record<string, unknown>;

/** Rough coins a kid earns on an ordinary practice day — used to show parents what a price means. */
export const COINS_PER_PRACTICE_DAY = 80;

export const practiceDaysFor = (cost: number) => Math.max(1, Math.round(cost / COINS_PER_PRACTICE_DAY));
export const practiceDaysLabel = (cost: number) => {
  const days = practiceDaysFor(cost);
  return days === 1 ? 'יום תרגול אחד' : `${days} ימי תרגול`;
};

function todayKeys(d: Data, today = todayStr()): string[] {
  const e = d.earnedToday as { day?: unknown; keys?: unknown } | undefined;
  return e && e.day === today && Array.isArray(e.keys) ? e.keys.filter((k): k is string => typeof k === 'string') : [];
}

function onceKeys(d: Data): string[] {
  return Array.isArray(d.paidOnce) ? d.paidOnce.filter((k): k is string => typeof k === 'string') : [];
}

const addCoins = <T extends Data>(d: T, amount: number): T => ({ ...d, coins: Math.max(0, (Number(d.coins) || 0) + amount) });

/** Would `key` still pay today? (for showing "+N" — the op below is what actually decides) */
export const canEarnToday = (d: Data, key: string) => !todayKeys(d).includes(key);

/** Pays `amount` for `key` if it hasn't paid yet today. */
export function payDaily<T extends Data>(d: T, key: string, amount: number): T {
  if (amount <= 0) return d;
  const today = todayStr();
  const keys = todayKeys(d, today);
  if (keys.includes(key)) return d;
  return { ...addCoins(d, amount), earnedToday: { day: today, keys: [...keys, key] } } as T;
}

export const canEarnOnce = (d: Data, key: string) => !onceKeys(d).includes(key);

/** Pays `amount` for `key` only the first time ever (the key is recorded even when amount is 0). */
export function payOnce<T extends Data>(d: T, key: string, amount: number): T {
  const keys = onceKeys(d);
  if (keys.includes(key)) return d;
  return { ...(amount > 0 ? addCoins(d, amount) : d), paidOnce: [...keys, key] } as T;
}

/**
 * For progress from before these rules: the tests the kid already finished (and was paid for)
 * count as paid, so they don't pay a second time. Levels skipped by the placement test never had
 * their quiz played, so those still pay the first time.
 */
export function paidOnceFromHistory(d: Data): string[] {
  const done = (Array.isArray(d.completedLevels) ? d.completedLevels : []).map(Number).filter(Number.isFinite);
  const placement = d.placement as { passedThrough?: unknown } | undefined;
  const skipped = Number(placement?.passedThrough) || 0;
  const keys = done.filter((id) => id <= 6 && id > skipped).map((id) => `quiz:${id}`);
  if (done.includes(7)) keys.push('level:7');
  if ((Number(d.bdBestScore) || 0) > 0) keys.push('bd');
  return keys;
}

/** Adds `paidOnce` to progress saved before these rules (no-op once it exists). */
export function withPaidOnce<T extends Data>(d: T): T {
  return Array.isArray(d.paidOnce) ? d : ({ ...d, paidOnce: paidOnceFromHistory(d) } as T);
}

/** All the amounts in one place. */
export const COINS = {
  learnLetter: 2, // once per letter (ever)
  newWord: 3, // first time a word is read in the blender (ever)
  buildWord: 4, // per word, once a day
  buildRound: 10, // finishing a build-a-word round, once a day per level
  sentence: 5, // once per sentence (ever)
  sentencesLevel: 15, // level 7 done (ever)
  quizPerCorrect: 5, // level quiz, first time only (paid at the end)
  quizDone: 15,
  bdPerCorrect: 3, // b/d/p/q challenge, first time only
  bdChampion: 15, // ≥ 8 of 10 on that first time
  mistakeWord: 5, // a word fixed in the mistakes bank, once a day per word
  mistakeRound: 5, // finishing mistakes practice, once a day
  spelling: { learn: 2, practiceClean: 3, practiceHelped: 2, testClean: 5, testHelped: 1 }, // per word, once a day
  dictationPerfect: 5, // per sentence, once a day
  dictationAlmost: 2,
  grammarCorrect: 1, // per question, once a day
  grammarRound: 3, // ≥ 80%, once a day per topic
  readingCorrect: 2, // per story, once a day
  readingPerfect: 3,
  sightCorrect: 1, // per word, once a day
  sightRound: 3, // once a day
  speakingOk: 1, // per word, once a day
} as const;
