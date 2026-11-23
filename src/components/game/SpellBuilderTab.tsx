'use client';

import { useCallback, useEffect, useState } from 'react';
import { LETTER_BANK, type LevelWord } from '@/content/game';
import { canEarnToday, COINS } from '@/lib/earning';
import { speakPhonics, speakWord } from '@/lib/game-speech';
import { useGame } from './GameContext';

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/** Listen and build the word from scrambled sounds (+4 per word, +15 for the round). */
export default function SpellBuilderTab() {
  const g = useGame();
  const [words, setWords] = useState<LevelWord[]>([]);
  const [index, setIndex] = useState(0);
  const [pool, setPool] = useState<string[]>([]);
  const [chosen, setChosen] = useState<number[]>([]);
  const [solved, setSolved] = useState(false);
  const [wrong, setWrong] = useState(false);
  const [finished, setFinished] = useState(false);
  const [roundPaid, setRoundPaid] = useState(false);

  const setupWord = useCallback((list: LevelWord[], i: number) => {
    const target = list[i];
    const distractors = shuffle(Object.keys(LETTER_BANK).filter((k) => k.length === 1 && !target.parts.includes(k))).slice(0, 2);
    setPool(shuffle([...target.parts, ...distractors]));
    setChosen([]);
    setSolved(false);
    setWrong(false);
    setTimeout(() => speakWord(target.word), 260);
  }, []);

  const start = useCallback(() => {
    const list = shuffle(g.level.words).slice(0, 8);
    setWords(list);
    setIndex(0);
    setFinished(false);
    if (list.length) setupWord(list, 0);
  }, [g.level.words, setupWord]);

  useEffect(() => {
    start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [g.level.id]);

  if (!words.length) return null;

  if (finished) {
    return (
      <div className="p-4 sm:p-7">
        <div className="max-w-2xl mx-auto">
          <div className="bg-gradient-to-b from-teal-50 to-emerald-50 border-2 border-teal-200 rounded-3xl p-8 text-center animate-pop">
            <div className="text-6xl mb-3">✍️🏆</div>
            <h3 className="text-2xl font-black text-teal-900 mb-2">מדהים! בנית את כל המילים!</h3>
            <p className="text-sm text-slate-600 mb-6">{roundPaid ? `קיבלת בונוס של +${COINS.buildRound} מטבעות ליתרה שלך 🪙` : 'את בונוס הסבב כבר קיבלת היום – מחר יש עוד! כל מילה שתבני מחדש עדיין מחזקת אותך 💪'}</p>
            <div className="flex flex-wrap justify-center gap-3">
              <button onClick={start} className="bg-white border-2 border-teal-300 text-teal-800 font-bold px-6 py-3 rounded-2xl cursor-pointer">
                🔄 סבב חדש
              </button>
              <button onClick={() => g.setTab('quiz')} className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-6 py-3 rounded-2xl shadow-md cursor-pointer">
                🎯 עברי לחידון השלב!
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const target = words[index];

  function pick(p: number) {
    if (solved || chosen.includes(p) || chosen.length >= target.parts.length) return;
    const next = [...chosen, p];
    setChosen(next);
    setWrong(false);
    speakPhonics(pool[p], false);
    if (next.length === target.parts.length) {
      if (next.map((i) => pool[i]).join('') === target.word) {
        setSolved(true);
        g.markWordRead(target.word, false);
        g.answered(true);
        g.award(COINS.buildWord, undefined, { daily: `build:${target.word}` });
        setTimeout(() => speakWord(target.word), 250);
      } else {
        g.sfx('wrong');
        g.recordMistake(target.word);
        setWrong(true);
      }
    }
  }

  function nextWord() {
    if (index + 1 >= words.length) {
      g.sfx('fanfare');
      g.confetti();
      setRoundPaid(g.award(COINS.buildRound, 'אלופת הכתיבה! סיימת את סבב בניית המילים', { daily: `buildRound:${g.level.id}` }));
      setFinished(true);
      return;
    }
    setIndex(index + 1);
    setupWord(words, index + 1);
  }

  return (
    <div className="p-4 sm:p-7">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-3">
          <span>
            מילה {index + 1} מתוך {words.length}
          </span>
          <span className="text-amber-600">{canEarnToday(g.data, `build:${target.word}`) ? `+${COINS.buildWord} 🪙 למילה הזו` : '✓ המילה הזו כבר זיכתה אותך היום'}</span>
        </div>
        <div className="bg-slate-50/90 border-2 border-indigo-100 rounded-3xl p-5 sm:p-7 text-center">
          <h3 className="text-lg font-extrabold text-slate-800 mb-3">✍️ הקשיבי למילה והרכיבי אותה מהאותיות!</h3>
          <div className="flex items-center justify-center gap-4 my-3">
            <button onClick={() => speakWord(target.word)} className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg flex flex-col items-center justify-center transition active:scale-95 cursor-pointer">
              <span className="text-3xl">🔊</span>
              <span className="text-[11px] font-bold">שמעי</span>
            </button>
            <div className="bg-white border border-amber-200 px-5 py-3 rounded-2xl">
              <div className="text-4xl">{target.emoji}</div>
              <div className="text-base font-extrabold text-slate-800" data-testid="spell-hebrew">
                {target.hebrew}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2.5 sm:gap-3 my-6 flex-wrap" dir="ltr" data-testid="spell-slots">
            {target.parts.map((_, slot) => {
              const p = chosen[slot];
              const filled = p !== undefined;
              return (
                <button
                  key={slot}
                  onClick={() => {
                    if (!filled || solved) return;
                    setChosen(chosen.filter((_, i) => i !== slot));
                    setWrong(false);
                    g.sfx('pop');
                  }}
                  className={`en-text min-w-[66px] sm:min-w-[80px] h-[76px] sm:h-[88px] rounded-2xl border-[3px] text-4xl sm:text-5xl font-black flex items-center justify-center transition ${
                    solved ? 'bg-emerald-500 border-emerald-600 text-white animate-pop' : filled ? 'bg-indigo-50 border-indigo-400 text-indigo-800 cursor-pointer hover:bg-rose-50' : 'bg-white border-dashed border-slate-300 text-slate-300'
                  }`}
                >
                  {filled ? pool[p] : '_'}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-2.5 flex-wrap pt-4 border-t border-slate-200" dir="ltr" data-testid="spell-pool">
            {pool.map((part, p) => {
              const used = chosen.includes(p);
              return (
                <button
                  key={`${part}-${p}`}
                  onClick={() => pick(p)}
                  disabled={used || solved}
                  className={`en-text min-w-[62px] sm:min-w-[74px] h-[68px] sm:h-[78px] px-3 rounded-2xl border-2 text-3xl sm:text-4xl font-black transition ${
                    used ? 'bg-slate-100 border-slate-200 text-slate-300 scale-90 cursor-default' : 'bg-white hover:bg-amber-50 border-indigo-200 hover:border-amber-400 text-slate-800 shadow-xs active:scale-95 cursor-pointer'
                  }`}
                >
                  {part}
                </button>
              );
            })}
          </div>

          <div className="mt-5 min-h-[48px] flex items-center justify-center gap-2">
            {solved ? (
              <button onClick={nextWord} className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-6 py-3 rounded-2xl shadow-md cursor-pointer animate-pop">
                🎉 מעולה! למילה הבאה ⬅️
              </button>
            ) : wrong ? (
              <span className="text-rose-600 font-bold text-sm bg-rose-50 px-4 py-2 rounded-xl border border-rose-200 animate-shake">כמעט! נסי שוב – לחצי על אות כדי להסיר אותה 💪</span>
            ) : (
              <>
                <button onClick={() => setChosen([])} className="text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-200/70 px-4 py-2 rounded-xl cursor-pointer">
                  נקה אותיות
                </button>
                <button
                  onClick={() => {
                    const idx = pool.indexOf(target.parts[0]);
                    if (idx !== -1) {
                      setChosen([idx]);
                      speakPhonics(target.parts[0], false);
                    }
                  }}
                  className="text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 px-4 py-2 rounded-xl cursor-pointer"
                >
                  💡 רמז לאות הראשונה
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
