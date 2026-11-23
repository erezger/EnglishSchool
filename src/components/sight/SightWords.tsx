'use client';

import { useEffect, useRef, useState } from 'react';
import { SIGHT_ROUND, SIGHT_WORDS, SPEED, type SightWord } from '@/content/sight';
import { speak, stopSpeaking, warmUpVoices } from '@/lib/speech';
import { useRoundActivity } from '@/lib/use-activity';
import { payDaily } from '@/lib/earning';
import { useEarnToday } from '@/lib/use-earn';
import { useProgress, type ProgressData } from '@/lib/use-progress';
import { KidPanel, KidShell, ProgressDots } from '../kid/KidShell';

type Stat = { c: number; w: number; t: number };
const statsOf = (d: ProgressData) => (d.sightStats && typeof d.sightStats === 'object' ? (d.sightStats as Record<string, Stat>) : {});
const BONUS = 3;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Words not yet known first (wrong before, or never seen), then the rest. */
function buildRound(stats: Record<string, Stat>): SightWord[] {
  const weak = SIGHT_WORDS.filter((w) => (stats[w.word]?.w ?? 0) > (stats[w.word]?.c ?? 0));
  const fresh = SIGHT_WORDS.filter((w) => !stats[w.word]);
  const rest = SIGHT_WORDS.filter((w) => !weak.includes(w) && !fresh.includes(w));
  return [...shuffle(weak), ...shuffle(fresh), ...shuffle(rest)].slice(0, SIGHT_ROUND);
}

function optionsFor(w: SightWord): string[] {
  const others = shuffle(SIGHT_WORDS.filter((x) => x.hebrew !== w.hebrew)).slice(0, 3);
  return shuffle([w.hebrew, ...others.map((x) => x.hebrew)]);
}

export default function SightWords({ displayName, progress }: { displayName: string; progress: { data: ProgressData; version: number } }) {
  const { data, mutate, flush, status } = useProgress(progress);
  const earnToday = useEarnToday(data);
  const [round, setRound] = useState<SightWord[]>([]);
  const [index, setIndex] = useState(0);
  const [right, setRight] = useState(0);
  const [speed, setSpeed] = useState<number>(SPEED.startMs);
  const [phase, setPhase] = useState<'intro' | 'run' | 'done'>('intro');
  const [bonus, setBonus] = useState(0);
  const [earned, setEarned] = useState(0);

  useEffect(() => warmUpVoices(), []);

  function start() {
    setRound(buildRound(statsOf(data)));
    setIndex(0);
    setRight(0);
    setBonus(0);
    setEarned(0);
    setPhase('run');
  }

  function answered(w: SightWord, correct: boolean) {
    if (correct) setRight((r) => r + 1);
    setSpeed((s) => (correct ? Math.max(SPEED.minMs, s - SPEED.faster) : Math.min(SPEED.maxMs, s + SPEED.slower)));
    // learning pays once a day per word
    const payKey = `sight:${w.word}`;
    const coins = correct ? earnToday(payKey, 1) : 0;
    setEarned((e) => e + coins);
    mutate((d) => {
      const all = { ...statsOf(d) };
      const prev = all[w.word] ?? { c: 0, w: 0, t: 0 };
      all[w.word] = correct ? { c: prev.c + 1, w: prev.w, t: Date.now() } : { c: prev.c, w: prev.w + 1, t: Date.now() };
      return payDaily({ ...d, sightStats: all }, payKey, coins);
    });
  }

  function next() {
    stopSpeaking();
    if (index + 1 < round.length) {
      setIndex(index + 1);
      return;
    }
    const roundBonus = right >= SIGHT_ROUND - 2 ? earnToday('sightRound', BONUS) : 0;
    setBonus(roundBonus);
    if (roundBonus) mutate((d) => payDaily(d, 'sightRound', roundBonus));
    setPhase('done');
  }

  useRoundActivity('sight', round, phase === 'done', round.length, right);

  async function goHome() {
    stopSpeaking();
    await flush();
    window.location.assign('/');
  }

  return (
    <KidShell
      title="⚡ קריאה מהירה"
      displayName={displayName}
      coins={Number(data.coins) || 0}
      status={status}
      onHome={goHome}
      extra={
        phase === 'run' ? (
          <span className="bg-violet-50 border border-violet-200 text-violet-800 px-3 py-2 rounded-2xl font-extrabold text-sm" data-testid="speed">
            ⚡ {(speed / 1000).toFixed(1)} שנ׳
          </span>
        ) : undefined
      }
    >
      {phase === 'intro' && (
        <KidPanel>
          <div className="text-6xl mb-3">⚡</div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">מילים שקוראים במבט אחד</h2>
          <p className="text-slate-600 mb-1">מילה מופיעה לרגע ונעלמת – בוחרים מה היא אומרת.</p>
          <p className="text-sm text-slate-500 mb-6">כל תשובה נכונה מקצרת את הזמן. {SIGHT_ROUND - 2}+ נכונות = בונוס {BONUS} 🪙</p>
          <button onClick={start} className="px-8 py-3 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-black text-lg shadow-md cursor-pointer">
            מתחילים! 🚀
          </button>
        </KidPanel>
      )}

      {phase === 'run' && round[index] && (
        <KidPanel key={index}>
          <ProgressDots index={index} total={round.length} />
          <FlashCard word={round[index]} showMs={speed} onAnswered={(c) => answered(round[index], c)} onNext={next} />
        </KidPanel>
      )}

      {phase === 'done' && (
        <KidPanel>
          <div className="text-6xl mb-2">{right >= SIGHT_ROUND - 2 ? '🏆' : '🌟'}</div>
          <h2 className="text-2xl font-black text-slate-800">
            {right} מתוך {round.length} נכונות
          </h2>
          <div className="text-amber-700 font-black mb-1">{earned + bonus > 0 ? `+${earned + bonus} 🪙` : 'על המילים האלה כבר קיבלת מטבעות היום 🌟'}</div>
          <div className="text-sm text-slate-500 mb-5">המהירות שלך עכשיו: {(speed / 1000).toFixed(1)} שניות למילה ⚡</div>
          <button onClick={start} className="px-6 py-3 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-black cursor-pointer">
            🔄 עוד סבב
          </button>
        </KidPanel>
      )}
    </KidShell>
  );
}

