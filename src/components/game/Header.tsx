'use client';

import { ALL_WORDS, SHOP_AVATARS, SHOP_PETS } from '@/content/game';
import { moduleEnabled } from '@/lib/modules';
import { useGame } from './GameContext';

const TOTAL_WORDS = Object.keys(ALL_WORDS).length;

export default function Header() {
  const g = useGame();
  const { data } = g;
  const avatar = SHOP_AVATARS.find((a) => a.id === data.equippedAvatar) ?? SHOP_AVATARS[0];
  const pet = SHOP_PETS.find((p) => p.id === data.equippedPet) ?? SHOP_PETS[0];
  const letters = g.list('learnedLetters').filter((l) => l.length === 1).length;
  const words = g.list('readWords').length;
  const levels = g.list('completedLevels').length;
  const slow = !!data.slowSpeech;
  const muted = !!data.sfxMuted;

  async function switchUser() {
    await g.flush();
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    window.location.assign('/login');
  }

  return (
    <header className="bg-white/95 backdrop-blur-md rounded-3xl shadow-md border border-indigo-100/80 p-4 sm:p-5 mb-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => g.setModal('shop')}
            className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-3xl shadow-md hover:scale-105 transition cursor-pointer shrink-0"
            title="החליפי דמות בחנות"
          >
            <span data-testid="header-avatar">{avatar.emoji}</span>
            <span className="absolute -bottom-1.5 -left-1.5 bg-white rounded-full w-7 h-7 flex items-center justify-center text-base shadow border border-slate-200 animate-bounce-soft" title="חיית המחמד שלך">
              {pet.emoji}
            </span>
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black bg-gradient-to-l from-indigo-700 to-purple-600 bg-clip-text text-transparent">
                שלום, <span data-testid="header-name">{g.user.displayName}</span>!
              </h1>
              <button onClick={() => void switchUser()} className="text-xs font-extrabold px-2.5 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition cursor-pointer">
                🔄 החלפת משתמש
              </button>
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                  g.status === 'error' ? 'bg-rose-50 text-rose-700 border-rose-200' : g.status === 'saving' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
                data-testid="save-badge"
              >
                {g.status === 'error' ? 'שגיאת שמירה ⚠️' : g.status === 'saving' ? 'שומר לשרת...' : 'נשמר בענן ☁️✓'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">לומדים שמות אותיות, צלילים, קוראים מהר וצוברים כסף לפרסים! 🚀</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <button
            id="wallet-pill"
            onClick={() => g.setModal('shop')}
            className="flex items-center gap-2 bg-gradient-to-l from-amber-100 to-yellow-50 hover:from-amber-200 hover:to-yellow-100 border-2 border-amber-300 text-amber-950 px-3.5 py-2 rounded-2xl font-black text-base shadow-sm transition active:scale-95 cursor-pointer"
            title="בנק האנגלית שלך - לחצי לפתיחת הפרסים"
          >
            <span className="text-xl">🪙</span>
            <span data-testid="coins">{g.coins}</span>
            <span className="text-xs font-bold text-amber-700">מטבעות</span>
          </button>
          <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 text-orange-700 px-3 py-2 rounded-2xl font-extrabold text-sm" title="רצף ימי למידה">
            <span>🔥</span>
            <span data-testid="streak">{Number(data.dailyStreak) || 1}</span>
            <span className="text-xs font-semibold hidden sm:inline">ימים</span>
          </div>
          {moduleEnabled(g.settings, 'daily') && (
            <button onClick={() => void g.leave('/practice/daily')} className="flex items-center gap-1.5 bg-sky-50 hover:bg-sky-100 border border-sky-300 text-sky-800 px-3.5 py-2 rounded-2xl font-extrabold text-xs sm:text-sm transition active:scale-95 cursor-pointer" title="חזרה יומית">
              <span>⏰</span>
              <span>5 דקות ביום</span>
            </button>
          )}
          <button onClick={() => void g.leave('/practice')} className="flex items-center gap-1.5 bg-gradient-to-l from-amber-400 to-yellow-300 hover:from-amber-500 hover:to-yellow-400 text-amber-950 px-3.5 py-2 rounded-2xl font-extrabold text-xs sm:text-sm shadow-sm transition active:scale-95 cursor-pointer" title="איות, הכתבה ועוד">
            <span>🎯</span>
            <span>תרגולים</span>
          </button>
          <button onClick={() => g.setModal('abc')} className="flex items-center gap-1.5 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 px-3.5 py-2 rounded-2xl font-extrabold text-xs sm:text-sm transition active:scale-95 cursor-pointer" title="לוח כל 26 האותיות A-Z">
            <span>🔤</span>
            <span>לוח ABC</span>
          </button>
          <button onClick={() => g.setModal('shop')} className="flex items-center gap-1.5 bg-gradient-to-l from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-3.5 py-2 rounded-2xl font-extrabold text-xs sm:text-sm shadow-sm transition active:scale-95 cursor-pointer">
            <span>🛍️</span>
            <span>חנות פרסים</span>
          </button>
          <button
            onClick={() => {
              g.mutate((d) => ({ ...d, slowSpeech: !d.slowSpeech }));
              g.toast(!slow ? 'מצב הקראה איטית וברורה 🐢' : 'מצב הקראה בקצב רגיל 🐇', !slow ? '🐢' : '🐇');
            }}
            className="flex items-center gap-1.5 bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 px-3 py-2 rounded-2xl font-bold text-xs sm:text-sm transition active:scale-95 cursor-pointer"
            title="מהירות הקראה"
          >
            <span>{slow ? '🐢' : '🐇'}</span>
            <span className="hidden sm:inline">{slow ? 'קצב איטי' : 'קצב רגיל'}</span>
          </button>
          <button onClick={() => g.setModal('voice')} className="flex items-center justify-center w-10 h-10 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-2xl transition active:scale-95 cursor-pointer" title="בחירת קול הקראה באנגלית" aria-label="בחירת קול">
            <span className="text-lg">🎙️</span>
          </button>
          <button
            onClick={() => {
              g.mutate((d) => ({ ...d, sfxMuted: !d.sfxMuted }));
              if (muted) setTimeout(() => g.sfx('pop'), 0);
            }}
            className="flex items-center justify-center w-10 h-10 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-2xl transition active:scale-95 cursor-pointer"
            title="השתק/הפעל צלילי משחק"
            aria-label="צלילי משחק"
          >
            <span className="text-lg">{muted ? '🔇' : '🔊'}</span>
          </button>
          <button onClick={() => void g.leave('/login?next=/parent&mode=parent')} className="flex items-center gap-1 bg-slate-800 hover:bg-slate-900 text-white px-3 py-2 rounded-2xl font-bold text-xs transition active:scale-95 cursor-pointer" title="אזור הורים (דורש התחברות הורה)">
            <span>🔒</span>
            <span className="hidden sm:inline">אזור הורים</span>
          </button>
        </div>
      </div>

      <div className="mt-4 pt-3.5 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
        <Stat icon="Aa" iconCls="bg-indigo-50 text-indigo-600 text-sm" label="אותיות בשליטה" value={`${letters}/26`} pct={(letters / 26) * 100} bar="bg-indigo-500" text="text-indigo-600" />
        <Stat icon="📖" iconCls="bg-teal-50 text-teal-600 text-base" label="מילים שקראתי" value={`${words}/${TOTAL_WORDS}`} pct={(words / TOTAL_WORDS) * 100} bar="bg-teal-500" text="text-teal-600" />
        <Stat icon="🏆" iconCls="bg-amber-50 text-amber-600 text-base" label="שלבים שהושלמו" value={`${levels}/7`} pct={(levels / 7) * 100} bar="bg-amber-500" text="text-amber-600" />
      </div>
    </header>
  );
}

function Stat({ icon, iconCls, label, value, pct, bar, text }: { icon: string; iconCls: string; label: string; value: string; pct: number; bar: string; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black shrink-0 ${iconCls}`}>{icon}</div>
      <div className="flex-1">
        <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
          <span>{label}</span>
          <span className={text} dir="ltr">
            {value}
          </span>
        </div>
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${bar}`} style={{ width: `${Math.min(100, Math.round(pct))}%` }} />
        </div>
      </div>
    </div>
  );
}
