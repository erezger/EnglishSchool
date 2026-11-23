'use client';

import { useEffect, useState } from 'react';
import { heardTarget, listenOnce, recognitionSupported, stopListening } from '@/lib/speech-recognition';
import { speak, stopSpeaking, warmUpVoices } from '@/lib/speech';
import { useProgress, type ProgressData } from '@/lib/use-progress';
import { KidPanel, KidShell, ProgressDots } from '../kid/KidShell';

export type SpeakWord = { word: string; hebrew: string; emoji: string };
export type SpeakSource = { id: string; title: string; icon: string; words: SpeakWord[] };
type Stat = { ok: number; tries: number; t: number };

const ROUND = 8;
const MAX_TRIES = 3;
const statsOf = (d: ProgressData) => (d.speakingStats && typeof d.speakingStats === 'object' ? (d.speakingStats as Record<string, Stat>) : {});

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Speaking({
  displayName,
  progress,
  sources,
}: {
  displayName: string;
  progress: { data: ProgressData; version: number };
  sources: SpeakSource[];
}) {
  const { data, mutate, flush, status } = useProgress(progress);
  const [supported, setSupported] = useState(true);
  const [source, setSource] = useState<SpeakSource | null>(null);
  const [round, setRound] = useState<SpeakWord[]>([]);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);

  useEffect(() => {
    warmUpVoices();
    setSupported(recognitionSupported());
    return () => stopListening();
  }, []);

  function start(src: SpeakSource) {
    setSource(src);
    setRound(shuffle(src.words).slice(0, ROUND));
    setIndex(0);
    setResults([]);
  }

  function record(w: SpeakWord, ok: boolean, tries: number) {
    setResults((r) => [...r, ok]);
    mutate((d) => {
      const all = { ...statsOf(d) };
      const key = w.word.toLowerCase();
      const prev = all[key] ?? { ok: 0, tries: 0, t: 0 };
      all[key] = { ok: prev.ok + (ok ? 1 : 0), tries: prev.tries + tries, t: Date.now() };
      return { ...d, coins: (Number(d.coins) || 0) + (ok ? 1 : 0), speakingStats: all };
    });
  }

  async function goHome() {
    stopListening();
    stopSpeaking();
    await flush();
    window.location.assign('/');
  }

  const finished = source && index >= round.length;

  return (
    <KidShell title="🎤 אומרים בקול" displayName={displayName} coins={Number(data.coins) || 0} status={status} onHome={goHome}>
      {!supported && (
        <KidPanel>
          <div className="text-5xl mb-2">🎤</div>
          <div className="text-xl font-black text-slate-700">הדפדפן הזה לא יודע לשמוע</div>
          <div className="text-sm text-slate-500 mt-1">כדאי לפתוח את האתר ב-Chrome או ב-Edge במחשב עם מיקרופון.</div>
        </KidPanel>
      )}

      {supported && !source && (
        <KidPanel className="!text-right !p-5">
          <p className="text-slate-600 text-sm mb-1">רואים מילה, לוחצים על 🎤 ואומרים אותה באנגלית. כל מילה נכונה = מטבע.</p>
          <p className="text-[11px] text-slate-400 mb-4">הזיהוי נעשה על ידי הדפדפן (ב-Chrome הקול נשלח לעיבוד אצל Google).</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sources.map((s) => (
              <button
                key={s.id}
                onClick={() => start(s)}
                disabled={!s.words.length}
                className="text-right bg-slate-50 hover:bg-indigo-50 border-2 border-slate-200 hover:border-indigo-300 rounded-2xl p-4 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="font-black text-slate-800">
                  {s.icon} {s.title}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{s.words.length ? `${s.words.length} מילים` : 'אין עדיין מילים'}</div>
              </button>
            ))}
          </div>
        </KidPanel>
      )}

      {supported && source && !finished && round[index] && (
        <KidPanel key={index}>
          <ProgressDots index={index} total={round.length} />
          <WordCard word={round[index]} onDone={(ok, tries) => record(round[index], ok, tries)} onNext={() => setIndex(index + 1)} />
        </KidPanel>
      )}

      {finished && (
        <KidPanel>
          <div className="text-6xl mb-2">{results.every(Boolean) ? '🏆' : '🌟'}</div>
          <h2 className="text-2xl font-black text-slate-800 mb-1">
            {results.filter(Boolean).length} מתוך {results.length} מילים נאמרו נכון
          </h2>
          <div className="text-amber-700 font-black mb-5">+{results.filter(Boolean).length} 🪙</div>
          <div className="flex flex-wrap justify-center gap-2">
            <button onClick={() => source && start(source)} className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black cursor-pointer">
              🔄 עוד סבב
            </button>
            <button onClick={() => setSource(null)} className="px-5 py-3 rounded-2xl bg-white border border-slate-300 text-slate-700 font-bold cursor-pointer">
              📚 מילים אחרות
            </button>
          </div>
        </KidPanel>
      )}
    </KidShell>
  );
}

