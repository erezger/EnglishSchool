'use client';

import { useEffect, useRef, useState } from 'react';
import { DAILY_BONUS, nextDaily, nextStat, reviewStatsOf, type ReviewExercise } from '@/lib/review';
import { speak, speakLetter, spellOut, stopSpeaking, warmUpVoices } from '@/lib/speech';
import { useRoundActivity } from '@/lib/use-activity';
import { useProgress, type ProgressData } from '@/lib/use-progress';

type Answer = { key: string; label: string; correct: boolean };

const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

export default function DailyReview({
  displayName,
  progress,
  today,
  exercises,
  dueCount,
  newCount,
  daily,
}: {
  displayName: string;
  progress: { data: ProgressData; version: number };
  today: string;
  exercises: ReviewExercise[];
  dueCount: number;
  newCount: number;
  daily: { last: string | null; streak: number };
}) {
  const { data, mutate, flush, status } = useProgress(progress);
  const [phase, setPhase] = useState<'intro' | 'run' | 'done'>('intro');
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [bonus, setBonus] = useState(0);
  const doneToday = daily.last === today;
  const coins = Number(data.coins) || 0;
  const streak = (data.dailyReview as { streak?: number } | undefined)?.streak ?? daily.streak;

  useEffect(() => warmUpVoices(), []);

  function record(ex: ReviewExercise, correct: boolean) {
    const label = ex.kind === 'letter' ? ex.letter : ex.word;
    setAnswers((a) => [...a, { key: ex.key, label, correct }]);
    mutate((d) => {
      const stats = { ...reviewStatsOf(d) };
      stats[ex.key] = nextStat(stats[ex.key], correct, today);
      const next: ProgressData = { ...d, reviewStats: stats };
      if (ex.kind === 'word' && !correct) next.mistakes = [...new Set([...strings(d.mistakes), ex.word])];
      if (ex.kind === 'spell') {
        const sp = { ...((d.spellingStats as Record<string, { c: number; w: number; s: number; t: number }>) ?? {}) };
        const prev = sp[ex.word] ?? { c: 0, w: 0, s: 0, t: 0 };
        sp[ex.word] = correct ? { c: prev.c + 1, w: prev.w, s: prev.s + 1, t: Date.now() } : { c: prev.c, w: prev.w + 1, s: 0, t: Date.now() };
        next.spellingStats = sp;
      }
      return next;
    });
  }

  function next() {
    stopSpeaking();
    if (index + 1 < exercises.length) {
      setIndex(index + 1);
      return;
    }
    // Finished: daily bonus + streak, once per day
    if (!doneToday) {
      setBonus(DAILY_BONUS);
      mutate((d) => {
        const prev = (d.dailyReview as { last?: string; streak?: number }) ?? {};
        const nd = nextDaily({ last: prev.last ?? null, streak: Number(prev.streak) || 0 }, today);
        if (prev.last === today) return d;
        return { ...d, coins: (Number(d.coins) || 0) + DAILY_BONUS, dailyReview: nd };
      });
    }
    setPhase('done');
  }

  async function goHome() {
    stopSpeaking();
    await flush();
    window.location.assign('/');
  }

  const ex = exercises[index];
  const right = answers.filter((a) => a.correct).length;
  useRoundActivity('daily', exercises, phase === 'done', answers.length, right);

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-5 py-4 sm:py-6 pb-16">
      <header className="bg-white/95 rounded-3xl shadow-md border border-indigo-100/80 p-4 mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-extrabold text-indigo-600">✨ אנגלית בקליק PRO</div>
          <h1 className="text-2xl font-black text-slate-800">⏰ 5 דקות ביום</h1>
          <div className="text-sm text-slate-500">שלום {displayName}!</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-orange-50 border border-orange-200 text-orange-700 px-3 py-2 rounded-2xl font-extrabold text-sm">🔥 {streak}</span>
          <span className="bg-gradient-to-l from-amber-100 to-yellow-50 border-2 border-amber-300 text-amber-950 px-3.5 py-2 rounded-2xl font-black">
            🪙 <span data-testid="coins">{coins}</span>
          </span>
          <span className="text-[11px] font-bold text-slate-400">{status === 'saving' ? 'שומר...' : status === 'error' ? '⚠️' : '✓'}</span>
          <button onClick={goHome} className="px-3.5 py-2 rounded-2xl text-sm font-extrabold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer">
            🏠 למשחק
          </button>
        </div>
      </header>

      {phase === 'intro' && (
        <Panel>
          {exercises.length === 0 ? (
            <>
              <div className="text-6xl mb-3">🎉</div>
              <h2 className="text-2xl font-black text-slate-800 mb-2">אין מה לחזור היום!</h2>
              <p className="text-slate-600">כל מה שלמדת עוד טרי בזיכרון. ממשיכים ללמוד דברים חדשים במשחק 🚀</p>
            </>
          ) : (
            <>
              <div className="text-6xl mb-3">⏰</div>
              <h2 className="text-2xl font-black text-slate-800 mb-2">{exercises.length} דברים לחזרה היום</h2>
              <p className="text-slate-600 mb-1">
                {dueCount > 0 && <>{dueCount} שהגיע הזמן לחזור עליהם</>}
                {dueCount > 0 && newCount > 0 && ' · '}
                {newCount > 0 && <>{newCount} חדשים</>}
              </p>
              <p className="text-sm text-slate-500 mb-6">
                מה שזוכרים – חוזר רק בעוד כמה ימים. מה ששוכחים – חוזר מחר. {doneToday ? 'כבר סיימת היום, זה סבב נוסף 💪' : `סיום הסבב = +${DAILY_BONUS} 🪙 ויום נוסף ברצף 🔥`}
              </p>
              <button onClick={() => setPhase('run')} className="px-8 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg shadow-md cursor-pointer">
                מתחילים! 🚀
              </button>
            </>
          )}
        </Panel>
      )}

      {phase === 'run' && ex && (
        <Panel key={index}>
          <div className="flex justify-center gap-1 mb-5" aria-label={`${index + 1} מתוך ${exercises.length}`}>
            {exercises.map((_, i) => (
              <span key={i} className={`w-2.5 h-2.5 rounded-full ${i < index ? 'bg-indigo-400' : i === index ? 'bg-indigo-600 scale-125' : 'bg-slate-200'}`} />
            ))}
          </div>
          {ex.kind === 'spell' ? (
            <SpellExercise ex={ex} onAnswered={(c) => record(ex, c)} onNext={next} />
          ) : (
            <ChoiceExercise ex={ex} onAnswered={(c) => record(ex, c)} onNext={next} />
          )}
        </Panel>
      )}

      {phase === 'done' && (
        <Panel>
          <div className="text-6xl mb-2">{right === answers.length ? '🏆' : '🌟'}</div>
          <h2 className="text-2xl font-black text-slate-800">
            {right} מתוך {answers.length} זכרת!
          </h2>
          {bonus > 0 && <div className="text-amber-700 font-black mt-1">+{bonus} 🪙 על החזרה היומית · 🔥 {streak} ימים ברצף</div>}
          <div className="flex flex-wrap justify-center gap-2 my-5" dir="ltr">
            {answers.map((a, i) => (
              <span key={i} className={`font-english font-bold px-3 py-1 rounded-xl border ${a.correct ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                {a.correct ? '✓' : '↻'} {a.label}
              </span>
            ))}
          </div>
          {right < answers.length && <p className="text-sm text-slate-500 mb-4">מה ששכחנו יחזור מחר 🙂</p>}
          <button onClick={goHome} className="px-8 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg shadow-md cursor-pointer">
            חזרה למשחק 🏠
          </button>
        </Panel>
      )}
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="bg-white/95 rounded-3xl shadow-md border border-indigo-100/80 p-6 sm:p-8 text-center animate-pop">{children}</div>;
}

function ChoiceExercise({
  ex,
  onAnswered,
  onNext,
}: {
  ex: Extract<ReviewExercise, { kind: 'letter' | 'word' }>;
  onAnswered: (correct: boolean) => void;
  onNext: () => void;
}) {
  const [chosen, setChosen] = useState<string | null>(null);
  const big = ex.kind === 'letter' ? ex.letter : ex.word;

  useEffect(() => {
    if (ex.kind === 'word') void speak(ex.word);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function choose(o: string) {
    if (chosen) return;
    setChosen(o);
    const correct = o === ex.answer;
    onAnswered(correct);
    if (ex.kind === 'letter') speakLetter(ex.letter);
    if (correct) setTimeout(onNext, 900);
  }

  return (
    <div>
      <div className="text-sm font-bold text-slate-500 mb-2">{ex.kind === 'letter' ? 'איך קוראים לאות הזו?' : 'מה פירוש המילה?'}</div>
      <div className="flex items-center justify-center gap-3 mb-6">
        {ex.kind === 'word' && ex.emoji && chosen && <span className="text-5xl">{ex.emoji}</span>}
        <span className="text-7xl font-black font-english text-indigo-700" dir="ltr">
          {big}
        </span>
        {ex.kind === 'word' && (
          <button onClick={() => void speak(ex.word)} aria-label="השמעה" className="w-12 h-12 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-2xl cursor-pointer">
            🔊
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {ex.options.map((o) => {
          const state = !chosen ? 'idle' : o === ex.answer ? 'right' : o === chosen ? 'wrong' : 'dim';
          return (
            <button
              key={o}
              onClick={() => choose(o)}
              disabled={!!chosen}
              className={`py-4 px-3 rounded-2xl border-2 text-lg font-black transition cursor-pointer ${
                {
                  idle: 'border-slate-200 bg-white hover:border-indigo-400 hover:bg-indigo-50 text-slate-800 active:scale-95',
                  right: 'border-emerald-400 bg-emerald-50 text-emerald-800',
                  wrong: 'border-rose-400 bg-rose-50 text-rose-800 animate-shake',
                  dim: 'border-slate-100 bg-white text-slate-300',
                }[state]
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>
      {chosen && chosen !== ex.answer && (
        <button onClick={onNext} className="mt-5 px-8 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-md cursor-pointer">
          הבא ←
        </button>
      )}
    </div>
  );
}

function SpellExercise({
  ex,
  onAnswered,
  onNext,
}: {
  ex: Extract<ReviewExercise, { kind: 'spell' }>;
  onAnswered: (correct: boolean) => void;
  onNext: () => void;
}) {
  const [value, setValue] = useState('');
  const [result, setResult] = useState<null | boolean>(null);
  const [revealIdx, setRevealIdx] = useState<number | null>(null);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => void speak(ex.word, { rate: 0.85 }), 300);
    ref.current?.focus();
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function submit() {
    if (result !== null) {
      onNext();
      return;
    }
    if (!value.trim()) return;
    const ok = value.trim().toLowerCase() === ex.word.toLowerCase();
    setResult(ok);
    onAnswered(ok);
    if (!ok) void spellOut(ex.word, (i) => setRevealIdx(i < 0 ? null : i));
  }

  return (
    <div>
      <div className="text-sm font-bold text-slate-500 mb-2">שומעים ומאייתים</div>
      <div className="text-6xl mb-1">{ex.emoji || '🔤'}</div>
      <div className="text-xl font-black text-slate-700 mb-3">{ex.hebrew}</div>
      <button onClick={() => void speak(ex.word, { rate: 0.85 })} className="px-4 py-2 rounded-2xl bg-indigo-50 hover:bg-indigo-100 font-extrabold text-indigo-800 mb-5 cursor-pointer">
        🔊 שמיעה שוב
      </button>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <input
          ref={ref}
          value={value}
          onChange={(e) => result === null && setValue(e.target.value.replace(/[^a-zA-Z' -]/g, '').slice(0, 40))}
          aria-label="הקלדת המילה"
          dir="ltr"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          className={`w-full max-w-xs mx-auto block text-center text-3xl font-black font-english tracking-widest px-4 py-3 rounded-2xl border-[3px] focus:outline-none mb-3 ${
            result === null ? 'border-slate-200 focus:border-indigo-500' : result ? 'border-emerald-400 bg-emerald-50 text-emerald-800' : 'border-rose-400 bg-rose-50 text-rose-800'
          }`}
        />
        {result === false && (
          <div className="font-english text-3xl font-black mb-3 tracking-widest" dir="ltr">
            {ex.word.split('').map((ch, i) => (
              <span key={i} className={revealIdx === i ? 'text-amber-500' : 'text-emerald-700'}>
                {ch}
              </span>
            ))}
          </div>
        )}
        {result === true && <div className="text-emerald-700 font-black mb-3">מצוין! 🎉</div>}
        <button type="submit" disabled={result === null && !value.trim()} className="px-8 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg shadow-md disabled:opacity-40 cursor-pointer">
          {result === null ? 'בדיקה ✓' : 'הבא ←'}
        </button>
      </form>
    </div>
  );
}
