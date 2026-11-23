/**
 * High-frequency "sight words" for grades 3-4: short, very common words that are hard or
 * impossible to sound out, so kids need to recognise them instantly.
 */
export type SightWord = { word: string; hebrew: string };

const s = (word: string, hebrew: string): SightWord => ({ word, hebrew });

export const SIGHT_WORDS: SightWord[] = [
  s('the', 'ה׳ הידיעה'), s('a', 'אחד / אחת'), s('and', 'ו... (וגם)'), s('is', 'הוא / היא / זה (is)'),
  s('to', 'אל / ל...'), s('in', 'בתוך'), s('it', 'זה / זאת'), s('you', 'אתה / את'), s('I', 'אני'),
  s('we', 'אנחנו'), s('he', 'הוא'), s('she', 'היא'), s('they', 'הם / הן'), s('my', 'שלי'),
  s('your', 'שלך'), s('his', 'שלו'), s('her', 'שלה'), s('this', 'זה / זאת (קרוב)'), s('that', 'ההוא / ההיא (רחוק)'),
  s('what', 'מה'), s('where', 'איפה'), s('who', 'מי'), s('when', 'מתי'), s('why', 'למה'), s('how', 'איך'),
  s('here', 'כאן'), s('there', 'שם'), s('yes', 'כן'), s('not', 'לא (שלילה)'), s('can', 'יכול / יכולה'),
  s('said', 'אמר / אמרה'), s('was', 'היה / הייתה'), s('were', 'היו'), s('have', 'יש לי / לנו (have)'),
  s('has', 'יש לו / לה (has)'), s('do', 'לעשות'), s('go', 'ללכת'), s('come', 'לבוא'), s('look', 'להסתכל'),
  s('see', 'לראות'), s('like', 'לאהוב / לחבב'), s('want', 'לרצות'), s('with', 'עם'), s('for', 'בשביל'),
  s('from', 'מ... (מאיפה)'), s('of', 'של'), s('on', 'על'), s('up', 'למעלה'), s('down', 'למטה'),
  s('out', 'החוצה'), s('all', 'כולם / הכול'), s('some', 'קצת / כמה'), s('many', 'הרבה'), s('very', 'מאוד'),
  s('because', 'כי / בגלל ש...'), s('friend', 'חבר / חברה'), s('people', 'אנשים'), s('again', 'שוב'),
  s('after', 'אחרי'), s('before', 'לפני'), s('now', 'עכשיו'), s('then', 'אז / אחר כך'),
];

export const SIGHT_ROUND = 10;
export const SPEED = { startMs: 1500, minMs: 600, maxMs: 2500, faster: 100, slower: 200 };
