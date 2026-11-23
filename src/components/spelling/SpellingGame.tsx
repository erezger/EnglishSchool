'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { gradeLabel, type BankTopic } from '@/content/wordbank';
import { setPreferredVoice, speak, speakLetter, speechSupported, spellOut, stopSpeaking, warmUpVoices } from '@/lib/speech';
import { useRoundActivity } from '@/lib/use-activity';
import { useProgress, type ProgressData } from '@/lib/use-progress';
import type { WordList } from '@/lib/words';

/* ------------------------------------------------------------------ types */

export type PracticeWord = {
  key: string; // lowercase word, stats key
  word: string;
  hebrew: string;
  emoji: string;
  exampleEn: string;
  exampleHe: string;
};
type Stat = { c: number; w: number; s: number; t: number }; // correct, wrong, streak, last seen
type Mode = 'learn' | 'practice' | 'test';
type Source = { id: string; title: string; icon: string; words: PracticeWord[] };
type RoundItem = { w: PracticeWord; mode: Mode };
type Result = { key: string; word: string; correct: boolean; coins: number };

const ROUND_SIZE = 10;
const KNOWN_STREAK = 3;
const REWARD: Record<Mode, { clean: number; helped: number }> = {
  learn: { clean: 2, helped: 2 },
  practice: { clean: 3, helped: 2 },
  test: { clean: 5, helped: 1 },
};

/* ---------------------------------------------------------------- helpers */

const statsOf = (data: ProgressData): Record<string, Stat> =>
  data.spellingStats && typeof data.spellingStats === 'object' ? (data.spellingStats as Record<string, Stat>) : {};

function modeFor(stat: Stat | undefined): Mode {
  if (!stat || (stat.c === 0 && stat.s === 0)) return 'learn';
  return stat.s >= KNOWN_STREAK ? 'test' : 'practice';
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Weak words first, then new ones, then the ones not seen for the longest time. */
function buildRound(words: PracticeWord[], stats: Record<string, Stat>): RoundItem[] {
  const unique = [...new Map(words.map((w) => [w.key, w])).values()];
  const weak = unique.filter((w) => stats[w.key] && stats[w.key].w > 0 && stats[w.key].s < KNOWN_STREAK);
  const fresh = unique.filter((w) => !stats[w.key]);
  const rest = unique
    .filter((w) => !weak.includes(w) && !fresh.includes(w))
    .sort((a, b) => (stats[a.key]?.t ?? 0) - (stats[b.key]?.t ?? 0));
  const picked = [...shuffle(weak), ...shuffle(fresh), ...rest].slice(0, ROUND_SIZE);
  return shuffle(picked).map((w) => ({ w, mode: modeFor(stats[w.key]) }));
}

const isLetter = (ch: string) => /[a-z]/i.test(ch);

let audioCtx: AudioContext | null = null;
function chime(kind: 'good' | 'bad', muted: boolean) {
  if (muted || typeof window === 'undefined') return;
  try {
    audioCtx ??= new AudioContext();
    const notes = kind === 'good' ? [660, 880, 1175] : [300, 220];
    notes.forEach((freq, i) => {
      const osc = audioCtx!.createOscillator();
      const gain = audioCtx!.createGain();
      osc.frequency.value = freq;
      osc.type = 'sine';
      const t = audioCtx!.currentTime + i * 0.11;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
      osc.connect(gain).connect(audioCtx!.destination);
      osc.start(t);
      osc.stop(t + 0.3);
    });
  } catch {
    /* audio not available */
  }
}

function readPref(key: string, fallback: boolean): boolean {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : v === '1';
  } catch {
    return fallback;
  }
}
function writePref(key: string, value: boolean) {
  try {
    localStorage.setItem(key, value ? '1' : '0');
  } catch {
    /* ignore */
  }
}

/* ------------------------------------------------------------- component */

