'use client';

import { useCallback, useEffect, useState } from 'react';
import { ALL_WORDS, LETTER_BANK, LEVELS, type Level, type LevelWord } from '@/content/game';
import { speakLetterName, speakWord } from '@/lib/game-speech';
import { useGame } from './GameContext';

type Question = {
  type: 'listen' | 'meaning' | 'startLetter' | 'abcName';
  word: string;
  emoji?: string;
  hebrew?: string;
  letterKey?: string;
  promptHe: string;
  correctAnswer: string;
  options: string[];
  revealInfo: string;
};

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/** Same question mix as the original: listen / meaning / starting sound / ABC letter name. */
function generate(wordList: LevelWord[], lvl: Level, isDigraphLevel: boolean): Question[] {
  const words = shuffle(wordList);
  const others = Object.values(ALL_WORDS).filter((w) => !wordList.some((lw) => lw.word === w.word));
  const lettersPool = Object.keys(LETTER_BANK).filter((k) => k.length === (isDigraphLevel ? 2 : 1));
  const count = Math.min(6, Math.max(words.length, 4));
  const out: Question[] = [];
  for (let i = 0; i < count; i++) {
    const target = words[i % words.length];
    const type = !isDigraphLevel && i === 3 && lvl.letters.length >= 4 ? 3 : i % 3;
    const reveal = `${target.emoji} ${target.word} = ${target.hebrew}`;
    if (type === 0 || type === 1) {
      const distractors = shuffle([...wordList.filter((w) => w.word !== target.word), ...shuffle(others).slice(0, 3)]);
      out.push({
        type: type === 0 ? 'listen' : 'meaning',
        word: target.word,
        emoji: target.emoji,
        hebrew: target.hebrew,
        promptHe: type === 0 ? 'הקשיבי למילה ובחרי איך כותבים אותה:' : 'איזו מילה באנגלית מתאימה לתמונה ולפירוש?',
        correctAnswer: target.word,
        options: shuffle([target.word, ...distractors.slice(0, 3).map((d) => d.word)]),
        revealInfo: reveal,
      });
    } else if (type === 2) {
      const start = target.parts[0];
      out.push({
        type: 'startLetter',
        word: target.word,
        emoji: target.emoji,
        hebrew: target.hebrew,
        promptHe: 'הקשיבי למילה: באיזה צליל היא מתחילה?',
        correctAnswer: start,
        options: shuffle([start, ...shuffle(lettersPool.filter((l) => l !== start)).slice(0, 3)]),
        revealInfo: `המילה ${target.word} מתחילה ב-"${start}"`,
      });
    } else {
      const letter = lvl.letters[Math.floor(Math.random() * lvl.letters.length)];
      const info = LETTER_BANK[letter];
      out.push({
        type: 'abcName',
        letterKey: letter,
        word: target.word,
        promptHe: 'הקשיבי לשם האות ב-ABC ובחרי את האות הנכונה:',
        correctAnswer: letter.toUpperCase(),
        options: shuffle([letter, ...shuffle(lettersPool.filter((l) => l !== letter)).slice(0, 3)]).map((l) => l.toUpperCase()),
        revealInfo: `האות ${info.upper} (${info.lower}) נקראת "${info.hebrewName}"`,
      });
    }
  }
  return out;
}

