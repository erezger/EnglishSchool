'use client';

import { useState } from 'react';
import { api } from '@/lib/api-client';
import { GOAL_OPTIONS, MODULES } from '@/lib/modules';
import type { StudentSummary } from './types';
import { ErrorNote } from './ui';

/** Which practice modules are open for this kid. Saves on every toggle. */
export default function ModuleSettings({ student, qs, onChanged }: { student: StudentSummary; qs: string; onChanged: () => Promise<void> }) {
  const [disabled, setDisabled] = useState<string[]>(student.settings.disabledModules);
  const [goal, setGoal] = useState<number>(student.settings.dailyGoalMinutes);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle(id: string) {
    const next = disabled.includes(id) ? disabled.filter((x) => x !== id) : [...disabled, id];
    setDisabled(next);
    setBusy(true);
    setError(null);
    try {
      await api(`/api/family/students/${student.id}${qs}`, { method: 'PATCH', body: { settings: { disabledModules: next, dailyGoalMinutes: goal } } });
      await onChanged();
    } catch (err) {
      setDisabled(disabled);
      setError(err instanceof Error ? err.message : 'שגיאה');
    } finally {
      setBusy(false);
    }
  }

  async function changeGoal(value: number) {
    const prev = goal;
    setGoal(value);
    setBusy(true);
    setError(null);
    try {
      await api(`/api/family/students/${student.id}${qs}`, { method: 'PATCH', body: { settings: { disabledModules: disabled, dailyGoalMinutes: value } } });
      await onChanged();
    } catch (err) {
      setGoal(prev);
      setError(err instanceof Error ? err.message : 'שגיאה');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <label className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-600">
        🎯 מטרה יומית:
        <select
          value={goal}
          disabled={busy}
          onChange={(e) => void changeGoal(Number(e.target.value))}
          className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-sm bg-white"
        >
          {GOAL_OPTIONS.map((g) => (
            <option key={g} value={g}>
              {g === 0 ? 'בלי מטרה' : `${g} דקות תרגול ביום`}
            </option>
          ))}
        </select>
      </label>
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
