'use client';

import { useState } from 'react';
import { api } from '@/lib/api-client';
import { gradeLabel } from '@/content/wordbank';
import { AVATARS, PETS, THEMES } from '@/lib/catalog';
import { Btn, ErrorNote, Field, Modal } from './ui';

function useSubmit(onDone: () => Promise<void> | void) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'משהו השתבש');
      setBusy(false);
    }
  };
  return { busy, error, submit };
}

export function AddStudentModal({ qs, onClose, onDone }: { qs: string; onClose: () => void; onDone: () => Promise<void> }) {
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [avatar, setAvatar] = useState<string>(AVATARS[0].id);
  const [pet, setPet] = useState<string>(PETS[0].id);
  const [theme, setTheme] = useState<string>(THEMES[0].id);
  const [grade, setGrade] = useState('');
  const { busy, error, submit } = useSubmit(async () => {
    await onDone();
    onClose();
  });

  return (
    <Modal title="הוספת ילד/ה" onClose={onClose}>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          void submit(() =>
            api(`/api/family/students${qs}`, { method: 'POST', body: { displayName, username, pin, avatar, pet, theme, grade: grade || null } }),
          );
        }}
      >
        <Field label="שם (כפי שיופיע במשחק)" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={40} autoFocus />
        <Field
          label="שם משתמש לכניסה"
          hint="אותיות (גם עברית), ספרות, נקודה או מקף. חייב להיות ייחודי."
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoCapitalize="none"
          spellCheck={false}
          maxLength={32}
        />
        <Field
          label="קוד כניסה (4 ספרות)"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
          inputMode="numeric"
          autoComplete="off"
          dir="ltr"
          className="text-center text-xl tracking-[0.5em] font-black"
        />
        <label className="block">
          <span className="block text-xs font-bold text-slate-600 mb-1">כיתה</span>
          <select value={grade} onChange={(e) => setGrade(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white">
            <option value="">לא הוגדר</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
              <option key={g} value={g}>
                {gradeLabel(g)}
              </option>
            ))}
          </select>
        </label>
        <Picker label="דמות" items={AVATARS.map((a) => ({ id: a.id, icon: a.emoji, name: a.name }))} value={avatar} onChange={setAvatar} />
        <Picker label="חיית מחמד" items={PETS.map((p) => ({ id: p.id, icon: p.emoji, name: p.name }))} value={pet} onChange={setPet} />
        <Picker label="ערכת צבעים" items={THEMES.map((t) => ({ id: t.id, icon: t.icon, name: t.name }))} value={theme} onChange={setTheme} />
        <ErrorNote message={error} />
        <div className="flex gap-2 justify-end pt-1">
          <Btn onClick={onClose}>ביטול</Btn>
          <Btn type="submit" variant="primary" disabled={busy || !displayName.trim() || !username.trim() || pin.length !== 4}>
            {busy ? 'יוצר...' : 'הוסף'}
          </Btn>
        </div>
      </form>
    </Modal>
  );
}

function Picker({
  label,
  items,
  value,
  onChange,
}: {
  label: string;
  items: { id: string; icon: string; name: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div>
      <span className="block text-xs font-bold text-slate-600 mb-1">{label}</span>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={label}>
        {items.map((it) => (
          <button
            key={it.id}
            type="button"
            role="radio"
            aria-checked={value === it.id}
            title={it.name}
            onClick={() => onChange(it.id)}
            className={`w-11 h-11 rounded-xl text-2xl border-2 transition cursor-pointer ${
              value === it.id ? 'border-indigo-500 bg-indigo-50 scale-105' : 'border-slate-200 hover:border-indigo-300'
            }`}
          >
            {it.icon}
          </button>
        ))}
      </div>
    </div>
  );
}

export function AddGuardianModal({ qs, onClose, onDone }: { qs: string; onClose: () => void; onDone: () => Promise<void> }) {
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { busy, error, submit } = useSubmit(async () => {
    await onDone();
    onClose();
  });
  return (
    <Modal title="הוספת הורה / מורה / חונך" onClose={onClose}>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          void submit(() => api(`/api/family/guardians${qs}`, { method: 'POST', body: { displayName, username, password } }));
        }}
      >
        <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-3">
          יקבל/תקבל את אותן הרשאות כמוך במשפחה הזו: לראות התקדמות, לנהל פרסים, לאפס ולהוסיף ילדים.
        </div>
        <Field label="שם" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={40} autoFocus />
        <Field
          label="שם משתמש"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoCapitalize="none"
          spellCheck={false}
          maxLength={32}
        />
        <Field
          label="סיסמה (לפחות 8 תווים)"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          dir="ltr"
        />
        <ErrorNote message={error} />
        <div className="flex gap-2 justify-end pt-1">
          <Btn onClick={onClose}>ביטול</Btn>
          <Btn type="submit" variant="primary" disabled={busy || !displayName.trim() || !username.trim() || password.length < 8}>
            {busy ? 'יוצר...' : 'הוסף'}
          </Btn>
        </div>
      </form>
    </Modal>
  );
}

export function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [repeat, setRepeat] = useState('');
  const [done, setDone] = useState(false);
  const { busy, error, submit } = useSubmit(() => setDone(true));
  return (
    <Modal title="שינוי הסיסמה שלי" onClose={onClose}>
      {done ? (
        <div className="space-y-4">
          <div className="text-sm font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
            הסיסמה שונתה ✓ מכשירים אחרים שלך נותקו.
          </div>
          <div className="flex justify-end">
            <Btn variant="primary" onClick={onClose}>
              סגור
            </Btn>
          </div>
        </div>
      ) : (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void submit(() =>
              api('/api/me/password', { method: 'POST', body: { currentPassword: current, newPassword: next } }),
            );
          }}
        >
          <Field label="סיסמה נוכחית" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" dir="ltr" autoFocus />
          <Field label="סיסמה חדשה (לפחות 8 תווים)" type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" dir="ltr" />
          <Field label="שוב את הסיסמה החדשה" type="password" value={repeat} onChange={(e) => setRepeat(e.target.value)} autoComplete="new-password" dir="ltr" />
          {repeat && next !== repeat && <ErrorNote message="הסיסמאות לא זהות" />}
          <ErrorNote message={error} />
          <div className="flex gap-2 justify-end pt-1">
            <Btn onClick={onClose}>ביטול</Btn>
            <Btn type="submit" variant="primary" disabled={busy || !current || next.length < 8 || next !== repeat}>
              {busy ? 'שומר...' : 'שמור'}
            </Btn>
          </div>
        </form>
      )}
    </Modal>
  );
}
