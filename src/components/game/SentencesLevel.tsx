'use client';

import { useState } from 'react';
import { LEVELS } from '@/content/game';
import { COINS } from '@/lib/earning';
import { speakWord } from '@/lib/game-speech';
import { useGame } from './GameContext';

/** Level 7: read real sentences, tap a word to hear it (+5 per sentence read, level done after 6). */
export default function SentencesLevel() {
  const g = useGame();
  const lvl = LEVELS.find((l) => l.id === 7)!;
  const sentences = lvl.sentences ?? [];
  const read = g.list('readSentences');
  const [shown, setShown] = useState<string[]>([]);

  function markRead(id: string) {
    if (read.includes(id)) {
      g.toast('כבר קראת את המשפט הזה! 🌟', '✅');
      return;
    }
    const total = read.length + 1;
    g.mutate((d) => {
      const list = Array.isArray(d.readSentences) ? (d.readSentences as string[]) : [];
      return list.includes(id) ? d : { ...d, readSentences: [...list, id] };
    });
    g.award(COINS.sentence, 'כל הכבוד על קריאת המשפט!');
    if (total >= 6 && !g.list('completedLevels').map(Number).includes(7)) {
      g.mutate((d) => {
        const done = (Array.isArray(d.completedLevels) ? (d.completedLevels as number[]) : []).map(Number);
        return done.includes(7) ? d : { ...d, completedLevels: [...done, 7] };
      });
      setTimeout(() => g.award(COINS.sentencesLevel, 'סיימת את שלב המשפטים!', { once: 'level:7' }), 50);
      g.confetti();
      g.sfx('fanfare');
    }
  }

  return (
    <div className="p-4 sm:p-7">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-black text-slate-800">📖 קוראים משפטים אמיתיים באנגלית!</h3>
          <p className="text-sm text-slate-500">
            לחצי על כל מילה בנפרד אם את צריכה עזרה, או קראי בקול וסמני &quot;קראתי לבד!&quot; כדי להרוויח <strong className="text-amber-600">+{COINS.sentence} 🪙</strong> למשפט.
          </p>
        </div>
        <div className="bg-indigo-50 text-indigo-800 font-extrabold text-sm px-4 py-2 rounded-2xl shrink-0" data-testid="sentences-count">
          הושלמו: {read.length} מתוך {sentences.length}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sentences.map((s, idx) => {
          const isRead = read.includes(s.id);
          return (
            <div key={s.id} className={`rounded-3xl p-5 border-2 transition ${isRead ? 'bg-emerald-50/50 border-emerald-200' : 'bg-white border-indigo-100 shadow-xs'}`} data-testid="sentence-card">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-extrabold text-slate-400">משפט #{idx + 1}</span>
                <span className="text-2xl">{s.emoji}</span>
              </div>
              <div className="flex flex-wrap gap-2 justify-center py-3" dir="ltr">
                {s.text.split(' ').map((w, i) => (
                  <button key={i} onClick={() => speakWord(w.replace(/[^a-zA-Z]/g, ''))} className="en-text px-2.5 py-1 rounded-xl bg-indigo-50 hover:bg-amber-100 text-indigo-900 font-black text-xl sm:text-2xl transition active:scale-95 cursor-pointer">
                    {w}
                  </button>
                ))}
              </div>
              {shown.includes(s.id) && <div className="text-center text-sm font-bold text-slate-600 bg-amber-50 border border-amber-200 rounded-xl py-2 px-3 my-2 animate-pop">{s.hebrew}</div>}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-4 pt-3 border-t border-slate-100">
                <button onClick={() => speakWord(s.text)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-xl cursor-pointer transition active:scale-95">
                  🔊 קרא משפט מלא
                </button>
                <button
                  onClick={() => setShown(shown.includes(s.id) ? shown.filter((x) => x !== s.id) : [...shown, s.id])}
                  className="bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs sm:text-sm px-4 py-2 rounded-xl cursor-pointer transition"
                >
                  👀 תרגום לעברית
                </button>
                <button
                  onClick={() => markRead(s.id)}
                  className={`${isRead ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-teal-600 hover:bg-teal-700 text-white'} font-extrabold text-xs sm:text-sm px-4 py-2 rounded-xl cursor-pointer transition active:scale-95`}
                >
                  {isRead ? '✓ קראתי!' : `קראתי לבד! (+${COINS.sentence} 🪙)`}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
