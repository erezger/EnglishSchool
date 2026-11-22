'use client';

import { useEffect, useState } from 'react';
import { applyPlacement, type PlacementLevel, type PlacementQuestion } from '@/lib/placement';
import { speak, stopSpeaking, warmUpVoices } from '@/lib/speech';
import { useProgress, type ProgressData } from '@/lib/use-progress';

export default function PlacementTest({
  displayName,
  progress,
  levels,
}: {
  displayName: string;
  progress: { data: ProgressData; version: number };
  levels: PlacementLevel[];
}) {
  const { mutate, flush } = useProgress(progress);
  const [phase, setPhase] = useState<'intro' | 'run' | 'done'>('intro');
  const [levelIdx, setLevelIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [correctInLevel, setCorrectInLevel] = useState(0);
  const [passedThrough, setPassedThrough] = useState(0);
  const done = (passed: number) => {
    setPassedThrough(passed);
    mutate((d) => applyPlacement(d, passed));
    setPhase('done');
  };

  useEffect(() => warmUpVoices(), []);

  const level = levels[levelIdx];
  const q = level?.questions[qIdx];

  function answer(correct: boolean) {
    const got = correctInLevel + (correct ? 1 : 0);
    const isLast = qIdx + 1 >= level.questions.length;
    if (!isLast) {
      // Stop early if the level can no longer be passed
      const remaining = level.questions.length - (qIdx + 1);
      if (got + remaining < level.passMark) {
        done(level.level - 1);
        return;
      }
      setCorrectInLevel(got);
      setQIdx(qIdx + 1);
      return;
    }
    if (got >= level.passMark) {
      if (levelIdx + 1 < levels.length) {
        setLevelIdx(levelIdx + 1);
        setQIdx(0);
        setCorrectInLevel(0);
      } else done(level.level);
    } else done(level.level - 1);
  }

  async function goHome() {
    stopSpeaking();
    await flush();
    window.location.assign('/');
  }

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-5 py-4 sm:py-6 pb-16">
      <header className="bg-white/95 rounded-3xl shadow-md border border-indigo-100/80 p-4 mb-5 flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-extrabold text-indigo-600">✨ אנגלית בקליק PRO</div>
          <h1 className="text-2xl font-black text-slate-800">🧭 מבחן מיקום</h1>
          <div className="text-sm text-slate-500">שלום {displayName}!</div>
        </div>
        <button onClick={goHome} className="px-3.5 py-2 rounded-2xl text-sm font-extrabold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer">
          🏠 למשחק
        </button>
      </header>

      {phase === 'intro' && (
        <Panel>
          <div className="text-6xl mb-3">🧭</div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">בואו נבדוק מאיפה כדאי להתחיל</h2>
          <p className="text-slate-600 mb-1">כמה שאלות קצרות על כל שלב. השאלות נהיות קשות יותר בהדרגה.</p>
          <p className="text-sm text-slate-500 mb-6">כשמשהו נהיה קשה – עוצרים, וזה בדיוק המקום להתחיל ממנו. לא מאבדים שום דבר 🙂</p>
          <button onClick={() => setPhase('run')} className="px-8 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg shadow-md cursor-pointer">
            מתחילים! 🚀
          </button>
        </Panel>
      )}

      {phase === 'run' && level && q && (
        <Panel key={`${levelIdx}-${qIdx}`}>
          <div className="flex items-center justify-between mb-4 text-xs font-extrabold">
            <span className="text-indigo-600">
              שלב {level.level} · {level.title}
            </span>
            <span className="text-slate-400">
              שאלה {qIdx + 1} מתוך {level.questions.length}
            </span>
          </div>
          <div className="flex gap-1 justify-center mb-5">
            {levels.map((l, i) => (
              <span key={l.level} className={`h-2 w-8 rounded-full ${i < levelIdx ? 'bg-emerald-400' : i === levelIdx ? 'bg-indigo-500' : 'bg-slate-200'}`} />
            ))}
          </div>
          <Question q={q} onAnswer={answer} />
        </Panel>
      )}

      {phase === 'done' && (
        <Panel>
          <div className="text-6xl mb-2">{passedThrough >= 6 ? '🏆' : passedThrough > 0 ? '🌟' : '🌱'}</div>
          {passedThrough > 0 ? (
            <>
              <h2 className="text-2xl font-black text-slate-800 mb-1">
                {passedThrough >= levels.length ? 'עברת את כל השלבים!' : `עברת עד שלב ${passedThrough}!`}
              </h2>
              <p className="text-slate-600 mb-6">
                {passedThrough >= levels.length
                  ? 'מעולה! אפשר להמשיך לאיות מילים ולחזרה היומית.'
                  : `השלבים 1–${passedThrough} סומנו כהושלמו. ממשיכים משלב ${passedThrough + 1} 💪`}
              </p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-black text-slate-800 mb-1">מתחילים מההתחלה – וזה מצוין!</h2>
              <p className="text-slate-600 mb-6">שלב 1 מחכה לך עם האותיות הראשונות 🚀</p>
            </>
          )}
          <button onClick={goHome} className="px-8 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg shadow-md cursor-pointer">
            למשחק 🏠
          </button>
        </Panel>
      )}
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="bg-white/95 rounded-3xl shadow-md border border-indigo-100/80 p-6 sm:p-8 text-center animate-pop">{children}</div>;
}

function Question({ q, onAnswer }: { q: PlacementQuestion; onAnswer: (correct: boolean) => void }) {
  const [chosen, setChosen] = useState<string | null>(null);

  useEffect(() => {
    if (q.kind === 'picture') void speak(q.word);
    if (q.kind === 'sentence') void speak(q.text, { rate: 0.85 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function choose(value: string) {
    if (chosen) return;
    setChosen(value);
    setTimeout(() => onAnswer(value === q.answer), 650);
  }

  const optionClass = (value: string) =>
    `rounded-2xl border-2 font-black transition cursor-pointer ${
      !chosen
        ? 'border-slate-200 bg-white hover:border-indigo-400 hover:bg-indigo-50 active:scale-95'
        : value === chosen
          ? 'border-indigo-500 bg-indigo-50'
          : 'border-slate-100 bg-white opacity-60'
    }`;

  if (q.kind === 'sound') {
    return (
      <div>
        <div className="text-sm font-bold text-slate-500 mb-2">איזה צליל עושה…</div>
        <div className="text-7xl font-black font-english text-indigo-700 mb-6" dir="ltr">
          {q.letter}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {q.options.map((o) => (
            <button key={o} onClick={() => choose(o)} disabled={!!chosen} className={`py-4 px-3 text-base ${optionClass(o)}`}>
              {o}
            </button>
          ))}
        </div>
      </div>
    );
  }
  if (q.kind === 'picture') {
    return (
      <div>
        <div className="text-sm font-bold text-slate-500 mb-2">קוראים ובוחרים את התמונה</div>
        <div className="flex items-center justify-center gap-3 mb-6">
          <span className="text-6xl font-black font-english text-indigo-700" dir="ltr">
            {q.word}
          </span>
          <button onClick={() => void speak(q.word)} aria-label="השמעה" className="w-11 h-11 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-xl cursor-pointer">
            🔊
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {q.options.map((o) => (
            <button key={o.emoji} onClick={() => choose(o.emoji)} disabled={!!chosen} className={`py-4 ${optionClass(o.emoji)}`} aria-label={o.hebrew}>
              <div className="text-5xl">{o.emoji}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div>
      <div className="text-sm font-bold text-slate-500 mb-2">מה פירוש המשפט?</div>
      <div className="flex items-center justify-center gap-3 mb-6">
        <span className="text-2xl sm:text-3xl font-black font-english text-indigo-700" dir="ltr">
          {q.text}
        </span>
        <button onClick={() => void speak(q.text, { rate: 0.85 })} aria-label="השמעה" className="w-11 h-11 shrink-0 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-xl cursor-pointer">
          🔊
        </button>
      </div>
      <div className="grid grid-cols-1 gap-2.5">
        {q.options.map((o) => (
          <button key={o} onClick={() => choose(o)} disabled={!!chosen} className={`py-3 px-3 text-base ${optionClass(o)}`}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
