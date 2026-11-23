'use client';

import { useCallback, useEffect, useState } from 'react';
import { LEVELS } from '@/content/game';
import { moduleEnabled } from '@/lib/modules';
import { useGame } from './GameContext';

type Adjustment = { id: string; amount: number; reason: string };
type NoticesData = {
  adjustments: Adjustment[];
  openCheck: { id: string; total: number } | null;
  review: { count: number; doneToday: boolean; streak: number };
};

/** Parent test waiting, today's review, placement test offer, and parent coin changes. */
export default function Notices() {
  const g = useGame();
  const [notices, setNotices] = useState<NoticesData | null>(null);
  const [coinNotice, setCoinNotice] = useState<Adjustment[] | null>(null);
  const [placementDismissed, setPlacementDismissed] = useState(true); // set from sessionStorage after mount

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/me/notices', { cache: 'no-store' });
      if (res.status === 401) {
        window.location.href = '/login?expired=1';
        return;
      }
      if (!res.ok) return;
      const json = (await res.json()) as NoticesData;
      setNotices(json);
      if (Array.isArray(json.adjustments) && json.adjustments.length) setCoinNotice((cur) => cur ?? json.adjustments);
    } catch {
      /* not critical */
    }
  }, []);

  useEffect(() => {
    try {
      setPlacementDismissed(sessionStorage.getItem('placement_dismissed') === '1');
    } catch {
      setPlacementDismissed(false);
    }
    void load();
    const t = setInterval(() => document.visibilityState === 'visible' && void load(), 60_000);
    return () => clearInterval(t);
  }, [load]);

  function ackCoins() {
    const ids = (coinNotice ?? []).map((a) => a.id);
    setCoinNotice(null);
    fetch('/api/me/notices/seen', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) }).catch(() => {});
    void g.refresh(); // pick up the new coin balance right away
  }

  const showPlacement =
    moduleEnabled(g.settings, 'placement') && !g.data.placement && g.list('completedLevels').length < LEVELS.length && !placementDismissed;
  const review = notices?.review;
  const showReview = review && review.count > 0 && !review.doneToday;

  return (
    <>
      {notices?.openCheck && (
        <div className="mb-5 bg-gradient-to-l from-amber-100 to-yellow-50 border-2 border-amber-300 rounded-3xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 animate-pop" data-testid="check-banner">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📝</span>
            <div>
              <div className="font-black text-amber-950">יש לך מבחן מההורים!</div>
              <div className="text-xs text-amber-900">
                {Number(notices.openCheck.total) === 1 ? 'שאלה אחת' : `${Number(notices.openCheck.total)} שאלות`} על מה שכבר למדת – בלי רמזים
              </div>
            </div>
          </div>
          <button onClick={() => void g.leave('/practice/check')} className="bg-amber-500 hover:bg-amber-600 text-white font-black px-5 py-2.5 rounded-2xl shadow-sm cursor-pointer">
            מתחילים 🚀
          </button>
        </div>
      )}

      {showReview && (
        <div className="mb-5 bg-gradient-to-l from-sky-100 to-indigo-50 border-2 border-sky-300 rounded-3xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3" data-testid="review-banner">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⏰</span>
            <div>
              <div className="font-black text-sky-950">{Number(review.count)} דברים לחזרה היום – 5 דקות!</div>
              <div className="text-xs text-sky-900">{review.streak > 0 ? `🔥 רצף של ${Number(review.streak)} ימים – לא לשבור אותו!` : 'סיום החזרה = בונוס מטבעות 🪙'}</div>
            </div>
          </div>
          <button onClick={() => void g.leave('/practice/daily')} className="bg-sky-500 hover:bg-sky-600 text-white font-black px-5 py-2.5 rounded-2xl shadow-sm cursor-pointer">
            לחזרה היומית ⏰
          </button>
        </div>
      )}

      {showPlacement && (
        <div className="mb-5 bg-gradient-to-l from-violet-100 to-fuchsia-50 border-2 border-violet-300 rounded-3xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3" data-testid="placement-banner">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🧭</span>
            <div>
              <div className="font-black text-violet-950">כבר יודעים חלק? מבחן מיקום קצר!</div>
              <div className="text-xs text-violet-900">כמה שאלות – ומדלגים ישר לשלב שמתאים לך</div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => void g.leave('/practice/placement')} className="bg-violet-600 hover:bg-violet-700 text-white font-black px-5 py-2.5 rounded-2xl shadow-sm cursor-pointer">
              למבחן מיקום 🧭
            </button>
            <button
              onClick={() => {
                try {
                  sessionStorage.setItem('placement_dismissed', '1');
                } catch {
                  /* private mode */
                }
                setPlacementDismissed(true);
              }}
              className="bg-white border border-violet-200 text-violet-800 font-bold px-3 py-2.5 rounded-2xl cursor-pointer"
            >
              לא עכשיו
            </button>
          </div>
        </div>
      )}

      {coinNotice && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 text-center animate-pop" role="dialog" aria-modal="true" data-testid="coin-notice">
            <div className="text-5xl mb-2">🪙</div>
            <h3 className="text-xl font-black text-slate-800 mb-3">הודעה מההורים</h3>
            <div className="space-y-2 mb-5">
              {coinNotice.map((a) => (
                <div key={a.id} className={`rounded-2xl border px-3 py-2 ${a.amount >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                  <div className={`font-black ${a.amount >= 0 ? 'text-emerald-700' : 'text-rose-700'}`} dir="ltr">
                    {a.amount >= 0 ? '+' : ''}
                    {Number(a.amount)} מטבעות
                  </div>
                  <div className="text-sm text-slate-700">{a.reason}</div>
                </div>
              ))}
            </div>
            <button onClick={ackCoins} className="px-8 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black cursor-pointer">
              הבנתי 👍
            </button>
          </div>
        </div>
      )}
    </>
  );
}
