'use client';

import { useEffect, useRef, useState } from 'react';
import { compareSentence, type WordResult } from '@/content/dictation';
import { speak, stopSpeaking, warmUpVoices } from '@/lib/speech';
import { useRoundActivity } from '@/lib/use-activity';
import { payDaily } from '@/lib/earning';
import { useEarnToday } from '@/lib/use-earn';
import { useProgress, type ProgressData } from '@/lib/use-progress';
import { KidPanel, KidShell, ProgressDots } from '../kid/KidShell';

export type DictationItem = { id: string; text: string; hebrew: string; emoji: string };
export type DictationSource = { id: string; title: string; icon: string; items: DictationItem[] };
type Stat = { c: number; w: number; t: number };

const ROUND = 5;
const COINS_PERFECT = 5;
const COINS_ALMOST = 2;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const statsOf = (d: ProgressData) => (d.dictationStats && typeof d.dictationStats === 'object' ? (d.dictationStats as Record<string, Stat>) : {});

/** Not-yet-mastered sentences first, then the rest. */
function buildRound(items: DictationItem[], stats: Record<string, Stat>): DictationItem[] {
  const fresh = items.filter((s) => !stats[s.id] || stats[s.id].c === 0);
  const rest = items.filter((s) => stats[s.id] && stats[s.id].c > 0).sort((a, b) => stats[a.id].t - stats[b.id].t);
  return [...shuffle(fresh), ...rest].slice(0, ROUND);
}

export default function Dictation({
  displayName,
  progress,
  sources,
}: {
  displayName: string;
  progress: { data: ProgressData; version: number };
  sources: DictationSource[];
}) {
  const { data, mutate, flush, status } = useProgress(progress);
  const earnToday = useEarnToday(data);
  const [source, setSource] = useState<DictationSource | null>(null);
  const [round, setRound] = useState<DictationItem[]>([]);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<{ id: string; wrong: number }[]>([]);
  const stats = statsOf(data);

  useEffect(() => warmUpVoices(), []);

  function start(src: DictationSource) {
    setSource(src);
    setRound(buildRound(src.items, stats));
    setIndex(0);
    setResults([]);
  }

  function record(item: DictationItem, wrong: number) {
    // learning pays once a day per sentence
    const payKey = `dict:${item.id}`;
    const coins = earnToday(payKey, wrong === 0 ? COINS_PERFECT : wrong === 1 ? COINS_ALMOST : 0);
    setResults((r) => [...r, { id: item.id, wrong }]);
    mutate((d) => {
      const all = { ...statsOf(d) };
      const prev = all[item.id] ?? { c: 0, w: 0, t: 0 };
      all[item.id] = wrong === 0 ? { c: prev.c + 1, w: prev.w, t: Date.now() } : { c: prev.c, w: prev.w + 1, t: Date.now() };
      return payDaily({ ...d, dictationStats: all }, payKey, coins);
    });
    return coins;
  }

  async function goHome() {
    stopSpeaking();
    await flush();
    window.location.assign('/');
  }

  const finished = source && index >= round.length;
  useRoundActivity('dictation', round, !!finished, results.length, results.filter((r) => r.wrong === 0).length);

  return (
    <KidShell title="✍️ הכתבה" displayName={displayName} coins={Number(data.coins) || 0} status={status} onHome={goHome}>
      {!source && (
        <div className="space-y-3">
          <KidPanel className="!text-right !p-5">
            <p className="text-slate-600 text-sm mb-4">שומעים משפט שלם ומקלידים אותו. משפט מושלם = {COINS_PERFECT} 🪙, טעות אחת = {COINS_ALMOST} 🪙 (פעם ביום לכל משפט).</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sources.map((s) => {
                const done = s.items.filter((it) => (stats[it.id]?.c ?? 0) > 0).length;
                return (
                  <button
                    key={s.id}
                    onClick={() => start(s)}
                    disabled={!s.items.length}
                    className="text-right bg-slate-50 hover:bg-indigo-50 border-2 border-slate-200 hover:border-indigo-300 rounded-2xl p-4 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <div className="font-black text-slate-800">
                      {s.icon} {s.title}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {s.items.length ? `${s.items.length} משפטים · ${done} הצליחו` : 'אין עדיין משפטים'}
                    </div>
                  </button>
                );
              })}
            </div>
          </KidPanel>
        </div>
      )}

      {source && !finished && round[index] && (
        <KidPanel key={index}>
          <ProgressDots index={index} total={round.length} />
          <SentenceCard item={round[index]} onAnswered={(wrong) => record(round[index], wrong)} onNext={() => setIndex(index + 1)} />
        </KidPanel>
      )}

      {finished && (
        <KidPanel>
          <div className="text-6xl mb-2">{results.every((r) => r.wrong === 0) ? '🏆' : '🌟'}</div>
          <h2 className="text-2xl font-black text-slate-800 mb-1">
            {results.filter((r) => r.wrong === 0).length} מתוך {results.length} משפטים מושלמים
          </h2>
          <p className="text-sm text-slate-500 mb-5">משפטים שלא הצליחו יחזרו בסבב הבא.</p>
          <div className="flex flex-wrap justify-center gap-2">
            <button onClick={() => start(source)} className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black cursor-pointer">
              🔄 עוד סבב
            </button>
            <button onClick={() => setSource(null)} className="px-5 py-3 rounded-2xl bg-white border border-slate-300 text-slate-700 font-bold cursor-pointer">
              📚 בחירת משפטים
            </button>
          </div>
        </KidPanel>
      )}
    </KidShell>
  );
}

