'use client';

import { useEffect, useRef, useState } from 'react';
import { STORIES, glossFor, tokenize, type Story } from '@/content/stories';
import { gradeLabel } from '@/content/wordbank';
import { speak, stopSpeaking, warmUpVoices } from '@/lib/speech';
import { useProgress, type ProgressData } from '@/lib/use-progress';
import { KidPanel, KidShell, ProgressDots } from '../kid/KidShell';

type Stat = { best: number; reads: number; t: number };
const statsOf = (d: ProgressData) => (d.readingStats && typeof d.readingStats === 'object' ? (d.readingStats as Record<string, Stat>) : {});
const PER_CORRECT = 2;
const PERFECT_BONUS = 3;
const TF_HE: Record<string, string> = { True: 'נכון ✓', False: 'לא נכון ✗' };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Reading({
  displayName,
  progress,
  grade,
}: {
  displayName: string;
  progress: { data: ProgressData; version: number };
  grade: number | null;
}) {
  const { data, mutate, flush, status } = useProgress(progress);
  const grades = [...new Set(STORIES.map((s) => s.grade))].sort();
  const [tab, setTab] = useState<number>(grade && grades.includes(grade) ? grade : grades[grades.length - 1]);
  const [story, setStory] = useState<Story | null>(null);
  const [phase, setPhase] = useState<'read' | 'quiz' | 'done'>('read');
  const [qIndex, setQIndex] = useState(0);
  const [right, setRight] = useState(0);
  const [earned, setEarned] = useState(0);
  const stats = statsOf(data);

  useEffect(() => warmUpVoices(), []);

  function open(s: Story) {
    setStory(s);
    setPhase('read');
    setQIndex(0);
    setRight(0);
  }

  function answered(correct: boolean) {
    if (correct) setRight((r) => r + 1);
  }

  function nextQuestion() {
    stopSpeaking();
    if (!story) return;
    if (qIndex + 1 < story.questions.length) {
      setQIndex(qIndex + 1);
      return;
    }
    const score = right;
    const total = story.questions.length;
    const coins = score * PER_CORRECT + (score === total ? PERFECT_BONUS : 0);
    setEarned(coins);
    mutate((d) => {
      const all = { ...statsOf(d) };
      const prev = all[story.id] ?? { best: 0, reads: 0, t: 0 };
      all[story.id] = { best: Math.max(prev.best, Math.round((score / total) * 100)), reads: prev.reads + 1, t: Date.now() };
      return { ...d, coins: (Number(d.coins) || 0) + coins, readingStats: all };
    });
    setPhase('done');
  }

  async function goHome() {
    stopSpeaking();
    await flush();
    window.location.assign('/');
  }

  return (
    <KidShell title="📖 קוראים ומבינים" displayName={displayName} coins={Number(data.coins) || 0} status={status} onHome={goHome} wide>
      {!story && (
        <div className="space-y-4">
          <div className="flex gap-1 bg-white/90 p-1 rounded-2xl w-fit">
            {grades.map((g) => (
              <button
                key={g}
                onClick={() => setTab(g)}
                className={`px-4 py-2 rounded-xl text-sm font-extrabold cursor-pointer ${tab === g ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}
              >
                כיתה {gradeLabel(g)}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {STORIES.filter((s) => s.grade === tab).map((s) => (
              <button
                key={s.id}
                onClick={() => open(s)}
                className="text-right bg-white/95 hover:bg-indigo-50 border-2 border-slate-200 hover:border-indigo-300 rounded-3xl p-5 shadow-sm transition cursor-pointer"
              >
                <div className="text-4xl mb-1">{s.emoji}</div>
                <div className="text-lg font-black text-slate-800 font-english" dir="ltr">
                  {s.title}
                </div>
                <div className="text-sm text-slate-500">{s.titleHe}</div>
                <div className="text-xs mt-1 font-bold text-slate-500">
                  {stats[s.id] ? `שיא: ${stats[s.id].best}% ${stats[s.id].best === 100 ? '⭐' : ''}` : 'חדש'}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {story && phase === 'read' && <StoryReader story={story} onQuiz={() => setPhase('quiz')} onBack={() => setStory(null)} />}

      {story && phase === 'quiz' && story.questions[qIndex] && (
        <KidPanel key={qIndex}>
          <ProgressDots index={qIndex} total={story.questions.length} />
          <QuestionView question={story.questions[qIndex]} onAnswered={answered} onNext={nextQuestion} />
          <button onClick={() => setPhase('read')} className="mt-4 text-xs font-bold text-slate-500 underline cursor-pointer">
            📖 לחזור לסיפור
          </button>
        </KidPanel>
      )}

      {story && phase === 'done' && (
        <KidPanel>
          <div className="text-6xl mb-2">{right === story.questions.length ? '🏆' : '🌟'}</div>
          <h2 className="text-2xl font-black text-slate-800">
            {right} מתוך {story.questions.length} תשובות נכונות
          </h2>
          <div className="text-amber-700 font-black mb-5">+{earned} 🪙</div>
          <div className="flex flex-wrap justify-center gap-2">
            <button onClick={() => open(story)} className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black cursor-pointer">
              🔄 לקרוא שוב
            </button>
            <button onClick={() => setStory(null)} className="px-5 py-3 rounded-2xl bg-white border border-slate-300 text-slate-700 font-bold cursor-pointer">
              📚 סיפור אחר
            </button>
          </div>
        </KidPanel>
      )}
    </KidShell>
  );
}

function StoryReader({ story, onQuiz, onBack }: { story: Story; onQuiz: () => void; onBack: () => void }) {
  const [reading, setReading] = useState<number | null>(null);
  const [picked, setPicked] = useState<{ word: string; he: string | null } | null>(null);
  const cancel = useRef(false);

  useEffect(() => () => stopSpeaking(), []);

  async function readAll() {
    cancel.current = false;
    stopSpeaking();
    for (let i = 0; i < story.sentences.length; i++) {
      if (cancel.current) break;
      setReading(i);
      await speak(story.sentences[i], { rate: 0.85, interrupt: false });
    }
    setReading(null);
  }

  function tapWord(word: string) {
    cancel.current = true;
    setReading(null);
    setPicked({ word, he: glossFor(story, word) });
    void speak(word, { rate: 0.8 });
  }

  return (
    <div className="bg-white/95 rounded-3xl shadow-md border border-indigo-100/80 p-5 sm:p-7">
      <div className="flex items-center justify-between mb-3">
        <button onClick={onBack} className="text-xs font-bold text-slate-500 cursor-pointer">
          ✕ חזרה לסיפורים
        </button>
        <span className="text-xs font-bold text-slate-400">לחיצה על מילה = תרגום 👆</span>
      </div>
      <div className="text-center mb-4">
        <div className="text-5xl">{story.emoji}</div>
        <h2 className="text-2xl sm:text-3xl font-black font-english text-slate-800" dir="ltr">
          {story.title}
        </h2>
      </div>
      <div className="font-english text-xl sm:text-2xl leading-loose text-slate-800 mb-5" dir="ltr">
        {story.sentences.map((s, i) => (
          <span key={i} className={`rounded-lg transition ${reading === i ? 'bg-amber-100' : ''}`}>
            {tokenize(s).map((t, j) =>
              t.word ? (
                <button
                  key={j}
                  onClick={() => tapWord(t.word!)}
                  className={`rounded px-0.5 hover:bg-indigo-100 cursor-pointer ${picked?.word === t.word ? 'bg-indigo-100 text-indigo-800' : ''}`}
                >
                  {t.text}
                </button>
              ) : (
                <span key={j}>{t.text}</span>
              ),
            )}{' '}
          </span>
        ))}
      </div>
      <div className="min-h-[3.25rem] mb-4">
        {picked && (
          <div className="flex items-center justify-center gap-3 bg-indigo-50 border border-indigo-200 rounded-2xl px-4 py-2.5 animate-pop">
            <span className="font-english font-black text-indigo-800 text-lg" dir="ltr">
              {picked.word}
            </span>
            <span className="text-slate-400">=</span>
            <span className="font-black text-slate-800">{picked.he ?? '—'}</span>
            <button onClick={() => void speak(picked.word, { rate: 0.8 })} aria-label="השמעה" className="text-xl cursor-pointer">
              🔊
            </button>
          </div>
        )}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <button onClick={() => void readAll()} className="px-5 py-3 rounded-2xl bg-white border-2 border-slate-200 hover:border-indigo-300 font-extrabold text-slate-700 cursor-pointer">
          🔊 הקראת הסיפור
        </button>
        <button onClick={onQuiz} className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-md cursor-pointer">
          לשאלות ←
        </button>
      </div>
    </div>
  );
}

function QuestionView({
  question,
  onAnswered,
  onNext,
}: {
  question: Story['questions'][number];
  onAnswered: (c: boolean) => void;
  onNext: () => void;
}) {
  const [chosen, setChosen] = useState<string | null>(null);
  const [options] = useState(() => (question.options.includes('True') ? question.options : shuffle(question.options)));
  const isTF = question.options.includes('True');

  useEffect(() => {
    void speak(question.q, { rate: 0.85 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function choose(o: string) {
    if (chosen) return;
    setChosen(o);
    onAnswered(o === question.answer);
  }

  return (
    <div>
      <div className="text-xl sm:text-2xl font-black font-english text-slate-800 mb-1" dir="ltr">
        {question.q} {isTF && <span className="text-slate-400 text-base">(True / False)</span>}
      </div>
      <div className="text-sm text-slate-500 mb-5">{question.qHe}</div>
      <div className={`grid gap-2.5 ${isTF ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {options.map((o) => {
          const state = !chosen ? 'idle' : o === question.answer ? 'right' : o === chosen ? 'wrong' : 'dim';
          return (
            <button
              key={o}
              onClick={() => choose(o)}
              disabled={!!chosen}
              className={`py-3 px-4 rounded-2xl border-2 text-lg font-black transition cursor-pointer ${isTF ? '' : 'font-english'} ${
                {
                  idle: 'border-slate-200 bg-white hover:border-indigo-400 hover:bg-indigo-50 text-slate-800 active:scale-95',
                  right: 'border-emerald-400 bg-emerald-50 text-emerald-800',
                  wrong: 'border-rose-400 bg-rose-50 text-rose-800 animate-shake',
                  dim: 'border-slate-100 bg-white text-slate-300',
                }[state]
              }`}
              dir={isTF ? 'rtl' : 'ltr'}
            >
              {isTF ? TF_HE[o] : o}
            </button>
          );
        })}
      </div>
      {chosen && (
        <div className="mt-5 animate-pop">
          <div className={`font-black mb-3 ${chosen === question.answer ? 'text-emerald-700' : 'text-rose-700'}`}>
            {chosen === question.answer ? 'נכון! 🎉' : 'לא נורא – אפשר לחזור לסיפור ולבדוק 🙂'}
          </div>
          <button onClick={onNext} className="px-8 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-md cursor-pointer">
            הבא ←
          </button>
        </div>
      )}
    </div>
  );
}