export default function QuizTab({ mistakeMode = false, onExit }: { mistakeMode?: boolean; onExit?: () => void }) {
  const g = useGame();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [streak, setStreak] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [wrong, setWrong] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);
  const [mode, setMode] = useState(mistakeMode);

  const start = useCallback(
    (asMistakes: boolean) => {
      const lvl = g.level;
      let pool = lvl.words;
      if (asMistakes) {
        pool = g.list('mistakes').map((w) => ALL_WORDS[w]).filter(Boolean);
        if (!pool.length) {
          g.toast('בנק החיזוק ריק! כל הכבוד 🌟', '🎉');
          onExit?.();
          return;
        }
      }
      setMode(asMistakes);
      setQuestions(generate(pool, lvl, !asMistakes && lvl.id === 6));
      setIndex(0);
      setStreak(0);
      setAnswered(false);
      setWrong([]);
      setFinished(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [g.level],
  );

  useEffect(() => {
    start(mistakeMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const q = questions[index];
  useEffect(() => {
    if (!q || finished) return;
    const t = setTimeout(() => {
      if (q.type === 'listen' || q.type === 'startLetter') speakWord(q.word);
      else if (q.type === 'abcName' && q.letterKey) speakLetterName(q.letterKey);
    }, 260);
    return () => clearTimeout(t);
  }, [q, finished]);

  function answer(opt: string) {
    if (answered || !q || wrong.includes(opt)) return;
    if (opt === q.correctAnswer) {
      const s = streak + 1;
      setStreak(s);
      setAnswered(true);
      let bonus = 0;
      if (s % 3 === 0) {
        bonus = 10;
        g.toast('בונוס רצף 3 תשובות נכונות! +10 🪙', '🔥');
      }
      g.award((mode ? 10 : 5) + bonus);
      g.markWordRead(q.word, false);
      if (mode) g.mutate((d) => ({ ...d, mistakes: (Array.isArray(d.mistakes) ? (d.mistakes as string[]) : []).filter((w) => w !== q.word) }));
      setTimeout(() => speakWord(q.word), 220);
    } else {
      setStreak(0);
      g.sfx('wrong');
      g.recordMistake(q.word);
      setWrong([...wrong, opt]);
    }
  }

  function next() {
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setAnswered(false);
      setWrong([]);
      return;
    }
    // summary rewards (same as the original)
    const lvl = g.level;
    if (!mode) {
      if (!g.list('completedLevels').map(Number).includes(lvl.id)) {
        g.mutate((d) => {
          const done = (Array.isArray(d.completedLevels) ? (d.completedLevels as number[]) : []).map(Number);
          return done.includes(lvl.id) ? d : { ...d, completedLevels: [...done, lvl.id] };
        });
        g.award(25, `סיימת את ${lvl.shortName}!`);
      } else g.award(10, `בונוס חזרה על ${lvl.shortName}`);
    } else g.award(15, 'בונוס סיום בנק החיזוק!');
    g.sfx('fanfare');
    g.confetti();
    setFinished(true);
  }

  if (finished) {
    const nextLevel = LEVELS.find((l) => l.id === g.level.id + 1);
    return (
      <Wrap>
        <div className="bg-gradient-to-b from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-3xl p-7 sm:p-10 text-center animate-pop">
          <div className="text-6xl mb-3">🏆🪙</div>
          <h3 className="text-2xl sm:text-3xl font-black text-indigo-900 mb-2">{mode ? 'כל הכבוד! חיזקת את המילים הקשות!' : `אלופה! סיימת את ${g.level.shortName}!`}</h3>
          <p className="text-slate-600 font-medium mb-6">המטבעות נוספו לבנק האנגלית שלך! בדקי מה אפשר לקנות בחנות הפרסים 🛍️</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {mode && onExit ? (
              <button onClick={onExit} className="bg-white hover:bg-slate-100 border-2 border-rose-200 text-rose-700 font-bold px-6 py-3 rounded-2xl cursor-pointer">
                ⚡ חזרה לאתגרים
              </button>
            ) : (
              <button onClick={() => start(false)} className="bg-white hover:bg-slate-100 border-2 border-indigo-200 text-indigo-700 font-bold px-6 py-3 rounded-2xl cursor-pointer">
                🔄 שחקי שוב
              </button>
            )}
            {nextLevel && !mode ? (
              <button onClick={() => g.selectLevel(nextLevel.id)} className="bg-gradient-to-l from-indigo-600 to-purple-600 text-white font-extrabold px-7 py-3 rounded-2xl shadow-lg cursor-pointer">
                קדימה ל{nextLevel.shortName}! 🚀
              </button>
            ) : (
              <button onClick={() => g.setModal('shop')} className="bg-gradient-to-l from-pink-500 to-purple-600 text-white font-extrabold px-7 py-3 rounded-2xl shadow-lg cursor-pointer">
                🛍️ לחנות הפרסים!
              </button>
            )}
          </div>
        </div>
      </Wrap>
    );
  }
  if (!q) return null;

  return (
    <Wrap>
      {mode && <div className="mb-3 bg-rose-100 text-rose-800 text-xs font-black px-4 py-2 rounded-2xl text-center">🎯 תרגול בנק החיזוק – כל תשובה נכונה שווה 10 מטבעות (2x)! 🪙</div>}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold text-slate-500">
          שאלה {index + 1} מתוך {questions.length}
        </span>
        <div className="flex items-center gap-2">
          {questions.map((_, i) => (
            <div key={i} className={`w-3 h-3 rounded-full transition-all ${i < index ? 'bg-emerald-500' : i === index ? 'bg-indigo-600 scale-125' : 'bg-slate-200'}`} />
          ))}
        </div>
      </div>
      <div className="bg-slate-50/90 border-2 border-indigo-100 rounded-3xl p-5 sm:p-7 text-center">
        <h3 className="text-lg sm:text-xl font-extrabold text-slate-800" data-testid="quiz-prompt">
          {q.promptHe}
        </h3>
        {q.type === 'listen' && (
          <button onClick={() => speakWord(q.word)} className="mx-auto my-4 w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg flex flex-col items-center justify-center transition active:scale-95 cursor-pointer">
            <span className="text-4xl">🔊</span>
            <span className="text-xs font-bold mt-1">שמעי שוב</span>
          </button>
        )}
        {q.type === 'abcName' && (
          <button onClick={() => q.letterKey && speakLetterName(q.letterKey)} className="mx-auto my-4 w-24 h-24 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-lg flex flex-col items-center justify-center transition active:scale-95 cursor-pointer">
            <span className="text-4xl">🔤</span>
            <span className="text-xs font-bold mt-1">שמעי שם</span>
          </button>
        )}
        {q.type === 'meaning' && (
          <div className="my-4 inline-flex flex-col items-center bg-amber-50 border-2 border-amber-200 px-8 py-4 rounded-3xl">
            <span className="text-5xl mb-1">{q.emoji}</span>
            <span className="text-2xl font-extrabold text-slate-800">{q.hebrew}</span>
          </div>
        )}
        {q.type === 'startLetter' && (
          <div className="my-4 flex items-center justify-center gap-4">
            <button onClick={() => speakWord(q.word)} className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-md flex flex-col items-center justify-center transition active:scale-95 cursor-pointer">
              <span className="text-3xl">🔊</span>
              <span className="text-[11px] font-bold">השמע</span>
            </button>
            <div className="bg-white border border-slate-200 px-5 py-3 rounded-2xl text-right">
              <div className="text-3xl">{q.emoji}</div>
              <div className="text-sm font-bold text-slate-600">{q.hebrew}</div>
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-5" dir="ltr" data-testid="quiz-options">
          {q.options.map((opt) => {
            const isWrong = wrong.includes(opt);
            const isRight = answered && opt === q.correctAnswer;
            return (
              <button
                key={opt}
                onClick={() => answer(opt)}
                disabled={isWrong}
                className={`en-text border-2 rounded-2xl py-4 sm:py-5 px-4 text-3xl sm:text-4xl font-black shadow-xs transition active:scale-95 cursor-pointer ${
                  isRight
                    ? 'bg-emerald-500 border-emerald-600 text-white animate-pop'
                    : isWrong
                      ? 'animate-shake bg-rose-50 border-rose-300 text-rose-500 opacity-65'
                      : 'bg-white hover:bg-indigo-50 border-slate-200 hover:border-indigo-400 text-slate-800'
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
        <div className="mt-5 min-h-[56px] flex items-center justify-center">
          {answered ? (
            <div className="flex flex-col sm:flex-row items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-900 px-5 py-3 rounded-2xl w-full justify-between animate-pop">
              <div className="font-bold text-sm">
                🎉 מעולה! <span className="font-normal">({q.revealInfo})</span>
              </div>
              <button onClick={next} className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-5 py-2 rounded-xl text-sm cursor-pointer shrink-0">
                לשאלה הבאה ⬅️
              </button>
            </div>
          ) : wrong.length > 0 ? (
            <div className="text-rose-600 font-bold text-sm bg-rose-50 px-4 py-2 rounded-xl border border-rose-200">כמעט! נסי שוב 💪 (שמרתי את המילה לבנק החיזוק)</div>
          ) : null}
        </div>
      </div>
    </Wrap>
  );
}

function Wrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-4 sm:p-7">
      <div className="max-w-2xl mx-auto">{children}</div>
    </div>
  );
}
