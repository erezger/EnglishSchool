'use client';

import { useEffect, useState } from 'react';
import { GRAMMAR, GRAMMAR_ROUND, type GrammarQuestion, type GrammarTopic } from '@/content/grammar';
import { speak, stopSpeaking, warmUpVoices } from '@/lib/speech';
import { useRoundActivity } from '@/lib/use-activity';
import { useProgress, type ProgressData } from '@/lib/use-progress';
import { KidPanel, KidShell, ProgressDots } from '../kid/KidShell';

type Stat = { c: number; w: number; best: number; t: number };
const statsOf = (d: ProgressData) => (d.grammarStats && typeof d.grammarStats === 'object' ? (d.grammarStats as Record<string, Stat>) : {});
const ROUND_BONUS = 3;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function GrammarGame({ displayName, progress }: { displayName: string; progress: { data: ProgressData; version: number } }) {
  const { data, mutate, flush, status } = useProgress(progress);
  const [topic, setTopic] = useState<GrammarTopic | null>(null);
  const [phase, setPhase] = useState<'pick' | 'rule' | 'run' | 'done'>('pick');
  const [round, setRound] = useState<GrammarQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [right, setRight] = useState(0);
  const [bonus, setBonus] = useState(0);
  const stats = statsOf(data);

  useEffect(() => warmUpVoices(), []);

  function open(t: GrammarTopic) {
    setTopic(t);
    setPhase('rule');
  }

  function start() {
    if (!topic) return;
    setRound(shuffle(topic.questions).slice(0, GRAMMAR_ROUND).map((qq) => ({ ...qq, options: shuffle(qq.options) })));
    setIndex(0);
    setRight(0);
    setBonus(0);
    setPhase('run');
  }

  function answered(correct: boolean) {
    if (correct) setRight((r) => r + 1);
    mutate((d) => ({ ...d, coins: (Number(d.coins) || 0) + (correct ? 1 : 0) }));
  }

  function next() {
    stopSpeaking();
    if (index + 1 < round.length) {
      setIndex(index + 1);
      return;
    }
    if (!topic) return;
    const score = right;
    const earned = score / round.length >= 0.8 ? ROUND_BONUS : 0;
    setBonus(earned);
    mutate((d) => {
      const all = { ...statsOf(d) };
      const prev = all[topic.id] ?? { c: 0, w: 0, best: 0, t: 0 };
      const pct = Math.round((score / round.length) * 100);
      all[topic.id] = { c: prev.c + score, w: prev.w + (round.length - score), best: Math.max(prev.best, pct), t: Date.now() };
      return { ...d, coins: (Number(d.coins) || 0) + earned, grammarStats: all };
    });
    setPhase('done');
  }

  useRoundActivity('grammar', round, phase === 'done', round.length, right);

  async function goHome() {
    stopSpeaking();
    await flush();
    window.location.assign('/');
  }

  return (
    <KidShell title="📘 דקדוק" displayName={displayName} coins={Number(data.coins) || 0} status={status} onHome={goHome}>
      {phase === 'pick' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {GRAMMAR.map((t) => {
            const st = stats[t.id];
            return (
              <button
                key={t.id}
                onClick={() => open(t)}
                className="text-right bg-white/95 hover:bg-indigo-50 border-2 border-slate-200 hover:border-indigo-300 rounded-3xl p-5 shadow-sm transition cursor-pointer"
              >
                <div className="text-3xl mb-1">{t.icon}</div>
                <div className="text-lg font-black text-slate-800 font-english" dir="auto">
                  {t.title}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {st ? `שיא: ${st.best}% ${st.best >= 80 ? '⭐' : ''}` : 'עוד לא תרגלת'}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {phase === 'rule' && topic && (
        <KidPanel>
          <div className="text-4xl mb-2">📘</div>
          <h2 className="text-2xl font-black text-slate-800 mb-4 font-english" dir="auto">
            {topic.title}
          </h2>
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 text-right space-y-1.5 mb-4">
            <div className="font-black text-indigo-900 mb-1">הכלל:</div>
            {topic.rule.map((line) => (
              <div key={line} className="text-slate-800 font-bold">
                • {line}
              </div>
            ))}
          </div>
          <div className="space-y-1 mb-6" dir="ltr">
            {topic.examples.map((ex) => (
              <button key={ex} onClick={() => void speak(ex)} className="block mx-auto font-english text-lg text-slate-700 hover:text-indigo-700 cursor-pointer">
                🔊 {ex}
              </button>
            ))}
          </div>
          <div className="flex justify-center gap-2">
            <button onClick={start} className="px-8 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg shadow-md cursor-pointer">
              מתרגלים! 🚀
            </button>
            <button onClick={() => setPhase('pick')} className="px-5 py-3 rounded-2xl bg-white border border-slate-300 text-slate-700 font-bold cursor-pointer">
              חזרה
            </button>
          </div>
        </KidPanel>
      )}

      {phase === 'run' && round[index] && (
        <KidPanel key={index}>
          <ProgressDots index={index} total={round.length} />
          <QuestionCard question={round[index]} onAnswered={answered} onNext={next} />
        </KidPanel>
      )}

      {phase === 'done' && topic && (
        <KidPanel>
          <div className="text-6xl mb-2">{right === round.length ? '🏆' : right / round.length >= 0.8 ? '🌟' : '💪'}</div>
          <h2 className="text-2xl font-black text-slate-800">
            {right} מתוך {round.length} נכונות
          </h2>
          <div className="text-amber-700 font-black mb-5">
            +{right + bonus} 🪙{bonus > 0 && ' (כולל בונוס 80%!)'}
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <button onClick={start} className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black cursor-pointer">
              🔄 עוד סבב
            </button>
            <button onClick={() => setPhase('pick')} className="px-5 py-3 rounded-2xl bg-white border border-slate-300 text-slate-700 font-bold cursor-pointer">
              📘 נושא אחר
            </button>
          </div>
        </KidPanel>
      )}
    </KidShell>
  );
}

function QuestionCard({ question, onAnswered, onNext }: { question: GrammarQuestion; onAnswered: (c: boolean) => void; onNext: () => void }) {
  const [chosen, setChosen] = useState<string | null>(null);
  const [before, after] = question.sentence.split('___');
  const full = `${before}${question.answer}${after ?? ''}`;

  function choose(o: string) {
    if (chosen) return;
    setChosen(o);
    onAnswered(o === question.answer);
    void speak(full, { rate: 0.85 });
  }

  return (
    <div>
      <div className="text-sm font-bold text-slate-500 mb-3">מה חסר?</div>
      <div className="text-2xl sm:text-3xl font-black font-english text-slate-800 mb-6 leading-relaxed" dir="ltr">
        {before}
        <span className={`inline-block min-w-[3.5rem] px-2 mx-1 rounded-lg border-b-4 ${chosen ? (chosen === question.answer ? 'border-emerald-500 text-emerald-700' : 'border-rose-500 text-rose-700') : 'border-indigo-400 text-indigo-400'}`}>
          {chosen ?? '?'}
        </span>
        {after}
      </div>
      <div className="flex flex-wrap justify-center gap-3 mb-4" dir="ltr">
        {question.options.map((o) => {
          const state = !chosen ? 'idle' : o === question.answer ? 'right' : o === chosen ? 'wrong' : 'dim';
          return (
            <button
              key={o}
              onClick={() => choose(o)}
              disabled={!!chosen}
              className={`min-w-[6rem] px-5 py-3 rounded-2xl border-2 text-xl font-black font-english transition cursor-pointer ${
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
      {chosen && (
        <div className="animate-pop">
          <div className={`font-black mb-1 ${chosen === question.answer ? 'text-emerald-700' : 'text-rose-700'}`}>
            {chosen === question.answer ? 'נכון! 🎉' : `התשובה: ${question.answer}`}
          </div>
          <div className="text-sm text-slate-600 mb-4" dir="auto">
            💡 {question.why}
          </div>
          <button onClick={onNext} className="px-8 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-md cursor-pointer">
            הבא ←
          </button>
        </div>
      )}
    </div>
  );
}
