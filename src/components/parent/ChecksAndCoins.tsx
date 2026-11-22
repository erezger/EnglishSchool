'use client';

import { useState } from 'react';
import { api } from '@/lib/api-client';
import type { StudentSummary } from './types';
import { Btn, ErrorNote, Field, formatDate, Modal } from './ui';

const SCOPE_LABELS = {
  letters: { label: 'אותיות שסומנו כנלמדו', icon: '🔤' },
  words: { label: 'מילים שקראה/קרא', icon: '📖' },
  spelling: { label: 'מילים שיודע/ת לאיית', icon: '🐝' },
} as const;
type Scope = keyof typeof SCOPE_LABELS;

const STATUS = { assigned: 'ממתין', in_progress: 'באמצע', done: 'הושלם' } as Record<string, string>;

export default function ChecksAndCoins({
  student,
  qs,
  onChanged,
}: {
  student: StudentSummary;
  qs: string;
  onChanged: () => Promise<void>;
}) {
  const [dialog, setDialog] = useState<null | 'check' | 'coins'>(null);
  const [error, setError] = useState<string | null>(null);
  const open = student.checks.find((c) => c.status === 'assigned' || c.status === 'in_progress');
  const nothingToCheck = student.checkable.letters + student.checkable.words + student.checkable.spelling === 0;

  return (
    <div>
      <h4 className="text-sm font-black text-slate-700 mb-2">📝 מבחנים ומטבעות</h4>
      <ErrorNote message={error} />
      <div className="flex flex-wrap gap-2 mb-2">
        <Btn
          variant="primary"
          disabled={!!open || nothingToCheck}
          title={open ? 'כבר יש מבחן פתוח' : nothingToCheck ? 'עוד אין פריטים שסומנו כנלמדו' : undefined}
          onClick={() => setDialog('check')}
        >
          📝 שליחת מבחן
        </Btn>
        {open && (
          <Btn
            onClick={async () => {
              setError(null);
              try {
                await api(`/api/family/checks/${open.id}${qs}`, { method: 'DELETE' });
                await onChanged();
              } catch (err) {
                setError(err instanceof Error ? err.message : 'שגיאה');
              }
            }}
          >
            ביטול המבחן הפתוח
          </Btn>
        )}
        <Btn onClick={() => setDialog('coins')}>🪙 הוספה / הורדה של מטבעות</Btn>
      </div>
      {nothingToCheck && !open && <div className="text-[11px] text-slate-500 mb-2">עוד אין פריטים שסומנו כנלמדו – אין מה לבדוק.</div>}

      {student.checks.length > 0 && (
        <div className="space-y-1.5 mb-2">
          {student.checks.map((c) => (
            <div key={c.id} className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-slate-700">
                  📝 {formatDate(c.createdAt)} · {STATUS[c.status] ?? c.status}
                  {c.status === 'done' && (
                    <>
                      {' '}
                      ·{' '}
                      <span className={c.score! / c.total >= 0.8 ? 'text-emerald-700' : 'text-rose-700'}>
                        {c.score}/{c.total}
                      </span>{' '}
                      · +{c.coinsAwarded} 🪙
                    </>
                  )}
                  {c.status !== 'done' && <> · {c.total} שאלות</>}
                </span>
              </div>
              {c.failed.length > 0 && (
                <div className="mt-1 text-rose-700" dir="auto">
                  לא ידע/ה: <span className="font-english font-bold">{c.failed.join(', ')}</span>{' '}
                  <span className="text-slate-500">(חזרו לתרגול)</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {student.coinAdjustments.length > 0 && (
        <div className="space-y-1">
          {student.coinAdjustments.map((a, i) => (
            <div key={i} className="text-xs flex justify-between gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <span>
                <b className={a.amount >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                  {a.amount >= 0 ? '+' : ''}
                  {a.amount} 🪙
                </b>{' '}
                · {a.reason}
              </span>
              <span className="text-slate-400 shrink-0">
                {formatDate(a.createdAt)} {a.seen ? '· נראה ✓' : '· עוד לא נראה'}
              </span>
            </div>
          ))}
        </div>
      )}

      {dialog === 'check' && <SendCheckModal student={student} qs={qs} onClose={() => setDialog(null)} onDone={onChanged} />}
      {dialog === 'coins' && <CoinsModal student={student} qs={qs} onClose={() => setDialog(null)} onDone={onChanged} />}
    </div>
  );
}

function SendCheckModal({ student, qs, onClose, onDone }: { student: StudentSummary; qs: string; onClose: () => void; onDone: () => Promise<void> }) {
  const available = (Object.keys(SCOPE_LABELS) as Scope[]).filter((s) => student.checkable[s] > 0);
  const [scopes, setScopes] = useState<Scope[]>(available);
  const [size, setSize] = useState(10);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <Modal title={`מבחן ל${student.displayName}`} onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          try {
            await api(`/api/family/students/${student.id}/checks${qs}`, { method: 'POST', body: { scopes, size } });
            await onDone();
            onClose();
          } catch (err) {
            setError(err instanceof Error ? err.message : 'שגיאה');
            setBusy(false);
          }
        }}
      >
        <p className="text-sm text-slate-600">
          המבחן נבנה ממה ש{student.displayName} סימן/ה שהוא/היא כבר יודע/ת, בלי רמזים. מה שלא יעבור – יחזור לתרגול, וכל תשובה נכונה שווה מטבע.
        </p>
        <div className="space-y-2">
          {(Object.keys(SCOPE_LABELS) as Scope[]).map((s) => (
            <label key={s} className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 ${student.checkable[s] ? 'border-slate-200' : 'border-slate-100 opacity-50'}`}>
              <span className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <input
                  type="checkbox"
                  disabled={!student.checkable[s]}
                  checked={scopes.includes(s)}
                  onChange={(e) => setScopes(e.target.checked ? [...scopes, s] : scopes.filter((x) => x !== s))}
                />
                {SCOPE_LABELS[s].icon} {SCOPE_LABELS[s].label}
              </span>
              <span className="text-xs text-slate-500">{student.checkable[s]} פריטים</span>
            </label>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
          מספר שאלות:
          <select value={size} onChange={(e) => setSize(Number(e.target.value))} className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white">
            {[5, 10, 15, 20].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <ErrorNote message={error} />
        <div className="flex gap-2 justify-end">
          <Btn onClick={onClose}>ביטול</Btn>
          <Btn type="submit" variant="primary" disabled={busy || scopes.length === 0}>
            {busy ? 'שולח...' : 'שליחה'}
          </Btn>
        </div>
      </form>
    </Modal>
  );
}

function CoinsModal({ student, qs, onClose, onDone }: { student: StudentSummary; qs: string; onClose: () => void; onDone: () => Promise<void> }) {
  const [direction, setDirection] = useState<'remove' | 'add'>('remove');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const n = Number(amount);
  return (
    <Modal title={`מטבעות של ${student.displayName} (כרגע ${student.progress.coins} 🪙)`} onClose={onClose}>
      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          try {
            await api(`/api/family/students/${student.id}/coins${qs}`, {
              method: 'POST',
              body: { amount: direction === 'remove' ? -n : n, reason },
            });
            await onDone();
            onClose();
          } catch (err) {
            setError(err instanceof Error ? err.message : 'שגיאה');
            setBusy(false);
          }
        }}
      >
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
          {(['remove', 'add'] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDirection(d)}
              className={`flex-1 py-2 rounded-lg text-sm font-extrabold cursor-pointer ${direction === d ? 'bg-white shadow-sm ' + (d === 'remove' ? 'text-rose-700' : 'text-emerald-700') : 'text-slate-500'}`}
            >
              {d === 'remove' ? '➖ הורדה' : '➕ הוספה'}
            </button>
          ))}
        </div>
        <Field label="כמה מטבעות" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, '').slice(0, 5))} inputMode="numeric" />
        <Field
          label="סיבה (הילד/ה יראה/תראה אותה)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={120}
          placeholder={direction === 'remove' ? 'למשל: סימנת אותיות שעוד לא למדת' : 'למשל: כל הכבוד על המבחן!'}
        />
        <ErrorNote message={error} />
        <div className="flex gap-2 justify-end">
          <Btn onClick={onClose}>ביטול</Btn>
          <Btn type="submit" variant={direction === 'remove' ? 'danger' : 'success'} disabled={busy || !n || !reason.trim()}>
            {busy ? 'שומר...' : direction === 'remove' ? `הורדת ${n || ''} מטבעות` : `הוספת ${n || ''} מטבעות`}
          </Btn>
        </div>
      </form>
    </Modal>
  );
}
