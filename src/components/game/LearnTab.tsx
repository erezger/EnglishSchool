'use client';

import { useState } from 'react';
import { LETTER_BANK } from '@/content/game';
import { speakLetterName, speakPhonics, speakWord } from '@/lib/game-speech';
import { COINS } from '@/lib/earning';
import { useGame } from './GameContext';

export default function LearnTab() {
  const g = useGame();
  const learned = g.list('learnedLetters');

  function markLearned(key: string) {
    if (learned.includes(key)) {
      g.toast('כבר סימנת שלמדת את האות הזו! 🌟', '✅');
      return;
    }
    g.mutate((d) => {
      const list = Array.isArray(d.learnedLetters) ? (d.learnedLetters as string[]) : [];
      return list.includes(key) ? d : { ...d, learnedLetters: [...list, key] };
    });
    g.award(COINS.learnLetter, `כל הכבוד! למדת את האות ${key.toUpperCase()}`);
  }

  return (
    <div className="p-4 sm:p-7">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-800">כרטיסיות אותיות חכמות (ABC + צליל קריאה)</h3>
          <p className="text-sm text-slate-500">
            למדי גם את <strong>שם האות</strong> וגם את <strong>הצליל שלה</strong>, וסמני &quot;למדתי ✓&quot; כדי להרוויח <strong className="text-amber-600">+2 🪙</strong>!
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
          <button onClick={() => g.setModal('abc')} className="bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 font-extrabold text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl transition flex items-center gap-1.5 cursor-pointer">
            <span>🔤</span>
            <span>לוח ה-ABC המלא</span>
          </button>
          <button onClick={() => g.setTab('blend')} className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs sm:text-sm px-4 py-2.5 rounded-2xl transition flex items-center gap-1.5 cursor-pointer">
            <span>עברי למכונת המילים</span>
            <span>⬅️</span>
          </button>
        </div>
      </div>

      <div className="mb-5 bg-gradient-to-l from-indigo-50 via-white to-emerald-50 border border-indigo-200/80 rounded-2xl px-4 py-3 flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm font-bold text-slate-700">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-indigo-600 inline-block" />
          <strong className="text-indigo-800">השם</strong> = איך קוראים לה ב-ABC (למשל B = בִּי)
        </span>
        <span className="text-slate-300 hidden sm:inline">|</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" />
          <strong className="text-emerald-800">הצליל</strong> = איך היא נשמעת במילה (למשל B = בּ)
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="letters-grid">
        {g.level.letters.map((key) => (
          <LetterCard key={key} letter={key} learned={learned.includes(key)} onLearned={() => markLearned(key)} />
        ))}
      </div>
    </div>
  );
}

function LetterCard({ letter, learned, onLearned }: { letter: string; learned: boolean; onLearned: () => void }) {
  const g = useGame();
  const info = LETTER_BANK[letter];
  const [bonusOpen, setBonusOpen] = useState(false);

  return (
    <div
      className={`rounded-3xl p-5 border-2 transition-all flex flex-col justify-between ${
        learned ? 'bg-emerald-50/40 border-emerald-200 shadow-xs' : 'bg-slate-50/80 hover:bg-white border-indigo-100 hover:border-indigo-300 shadow-xs hover:shadow-md'
      }`}
      data-testid="letter-card"
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <button
            onClick={() => speakLetterName(letter)}
            className="cursor-pointer select-none flex items-baseline gap-2 bg-white border border-indigo-100 px-4 py-2 rounded-2xl shadow-2xs hover:scale-105 transition"
            title="לחצי לשמוע את שם האות ב-ABC"
            aria-label={`שם האות ${info.upper}`}
          >
            <span className="en-text text-4xl font-extrabold text-slate-400">{info.upper}</span>
            <span className="en-text text-5xl font-black text-indigo-600">{info.lower}</span>
          </button>
          <div className="flex flex-col gap-1.5 flex-1">
            <div className="bg-indigo-100/90 border border-indigo-200 text-indigo-950 px-2.5 py-1 rounded-xl text-xs font-bold flex items-center justify-between gap-1">
              <span className="text-indigo-700">שם ב-ABC:</span>
              <span className="font-black text-sm">{info.hebrewName}</span>
            </div>
            <div className="bg-emerald-100/90 border border-emerald-200 text-emerald-950 px-2.5 py-1 rounded-xl text-xs font-bold flex items-center justify-between gap-1">
              <span className="text-emerald-700">צליל קריאה:</span>
              <span className="font-black text-sm">{info.hebrewSound.split(' ')[0]}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <button onClick={() => speakLetterName(letter)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-2.5 px-2 rounded-xl transition active:scale-95 flex items-center justify-center gap-1 shadow-xs cursor-pointer">
            <span>🔊</span>
            <span>שם האות</span>
          </button>
          <button onClick={() => speakPhonics(letter, true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2.5 px-2 rounded-xl transition active:scale-95 flex items-center justify-center gap-1 shadow-xs cursor-pointer">
            <span>🗣️</span>
            <span>צליל האות</span>
          </button>
        </div>

        <div className="bg-white/90 border border-indigo-100/80 rounded-2xl p-3 mb-3 text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
          <div className="text-xs font-extrabold text-emerald-700 mb-1">🗣️ הצליל במילה: {info.hebrewSound}</div>
          <span className="font-extrabold text-indigo-600">💡 טריק: </span>
          {info.trick}
        </div>

        <div className="flex items-center justify-between bg-white border border-slate-200/80 rounded-2xl p-2.5">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{info.exampleEmoji}</span>
            <div>
              <div className="en-text font-black text-lg text-slate-800 leading-none">{info.exampleWord}</div>
              <div className="text-xs text-slate-500 font-medium">{info.exampleHebrew}</div>
            </div>
          </div>
          <button onClick={() => speakWord(info.exampleWord)} className="bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-xs px-3 py-2 rounded-xl transition active:scale-95 cursor-pointer">
            🔊 שמע מילה
          </button>
        </div>

        {info.bonus && (
          <div className="mt-3">
            <button
              onClick={() => {
                if (!bonusOpen) g.sfx('pop');
                setBonusOpen(!bonusOpen);
              }}
              aria-expanded={bonusOpen}
              className="w-full flex items-center justify-between bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-extrabold px-3 py-2 rounded-xl transition cursor-pointer"
            >
              <span>💡 בונוס לגאונים: צליל נוסף</span>
              <span>{bonusOpen ? '▲' : '▼'}</span>
            </button>
            {bonusOpen && (
              <div className="mt-2 bg-amber-50/80 border border-amber-200 rounded-xl p-3 text-xs text-amber-950 space-y-2 animate-pop">
                <div className="font-extrabold text-amber-800">{info.bonus.title}</div>
                <p className="leading-relaxed">{info.bonus.desc}</p>
                <button onClick={() => speakWord(info.bonus!.word)} className="inline-flex items-center gap-1.5 bg-white border border-amber-300 hover:bg-amber-100 px-3 py-1.5 rounded-lg font-bold text-amber-900 cursor-pointer">
                  <span>{info.bonus.emoji}</span>
                  <span className="en-text font-black text-sm">{info.bonus.word}</span>
                  <span>({info.bonus.hebrew}) 🔊</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-200/70">
        <button
          onClick={onLearned}
          className={`w-full py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
            learned ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-white hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200'
          }`}
          data-testid={`learn-${letter}`}
        >
          {learned ? '✓ למדתי את האות הזו!' : 'סמני "למדתי ✓" (+2 🪙)'}
        </button>
      </div>
    </div>
  );
}
