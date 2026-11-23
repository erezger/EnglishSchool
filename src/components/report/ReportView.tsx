'use client';

import { useState } from 'react';
import { MODULES } from '@/lib/modules';
import type { Report } from '@/lib/report';

const MODULE_NAMES: Record<string, string> = {
  ...Object.fromEntries(MODULES.map((m) => [m.id, `${m.icon} ${m.title}`])),
  game: '🎮 המשחק (אותיות ומילים)',
  sight: '⚡ קריאה מהירה',
  check: '📝 מבחנים מההורים',
};
const DAY_NAMES = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
const dayLabel = (iso: string) => {
  const d = new Date(`${iso}T12:00:00Z`);
  return { name: DAY_NAMES[d.getUTCDay()], date: `${d.getUTCDate()}/${d.getUTCMonth() + 1}` };
};

export default function ReportView({ name, report, backHref }: { name: string; report: Report; backHref: string }) {
  const totalMinutes = report.days.reduce((s, d) => s + d.minutes, 0);
  const answers = report.days.reduce((s, d) => s + d.answers, 0);
  const correct = report.days.reduce((s, d) => s + d.correct, 0);
  const activeDays = report.days.filter((d) => d.minutes > 0 || d.answers > 0).length;
  const w = report.weak;
  const nothingWeak = !w.spelling.length && !w.mistakes.length && !w.dictation.length && !w.grammar.length;

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-5 py-4 sm:py-6 pb-16 space-y-5">
      <header className="bg-white/95 rounded-3xl shadow-md border border-indigo-100/80 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-extrabold text-indigo-600">✨ אנגלית בקליק PRO · אזור הורים</div>
          <h1 className="text-2xl font-black text-slate-800">📊 הדוח השבועי של {name}</h1>
          <div className="text-sm text-slate-500">7 הימים האחרונים</div>
        </div>
        <a href={backHref} className="px-3.5 py-2 rounded-xl text-sm font-extrabold bg-white border border-slate-300 text-slate-700">
          ← חזרה
        </a>
      </header>

      {report.suspiciousCoins > 0 && (
        <div role="alert" className="text-sm font-bold text-amber-900 bg-amber-50 border border-amber-300 rounded-2xl px-4 py-3">
          ⚠️ השבוע היו {report.suspiciousCoins} ניסיונות להוסיף מטבעות בקפיצה לא רגילה – השרת הגביל אותם. אולי שווה שיחה קטנה 🙂
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Tile label="דקות תרגול" value={String(totalMinutes)} />
        <Tile label="ימים פעילים" value={`${activeDays} מתוך 7`} />
        <Tile label="תשובות" value={String(answers)} />
        <Tile label="דיוק" value={answers ? `${Math.round((correct / answers) * 100)}%` : '—'} />
      </div>

      <section className="bg-white/95 rounded-3xl shadow-md border border-indigo-100/80 p-4 sm:p-5">
        <MinutesChart days={report.days} goal={report.goal} />
        {report.goal > 0 && (
          <div className="text-sm font-bold text-slate-600 mt-2">
            🎯 עמד/ה במטרה ({report.goal} דקות) ב-{report.goalDaysMet} מתוך 7 ימים
          </div>
        )}
      </section>

      <section className="bg-white/95 rounded-3xl shadow-md border border-indigo-100/80 p-4 sm:p-5">
        <h2 className="text-lg font-black text-slate-800 mb-3">לפי תרגול</h2>
        {report.modules.length === 0 ? (
          <div className="text-sm text-slate-500">עוד אין פעילות מתועדת בשבועיים האחרונים.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-right text-xs text-slate-500">
                <th className="py-1.5 font-bold">תרגול</th>
                <th className="py-1.5 font-bold">דקות</th>
                <th className="py-1.5 font-bold">תשובות</th>
                <th className="py-1.5 font-bold">דיוק</th>
                <th className="py-1.5 font-bold">מול שבוע שעבר</th>
              </tr>
            </thead>
            <tbody>
              {report.modules.map((m) => (
                <tr key={m.module} className="border-t border-slate-100">
                  <td className="py-2 font-bold text-slate-800">{MODULE_NAMES[m.module] ?? m.module}</td>
                  <td className="py-2 tabular-nums">{m.minutes}</td>
                  <td className="py-2 tabular-nums">{m.answers}</td>
                  <td className="py-2 tabular-nums">{m.answers ? `${Math.round((m.correct / m.answers) * 100)}%` : '—'}</td>
                  <td className="py-2 tabular-nums text-slate-600">
                    <Trend now={m.minutes} prev={m.prevMinutes} unit="דק׳" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="bg-white/95 rounded-3xl shadow-md border border-indigo-100/80 p-4 sm:p-5">
        <h2 className="text-lg font-black text-slate-800 mb-3">על מה כדאי לעבוד</h2>
        {nothingWeak ? (
          <div className="text-sm text-slate-500">אין כרגע נקודות חולשה בולטות 🎉</div>
        ) : (
          <div className="space-y-3">
            <Chips title="🐝 מילים שקשה לאיית" items={w.spelling} />
            <Chips title="📖 מילים בבנק הטעויות" items={w.mistakes} />
            <Chips title="✍️ משפטים בהכתבה שעוד לא הצליחו" items={w.dictation} />
            {w.grammar.length > 0 && <Chips title="📘 נושאי דקדוק מתחת ל-80%" items={w.grammar.map((g) => `${g.title} (${g.best}%)`)} />}
          </div>
        )}
      </section>

      {report.checks.length > 0 && (
        <section className="bg-white/95 rounded-3xl shadow-md border border-indigo-100/80 p-4 sm:p-5">
          <h2 className="text-lg font-black text-slate-800 mb-3">📝 מבחנים אחרונים</h2>
          <div className="space-y-1.5 text-sm">
            {report.checks.map((c) => (
              <div key={c.id} className="flex flex-wrap justify-between gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                <span className="font-bold">
                  {c.score}/{c.total} · {new Date(c.createdAt).toLocaleDateString('he-IL')}
                </span>
                {c.failed.length > 0 && (
                  <span className="text-slate-600" dir="ltr">
                    {c.failed.join(', ')}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/95 rounded-2xl border border-indigo-100/80 shadow-sm p-4 text-center">
      <div className="text-2xl font-black text-slate-800 tabular-nums">{value}</div>
      <div className="text-xs font-bold text-slate-500">{label}</div>
    </div>
  );
}

function Trend({ now, prev, unit }: { now: number; prev: number; unit: string }) {
  if (!prev && !now) return <>—</>;
  if (!prev) return <>חדש השבוע</>;
  const diff = now - prev;
  if (diff === 0) return <>ללא שינוי</>;
  return (
    <>
      {diff > 0 ? '▲' : '▼'} {Math.abs(diff)} {unit}
    </>
  );
}

function Chips({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <div className="text-xs font-black text-slate-600 mb-1">{title}</div>
      <div className="flex flex-wrap gap-1.5" dir="ltr">
        {items.map((it) => (
          <span key={it} className="font-english text-sm font-bold bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 text-slate-700">
            {it}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Single-series bar chart: minutes per day, with the daily goal as a labelled dashed line. */
function MinutesChart({ days, goal }: { days: Report['days']; goal: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const [asTable, setAsTable] = useState(false);
  const W = 640;
  const H = 220;
  const pad = { top: 16, right: 12, bottom: 40, left: 36 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;
  const max = Math.max(5, goal, ...days.map((d) => d.minutes));
  const step = max <= 10 ? 2 : max <= 30 ? 5 : max <= 60 ? 10 : 20;
  const top = Math.ceil(max / step) * step;
  const y = (v: number) => pad.top + innerH - (v / top) * innerH;
  const slot = innerW / days.length;
  const barW = Math.min(36, slot - 2); // >= 2px surface gap between bars
  const ticks = Array.from({ length: Math.floor(top / step) + 1 }, (_, i) => i * step);

  // left-to-right in time even though the page is RTL: the chart is an LTR figure
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-black text-slate-800">דקות תרגול ביום</h2>
        <button onClick={() => setAsTable((t) => !t)} className="text-xs font-bold text-indigo-700 underline cursor-pointer">
          {asTable ? '📊 גרף' : '📋 טבלה'}
        </button>
      </div>
      {asTable ? (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-right text-xs text-slate-500">
              <th className="py-1 font-bold">יום</th>
              <th className="py-1 font-bold">דקות</th>
              <th className="py-1 font-bold">תשובות</th>
              <th className="py-1 font-bold">נכונות</th>
            </tr>
          </thead>
          <tbody>
            {days.map((d) => (
              <tr key={d.day} className="border-t border-slate-100 tabular-nums">
                <td className="py-1.5">
                  {dayLabel(d.day).name} {dayLabel(d.day).date}
                </td>
                <td className="py-1.5">{d.minutes}</td>
                <td className="py-1.5">{d.answers}</td>
                <td className="py-1.5">{d.correct}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="relative" dir="ltr">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="דקות תרגול בכל אחד משבעת הימים האחרונים">
            {ticks.map((t) => (
              <g key={t} pointerEvents="none">
                <line x1={pad.left} x2={W - pad.right} y1={y(t)} y2={y(t)} stroke="#e2e8f0" strokeWidth={1} />
                <text x={pad.left - 6} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#64748b">
                  {t}
                </text>
              </g>
            ))}
            {days.map((d, i) => {
              const cx = pad.left + slot * i + slot / 2;
              const x = cx - barW / 2;
              const h = Math.max(0, y(0) - y(d.minutes));
              const r = Math.min(4, h / 2, barW / 2);
              const top0 = y(0) - h;
              return (
                <g key={d.day} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                  {/* hit target larger than the mark */}
                  <rect x={pad.left + slot * i} y={pad.top} width={slot} height={innerH} fill="transparent" />
                  {h > 0 && (
                    <path
                      d={`M${x},${y(0)} V${top0 + r} Q${x},${top0} ${x + r},${top0} H${x + barW - r} Q${x + barW},${top0} ${x + barW},${top0 + r} V${y(0)} Z`}
                      fill="#6366f1"
                      opacity={hover === null || hover === i ? 1 : 0.55}
                    />
                  )}
                  <text x={cx} y={H - 22} textAnchor="middle" fontSize="12" fontWeight="700" fill="#334155">
                    {dayLabel(d.day).name}
                  </text>
                  <text x={cx} y={H - 8} textAnchor="middle" fontSize="10" fill="#64748b">
                    {dayLabel(d.day).date}
                  </text>
                </g>
              );
            })}
            <line x1={pad.left} x2={W - pad.right} y1={y(0)} y2={y(0)} stroke="#94a3b8" strokeWidth={1} pointerEvents="none" />
            {goal > 0 && (
              <g pointerEvents="none">
                <line x1={pad.left} x2={W - pad.right} y1={y(goal)} y2={y(goal)} stroke="#334155" strokeWidth={1.5} strokeDasharray="5 4" />
                <text x={pad.left + 4} y={y(goal) - 5} textAnchor="start" fontSize="11" fontWeight="700" fill="#334155">
                  מטרה: {goal} דק׳
                </text>
              </g>
            )}
          </svg>
          {hover !== null && (
            <div
              className="pointer-events-none absolute bg-slate-900 text-white text-xs rounded-lg px-2.5 py-1.5 shadow-lg whitespace-nowrap"
              style={{
                left: `${((pad.left + slot * hover + slot / 2) / W) * 100}%`,
                top: 0,
                // keep the tooltip inside the card at the edges (no horizontal scroll)
                transform: `translateX(${hover === 0 ? '-15%' : hover === days.length - 1 ? '-85%' : '-50%'})`,
              }}
              dir="rtl"
              role="tooltip"
            >
              <div className="font-bold">
                {dayLabel(days[hover].day).name} {dayLabel(days[hover].day).date}
              </div>
              <div>
                {days[hover].minutes} דקות · {days[hover].answers} תשובות
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
