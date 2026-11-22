'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { AddGuardianModal, AddStudentModal, ChangePasswordModal } from './forms';
import StudentCard from './StudentCard';
import WordLists from './WordLists';
import type { FamilyOverview, Me, RedemptionItem } from './types';
import { Btn, ConfirmWithPassword, ErrorNote, formatDate, Section } from './ui';

type Dialog = null | 'addStudent' | 'addGuardian' | 'password' | { removeGuardian: { id: string; name: string } };

export default function ParentDashboard({ me, familyId }: { me: Me; familyId?: string }) {
  const qs = familyId ? `?familyId=${encodeURIComponent(familyId)}` : '';
  const [data, setData] = useState<FamilyOverview | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await api<FamilyOverview>(`/api/family${qs}`));
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'שגיאה בטעינה');
    }
  }, [qs]);

  useEffect(() => {
    void load();
    // Keep "waiting for parents" fresh while the dashboard is open
    const t = setInterval(() => document.visibilityState === 'visible' && void load(), 15_000);
    return () => clearInterval(t);
  }, [load]);

  async function resolve(r: RedemptionItem, action: 'fulfill' | 'cancel') {
    setBusyId(r.id);
    setActionError(null);
    try {
      await api(`/api/family/redemptions/${r.id}${qs}`, { method: 'POST', body: { action } });
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'משהו השתבש');
    } finally {
      setBusyId(null);
    }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    window.location.assign('/login');
  }

  const nameOf = (studentId: string) => data?.students.find((s) => s.id === studentId)?.displayName ?? '—';
  const pending = data?.redemptions.filter((r) => r.status === 'pending') ?? [];
  const history = data?.redemptions.filter((r) => r.status !== 'pending').slice(0, 15) ?? [];

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-5 py-4 sm:py-6 pb-16 space-y-5">
      <header className="bg-white/95 rounded-3xl shadow-md border border-indigo-100/80 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-extrabold text-indigo-600">✨ אנגלית בקליק PRO · אזור הורים</div>
          <h1 className="text-2xl font-black text-slate-800">{data?.family.name ?? '...'}</h1>
          <div className="text-sm text-slate-500">
            מחובר/ת כ<strong className="text-slate-700">{me.displayName}</strong>
            {me.role === 'admin' && <span className="mr-1 text-[11px] font-black px-2 py-0.5 rounded-full bg-slate-800 text-white">מנהל מערכת</span>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {me.role === 'admin' && (
            <a href="/admin" className="px-3.5 py-2 rounded-xl text-sm font-extrabold bg-slate-800 hover:bg-slate-900 text-white">
              🛠️ כל המשפחות
            </a>
          )}
          <Btn onClick={() => setDialog('password')}>🔑 שינוי סיסמה</Btn>
          <Btn onClick={logout}>🚪 יציאה / החלפת משתמש</Btn>
        </div>
      </header>

      {loadError && <ErrorNote message={loadError} />}
      {actionError && <ErrorNote message={actionError} />}
      {!data && !loadError && <div className="text-center text-slate-500 font-bold py-10">טוען... ⏳</div>}

      {data && (
        <>
          {pending.length > 0 && (
            <Section title={`🎁 פרסים שמחכים לך (${pending.length})`}>
              <div className="space-y-2">
                {pending.map((r) => (
                  <div
                    key={r.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-amber-50 border-2 border-amber-200 rounded-2xl px-4 py-3"
                  >
                    <div>
                      <div className="font-black text-slate-800">
                        {nameOf(r.studentId)} מימש/ה: {r.title}
                      </div>
                      <div className="text-xs text-slate-600">
                        {r.cost} 🪙 · {formatDate(r.requestedAt)}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Btn variant="success" disabled={busyId === r.id} onClick={() => resolve(r, 'fulfill')}>
                        ✓ מומש
                      </Btn>
                      <Btn disabled={busyId === r.id} onClick={() => resolve(r, 'cancel')} title="ביטול ומחזיר את המטבעות">
                        ↩️ בטל והחזר מטבעות
                      </Btn>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          <Section
            title="👧🧒 הילדים"
            action={
              <Btn variant="primary" onClick={() => setDialog('addStudent')}>
                ➕ הוספת ילד/ה
              </Btn>
            }
          >
            {data.students.length === 0 ? (
              <div className="text-center text-sm text-slate-500 py-6">עוד אין ילדים. לחצו על &quot;הוספת ילד/ה&quot; כדי להתחיל.</div>
            ) : (
              <div className="space-y-3">
                {data.students.map((s) => (
                  <StudentCard key={s.id} student={s} qs={qs} onChanged={load} />
                ))}
              </div>
            )}
          </Section>

          <WordLists qs={qs} students={data.students} />

          <Section
            title="👨‍👩‍👧 הורים, מורים וחונכים"
            action={<Btn onClick={() => setDialog('addGuardian')}>➕ הוספה</Btn>}
          >
            <div className="space-y-2">
              {data.guardians.map((g) => (
                <div key={g.id} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5">
                  <div>
                    <span className="font-bold text-slate-800">{g.displayName}</span>{' '}
                    <span className="text-xs text-slate-500" dir="ltr">
                      @{g.username}
                    </span>
                    {g.id === me.id && <span className="text-xs text-indigo-600 font-bold"> (את/ה)</span>}
                    <div className="text-[11px] text-slate-500">כניסה אחרונה: {formatDate(g.lastLoginAt)}</div>
                  </div>
                  {g.id !== me.id && g.role !== 'admin' && (
                    <Btn
                      variant="ghost"
                      className="!text-rose-600 text-xs"
                      onClick={() => setDialog({ removeGuardian: { id: g.id, name: g.displayName } })}
                    >
                      הסר
                    </Btn>
                  )}
                </div>
              ))}
            </div>
          </Section>

          {history.length > 0 && (
            <Section title="📜 היסטוריית פרסים">
              <div className="space-y-1.5">
                {history.map((r) => (
                  <div key={r.id} className="flex justify-between text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                    <span>
                      {r.status === 'fulfilled' ? '✅' : '↩️'} {nameOf(r.studentId)} · {r.title} ({r.cost} 🪙)
                      {r.status === 'cancelled' && ' – בוטל, הוחזר'}
                    </span>
                    <span className="text-slate-500">{formatDate(r.resolvedAt ?? r.requestedAt)}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </>
      )}

      {dialog === 'addStudent' && <AddStudentModal qs={qs} onClose={() => setDialog(null)} onDone={load} />}
      {dialog === 'addGuardian' && <AddGuardianModal qs={qs} onClose={() => setDialog(null)} onDone={load} />}
      {dialog === 'password' && <ChangePasswordModal onClose={() => setDialog(null)} />}
      {dialog && typeof dialog === 'object' && (
        <ConfirmWithPassword
          title={`הסרת ${dialog.removeGuardian.name}`}
          description={`${dialog.removeGuardian.name} לא יוכל/תוכל יותר להיכנס לאזור ההורים של המשפחה.`}
          confirmLabel="הסר"
          danger
          run={async (password) => {
            await api(`/api/family/guardians/${dialog.removeGuardian.id}${qs}`, {
              method: 'DELETE',
              body: { confirmPassword: password },
            });
            await load();
          }}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
}
