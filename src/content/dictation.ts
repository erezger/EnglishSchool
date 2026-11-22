/**
 * Built-in dictation sentences by grade, using the grade word banks' vocabulary.
 * Short, simple sentences (present simple / can / was) for Israeli grades 3-4.
 */
export type DictationSentence = { id: string; text: string; hebrew: string; emoji: string };

export const DICTATION: Record<number, DictationSentence[]> = {
  3: [
    { id: 'd3-1', text: 'I have a red ball.', hebrew: 'יש לי כדור אדום.', emoji: '⚽' },
    { id: 'd3-2', text: 'The cat is on the bed.', hebrew: 'החתול על המיטה.', emoji: '🐱' },
    { id: 'd3-3', text: 'My mom has a big bag.', hebrew: 'לאמא שלי יש תיק גדול.', emoji: '👜' },
    { id: 'd3-4', text: 'I can see a yellow bird.', hebrew: 'אני יכול/ה לראות ציפור צהובה.', emoji: '🐤' },
    { id: 'd3-5', text: 'The dog can run and jump.', hebrew: 'הכלב יכול לרוץ ולקפוץ.', emoji: '🐶' },
    { id: 'd3-6', text: 'I like to eat pizza.', hebrew: 'אני אוהב/ת לאכול פיצה.', emoji: '🍕' },
    { id: 'd3-7', text: 'This is my new pencil.', hebrew: 'זה העיפרון החדש שלי.', emoji: '✏️' },
    { id: 'd3-8', text: 'We play with a kite.', hebrew: 'אנחנו משחקים עם עפיפון.', emoji: '🪁' },
    { id: 'd3-9', text: 'My brother is happy.', hebrew: 'אח שלי שמח.', emoji: '😊' },
    { id: 'd3-10', text: 'Thank you for the cake.', hebrew: 'תודה על העוגה.', emoji: '🎂' },
  ],
  4: [
    { id: 'd4-1', text: 'Today is a sunny day.', hebrew: 'היום יום שמשי.', emoji: '☀️' },
    { id: 'd4-2', text: 'I go to school on Sunday.', hebrew: 'אני הולך/ת לבית הספר ביום ראשון.', emoji: '🏫' },
    { id: 'd4-3', text: 'My friend has a funny dog.', hebrew: 'לחבר/ה שלי יש כלב מצחיק.', emoji: '🐕' },
    { id: 'd4-4', text: 'We eat in the kitchen.', hebrew: 'אנחנו אוכלים במטבח.', emoji: '🍳' },
    { id: 'd4-5', text: 'Where is my blue shirt?', hebrew: 'איפה החולצה הכחולה שלי?', emoji: '👕' },
    { id: 'd4-6', text: 'They like to dance and sing.', hebrew: 'הם אוהבים לרקוד ולשיר.', emoji: '💃' },
    { id: 'd4-7', text: 'It was cold and rainy yesterday.', hebrew: 'אתמול היה קר וגשום.', emoji: '🌧️' },
    { id: 'd4-8', text: 'The library is very big.', hebrew: 'הספרייה גדולה מאוד.', emoji: '📚' },
    { id: 'd4-9', text: 'I am tired because I ran fast.', hebrew: 'אני עייף/ה כי רצתי מהר.', emoji: '😴' },
    { id: 'd4-10', text: 'Can you help me open the window?', hebrew: 'את/ה יכול/ה לעזור לי לפתוח את החלון?', emoji: '🪟' },
  ],
};

/** Compare a typed sentence to the target, word by word (case and punctuation ignored). */
export function normalizeWords(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[’`]/g, "'")
    .replace(/[^a-z' ]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

export type WordResult = { word: string; typed: string; ok: boolean };

/**
 * Word-level alignment (edit distance: match 0, substitute / missing / extra word 1 each),
 * so a misspelled word counts once and one missing word doesn't shift everything after it.
 */
export function compareSentence(target: string, typed: string): { words: WordResult[]; wrong: number } {
  const t = normalizeWords(target);
  const g = normalizeWords(typed);
  const n = t.length;
  const m = g.length;
  const d: number[][] = Array.from({ length: n + 1 }, (_, i) => Array.from({ length: m + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      d[i][j] = Math.min(d[i - 1][j - 1] + (t[i - 1] === g[j - 1] ? 0 : 1), d[i - 1][j] + 1, d[i][j - 1] + 1);
    }
  }
  const words: WordResult[] = [];
  let i = n;
  let j = m;
  while (i > 0) {
    if (j > 0 && d[i][j] === d[i - 1][j - 1] + (t[i - 1] === g[j - 1] ? 0 : 1)) {
      words.unshift({ word: t[i - 1], typed: g[j - 1], ok: t[i - 1] === g[j - 1] }); // match / misspelling
      i--;
      j--;
    } else if (d[i][j] === d[i - 1][j] + 1) {
      words.unshift({ word: t[i - 1], typed: '', ok: false }); // missing word
      i--;
    } else {
      j--; // extra typed word
    }
  }
  return { words, wrong: d[n][m] };
}
