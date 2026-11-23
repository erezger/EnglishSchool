'use client';

import { useState } from 'react';
import { api } from '@/lib/api-client';
import { GRAMMAR } from '@/content/grammar';
import { gradeLabel } from '@/content/wordbank';

const GRAMMAR_TITLES: Record<string, string> = Object.fromEntries(GRAMMAR.map((t) => [t.id, t.title]));
import { avatarEmoji, petEmoji, TOTAL_LEVELS } from '@/lib/catalog';
import ChecksAndCoins from './ChecksAndCoins';
import ModuleSettings from './ModuleSettings';
import type { StudentSummary } from './types';
import { Btn, ConfirmWithPassword, ErrorNote, Field, formatDate } from './ui';

type Dialog = null | 'pin' | 'reset' | 'delete';

export default function StudentCard({
  student,
  qs,
  onChanged,
}: {
  student: StudentSummary;
  qs: string; // "?familyId=..." for admin, "" otherwise
  onChanged: () => Promise<void>;
}) {
  const [open, setOpen] = useState(!student.hasPin);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [newPin, setNewPin] = useState('');
  const [rewardTitle, setRewardTitle] = useState('');
  const [rewardCost, setRewardCost] = useState('');
  const [name, setName] = useState(student.displayName);
  const [grade, setGrade] = useState<string>(student.grade ? String(student.grade) : '');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const p = student.progress;
  const base = `/api/family/students/${student.id}`;

  async function act(fn: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'משהו השתבש');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border-2 border-slate-200 rounded-2xl p-4 bg-white">
      <div className="flex items-start gap-3">
        <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-3xl shrink-0">
          <span>{avatarEmoji(p.equippedAvatar)}</span>
          <span className="absolute -bottom-1 -left-1 bg-white rounded-full w-6 h-6 flex items-center justify-center text-sm shadow border border-slate-200">
            {petEmoji(p.equippedPet)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-black text-slate-800">{student.displayName}</span>
            <span className="text-xs font-bold text-slate-500" dir="ltr">
              @{student.username}
            </span>
            {student.grade && (
              <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200">
                כיתה {gradeLabel(student.grade)}
              </span>
            )}
            {!student.hasPin && (
              <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                ⚠️ עוד לא הוגדר קוד כניסה
              </span>
            )}
            {student.locked && (
              <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                🔒 נחסם זמנית
              </span>
            )}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">כניסה אחרונה: {formatDate(student.lastLoginAt)}</div>
        </div>
        <a href={`/parent/report/${student.id}`} className="px-3 py-2 rounded-xl text-sm font-extrabold text-indigo-700 hover:bg-indigo-50">
          📊 דוח שבועי
        </a>
        <Btn variant="ghost" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          {open ? 'סגור ▲' : 'ניהול ▼'}
        </Btn>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-3 text-center">
        <Stat label="מטבעות" value={`🪙 ${p.coins}`} />
        <Stat label="שלבים" value={`${p.completedLevels}/${TOTAL_LEVELS}`} />
        <Stat label="אותיות" value={`${p.learnedLetters}/26`} />
        <Stat label="מילים" value={String(p.readWords)} />
        <Stat label="משפטים" value={String(p.readSentences)} />
        <Stat label="רצף ימים" value={`🔥 ${p.dailyStreak}`} />
      </div>
      {p.speakingTried > 0 && (
        <div className="mt-2 text-xs font-bold text-slate-600 bg-amber-50/60 border border-amber-100 rounded-xl px-3 py-2">
          🎤 דיבור: {p.speakingOk} מתוך {p.speakingTried} מילים נאמרו נכון
        </div>
      )}
      {p.storiesRead > 0 && (
        <div className="mt-2 text-xs font-bold text-slate-600 bg-pink-50/60 border border-pink-100 rounded-xl px-3 py-2">
          📖 קריאה והבנה: {p.storiesRead} סיפורים · ממוצע הבנה {p.storiesAvg}%
        </div>
      )}
      {Object.keys(p.grammar).length > 0 && (
        <div className="mt-2 text-xs font-bold text-slate-600 bg-emerald-50/60 border border-emerald-100 rounded-xl px-3 py-2">
          📘 דקדוק (שיא):{' '}
          {Object.entries(p.grammar).map(([topic, best]) => (
            <span key={topic} className={`ms-2 font-english ${best >= 80 ? 'text-emerald-700' : 'text-rose-700'}`} dir="ltr">
              {GRAMMAR_TITLES[topic] ?? topic} {best}%
            </span>
          ))}
        </div>
      )}
      {p.dictationTried > 0 && (
        <div className="mt-2 text-xs font-bold text-slate-600 bg-indigo-50/60 border border-indigo-100 rounded-xl px-3 py-2">
          ✍️ הכתבה: {p.dictationPerfect} מתוך {p.dictationTried} משפטים נכתבו מושלם
        </div>
      )}
      {p.placement && (
        <div className="mt-2 text-xs font-bold text-slate-600 bg-violet-50/60 border border-violet-100 rounded-xl px-3 py-2">
          🧭 מבחן מיקום ({p.placement.date}): {p.placement.passedThrough > 0 ? `עבר/ה עד שלב ${p.placement.passedThrough}` : 'התחיל/ה מההתחלה'}
        </div>
      )}
      {p.reviewTracked > 0 && (
        <div className="mt-2 text-xs font-bold text-slate-600 bg-sky-50/60 border border-sky-100 rounded-xl px-3 py-2">
          ⏰ חזרה יומית: {p.reviewStreak > 0 ? <span className="text-orange-600">🔥 {p.reviewStreak} ימים ברצף</span> : 'אין רצף כרגע'}
          {' · '}אחרונה: {p.reviewLast ?? '—'} · {p.reviewMastered} מתוך {p.reviewTracked} פריטים יושבים טוב
          {p.reviewDue > 0 && <span className="text-sky-800"> · {p.reviewDue} מחכים לחזרה</span>}
        </div>
      )}
      {p.spellingPracticed > 0 && (
        <div className="mt-2 text-xs font-bold text-slate-600 bg-amber-50/60 border border-amber-100 rounded-xl px-3 py-2">
          🐝 איות: {p.spellingPracticed} מילים תורגלו · <span className="text-emerald-700">{p.spellingKnown} יודעים</span>
          {p.spellingWeak > 0 && <span className="text-rose-700"> · {p.spellingWeak} צריכות חיזוק</span>}
        </div>
      )}

      {open && (
        <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
          <ErrorNote message={error} />

          {/* Rewards */}
          <div>
            <h4 className="text-sm font-black text-slate-700 mb-2">🎁 פרסים של {student.displayName}</h4>
            <div className="space-y-1.5 mb-2">
              {student.rewards.length === 0 && <div className="text-xs text-slate-400">אין פרסים עדיין</div>}
              {student.rewards.map((r) => (
                <div key={r.id} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm">
                  <span className="font-bold text-slate-800">
                    {r.title} <span className="text-amber-700 text-xs">({r.cost} 🪙)</span>
                  </span>
                  <Btn
                    variant="ghost"
                    className="!text-rose-600 !px-2 !py-1 text-xs"
                    disabled={busy}
                    onClick={() => act(() => api(`/api/family/rewards/${r.id}${qs}`, { method: 'DELETE' }))}
                  >
                    מחק 🗑️
                  </Btn>
                </div>
              ))}
            </div>
            <form
              className="flex flex-col sm:flex-row gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void act(async () => {
                  await api(`${base}/rewards${qs}`, { method: 'POST', body: { title: rewardTitle, cost: Number(rewardCost) } });
                  setRewardTitle('');
                  setRewardCost('');
                });
              }}
            >
              <input
                value={rewardTitle}
                onChange={(e) => setRewardTitle(e.target.value)}
                placeholder="פרס חדש (למשל: פיצה 🍕)"
                maxLength={60}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-indigo-500"
              />
              <input
                value={rewardCost}
                onChange={(e) => setRewardCost(e.target.value.replace(/\D/g, ''))}
                placeholder="מטבעות"
                inputMode="numeric"
                className="w-full sm:w-28 px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold focus:outline-none focus:border-indigo-500"
              />
              <Btn type="submit" variant="primary" disabled={busy || !rewardTitle.trim() || !rewardCost}>
                הוסף
              </Btn>
            </form>
          </div>

          <ModuleSettings student={student} qs={qs} onChanged={onChanged} />

          <ChecksAndCoins student={student} qs={qs} onChanged={onChanged} />

          {/* Account */}
          <div>
            <h4 className="text-sm font-black text-slate-700 mb-2">👤 חשבון</h4>
            <form
              className="flex gap-2 mb-2"
              onSubmit={(e) => {
                e.preventDefault();
                void act(() => api(`${base}${qs}`, { method: 'PATCH', body: { displayName: name } }));
              }}
            >
              <div className="flex-1">
                <Field label="שם תצוגה" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
              </div>
              <Btn type="submit" className="self-end" disabled={busy || name.trim() === student.displayName || !name.trim()}>
                שמור
              </Btn>
            </form>
            <label className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-600">
              כיתה:
              <select
                value={grade}
                disabled={busy}
                onChange={(e) => {
                  setGrade(e.target.value);
                  void act(() => api(`${base}${qs}`, { method: 'PATCH', body: { grade: e.target.value || null } }));
                }}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-sm bg-white"
              >
                <option value="">לא הוגדר</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                  <option key={g} value={g}>
                    {gradeLabel(g)}
                  </option>
                ))}
              </select>
              <span className="font-medium text-slate-400">(קובע את מאגר המילים לאיות)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              <Btn variant={student.hasPin ? 'secondary' : 'primary'} onClick={() => setDialog('pin')}>
                🔢 {student.hasPin ? 'שינוי קוד כניסה' : 'הגדרת קוד כניסה'}
              </Btn>
              {student.locked && (
                <Btn disabled={busy} onClick={() => act(() => api(`${base}/unlock${qs}`, { method: 'POST' }))}>
                  🔓 שחרור חסימה
                </Btn>
              )}
            </div>
          </div>

          {/* Danger zone */}
          <div className="bg-rose-50/50 border border-rose-200 rounded-2xl p-3">
            <h4 className="text-sm font-black text-rose-900 mb-2">⚠️ פעולות רגישות</h4>
            <div className="flex flex-wrap gap-2">
              <Btn variant="danger" onClick={() => setDialog('reset')}>
                🔄 איפוס התקדמות
              </Btn>
              <Btn variant="danger" onClick={() => setDialog('delete')}>
                🗑️ מחיקת {student.displayName}
              </Btn>
            </div>
          </div>
        </div>
      )}

      {dialog === 'pin' && (
        <ConfirmWithPassword
          title={`קוד כניסה ל${student.displayName}`}
          description="קוד של 4 ספרות שהילד/ה יקיש/תקיש בכניסה. אחרי השינוי, מכשירים שמחוברים כרגע יתבקשו להתחבר מחדש."
          confirmLabel="שמור קוד"
          extra={
            <Field
              label="קוד חדש (4 ספרות)"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              inputMode="numeric"
              autoComplete="off"
              dir="ltr"
              className="text-center text-2xl tracking-[0.5em] font-black"
            />
          }
          run={async (password) => {
            await api(`${base}/pin${qs}`, { method: 'POST', body: { pin: newPin, confirmPassword: password } });
            setNewPin('');
            await onChanged();
          }}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === 'reset' && (
        <ConfirmWithPassword
          title={`איפוס ההתקדמות של ${student.displayName}`}
          description={
            <>
              כל המטבעות, השלבים, האותיות והמילים יימחקו ו<strong>{student.displayName}</strong> תתחיל/יתחיל מההתחלה. הדמות,
              הפרסים וההיסטוריה נשמרים. <strong>אי אפשר לבטל.</strong>
            </>
          }
          confirmLabel="כן, אפס"
          danger
          run={async (password) => {
            await api(`${base}/reset${qs}`, { method: 'POST', body: { confirmPassword: password } });
            await onChanged();
          }}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === 'delete' && (
        <ConfirmWithPassword
          title={`מחיקת ${student.displayName}`}
          description={
            <>
              החשבון, כל ההתקדמות, הפרסים וההיסטוריה של <strong>{student.displayName}</strong> יימחקו לגמרי.{' '}
              <strong>אי אפשר לבטל.</strong>
            </>
          }
          confirmLabel="מחק לצמיתות"
          danger
          run={async (password) => {
            await api(`${base}${qs}`, { method: 'DELETE', body: { confirmPassword: password } });
            await onChanged();
          }}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 border border-slate-100 rounded-xl py-2">
      <div className="text-[11px] text-slate-500 font-bold">{label}</div>
      <div className="text-sm font-black text-slate-800">{value}</div>
    </div>
  );
}