export default function SpellingGame({
  displayName,
  progress,
  grade,
  lists,
  bank,
}: {
  displayName: string;
  progress: { data: ProgressData; version: number };
  grade: number | null;
  lists: WordList[];
  bank: Record<number, BankTopic[]>;
}) {
  const { data, mutate, flush, status } = useProgress(progress);
  const stats = statsOf(data);
  const coins = Number(data.coins) || 0;
  const muted = !!data.sfxMuted;

  const [screen, setScreen] = useState<'pick' | 'play' | 'done'>('pick');
  const [source, setSource] = useState<Source | null>(null);
  const [round, setRound] = useState<RoundItem[]>([]);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<Result[]>([]);
  const [sayLetters, setSayLetters] = useState(true);
  const [slow, setSlow] = useState(false);
  const [noSpeech, setNoSpeech] = useState(false); // checked after mount: the server can't know
  const bankGrades = Object.keys(bank).map(Number).sort();
  const [bankGrade, setBankGrade] = useState<number>(grade && bank[grade] ? grade : bankGrades[bankGrades.length - 1]);

  useEffect(() => {
    setSayLetters(readPref('spell_say_letters', true));
    setSlow(readPref('spell_slow', false));
    if (typeof data.preferredVoiceName === 'string') setPreferredVoice(data.preferredVoiceName);
    warmUpVoices();
    setNoSpeech(!speechSupported());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- word sources ---- */
  const listSources: Source[] = useMemo(
    () =>
      lists
        .filter((l) => l.words.length)
        .map((l) => ({
          id: `list:${l.id}`,
          title: l.title,
          icon: '📚',
          words: l.words.map((w) => ({
            key: w.word.toLowerCase(),
            word: w.word,
            hebrew: w.hebrew,
            emoji: w.emoji,
            exampleEn: w.exampleEn,
            exampleHe: w.exampleHe,
          })),
        })),
    [lists],
  );
  const bankSources = (g: number): Source[] =>
    (bank[g] ?? []).map((t) => ({
      id: `bank:${t.id}`,
      title: t.title,
      icon: t.icon,
      words: t.words.map((w) => ({ key: w.word.toLowerCase(), word: w.word, hebrew: w.hebrew, emoji: w.emoji, exampleEn: '', exampleHe: '' })),
    }));
  const allWords = useMemo(
    () => [...listSources.flatMap((s) => s.words), ...bankGrades.flatMap((g) => bankSources(g).flatMap((s) => s.words))],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [listSources],
  );
  const reviewWords = allWords.filter((w) => stats[w.key] && stats[w.key].w > 0 && stats[w.key].s < KNOWN_STREAK);

  function start(src: Source) {
    setSource(src);
    setRound(buildRound(src.words, stats));
    setIndex(0);
    setResults([]);
    setScreen('play');
  }

  const onAnswered = useCallback(
    (item: RoundItem, correct: boolean, helped: boolean) => {
      const reward = correct ? REWARD[item.mode][helped ? 'helped' : 'clean'] : 0;
      mutate((d) => {
        const all = { ...statsOf(d) };
        const prev = all[item.w.key] ?? { c: 0, w: 0, s: 0, t: 0 };
        all[item.w.key] = correct
          ? { c: prev.c + 1, w: prev.w, s: helped ? Math.max(prev.s, 1) : prev.s + 1, t: Date.now() }
          : { c: prev.c, w: prev.w + 1, s: 0, t: Date.now() };
        return { ...d, coins: (Number(d.coins) || 0) + reward, spellingStats: all };
      });
      setResults((r) => [...r, { key: item.w.key, word: item.w.word, correct, coins: reward }]);
      return reward;
    },
    [mutate],
  );

  useRoundActivity('spell', round, screen === 'done', results.length, results.filter((r) => r.correct).length);

  async function goHome() {
    stopSpeaking();
    await flush();
    window.location.assign('/');
  }

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-5 py-4 sm:py-6 pb-16">
      <header className="bg-white/95 rounded-3xl shadow-md border border-indigo-100/80 p-4 mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-extrabold text-indigo-600">✨ אנגלית בקליק PRO</div>
          <h1 className="text-2xl font-black text-slate-800">🐝 שומעים ומאייתים</h1>
          <div className="text-sm text-slate-500">שלום {displayName}!</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 bg-gradient-to-l from-amber-100 to-yellow-50 border-2 border-amber-300 text-amber-950 px-3.5 py-2 rounded-2xl font-black">
            🪙 <span data-testid="coins">{coins}</span>
          </span>
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
              status === 'error' ? 'bg-rose-50 text-rose-700 border-rose-200' : status === 'saving' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            {status === 'error' ? 'שגיאת שמירה ⚠️' : status === 'saving' ? 'שומר...' : 'נשמר ✓'}
          </span>
          <button onClick={goHome} className="px-3.5 py-2 rounded-2xl text-sm font-extrabold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer">
            🏠 למשחק
          </button>
        </div>
      </header>

      {noSpeech && (
        <div className="mb-4 text-sm font-bold text-amber-900 bg-amber-50 border border-amber-200 rounded-2xl p-3">
          הדפדפן הזה לא תומך בהקראה. כדאי להשתמש ב-Chrome.
        </div>
      )}

      {screen === 'pick' && (
        <div className="space-y-5">
          <Card title="📚 מילים מהכיתה שלי">
            {listSources.length === 0 ? (
              <div className="text-sm text-slate-500">עוד אין רשימות. ההורים יכולים להוסיף מילים מהספר באזור ההורים 🙂</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {listSources.map((s) => (
                  <SourceButton key={s.id} src={s} stats={stats} onClick={() => start(s)} />
                ))}
              </div>
            )}
          </Card>

          {reviewWords.length > 0 && (
            <Card title="🔁 מילים לחזרה">
              <SourceButton
                src={{ id: 'review', title: 'מילים שכדאי לתרגל שוב', icon: '🔁', words: reviewWords }}
                stats={stats}
                onClick={() => start({ id: 'review', title: 'חזרה', icon: '🔁', words: reviewWords })}
              />
            </Card>
          )}

          <Card
            title={`🎓 מילים לכיתה ${gradeLabel(bankGrade)}`}
            action={
              <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                {bankGrades.map((g) => (
                  <button
                    key={g}
                    onClick={() => setBankGrade(g)}
                    className={`px-3 py-1 rounded-lg text-xs font-extrabold cursor-pointer ${bankGrade === g ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}
                  >
                    כיתה {gradeLabel(g)}
                  </button>
                ))}
              </div>
            }
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {bankSources(bankGrade).map((s) => (
                <SourceButton key={s.id} src={s} stats={stats} onClick={() => start(s)} compact />
              ))}
            </div>
          </Card>

          <Card title="⚙️ הגדרות">
            <div className="flex flex-wrap gap-2">
              <Toggle
                on={sayLetters}
                label="🗣️ להקריא כל אות שמקלידים"
                onChange={(v) => {
                  setSayLetters(v);
                  writePref('spell_say_letters', v);
                }}
              />
              <Toggle
                on={slow}
                label="🐢 הקראה איטית"
                onChange={(v) => {
                  setSlow(v);
                  writePref('spell_slow', v);
                }}
              />
            </div>
          </Card>
        </div>
      )}

      {screen === 'play' && round[index] && (
        <WordCard
          key={`${index}-${round[index].w.key}`}
          item={round[index]}
          position={index}
          total={round.length}
          sayLetters={sayLetters}
          slow={slow}
          muted={muted}
          onAnswered={onAnswered}
          onNext={() => {
            if (index + 1 < round.length) setIndex(index + 1);
            else setScreen('done');
          }}
          onQuit={() => {
            stopSpeaking();
            setScreen('pick');
          }}
        />
      )}

      {screen === 'done' && (
        <Summary
          results={results}
          onAgain={() => source && start(source)}
          onPick={() => setScreen('pick')}
          onHome={goHome}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------ word card */

function WordCard({
  item,
  position,
  total,
  sayLetters,
  slow,
  muted,
  onAnswered,
  onNext,
  onQuit,
}: {
  item: RoundItem;
  position: number;
  total: number;
  sayLetters: boolean;
  slow: boolean;
  muted: boolean;
  onAnswered: (item: RoundItem, correct: boolean, helped: boolean) => number;
  onNext: () => void;
  onQuit: () => void;
}) {
  const { w, mode } = item;
  const target = w.word;
  const [typed, setTyped] = useState('');
  const [helped, setHelped] = useState(false);
  const [spellingIdx, setSpellingIdx] = useState<number | null>(null); // letter being spoken
  const [phase, setPhase] = useState<'typing' | 'correct' | 'wrong' | 'retype' | 'retyped'>('typing');
  const [reward, setReward] = useState(0);
  const [firstTry, setFirstTry] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const focus = () => setTimeout(() => inputRef.current?.focus(), 0);

  const doSpell = useCallback(
    async (markHelp: boolean) => {
      if (markHelp) setHelped(true);
      await spellOut(target, (i) => setSpellingIdx(i < 0 ? null : i), { slow });
      setSpellingIdx(null);
      focus();
    },
    [target, slow],
  );

  // Start of each word: new words are spelled out for her; known ones only say the word
  useEffect(() => {
    const t = setTimeout(() => {
      if (mode === 'learn') void doSpell(false);
      else void speak(target, { rate: slow ? 0.7 : 0.85 });
    }, 350);
    focus();
    return () => {
      clearTimeout(t);
      stopSpeaking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const normalized = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

  function onType(value: string) {
    const clean = value.replace(/[^a-zA-Z' -]/g, '').slice(0, target.length);
    if (clean.length > typed.length && sayLetters) {
      const ch = clean[clean.length - 1];
      if (isLetter(ch)) speakLetter(ch);
    }
    setTyped(clean);
  }

  function check() {
    if (phase === 'typing') {
      if (!typed.trim()) return;
      stopSpeaking();
      const ok = normalized(typed) === normalized(target);
      setFirstTry(typed);
      const r = onAnswered(item, ok, helped);
      setReward(r);
      if (ok) {
        setPhase('correct');
        chime('good', muted);
        setTimeout(() => void speak(w.exampleEn || target, { rate: 0.85 }), 450);
      } else {
        setPhase('wrong');
        chime('bad', muted);
        setTimeout(() => void doSpell(false).then(() => setPhase('retype')), 500);
        setTyped('');
      }
    } else if (phase === 'retype') {
      if (normalized(typed) === normalized(target)) {
        chime('good', muted);
        setPhase('retyped');
      } else {
        chime('bad', muted);
        setTyped('');
        void doSpell(false);
      }
    } else if (phase === 'correct' || phase === 'retyped') {
      onNext();
    }
  }

  function hint() {
    if (phase !== 'typing' && phase !== 'retype') return;
    let prefix = 0;
    while (prefix < typed.length && typed[prefix]?.toLowerCase() === target[prefix]?.toLowerCase()) prefix++;
    const next = target.slice(0, prefix + 1);
    setTyped(next);
    setHelped(true);
    const ch = target[prefix];
    if (ch && isLetter(ch)) speakLetter(ch);
    focus();
  }

  const done = phase === 'correct' || phase === 'retyped';
  const modeBadge = {
    learn: { text: '🌱 מילה חדשה – מקשיבים לאיות ואז מקלידים', cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    practice: { text: '✏️ תרגול – אפשר להיעזר באיות ורמז', cls: 'bg-sky-50 text-sky-800 border-sky-200' },
    test: { text: '⭐ מבחן – בלי עזרה מקבלים 5 מטבעות', cls: 'bg-amber-50 text-amber-900 border-amber-300' },
  }[mode];

  // What each letter box shows
  const boxes = target.split('').map((ch, i) => {
    const isGap = !isLetter(ch);
    let shown = typed[i] ?? '';
    let state: 'empty' | 'filled' | 'good' | 'bad' | 'speaking' = shown ? 'filled' : 'empty';
    if (spellingIdx === i) {
      state = 'speaking';
      shown = ch;
    } else if (phase === 'wrong') {
      shown = firstTry[i] ?? '';
      state = shown.toLowerCase() === ch.toLowerCase() ? 'good' : 'bad';
    } else if (done) {
      shown = ch;
      state = 'good';
    }
    return { ch, shown, state, isGap };
  });

  return (
    <div className="bg-white/95 rounded-3xl shadow-md border border-indigo-100/80 p-5 sm:p-7" onClick={focus}>
      <div className="flex items-center justify-between mb-4">
        <button onClick={onQuit} className="text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer">
          ✕ יציאה
        </button>
        <div className="flex gap-1" aria-label={`מילה ${position + 1} מתוך ${total}`}>
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className={`w-2.5 h-2.5 rounded-full ${i < position ? 'bg-indigo-400' : i === position ? 'bg-indigo-600 scale-125' : 'bg-slate-200'}`} />
          ))}
        </div>
      </div>

      <div className={`inline-block text-xs font-extrabold px-3 py-1 rounded-full border mb-4 ${modeBadge.cls}`}>{modeBadge.text}</div>

      <div className="text-center mb-5">
        <div className="text-6xl mb-2">{w.emoji || '🔤'}</div>
        <div className="text-xl font-black text-slate-700">{w.hebrew || 'מה המילה?'}</div>
      </div>

      <div className="flex justify-center gap-2 mb-5 flex-wrap">
        <ActionBtn onClick={() => void speak(target, { rate: slow ? 0.7 : 0.85 })}>🔊 שמיעה</ActionBtn>
        <ActionBtn onClick={() => void doSpell(mode !== 'learn' && !done)}>🐝 איות{mode !== 'learn' && !done ? ' (עזרה)' : ''}</ActionBtn>
        {!done && phase !== 'wrong' && <ActionBtn onClick={hint}>💡 רמז</ActionBtn>}
      </div>

      {/* Letter boxes (LTR) with an invisible input on top for the keyboard */}
      <div className="relative mx-auto mb-5" dir="ltr">
        <div className="flex justify-center gap-1.5 sm:gap-2 flex-wrap">
          {boxes.map((b, i) =>
            b.isGap ? (
              <div key={i} className="w-4 sm:w-6" />
            ) : (
              <div
                key={i}
                data-testid="letter-box"
                className={`w-11 h-14 sm:w-14 sm:h-16 rounded-2xl border-[3px] flex items-center justify-center text-3xl sm:text-4xl font-black font-english transition ${
                  {
                    empty: 'border-slate-200 bg-white text-slate-800',
                    filled: 'border-indigo-300 bg-indigo-50 text-indigo-900',
                    good: 'border-emerald-400 bg-emerald-50 text-emerald-700',
                    bad: 'border-rose-400 bg-rose-50 text-rose-700 animate-shake',
                    speaking: 'border-amber-400 bg-amber-100 text-amber-800 scale-110',
                  }[b.state]
                }`}
              >
                {b.shown.toLowerCase()}
              </div>
            ),
          )}
        </div>
        <input
          ref={inputRef}
          aria-label="הקלדת המילה"
          value={typed}
          onChange={(e) => onType(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              check();
            }
          }}
          disabled={phase === 'wrong'}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          className="absolute inset-0 w-full h-full opacity-0 cursor-text"
        />
      </div>

      {phase === 'typing' && (
        <div className="text-center">
          <button onClick={check} disabled={!typed.trim()} className="px-8 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg shadow-md disabled:opacity-40 cursor-pointer">
            בדיקה ✓
          </button>
          <div className="text-xs text-slate-400 mt-2">מקלידים במקלדת ולוחצים Enter</div>
        </div>
      )}

      {phase === 'wrong' && (
        <div className="text-center text-rose-700 font-black">
          כמעט! זו המילה: <span className="font-english text-2xl" dir="ltr">{target}</span> – תקשיבו לאיות 👂
        </div>
      )}

      {phase === 'retype' && (
        <div className="text-center">
          <div className="text-sky-800 font-black mb-2">עכשיו מקלידים אותה נכון פעם אחת ✍️</div>
          <button onClick={check} disabled={typed.length < target.length} className="px-8 py-3 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-black shadow-md disabled:opacity-40 cursor-pointer">
            בדיקה ✓
          </button>
        </div>
      )}

      {done && (
        <div className="text-center space-y-3 animate-pop">
          {phase === 'correct' ? (
            <div className="text-2xl font-black text-emerald-700">
              כל הכבוד! 🎉 {reward > 0 && <span className="text-amber-600">+{reward} 🪙</span>}
            </div>
          ) : (
            <div className="text-xl font-black text-sky-700">יופי, עכשיו זה נכון! 💪</div>
          )}
          {w.exampleEn && (
            <button
              onClick={() => void speak(w.exampleEn, { rate: 0.85 })}
              className="block mx-auto bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-right hover:bg-slate-100 cursor-pointer"
            >
              <div className="font-english text-lg text-slate-800" dir="ltr">
                🔊 {w.exampleEn}
              </div>
              {w.exampleHe && <div className="text-sm text-slate-500">{w.exampleHe}</div>}
            </button>
          )}
          <button onClick={onNext} className="px-8 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg shadow-md cursor-pointer">
            {position + 1 < total ? 'הבא ←' : 'סיום 🏁'}
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- pieces */

function Summary({ results, onAgain, onPick, onHome }: { results: Result[]; onAgain: () => void; onPick: () => void; onHome: () => void }) {
  const right = results.filter((r) => r.correct).length;
  const earned = results.reduce((s, r) => s + r.coins, 0);
  return (
    <div className="bg-white/95 rounded-3xl shadow-md border border-indigo-100/80 p-6 text-center animate-pop">
      <div className="text-6xl mb-2">{right === results.length ? '🏆' : right >= results.length / 2 ? '🌟' : '💪'}</div>
      <h2 className="text-2xl font-black text-slate-800 mb-1">
        {right} מתוך {results.length} נכונות בפעם הראשונה
      </h2>
      <div className="text-amber-700 font-black mb-5">+{earned} 🪙 בסבב הזה</div>
      <div className="flex flex-wrap justify-center gap-2 mb-6" dir="ltr">
        {results.map((r, i) => (
          <span
            key={i}
            className={`font-english font-bold px-3 py-1 rounded-xl border ${r.correct ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}
          >
            {r.correct ? '✓' : '↻'} {r.word}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <button onClick={onAgain} className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black cursor-pointer">
          🔄 עוד סבב
        </button>
        <button onClick={onPick} className="px-5 py-3 rounded-2xl bg-white border border-slate-300 text-slate-700 font-bold cursor-pointer">
          📚 בחירת מילים
        </button>
        <button onClick={onHome} className="px-5 py-3 rounded-2xl bg-white border border-slate-300 text-slate-700 font-bold cursor-pointer">
          🏠 למשחק
        </button>
      </div>
    </div>
  );
}

function Card({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="bg-white/95 rounded-3xl shadow-md border border-indigo-100/80 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h2 className="text-lg font-black text-slate-800">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function SourceButton({ src, stats, onClick, compact }: { src: Source; stats: Record<string, Stat>; onClick: () => void; compact?: boolean }) {
  const known = src.words.filter((w) => (stats[w.key]?.s ?? 0) >= KNOWN_STREAK).length;
  const pct = src.words.length ? Math.round((known / src.words.length) * 100) : 0;
  return (
    <button
      onClick={onClick}
      className={`text-right bg-slate-50 hover:bg-indigo-50 border-2 border-slate-200 hover:border-indigo-300 rounded-2xl transition active:scale-[0.98] cursor-pointer ${compact ? 'p-3' : 'p-4'}`}
    >
      <div className={`font-black text-slate-800 ${compact ? 'text-sm' : 'text-base'}`}>
        {src.icon} {src.title}
      </div>
      <div className="text-xs text-slate-500 mt-0.5">
        {src.words.length} מילים · {known} יודעים
      </div>
      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-2">
        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
      </div>
    </button>
  );
}

function Toggle({ on, label, onChange }: { on: boolean; label: string; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`px-3.5 py-2 rounded-xl text-sm font-bold border transition cursor-pointer ${on ? 'bg-indigo-50 border-indigo-300 text-indigo-800' : 'bg-white border-slate-300 text-slate-500'}`}
    >
      {label} {on ? '✓' : ''}
    </button>
  );
}

function ActionBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="px-4 py-2.5 rounded-2xl bg-white border-2 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700 font-extrabold text-sm transition active:scale-95 cursor-pointer"
    >
      {children}
    </button>
  );
}
