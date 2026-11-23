'use client';

import { KidShell } from './KidShell';

export type HubItem = {
  href: string;
  icon: string;
  title: string;
  desc: string;
  badge?: string;
  tone: 'amber' | 'sky' | 'yellow' | 'indigo' | 'violet' | 'emerald' | 'pink';
};

const TONES: Record<HubItem['tone'], string> = {
  amber: 'from-amber-100 to-yellow-50 border-amber-300',
  sky: 'from-sky-100 to-indigo-50 border-sky-300',
  yellow: 'from-yellow-100 to-amber-50 border-yellow-300',
  indigo: 'from-indigo-100 to-purple-50 border-indigo-300',
  violet: 'from-violet-100 to-fuchsia-50 border-violet-300',
  emerald: 'from-emerald-100 to-teal-50 border-emerald-300',
  pink: 'from-pink-100 to-rose-50 border-pink-300',
};

export default function PracticeHub({
  displayName,
  coins,
  items,
  notice,
  goal,
}: {
  displayName: string;
  coins: number;
  items: HubItem[];
  notice?: string;
  goal?: { minutes: number; target: number };
}) {
  return (
    <KidShell title="🎯 תרגולים" displayName={displayName} coins={coins} onHome={() => window.location.assign('/')} wide>
      {notice && <div className="mb-4 text-sm font-bold text-amber-900 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-2">{notice}</div>}
      {goal && (
        <div className="mb-4 bg-white/95 border-2 border-indigo-100 rounded-3xl p-4" data-testid="daily-goal">
          <div className="flex items-center justify-between mb-2 text-sm font-black text-slate-700">
            <span>🎯 המטרה של היום</span>
            <span>
              {Math.min(goal.minutes, goal.target)} מתוך {goal.target} דקות {goal.minutes >= goal.target ? '✅' : ''}
            </span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={goal.target} aria-valuenow={Math.min(goal.minutes, goal.target)}>
            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, Math.round((goal.minutes / goal.target) * 100))}%` }} />
          </div>
          {goal.minutes >= goal.target && <div className="text-xs font-bold text-emerald-700 mt-2">כל הכבוד! עמדת במטרה היומית 🎉</div>}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((it) => (
          <a
            key={it.href}
            href={it.href}
            className={`relative block bg-gradient-to-l ${TONES[it.tone]} border-2 rounded-3xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition`}
          >
            {it.badge && (
              <span className="absolute top-3 left-3 text-xs font-black bg-white/90 border border-slate-200 rounded-full px-2.5 py-0.5">{it.badge}</span>
            )}
            <div className="text-4xl mb-2">{it.icon}</div>
            <div className="text-xl font-black text-slate-800">{it.title}</div>
            <div className="text-sm text-slate-600 mt-0.5">{it.desc}</div>
          </a>
        ))}
      </div>
    </KidShell>
  );
}