function FlashCard({ word, showMs, onAnswered, onNext }: { word: SightWord; showMs: number; onAnswered: (c: boolean) => void; onNext: () => void }) {
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);
  const [chosen, setChosen] = useState<string | null>(null);
  const [options] = useState(() => optionsFor(word));
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    // short "get ready", then flash the word
    timers.current.push(setTimeout(() => setVisible(true), 500));
    timers.current.push(
      setTimeout(() => {
        setVisible(false);
        setReady(true);
      }, 500 + showMs),
    );
    const list = timers.current;
    return () => list.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function choose(o: string) {
    if (chosen || !ready) return;
    setChosen(o);
    onAnswered(o === word.hebrew);
    void speak(word.word);
  }

  return (
    <div>
      <div className="h-28 flex items-center justify-center mb-4">
        {visible ? (
          <span className="text-7xl font-black font-english text-violet-700" dir="ltr" data-testid="flash-word">
            {word.word}
          </span>
        ) : chosen ? (
          <span className="text-6xl font-black font-english text-slate-700" dir="ltr">
            {word.word}
          </span>
        ) : (
          <span className="text-5xl text-slate-300">{ready ? '❓' : '👀'}</span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {options.map((o) => {
          const state = !chosen ? (ready ? 'idle' : 'wait') : o === word.hebrew ? 'right' : o === chosen ? 'wrong' : 'dim';
          return (
            <button
              key={o}
              onClick={() => choose(o)}
              disabled={!ready || !!chosen}
              className={`py-4 px-3 rounded-2xl border-2 text-lg font-black transition cursor-pointer ${
                {
                  wait: 'border-slate-100 bg-white text-slate-300',
                  idle: 'border-slate-200 bg-white hover:border-violet-400 hover:bg-violet-50 text-slate-800 active:scale-95',
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
      {chosen && (
        <button onClick={onNext} className="mt-5 px-8 py-3 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-black shadow-md cursor-pointer">
          הבא ←
        </button>
      )}
    </div>
  );
}
