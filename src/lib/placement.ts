import { LEVELS, PHONICS_WORDS, SENTENCES, SOUNDS } from '@/content/phonics';
import { todayStr } from './review';

/**
 * Placement test: a few questions per level, stop at the first level that isn't solid.
 * Passed levels are marked complete (and their letters learned) so the kid starts where
 * the real learning is. It only ever ADDS progress.
 */
export type PlacementQuestion =
  | { kind: 'sound'; letter: string; answer: string; options: string[] }
  | { kind: 'picture'; word: string; answer: string; options: { emoji: string; hebrew: string }[] }
  | { kind: 'sentence'; text: string; answer: string; options: string[] };
export type PlacementLevel = { level: number; title: string; questions: PlacementQuestion[]; passMark: number };

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function buildPlacement(rand: () => number = Math.random): PlacementLevel[] {
  const allSounds = SOUNDS.map((s) => s.hebrewSound);
  return LEVELS.map((lvl) => {
    if (lvl.isSentenceLevel) {
      const picked = shuffle(SENTENCES, rand).slice(0, 2);
      return {
        level: lvl.id,
        title: lvl.title,
        passMark: 2,
        questions: picked.map((s) => ({
          kind: 'sentence' as const,
          text: s.text,
          answer: s.hebrew,
          options: shuffle([s.hebrew, ...shuffle(SENTENCES.filter((x) => x.id !== s.id), rand).slice(0, 3).map((x) => x.hebrew)], rand),
        })),
      };
    }
    const letters = shuffle(lvl.letters, rand).slice(0, 2);
    const words = shuffle(PHONICS_WORDS.filter((w) => w.level === lvl.id), rand).slice(0, 2);
    const questions: PlacementQuestion[] = [
      ...letters.map((key) => {
        const answer = SOUNDS.find((s) => s.key === key)!.hebrewSound;
        return {
          kind: 'sound' as const,
          letter: key,
          answer,
          options: shuffle([answer, ...shuffle(allSounds.filter((x) => x !== answer), rand).slice(0, 3)], rand),
        };
      }),
      ...words.map((w) => {
        const others = shuffle(
          PHONICS_WORDS.filter((x) => x.word !== w.word && x.emoji !== w.emoji),
          rand,
        );
        const opts: { emoji: string; hebrew: string }[] = [{ emoji: w.emoji, hebrew: w.hebrew }];
        for (const o of others) {
          if (opts.length === 4) break;
          if (!opts.some((x) => x.emoji === o.emoji)) opts.push({ emoji: o.emoji, hebrew: o.hebrew });
        }
        return { kind: 'picture' as const, word: w.word, answer: w.emoji, options: shuffle(opts, rand) };
      }),
    ];
    return { level: lvl.id, title: lvl.title, passMark: 3, questions: shuffle(questions, rand) };
  });
}

/** Adds the passed levels (1..passedThrough) to progress. Never removes anything. */
export function applyPlacement(data: Record<string, unknown>, passedThrough: number): Record<string, unknown> {
  const arr = (k: string) => (Array.isArray(data[k]) ? (data[k] as unknown[]) : []);
  const passed = LEVELS.filter((l) => l.id <= passedThrough);
  const completed = new Set([...arr('completedLevels').map(Number), ...passed.map((l) => l.id)]);
  const letters = new Set([...arr('learnedLetters').map(String), ...passed.flatMap((l) => l.letters)]);
  return {
    ...data,
    completedLevels: [...completed].sort((a, b) => a - b),
    learnedLetters: [...letters],
    placement: { date: todayStr(), passedThrough },
  };
}
