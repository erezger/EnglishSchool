'use client';

import { useEffect, useRef, useState } from 'react';
import { ALL_WORDS } from '@/content/game';
import { speakPhonics, speakWord } from '@/lib/game-speech';
import { useGame } from './GameContext';
import QuizTab from './QuizTab';

type BdQ = { mode: 'sound' | 'match'; target: string; word?: string; hebrew?: string; emoji?: string; upper?: string; prompt: string };

const BD_POOL: BdQ[] = [
  { mode: 'sound', target: 'b', word: 'bat', hebrew: 'עטלף', emoji: '🦇', prompt: 'איזו אות מתחילה את המילה?' },
  { mode: 'sound', target: 'd', word: 'dog', hebrew: 'כלב', emoji: '🐶', prompt: 'איזו אות מתחילה את המילה?' },
  { mode: 'sound', target: 'p', word: 'pig', hebrew: 'חזיר', emoji: '🐷', prompt: 'איזו אות מתחילה את המילה?' },
  { mode: 'sound', target: 'q', word: 'queen', hebrew: 'מלכה', emoji: '👑', prompt: 'איזו אות מתחילה את המילה?' },
  { mode: 'sound', target: 'b', word: 'bed', hebrew: 'מיטה', emoji: '🛏️', prompt: 'איזו אות מתחילה את המילה?' },
  { mode: 'sound', target: 'd', word: 'dad', hebrew: 'אבא', emoji: '👨', prompt: 'איזו אות מתחילה את המילה?' },
  { mode: 'sound', target: 'p', word: 'pan', hebrew: 'מחבת', emoji: '🍳', prompt: 'איזו אות מתחילה את המילה?' },
  { mode: 'sound', target: 'b', word: 'bus', hebrew: 'אוטובוס', emoji: '🚌', prompt: 'איזו אות מתחילה את המילה?' },
  { mode: 'match', target: 'b', upper: 'B', prompt: 'מצאי את האות הקטנה של:' },
  { mode: 'match', target: 'd', upper: 'D', prompt: 'מצאי את האות הקטנה של:' },
  { mode: 'match', target: 'p', upper: 'P', prompt: 'מצאי את האות הקטנה של:' },
  { mode: 'match', target: 'q', upper: 'Q', prompt: 'מצאי את האות הקטנה של:' },
];

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export default function ChallengesTab() {
  const g = useGame();
  const [practicing, setPracticing] = useState(false);
  const mistakes = g.list('mistakes');
  const best = Number(g.data.bdBestScore) || 0;

  if (practicing) return <QuizTab mistakeMode onExit={() => setPracticing(false)} />;

  return (
    <div className="p-4 sm:p-7">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="bg-gradient-to-br from-rose-50/90 to-amber-50/70 border-2 border-rose-200 rounded-3xl p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-rose-100 text-rose-800 text-xs font-extrabold px-3 py-1 rounded-full mb-1">
                <span>🎯 בנק החיזוק האישי</span>
                <span className="bg-amber-300 text-amber-950 px-2 py-0.5 rounded-full">2x מטבעות!</span>
              </div>
              <h3 className="text-xl font-black text-slate-800">מילים שמתאמנים עליהן עוד קצת</h3>
              <p className="text-sm text-slate-600">כל מילה שטעית בה נשמרת כאן אוטומטית. כשתעני עליה נכון היא תיעלם מהבנק ותקבלי מטבעות כפולים!</p>
            </div>
            {mistakes.length > 0 && (
              <button
                onClick={() => setPracticing(true)}
                className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold px-5 py-3 rounded-2xl shadow-md transition active:scale-95 cursor-pointer shrink-0"
              >
                🚀 תרגלי את בנק החיזוק
              </button>
            )}
          </div>
          {mistakes.length === 0 ? (
            <div className="bg-white/80 rounded-2xl p-4 text-center text-sm font-bold text-emerald-700 border border-emerald-200">🌟 בנק החיזוק ריק כרגע! אין לך מילים שטעית בהן – עבודה נהדרת!</div>
          ) : (
            <div className="flex flex-wrap gap-2" dir="ltr" data-testid="mistake-bank">
              {mistakes.map((w) => {
                const obj = ALL_WORDS[w];
                return (
                  <button key={w} onClick={() => speakWord(w)} className="bg-white hover:bg-rose-100 border border-rose-200 px-3.5 py-2 rounded-xl flex items-center gap-2 shadow-2xs cursor-pointer transition">
                    <span>{obj?.emoji ?? '🔤'}</span>
                    <span className="en-text font-black text-rose-900">{w}</span>
                    <span className="font-hebrew text-xs text-slate-500" dir="rtl">
                      {obj?.hebrew ?? ''}
                    </span>
                    <span className="text-xs">🔊</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-teal-50/80 to-emerald-50/70 border-2 border-teal-200 rounded-3xl p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <span className="bg-teal-100 text-teal-800 text-xs font-extrabold px-3 py-1 rounded-full">אתגר אלופות ⚡</span>
              <h3 className="text-xl sm:text-2xl font-black text-teal-950 mt-1">
                אלופת ה- <span className="en-text bg-white px-2 rounded-lg border border-teal-200">b / d / p / q</span>
              </h3>
            </div>
            <div className="bg-white border border-teal-200 rounded-2xl px-4 py-2 text-center self-start sm:self-auto">
              <div className="text-[11px] text-slate-500 font-bold">שיא אישי</div>
              <div className="text-xl font-black text-teal-700" data-testid="bd-best">
                {best} מתוך 10
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white border border-amber-200 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-extrabold text-amber-900">🛏️ טריק המיטה (bed)</h4>
                <button onClick={() => speakWord('bed')} className="bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-lg cursor-pointer">
                  🔊 bed
                </button>
              </div>
              <p className="text-xs text-slate-600 mb-3">
                בצד שמאל משענת הראש (<strong className="en-text text-indigo-700">b</strong>) ובצד ימין משענת הרגליים (<strong className="en-text text-teal-700">d</strong>).
              </p>
              <svg viewBox="0 0 260 100" className="w-full max-w-[230px] mx-auto h-auto" aria-label="איור המילה bed בצורת מיטה">
                <rect x="46" y="42" width="38" height="16" rx="8" fill="#bae6fd" stroke="#0284c7" strokeWidth="2" />
                <rect x="86" y="46" width="110" height="22" rx="6" fill="#c7d2fe" stroke="#4f46e5" strokeWidth="2" />
                <line x1="36" y1="82" x2="224" y2="82" stroke="#92400e" strokeWidth="6" strokeLinecap="round" />
                <text x="34" y="78" fontFamily="Nunito, sans-serif" fontWeight="900" fontSize="64" fill="#4f46e5">
                  b
                </text>
                <text x="108" y="78" fontFamily="Nunito, sans-serif" fontWeight="900" fontSize="60" fill="#d97706">
                  e
                </text>
                <text x="174" y="78" fontFamily="Nunito, sans-serif" fontWeight="900" fontSize="64" fill="#0d9488">
                  d
                </text>
              </svg>
            </div>
            <div className="bg-white border border-purple-200 rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <h4 className="font-extrabold text-purple-900 mb-2">
                  👑 טריק ה-<span className="en-text">p</span> וה-<span className="en-text">q</span>
                </h4>
                <p className="text-xs text-slate-600 mb-2">
                  <strong className="en-text text-base text-purple-700">p</strong> (פּיצה 🍕): מסתכלת <strong>קדימה</strong> (ימינה) לכיוון האוכל!
                </p>
                <p className="text-xs text-slate-600">
                  <strong className="en-text text-base text-rose-600">q</strong> (Queen 👑): המלכה מסתכלת <strong>אחורה</strong> (שמאלה) על הגלימה שלה.
                </p>
              </div>
              <div className="flex items-center justify-around mt-3 pt-2 border-t border-slate-100" dir="ltr">
                <button onClick={() => speakPhonics('p')} className="px-4 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 font-black en-text cursor-pointer">
                  p 🔊
                </button>
                <span className="text-slate-300 font-bold text-xs">VS</span>
                <button onClick={() => speakPhonics('q')} className="px-4 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-900 font-black en-text cursor-pointer">
                  q 🔊
                </button>
              </div>
            </div>
          </div>

          <BdGame />
        </div>
      </div>
    </div>
  );
}

function BdGame() {
  const g = useGame();
  const [questions, setQuestions] = useState<BdQ[] | null>(null);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const q = questions?.[index];
  useEffect(() => {
    if (!q) return;
    setOptions(shuffle(['b', 'd', 'p', 'q']));
    setPicked(null);
    const t = setTimeout(() => (q.mode === 'sound' && q.word ? speakWord(q.word) : speakPhonics(q.target, false)), 220);
    return () => clearTimeout(t);
  }, [q]);

  function start() {
    setQuestions(shuffle(BD_POOL).slice(0, 10));
    setIndex(0);
    setScore(0);
  }

  function answer(opt: string) {
    if (!q || picked) return;
    setPicked(opt);
    const right = opt === q.target;
    const newScore = score + (right ? 1 : 0);
    if (right) {
      setScore(newScore);
      g.award(3);
    } else g.sfx('wrong');
    timer.current = setTimeout(() => {
      if (index + 1 < (questions?.length ?? 0)) setIndex(index + 1);
      else finish(newScore);
    }, 1050);
  }

  function finish(final: number) {
    if (final > (Number(g.data.bdBestScore) || 0)) g.mutate((d) => ({ ...d, bdBestScore: final }));
    if (final >= 8) {
      g.sfx('fanfare');
      g.confetti();
      g.award(15, 'אלופת ה-b/d/p/q!');
    }
    setIndex(10);
  }

  return (
    <div className="bg-white border-2 border-teal-100 rounded-2xl p-5 text-center" data-testid="bd-area">
      {!questions ? (
        <>
          <h4 className="text-lg font-extrabold text-slate-800 mb-1">⚡ אתגר 10 השאלות המהיר</h4>
          <p className="text-xs sm:text-sm text-slate-500 mb-4">כל תשובה נכונה מזכה ב-3 מטבעות 🪙!</p>
          <button onClick={start} className="bg-gradient-to-l from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-extrabold px-7 py-3 rounded-2xl shadow-md cursor-pointer transition active:scale-95">
            🚀 התחילי אתגר b / d / p / q
          </button>
        </>
      ) : !q ? (
        <div className="py-3 animate-pop">
          <div className="text-5xl mb-2">{score >= 8 ? '👑' : '🌟'}</div>
          <h4 className="text-2xl font-black text-teal-900">סיימת עם {score} מתוך 10!</h4>
          <button onClick={start} className="mt-4 bg-teal-600 hover:bg-teal-700 text-white font-extrabold px-6 py-2.5 rounded-2xl cursor-pointer">
            🔄 שחקי שוב
          </button>
        </div>
      ) : (
        <>
          <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
            <span>שאלה {index + 1} מתוך 10</span>
            <span className="text-teal-700">ניקוד: {score}</span>
          </div>
          <div className="font-extrabold text-slate-800">{q.prompt}</div>
          {q.mode === 'sound' ? (
            <div className="flex items-center justify-center gap-4 my-3">
              <button onClick={() => q.word && speakWord(q.word)} className="w-16 h-16 rounded-full bg-teal-600 text-white shadow flex items-center justify-center text-2xl cursor-pointer" aria-label="השמעה">
                🔊
              </button>
              <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-2xl">
                <div className="text-3xl">{q.emoji}</div>
                <div className="text-xs font-bold text-slate-700" data-testid="bd-hebrew">
                  {q.hebrew}
                </div>
              </div>
            </div>
          ) : (
            <div className="my-3 inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-teal-50 border-2 border-teal-200 en-text text-5xl font-black text-teal-800" data-testid="bd-upper">
              {q.upper}
            </div>
          )}
          <div className="grid grid-cols-4 gap-3 max-w-md mx-auto mt-4" dir="ltr" data-testid="bd-options">
            {options.map((opt) => {
              const state = !picked ? '' : opt === q.target && opt === picked ? 'bg-emerald-500 border-emerald-600 text-white animate-pop' : opt === picked ? 'bg-rose-100 border-rose-400 text-rose-600 animate-shake' : '';
              return (
                <button key={opt} onClick={() => answer(opt)} className={`en-text bg-slate-50 hover:bg-teal-50 border-2 border-slate-200 hover:border-teal-400 rounded-2xl py-3.5 text-4xl font-black text-slate-800 cursor-pointer transition active:scale-95 ${state}`}>
                  {opt}
                </button>
              );
            })}
          </div>
          <div className="mt-3 min-h-[26px] text-sm font-bold">
            {picked &&
              (picked === q.target ? (
                <span className="text-emerald-700">✨ בול! (+3 🪙)</span>
              ) : (
                <span className="text-rose-600">
                  התשובה הנכונה: <strong className="en-text text-lg text-slate-900 mx-1">{q.target}</strong>
                </span>
              ))}
          </div>
        </>
      )}
    </div>
  );
}