function SentenceCard({ item, onAnswered, onNext }: { item: DictationItem; onAnswered: (wrong: number) => number; onNext: () => void }) {
  const [value, setValue] = useState('');
  const [result, setResult] = useState<{ words: WordResult[]; wrong: number; coins: number } | null>(null);
  const [speakingWord, setSpeakingWord] = useState<number | null>(null);
  const ref = useRef<HTMLTextAreaElement>(null);
  const words = item.text.split(/\s+/);

  useEffect(() => {
    const t = setTimeout(() => void speak(item.text, { rate: 0.8 }), 300);
    ref.current?.focus();
    return () => {
      clearTimeout(t);
      stopSpeaking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function wordByWord() {
    stopSpeaking();
    for (let i = 0; i < words.length; i++) {
      setSpeakingWord(i);
      await speak(words[i].replace(/[^A-Za-z']/g, ''), { rate: 0.7, interrupt: false });
    }
    setSpeakingWord(null);
    ref.current?.focus();
  }

  function check() {
    if (result) {
      onNext();
      return;
    }
    if (!value.trim()) return;
    stopSpeaking();
    const r = compareSentence(item.text, value);
    const coins = onAnswered(r.wrong);
    setResult({ ...r, coins });
    if (r.wrong > 0) setTimeout(() => void speak(item.text, { rate: 0.8 }), 400);
  }

  return (
    <div>
      <div className="text-5xl mb-2">{item.emoji || '✍️'}</div>
      <div className="text-sm font-bold text-slate-500 mb-3">שומעים ומקלידים את כל המשפט</div>
      <div className="flex flex-wrap justify-center gap-2 mb-4">
        <Action onClick={() => void speak(item.text, { rate: 0.85 })}>🔊 שוב</Action>
        <Action onClick={() => void speak(item.text, { rate: 0.6 })}>🐢 לאט</Action>
        <Action onClick={() => void wordByWord()}>👂 מילה מילה</Action>
      </div>
      {speakingWord !== null && (
        <div className="flex justify-center gap-1.5 mb-3" dir="ltr" aria-hidden>
          {words.map((_, i) => (
            <span key={i} className={`h-2 w-6 rounded-full ${i === speakingWord ? 'bg-amber-400' : i < speakingWord ? 'bg-indigo-300' : 'bg-slate-200'}`} />
          ))}
        </div>
      )}
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => !result && setValue(e.target.value.slice(0, 200))}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            check();
          }
        }}
        rows={2}
        dir="ltr"
        aria-label="הקלדת המשפט"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        readOnly={!!result}
        className="w-full text-xl sm:text-2xl font-bold font-english px-4 py-3 rounded-2xl border-[3px] border-slate-200 focus:border-indigo-500 focus:outline-none mb-3 resize-none"
      />
      {result && (
        <div className="mb-4">
          <div className="flex flex-wrap justify-center gap-1.5 mb-2" dir="ltr">
            {result.words.map((w, i) => (
              <span key={i} className={`font-english text-lg font-black px-2 py-0.5 rounded-lg ${w.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                {w.word}
                {!w.ok && w.typed && <span className="text-xs text-rose-400 line-through ms-1">{w.typed}</span>}
              </span>
            ))}
          </div>
          <div className="text-sm text-slate-500 mb-1">{item.hebrew}</div>
          <div className={`font-black ${result.wrong === 0 ? 'text-emerald-700' : result.wrong === 1 ? 'text-sky-700' : 'text-rose-700'}`}>
            {result.wrong === 0 ? 'מושלם! 🎉' : result.wrong === 1 ? 'כמעט! טעות אחת 💪' : `${result.wrong} טעויות – תקשיבו שוב למשפט 👂`}
            {result.coins > 0 && <span className="text-amber-600"> +{result.coins} 🪙</span>}
          </div>
        </div>
      )}
      <button onClick={check} disabled={!result && !value.trim()} className="px-8 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg shadow-md disabled:opacity-40 cursor-pointer">
        {result ? 'הבא ←' : 'בדיקה ✓'}
      </button>
    </div>
  );
}

function Action({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="px-4 py-2.5 rounded-2xl bg-white border-2 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700 font-extrabold text-sm transition active:scale-95 cursor-pointer">
      {children}
    </button>
  );
}
