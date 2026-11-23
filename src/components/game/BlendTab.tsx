'use client';

import { useEffect, useRef, useState } from 'react';
import { LETTER_BANK } from '@/content/game';
import { speakPhonics, speakWord } from '@/lib/game-speech';
import { useGame } from './GameContext';

/** Word blender: tap each sound left-to-right, then "חבר למילה!" blends and reads it (+3 the first time). */
export default function BlendTab() {
  const g = useGame();
  const words = g.level.words;
  const [index, setIndex] = useState(0);
  const [reveal, setReveal] = useState(false);
  const [glow, setGlow] = useState<number[]>([]);
  const running = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const read = g.list('readWords');

  useEffect(() => {
    setIndex(0);
    setReveal(false);
  }, [g.level.id]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  if (!words.length) return null;
  const word = words[Math.min(index, words.length - 1)];
  const later = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));
  const flash = (i: number) => {
    setGlow((gl) => [...gl, i]);
    later(() => setGlow((gl) => gl.filter((x) => x !== i)), 420);
  };

  function blend() {
    if (running.current) return;
    running.current = true;
    const step = g.data.slowSpeech ? 440 : 300;
    word.parts.forEach((_, i) =>
      later(() => {
        flash(i);
        g.sfx('pop');
      }, i * step),
    );
    later(() => {
      setGlow(word.parts.map((_, i) => i));
      speakWord(word.word);
      setReveal(true);
      g.markWordRead(word.word, true);
      later(() => {
        setGlow([]);
        running.current = false;
      }, 650);
    }, word.parts.length * step + 100);
  }

  function go(delta: number) {
    setIndex((index + delta + words.length) % words.length);
    setReveal(false);
  }

  return (
    <div className="p-4 sm:p-7">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-5">
          <h3 className="text-xl font-extrabold text-slate-800">🧩 מכונת חיבור המילים</h3>
          <p className="text-sm text-slate-500 mt-1">
            לחצי על כל אות משמאל לימין לשמוע את הצליל, ואז לחצי על <strong>&quot;חבר למילה!&quot;</strong> (+3 🪙 לכל מילה חדשה)
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-6" dir="ltr" data-testid="blend-pills">
          {words.map((w, i) => {
            const active = i === index;
            const done = read.includes(w.word);
            return (
              <button
                key={w.word}
                onClick={() => {
                  setIndex(i);
                  setReveal(false);
                }}
                className={`en-text px-3 py-1.5 rounded-xl text-sm font-extrabold transition cursor-pointer flex items-center gap-1 ${
                  active ? 'bg-indigo-600 text-white shadow-sm' : done ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' : 'bg-slate-100 hover:bg-indigo-100 text-slate-600'
                }`}
              >
                {w.word}
                {done && !active && <span className="text-[10px]">✓</span>}
              </button>
            );
          })}
        </div>

        <div className="bg-gradient-to-b from-slate-50 to-indigo-50/70 border-2 border-indigo-100 rounded-3xl p-5 sm:p-8 text-center">
          <div className="flex items-center justify-between text-xs font-bold text-indigo-500 mb-4">
            <span className={`bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full ${read.includes(word.word) ? 'opacity-100' : 'opacity-0'}`}>✓ כבר קראת!</span>
            <span className="flex items-center gap-1">קוראים משמאל לימין ➡️</span>
            <span className="text-slate-400" dir="ltr">
              {index + 1}/{words.length}
            </span>
          </div>

          <div className="flex items-center justify-center gap-2.5 sm:gap-4 my-5 flex-wrap" dir="ltr" data-testid="blend-tiles">
            {word.parts.map((part, i) => (
              <span key={`${word.word}-${i}`} className="contents">
                <button
                  onClick={() => {
                    flash(i);
                    speakPhonics(part, false);
                  }}
                  className={`en-text min-w-[70px] sm:min-w-[90px] h-[82px] sm:h-[100px] px-3.5 bg-white hover:bg-indigo-50 border-2 border-indigo-200 rounded-3xl text-4xl sm:text-5xl font-black text-indigo-700 shadow-sm transition-all cursor-pointer flex flex-col items-center justify-center active:scale-95 ${glow.includes(i) ? 'tile-glow' : ''}`}
                >
                  <span className="leading-none">{part}</span>
                  <span className="font-hebrew text-xs font-bold text-slate-400 mt-1" dir="rtl">
                    {LETTER_BANK[part]?.hebrewSound.split(' ')[0] ?? ''}
                  </span>
                </button>
                {i < word.parts.length - 1 && <span className="text-xl font-black text-indigo-300 select-none">+</span>}
              </span>
            ))}
          </div>

          <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button onClick={blend} className="w-full sm:w-auto bg-gradient-to-l from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-lg px-8 py-4 rounded-2xl shadow-lg shadow-indigo-200 transition transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer">
              <span>🔊</span>
              <span>חבר למילה!</span>
            </button>
            <button
              onClick={() => {
                if (!reveal) g.sfx('pop');
                setReveal(!reveal);
              }}
              className="w-full sm:w-auto bg-white hover:bg-amber-50 border-2 border-amber-300 text-amber-800 font-bold text-base px-5 py-3.5 rounded-2xl transition active:scale-95 cursor-pointer"
            >
              {reveal ? '🙈 הסתר פירוש' : '👀 גלה פירוש'}
            </button>
          </div>

          <div className="mt-6 min-h-[76px] flex items-center justify-center" data-testid="blend-meaning">
            {reveal ? (
              <div className="inline-flex items-center gap-3 bg-white border-2 border-emerald-200 px-6 py-3 rounded-2xl shadow-sm animate-pop">
                <span className="text-4xl">{word.emoji}</span>
                <div className="text-right">
                  <div className="en-text text-2xl font-black text-emerald-700 leading-tight">{word.word}</div>
                  <div className="text-base font-bold text-slate-700">{word.hebrew}</div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-400 font-medium">נסי לחבר את הצלילים בקול לפני שתגלי את הפירוש 😉</div>
            )}
          </div>

          <div className="flex items-center justify-between mt-6 pt-5 border-t border-indigo-100">
            <button onClick={() => go(-1)} className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-sm transition active:scale-95 cursor-pointer">
              ➡️ מילה קודמת
            </button>
            <button onClick={() => g.setTab('spell')} className="hidden sm:inline-flex bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer">
              ✍️ מוכנה לבנות מילים משמיעה?
            </button>
            <button onClick={() => go(1)} className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-sm transition active:scale-95 cursor-pointer">
              מילה הבאה ⬅️
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