function WordCard({ word, onDone, onNext }: { word: SpeakWord; onDone: (ok: boolean, tries: number) => void; onNext: () => void }) {
  const [tries, setTries] = useState(0);
  const [listening, setListening] = useState(false);
  const [state, setState] = useState<'idle' | 'ok' | 'retry' | 'failed'>('idle');
  const [heard, setHeard] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  async function listen() {
    if (listening || state === 'ok' || state === 'failed') return;
    stopSpeaking();
    setListening(true);
    setMessage(null);
    const r = await listenOnce();
    setListening(false);
    if (!r.ok) {
      setMessage(
        r.error === 'not-allowed'
          ? 'צריך לאשר לדפדפן להשתמש במיקרופון 🎤'
          : r.error === 'no-speech'
            ? 'לא שמעתי כלום – נסו שוב קרוב יותר למיקרופון'
            : 'משהו השתבש בזיהוי, נסו שוב',
      );
      return; // a technical failure doesn't count as a try
    }
    const n = tries + 1;
    setTries(n);
    setHeard(r.alternatives[0] ?? '');
    if (heardTarget(r.alternatives, word.word)) {
      setState('ok');
      onDone(true, n);
      setTimeout(() => void speak(word.word), 200);
    } else if (n >= MAX_TRIES) {
      setState('failed');
      onDone(false, n);
      void speak(word.word, { rate: 0.8 });
    } else {
      setState('retry');
    }
  }

  return (
    <div>
      <div className="text-6xl mb-1">{word.emoji || '🔤'}</div>
      <div className="text-5xl font-black font-english text-indigo-700 mb-1" dir="ltr">
        {word.word}
      </div>
      <div className="text-lg font-bold text-slate-500 mb-5">{word.hebrew}</div>
      <div className="flex justify-center gap-3 mb-4">
        <button
          onClick={() => void speak(word.word, { rate: 0.8 })}
          className="px-4 py-3 rounded-2xl bg-white border-2 border-slate-200 hover:border-indigo-300 font-extrabold text-slate-700 cursor-pointer"
        >
          👂 קודם לשמוע
        </button>
        <button
          onClick={() => void listen()}
          disabled={listening || state === 'ok' || state === 'failed'}
          aria-label="להגיד את המילה"
          className={`px-6 py-3 rounded-2xl font-black text-lg text-white shadow-md cursor-pointer disabled:opacity-60 ${listening ? 'bg-rose-500 animate-pulse' : 'bg-indigo-600 hover:bg-indigo-700'}`}
        >
          {listening ? '🎤 מקשיב...' : '🎤 להגיד'}
        </button>
      </div>
      {message && <div className="text-sm font-bold text-amber-800 mb-3">{message}</div>}
      {state === 'retry' && (
        <div className="text-sky-800 font-bold mb-3">
          שמעתי: <span className="font-english" dir="ltr">&quot;{heard}&quot;</span> – נסו שוב ({MAX_TRIES - tries} ניסיונות) 💪
        </div>
      )}
      {state === 'ok' && <div className="text-2xl font-black text-emerald-700 mb-3">מצוין! 🎉 +1 🪙</div>}
      {state === 'failed' && <div className="text-rose-700 font-bold mb-3">תקשיבו איך אומרים את זה, ובפעם הבאה זה יצליח 🙂</div>}
      {(state === 'ok' || state === 'failed') && (
        <button onClick={onNext} className="px-8 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-md cursor-pointer">
          הבא ←
        </button>
      )}
    </div>
  );
}
