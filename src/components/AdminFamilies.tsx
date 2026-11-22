'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { Btn, ErrorNote, Field, formatDate, Modal, Section } from './parent/ui';

type FamilyRow = { id: string; name: string; createdAt: string; students: number; guardians: number };

export default function AdminFamilies({ myFamilyId }: { myFamilyId: string | null }) {
  const [families, setFamilies] = useState<FamilyRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api<{ families: FamilyRow[] }>('/api/admin/families');
      setFamilies(res.families);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בטעינה');
    }
  }, []);
  useEffect(() => void load(), [load]);

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-5 py-6 space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-xs font-extrabold text-indigo-600">✨ אנגלית בקליק PRO</div>
          <h1 className="text-2xl font-black text-slate-800">🛠️ ניהול משפחות</h1>
        </div>
        <a href="/parent" className="px-3.5 py-2 rounded-xl text-sm font-extrabold bg-white border border-slate-300 text-slate-700">
          ← למשפחה שלי
        </a>
      </header>
      <ErrorNote message={error} />
      <Section
        title="משפחות"
        action={
          <Btn variant="primary" onClick={() => setCreating(true)}>
            ➕ משפחה חדשה
          </Btn>
        }
      >
        {!families ? (
          <div className="text-center text-slate-500 py-6">טוען...</div>
        ) : (
          <div className="space-y-2">
            {families.map((f) => (
              <a
                key={f.id}
                href={f.id === myFamilyId ? '/parent' : `/parent?familyId=${f.id}`}
                className="flex items-center justify-between bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-xl px-4 py-3 transition"
              >
                <div>
                  <div className="font-black text-slate-800">
                    {f.name} {f.id === myFamilyId && <span className="text-xs text-indigo-600">(שלי)</span>}
                  </div>
                  <div className="text-xs text-slate-500">
                    {f.students} ילדים · {f.guardians} הורים/מורים · נוצרה {formatDate(f.createdAt)}
                  </div>
                </div>
                <span className="text-indigo-600 font-bold text-sm">ניהול ←</span>
              </a>
            ))}
          </div>
        )}
      </Section>
      {creating && <CreateFamilyModal onClose={() => setCreating(false)} onDone={load} />}
    </div>
  );
}

function CreateFamilyModal({ onClose, onDone }: { onClose: () => void; onDone: () => Promise<void> }) {
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <Modal title="משפחה חדשה" onClose={onClose}>
      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          try {
            await api('/api/admin/families', {
              method: 'POST',
              body: { name, parent: { displayName, username, password } },
            });
            await onDone();
            onClose();
          } catch (err) {
            setError(err instanceof Error ? err.message : 'משהו השתבש');
            setBusy(false);
          }
        }}
      >
        <Field label="שם המשפחה / הקבוצה" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoFocus />
        <div className="text-xs font-black text-slate-700 pt-1">ההורה הראשון</div>
        <Field label="שם" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={40} />
        <Field label="שם משתמש" value={username} onChange={(e) => setUsername(e.target.value)} autoCapitalize="none" spellCheck={false} />
        <Field label="סיסמה (לפחות 8 תווים)" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" dir="ltr" />
        <ErrorNote message={error} />
        <div className="flex gap-2 justify-end">
          <Btn onClick={onClose}>ביטול</Btn>
          <Btn type="submit" variant="primary" disabled={busy || !name.trim() || !displayName.trim() || !username.trim() || password.length < 8}>
            {busy ? 'יוצר...' : 'צור'}
          </Btn>
        </div>
      </form>
    </Modal>
  );
}
