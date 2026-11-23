/**
 * Phonics views of the game content (src/content/game.ts) used by server-side features
 * (mastery checks, dictation, placement, review, reports). Edit the content in game.ts.
 */
import { LETTER_BANK, LEVELS as GAME_LEVELS } from './game';

export type PhonicsLetter = { key: string; hebrewName: string; ttsName: string; exampleWord: string; exampleHebrew: string; exampleEmoji: string };
export type PhonicsWord = { word: string; hebrew: string; emoji: string; level: number };
export type PhonicsSentence = { id: string; text: string; hebrew: string; emoji: string };
export type PhonicsSound = { key: string; upper: string; hebrewSound: string };
export type PhonicsLevel = { id: number; title: string; letters: string[]; isSentenceLevel: boolean };

/** The 26 single letters (no digraphs). */
export const LETTERS: PhonicsLetter[] = Object.entries(LETTER_BANK)
  .filter(([k]) => k.length === 1)
  .map(([key, v]) => ({ key, hebrewName: v.hebrewName, ttsName: v.ttsLetterName, exampleWord: v.exampleWord, exampleHebrew: v.exampleHebrew, exampleEmoji: v.exampleEmoji }));

/** Every decodable word once, tagged with the first level it appears in. */
export const PHONICS_WORDS: PhonicsWord[] = (() => {
  const seen = new Set<string>();
  const out: PhonicsWord[] = [];
  for (const lvl of GAME_LEVELS)
    for (const w of lvl.words) {
      if (seen.has(w.word)) continue;
      seen.add(w.word);
      out.push({ word: w.word, hebrew: w.hebrew, emoji: w.emoji, level: lvl.id });
    }
  return out;
})();

export const SENTENCES: PhonicsSentence[] = GAME_LEVELS.flatMap((l) => (l.sentences ?? []).map((s) => ({ id: s.id, text: s.text, hebrew: s.hebrew, emoji: s.emoji })));

/** Letters and digraphs (sh, ch...) with the sound hint shown in the game. */
export const SOUNDS: PhonicsSound[] = Object.entries(LETTER_BANK).map(([key, v]) => ({ key, upper: v.upper, hebrewSound: v.hebrewSound }));

export const LEVELS: PhonicsLevel[] = GAME_LEVELS.map((l) => ({ id: l.id, title: l.title, letters: l.letters ?? [], isSentenceLevel: !!l.isSentenceLevel }));
