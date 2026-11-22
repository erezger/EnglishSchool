'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api-client';
import type { PublicQuestion } from '@/lib/checks';
import { speak, stopSpeaking, warmUpVoices } from '@/lib/speech';

type OpenCheck = { id: string; total: number; answered: number[]; questions: PublicQuestion[] };
type ResultItem = { type: 'letter' | 'meaning' | 'spell'; label: string; answer: string; given: string; correct: boolean };
type Finish = { score: number; total: number; coins: number; results: ResultItem[] };

const decode = (audio: string) => atob(audio).split('').reverse().join('');

export default function CheckRunner({ displayName, check }: { displayName: string; check: OpenCheck | null }) {
  const firstOpen = check ? check.questions.findIndex((_, i) => !check.answered.includes(i)) : -1;
  const [phase, setPhase] = useState<'intro' | 'question' | 'finishing' | 'done'>(
    check && check.answered.length > 0 ? 'question' : 'intro',
  );
  const [index, setIndex] = useState(firstOpen < 0 ? check?.total ?? 0 : firstOpen);
  const [result, setResult] = useState<Finish | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => warmUpVoices(), []);

  // All answered (e.g. page reloaded after the last answer) -> finish
  useEffect(() => {
    if (check && phase === 'question' && index >= check.total) void finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, phase]);

  async function submit(answer: string) {
    if (!check || busy) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/api/me/check/${check.id}/answer`, { method: 'POST', body: { index, answer } });
      stopSpeaking();
      setIndex(index + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'משהו השתבש, נסו שוב');
    } finally {
      setBusy(false);
    }
  }

  async function finish() {
    if (!check) return;
    setPhase('finishing');
    try {
      setResult(await api<Finish>(`/api/me/check/${check.id}/finish`, { method: 'POST' }));
      setPhase('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'משהו השתבש');
      setPhase('question');
    }
  }

  const q = check?.questions[index];

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-5 py-4 sm:py-6 pb-16">
      <header className="bg-white/95 rounded-3xl shadow-md border border-indigo-100/80 p-4 mb-5 flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-extrabold text-indigo-600">✨ אנגלית בקליק PRO</div>
          <h1 className="text-2xl font-black text-slate-800">📝 מבחן מההורים</h1>
          <div className="text-sm text-slate-500">שלום {displayName}!</div>
        </div>
        <a href="/" className="px-3.5 py-2 rounded-2xl text-sm font-extrabold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50">
          🏠 למשחק
        </a>
      </header>

      {error && <div role="alert" className="mb-4 text-sm font-bold text-rose-800 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">{error}</div>}

      {!check && (
        <Panel>
          <div className="text-5xl mb-3">🎈</div>
          <div className="text-xl font-black text-slate-700">אין מבחן כרגע</div>
          <div className="text-sm text-slate-500 mt-1">כשההורים ישלחו מבחן, הוא יופיע כאן.</div>
        </Panel>
      )}

      {check && phase === 'intro' && (
        <Panel>
          <div className="text-6xl mb-3">📝</div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">{check.total} שאלות על מה שכבר למדת</h2>
          <p className="text-slate-600 mb-1">בלי רמזים ובלי עזרה – ככה רואים מה באמת יודעים 💪</p>
          <p className="text-sm text-slate-500 mb-6">כל תשובה נכונה = מטבע, ו-90% ומעלה = בונוס! מה שעוד לא יושב טוב יחזור לתרגול.</p>
          <button onClick={() => setPhase('question')} className="px-8 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg shadow-md cursor-pointer">
            מתחילים! 🚀
          </button>
        </Panel>
      )}

      {check && phase === 'question' && q && (
        <Panel key={index}>
          <div className="flex justify-center gap-1 mb-5" aria-label={`שאלה ${index + 1} מתוך ${check.total}`}>
            {check.questions.map((_, i) => (
              <span key={i} className={`w-2.5 h-2.5 rounded-full ${i < index ? 'bg-indigo-400' : i === index ? 'bg-indigo-600 scale-125' : 'bg-slate-200'}`} />
            ))}
          </div>
          {q.type === 'letter' && <ChoiceQuestion title="איך קוראים לאות הזו?" big={q.letter} options={q.options} onAnswer={submit} busy={busy} />}
          {q.type === 'meaning' && (
            <ChoiceQuestion title="מה פירוש המילה?" big={q.word} speakText={q.word} options={q.options} onAnswer={submit} busy={busy} />
          )}
          {q.type === 'spell' && <SpellQuestion q={q} onAnswer={submit} busy={busy} />}
        </Panel>
      )}

      {phase === 'finishing' && (
        <Panel>
          <div className="text-slate-500 font-bold py-6">בודקים... ⏳</div>
        </Panel>
      )}

      {phase === 'done' && result && (
        <Panel>
          <div className="text-6xl mb-2">{result.score === result.total ? '🏆' : result.score >= result.total * 0.7 ? '🌟' : '💪'}</div>
          <h2 className="text-2xl font-black text-slate-800">
            {result.score} מתוך {result.total} נכונות
          </h2>
          <div className="text-amber-700 font-black mb-5">+{result.coins} 🪙</div>
          <div className="space-y-1.5 text-right mb-5">
            {result.results.map((r, i) => (
              <div
                key={i}
                className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm ${r.correct ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}
              >
                <span className="font-english font-black" dir="ltr">
                  {r.correct ? '✓' : '✗'} {r.label}
                </span>
                {!r.correct && (
                  <span className="text-xs text-slate-600">
                    {r.given ? <>ענית: <b dir="auto">{r.given}</b> · </> : null}נכון: <b dir="auto">{r.answer}</b>
                  </span>
                )}
              </div>
            ))}
          </div>
          {result.score < result.total && <p className="text-sm text-slate-500 mb-4">מה שלא הצליח חזר לתרגול – בפעם הבאה זה כבר יצליח 🙂</p>}
          <a href="/" className="inline-block px-8 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg shadow-md">
            חזרה למשחק 🏠
          </a>
        </Panel>
      )}
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="bg-white/95 rounded-3xl shadow-md border border-indigo-100/80 p-6 sm:p-8 text-center animate-pop">{children}</div>;
}

function ChoiceQuestion({
  title,
  big,
  speakText,
  options,
  onAnswer,
  busy,
}: {
  title: string;
  big: string;
  speakText?: string;
  options: string[];
  onAnswer: (a: string) => void;
  busy: boolean;
}) {
  return (
    <div>
      <div className="text-sm font-bold text-slate-500 mb-2">{title}</div>
      <div className="flex items-center justify-center gap-3 mb-6">
        <span className="text-7xl font-black font-english text-indigo-700" dir="ltr">
          {big}
        </span>
        {speakText && (
          <button onClick={() => void speak(speakText)} aria-label="השמעה" className="w-12 h-12 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-2xl cursor-pointer">
            🔊
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {options.map((o) => (
          <button
            key={o}
            disabled={busy}
            onClick={() => onAnswer(o)}
            className="py-4 px-3 rounded-2xl border-2 border-slate-200 bg-white hover:border-indigo-400 hover:bg-indigo-50 text-lg font-black text-slate-800 transition active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

function SpellQuestion({
  q,
  onAnswer,
  busy,
}: {
  q: { hebrew: string; emoji: string; length: number; audio: string };
  onAnswer: (a: string) => void;
  busy: boolean;
}) {
  const [value, setValue] = useState('');
  const ref = useRef<HTMLInputElement>(null);
  const word = decode(q.audio);

  useEffect(() => {
    const t = setTimeout(() => void speak(word, { rate: 0.85 }), 300);
    ref.current?.focus();
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="text-sm font-bold text-slate-500 mb-2">שומעים ומאייתים – בלי רמזים</div>
      <div className="text-6xl mb-1">{q.emoji || '🔤'}</div>
      <div className="text-xl font-black text-slate-700 mb-3">{q.hebrew}</div>
      <button onClick={() => void speak(word, { rate: 0.85 })} className="px-4 py-2 rounded-2xl bg-indigo-50 hover:bg-indigo-100 font-extrabold text-indigo-800 mb-5 cursor-pointer">
        🔊 שמיעה שוב
      </button>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (value.trim()) onAnswer(value.trim());
        }}
      >
        <input
          ref={ref}
          value={value}
          onChange={(e) => setValue(e.target.value.replace(/[^a-zA-Z' -]/g, '').slice(0, 40))}
          aria-label="הקלדת המילה"
          dir="ltr"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          className="w-full max-w-xs mx-auto block text-center text-3xl font-black font-english tracking-widest px-4 py-3 rounded-2xl border-[3px] border-slate-200 focus:border-indigo-500 focus:outline-none mb-4"
        />
        <button type="submit" disabled={busy || !value.trim()} className="px-8 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg shadow-md disabled:opacity-40 cursor-pointer">
          הבא ←
        </button>
      </form>
    </div>
  );
}
