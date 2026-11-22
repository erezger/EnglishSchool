'use client';

import type { ReactNode } from 'react';
import type { SaveStatus } from '@/lib/use-progress';

/** Common frame for kid practice pages: title, name, coins, save status, back to the game. */
export function KidShell({
  title,
  displayName,
  coins,
  status,
  onHome,
  extra,
  children,
  wide,
}: {
  title: string;
  displayName: string;
  coins?: number;
  status?: SaveStatus;
  onHome: () => void;
  extra?: ReactNode;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={`${wide ? 'max-w-3xl' : 'max-w-2xl'} mx-auto px-3 sm:px-5 py-4 sm:py-6 pb-16`}>
      <header className="bg-white/95 rounded-3xl shadow-md border border-indigo-100/80 p-4 mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-extrabold text-indigo-600">✨ אנגלית בקליק PRO</div>
          <h1 className="text-2xl font-black text-slate-800">{title}</h1>
          <div className="text-sm text-slate-500">שלום {displayName}!</div>
        </div>
        <div className="flex items-center gap-2">
          {extra}
          {coins !== undefined && (
            <span className="bg-gradient-to-l from-amber-100 to-yellow-50 border-2 border-amber-300 text-amber-950 px-3.5 py-2 rounded-2xl font-black">
              🪙 <span data-testid="coins">{coins}</span>
            </span>
          )}
          {status && (
            <span className="text-[11px] font-bold text-slate-400" aria-live="polite">
              {status === 'saving' ? 'שומר...' : status === 'error' ? 'שגיאת שמירה ⚠️' : 'נשמר ✓'}
            </span>
          )}
          <button onClick={onHome} className="px-3.5 py-2 rounded-2xl text-sm font-extrabold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer">
            🏠 למשחק
          </button>
        </div>
      </header>
      {children}
    </div>
  );
}

export function KidPanel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`bg-white/95 rounded-3xl shadow-md border border-indigo-100/80 p-6 sm:p-8 text-center animate-pop ${className}`}>{children}</div>;
}

export function ProgressDots({ index, total }: { index: number; total: number }) {
  return (
    <div className="flex justify-center gap-1 mb-5" aria-label={`${index + 1} מתוך ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`w-2.5 h-2.5 rounded-full ${i < index ? 'bg-indigo-400' : i === index ? 'bg-indigo-600 scale-125' : 'bg-slate-200'}`} />
      ))}
    </div>
  );
}
