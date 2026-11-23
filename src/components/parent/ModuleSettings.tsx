'use client';

import { useState } from 'react';
import { api } from '@/lib/api-client';
import { MODULES } from '@/lib/modules';
import type { StudentSummary } from './types';
import { ErrorNote } from './ui';

/** Which practice modules are open for this kid. Saves on every toggle. */
export default function ModuleSettings({ student, qs, onChanged }: { student: StudentSummary; qs: string; onChanged: () => Promise<void> }) {
  const [disabled, setDisabled] = useState<string[]>(student.settings.disabledModules);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle(id: string) {
    const next = disabled.includes(id) ? disabled.filter((x) => x !== id) : [...disabled, id];
    setDisabled(next);
    setBusy(true);
    setError(null);
    try {
      await api(`/api/family/students/${student.id}${qs}`, { method: 'PATCH', body: { settings: { disabledModules: next } } });
      await onChanged();
    } catch (err) {
      setDisabled(disabled);
      setError(err instanceof Error ? err.message : 'שגיאה');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h4 className="text-sm font-black text-slate-700 mb-2">⚙️ מה פתוח לתרגול</h4>
      <ErrorNote message={error} />
      <div className="flex flex-wrap gap-2">
        {MODULES.map((m) => {
          const on = !disabled.includes(m.id);
          return (
            <button
              key={m.id}
              role="switch"
              aria-checked={on}
              disabled={busy}
              onClick={() => void toggle(m.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition cursor-pointer disabled:opacity-60 ${
                on ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-400 line-through'
              }`}
            >
              {m.icon} {m.title}
            </button>
          );
        })}
      </div>
      {!disabled.includes('speaking') && (
        <div className="text-[11px] text-slate-500 mt-1.5">🎤 &quot;אומרים בקול&quot; משתמש בזיהוי הדיבור של הדפדפן (ב-Chrome הקול נשלח לעיבוד אצל Google).</div>
      )}
    </div>
  );
}
