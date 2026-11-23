'use client';

import { LEVELS } from '@/content/game';
import { useGame, type Tab } from './GameContext';

export function LevelSelector() {
  const g = useGame();
  const done = g.list('completedLevels').map(Number);
  const mistakes = g.list('mistakes').length;
  return (
    <section className="mb-5">
      <div className="flex items-center justify-between mb-2 px-1">
        <h2 className="text-xs sm:text-sm font-extrabold text-slate-600 bg-white/80 backdrop-blur-xs px-3 py-1 rounded-full shadow-2xs">🗺️ מסלול הקריאה המהיר (7 שלבים):</h2>
        {mistakes > 0 && (
          <button onClick={() => g.setTab('challenges')} className="cursor-pointer text-xs font-extrabold bg-rose-100 hover:bg-rose-200 text-rose-700 px-3 py-1 rounded-full transition">
            🎯 יש לך {mistakes} מילים בבנק החיזוק (2x מטבעות!)
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5" data-testid="level-selector">
        {LEVELS.map((lvl) => {
          const selected = g.level.id === lvl.id;
          const isDone = done.includes(lvl.id);
          return (
            <button
              key={lvl.id}
              onClick={() => g.selectLevel(lvl.id)}
              aria-pressed={selected}
              className={`relative text-right p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between min-h-[76px] ${
                selected
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md -translate-y-0.5'
                  : isDone
                    ? 'bg-emerald-50/90 hover:bg-emerald-100 text-slate-800 border-emerald-300'
                    : 'bg-white/95 hover:bg-indigo-50 text-slate-800 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className={`text-xs font-extrabold ${selected ? 'text-indigo-100' : 'text-indigo-600'}`}>{lvl.shortName}</span>
                {isDone && <span className={`text-[11px] font-black px-1.5 py-0.5 rounded-full ${selected ? 'bg-white/25 text-white' : 'bg-emerald-500 text-white'}`}>✓</span>}
              </div>
              <div className={`${lvl.isSentenceLevel ? '' : 'en-text'} text-xs font-extrabold mt-1 truncate w-full ${selected ? 'text-white' : 'text-slate-700'}`}>
                {lvl.isSentenceLevel ? '📖 12 משפטים' : lvl.letters.map((l) => l.toUpperCase()).join(' ')}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'learn', icon: '🔤', label: 'אותיות' },
  { id: 'blend', icon: '🧩', label: 'מכונת מילים' },
  { id: 'spell', icon: '✍️', label: 'בנה מילה' },
  { id: 'quiz', icon: '🎯', label: 'חידון' },
  { id: 'challenges', icon: '⚡', label: 'אתגרים' },
];

export function LevelBanner() {
  const g = useGame();
  const lvl = g.level;
  const done = g.list('completedLevels').map(Number).includes(lvl.id);
  const showTabs = !lvl.isSentenceLevel || g.tab === 'challenges';
  return (
    <div className="theme-banner text-white p-4 sm:p-6 transition-all duration-500">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-white/20 backdrop-blur-xs text-xs font-extrabold px-3 py-1 rounded-full" data-testid="level-badge">
              {lvl.shortName}
            </span>
            {done && <span className="bg-emerald-400 text-emerald-950 text-xs font-black px-2.5 py-1 rounded-full">✓ הושלם!</span>}
          </div>
          <h2 className="text-2xl sm:text-3xl font-black">{lvl.title}</h2>
          <p className="text-white/85 text-sm sm:text-base mt-0.5 font-medium en-text tracking-wider">
            {lvl.isSentenceLevel ? 'לחצי על כל מילה לשמוע אותה, או קראי את כל המשפט!' : lvl.letters.map((l) => l.toUpperCase()).join(' • ')}
          </p>
        </div>
        {showTabs && (
          <div className="flex flex-wrap sm:flex-nowrap bg-black/20 p-1.5 rounded-2xl gap-1" role="tablist">
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={g.tab === t.id}
                onClick={() => g.setTab(t.id)}
                className={
                  g.tab === t.id
                    ? 'flex-1 sm:flex-none px-3 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-white text-indigo-700 shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap'
                    : 'flex-1 sm:flex-none px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white/90 hover:bg-white/15 transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap'
                }
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
