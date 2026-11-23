'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { LETTER_BANK } from '@/content/game';
import { gameVoices, initGameVoices, selectVoice, selectedVoiceName, speakLetterName, speakPhonics, speakWord } from '@/lib/game-speech';
import { useGame } from './GameContext';

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');

function Overlay({ onClose, children, label }: { onClose: () => void; children: ReactNode; label: string }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5" onMouseDown={(e) => e.target === e.currentTarget && onClose()} role="dialog" aria-modal="true" aria-label={label}>
      {children}
    </div>
  );
}

export function AbcBoardModal() {
  const g = useGame();
  const [mode, setMode] = useState<'name' | 'sound'>('name');
  const [popped, setPopped] = useState<string | null>(null);
  const learned = g.list('learnedLetters');
  const close = () => g.setModal(null);

  return (
    <Overlay onClose={close} label="לוח ה-ABC המלא">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-pop">
        <div className="bg-gradient-to-l from-sky-600 to-indigo-600 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🔤</span>
            <div>
              <h2 className="text-xl sm:text-2xl font-black">לוח ה-ABC המלא (A–Z)</h2>
              <p className="text-xs text-white/85">לחצי על כל אות לשמוע את השם שלה ב-ABC או את הצליל שלה לקריאה!</p>
            </div>
          </div>
          <button onClick={close} aria-label="סגור" className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center font-black text-lg cursor-pointer">
            ✕
          </button>
        </div>
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex flex-wrap items-center justify-center gap-2">
          {(['name', 'sound'] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                g.sfx('pop');
              }}
              aria-pressed={mode === m}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition cursor-pointer ${
                mode === m
                  ? m === 'name'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-emerald-600 text-white shadow-sm'
                  : `bg-white border border-slate-200 text-slate-600 ${m === 'name' ? 'hover:bg-indigo-50' : 'hover:bg-emerald-50'}`
              }`}
            >
              {m === 'name' ? '🔊 שם האות (ב-ABC)' : '🗣️ צליל האות (לקריאה)'}
            </button>
          ))}
        </div>
        <div className="p-4 sm:p-6 overflow-y-auto grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-2.5" dir="ltr">
          {ALPHABET.map((key) => {
            const info = LETTER_BANK[key];
            const isLearned = learned.includes(key);
            return (
              <button
                key={key}
                onClick={() => {
                  setPopped(key);
                  setTimeout(() => setPopped((p) => (p === key ? null : p)), 350);
                  if (mode === 'name') speakLetterName(key);
                  else speakPhonics(key, true);
                }}
                className={`relative bg-white border-2 ${isLearned ? 'border-emerald-300 bg-emerald-50/30' : 'border-slate-200'} ${
                  mode === 'name' ? 'hover:border-indigo-400 hover:bg-indigo-50 text-indigo-700' : 'hover:border-emerald-400 hover:bg-emerald-50 text-emerald-700'
                } rounded-2xl p-3 flex flex-col items-center justify-center shadow-2xs transition active:scale-95 cursor-pointer ${popped === key ? 'animate-pop' : ''}`}
              >
                {isLearned && <span className="absolute top-1.5 right-1.5 text-[10px] bg-emerald-500 text-white w-4 h-4 rounded-full flex items-center justify-center font-black">✓</span>}
                <div className="en-text text-2xl sm:text-3xl font-black leading-none">
                  <span className="text-slate-400">{info.upper}</span>
                  <span>{info.lower}</span>
                </div>
                <div className={`font-hebrew text-xs font-extrabold mt-1.5 px-2 py-0.5 rounded-lg ${mode === 'name' ? 'bg-indigo-100 text-indigo-900' : 'bg-emerald-100 text-emerald-900'}`} dir="rtl">
                  {mode === 'name' ? info.hebrewName : info.hebrewSound.split(' ')[0]}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </Overlay>
  );
}

export function VoiceModal() {
  const g = useGame();
  const [, refresh] = useState(0);
  const close = () => g.setModal(null);
  useEffect(() => initGameVoices(String(g.data.preferredVoiceName ?? '')), [g.data.preferredVoiceName]);
  const list = gameVoices();
  const current = selectedVoiceName();

  return (
    <Overlay onClose={close} label="בחירת קול הקראה">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 animate-pop">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-slate-800">🎙️ בחירת קול הקראה באנגלית</h3>
          <button onClick={close} aria-label="סגור" className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold cursor-pointer">
            ✕
          </button>
        </div>
        <p className="text-xs text-slate-500 mb-4">האפליקציה בוחרת אוטומטית את הקול האנגלי הברור ביותר במכשיר. אפשר לבדוק ולבחור קול אחר אם רוצים:</p>
        <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
          {list.length === 0 ? (
            <div className="text-sm text-slate-500 text-center py-4">משתמש בקול ברירת המחדל של הדפדפן</div>
          ) : (
            list.map((v) => {
              const sel = v.name === current;
              return (
                <button
                  key={v.name}
                  onClick={() => {
                    selectVoice(v.name);
                    g.mutate((d) => ({ ...d, preferredVoiceName: v.name }));
                    refresh((n) => n + 1);
                    speakWord('Great choice!');
                  }}
                  className={`w-full text-right px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-between cursor-pointer transition ${
                    sel ? 'bg-indigo-50 border-indigo-400 text-indigo-900' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <span className="en-text truncate">{v.name}</span>
                  <span className="text-[11px] text-slate-400 shrink-0 mr-2">
                    {v.lang} {sel ? '✓' : ''}
                  </span>
                </button>
              );
            })
          )}
        </div>
        <button onClick={() => speakWord('Hello! You are doing amazing!')} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl cursor-pointer transition">
          🔊 בדקי את הקול הנבחר
        </button>
      </div>
    </Overlay>
  );
}
