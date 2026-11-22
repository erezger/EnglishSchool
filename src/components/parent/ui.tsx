'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

export function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="bg-white/95 rounded-3xl shadow-md border border-indigo-100/80 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h2 className="text-lg sm:text-xl font-black text-slate-800">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

type BtnVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
const VARIANTS: Record<BtnVariant, string> = {
  primary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
  secondary: 'bg-white hover:bg-slate-50 border border-slate-300 text-slate-700',
  danger: 'bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700',
  success: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  ghost: 'text-slate-600 hover:bg-slate-100',
};

export function Btn({
  variant = 'secondary',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant }) {
  return (
    <button
      type="button"
      {...props}
      className={`px-3.5 py-2 rounded-xl text-sm font-extrabold transition active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
    />
  );
}

export function Field({
  label,
  hint,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className="block">
      <span className="block text-xs font-bold text-slate-600 mb-1">{label}</span>
      <input
        {...props}
        className={`w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:outline-none focus:border-indigo-500 ${props.className ?? ''}`}
      />
      {hint && <span className="block text-[11px] text-slate-500 mt-1">{hint}</span>}
    </label>
  );
}

export function ErrorNote({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div role="alert" className="text-sm font-bold text-rose-800 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
      {message}
    </div>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div role="dialog" aria-modal="true" aria-label={title} className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-5 animate-pop">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-slate-800">{title}</h3>
          <button onClick={onClose} aria-label="סגור" className="w-8 h-8 rounded-xl hover:bg-slate-100 font-black cursor-pointer">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/**
 * Sensitive actions (reset, delete, change PIN) need the guardian's own password.
 * `run` receives the password and should throw an Error with a Hebrew message on failure.
 */
export function ConfirmWithPassword({
  title,
  description,
  confirmLabel,
  danger,
  extra,
  run,
  onClose,
}: {
  title: string;
  description: ReactNode;
  confirmLabel: string;
  danger?: boolean;
  extra?: ReactNode;
  run: (password: string) => Promise<void>;
  onClose: () => void;
}) {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => ref.current?.focus(), []);

  return (
    <Modal title={title} onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          try {
            await run(password);
            onClose();
          } catch (err) {
            setError(err instanceof Error ? err.message : 'משהו השתבש');
            setBusy(false);
          }
        }}
      >
        <div className="text-sm text-slate-700">{description}</div>
        {extra}
        <label className="block">
          <span className="block text-xs font-bold text-slate-600 mb-1">הסיסמה שלך (לאישור)</span>
          <input
            ref={ref}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            dir="ltr"
            className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-indigo-500"
          />
        </label>
        <ErrorNote message={error} />
        <div className="flex gap-2 justify-end">
          <Btn onClick={onClose}>ביטול</Btn>
          <Btn type="submit" variant={danger ? 'danger' : 'primary'} disabled={busy || !password}>
            {busy ? 'רגע...' : confirmLabel}
          </Btn>
        </div>
      </form>
    </Modal>
  );
}

export function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('he-IL', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '—';
  }
}
