'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import type { WordList, WordRow } from '@/lib/words';
import type { StudentSummary } from './types';
import { Btn, ErrorNote, Field, Modal, Section } from './ui';

type ListsResponse = { lists: WordList[]; aiEnabled: boolean };

export default function WordLists({ qs, students }: { qs: string; students: StudentSummary[] }) {
  const [data, setData] = useState<ListsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await api<ListsResponse>(`/api/family/word-lists${qs}`));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בטעינה');
    }
  }, [qs]);
  useEffect(() => void load(), [load]);

  const forWhom = (l: WordList) =>
    l.studentId ? students.find((s) => s.id === l.studentId)?.displayName ?? '—' : 'כל הילדים';

  return (
    <Section
      title="📚 רשימות מילים מהכיתה"
      action={
        <Btn variant="primary" onClick={() => setCreating(true)}>
          ➕ רשימה חדשה
        </Btn>
      }
    >
      <ErrorNote message={error} />
      {!data ? (
        <div className="text-center text-slate-500 py-4">טוען...</div>
      ) : data.lists.length === 0 ? (
        <div className="text-sm text-slate-500 text-center py-4">
          עוד אין רשימות. צרו רשימה (למשל &quot;יחידה 3 בספר&quot;) והדביקו את המילים – הילדים יתרגלו לאיית אותן.
        </div>
      ) : (
        <div className="space-y-2">
          {data.lists.map((l) => {
            const needsReview = l.words.filter((w) => w.aiGenerated).length;
            const incomplete = l.words.filter((w) => !w.hebrew || !w.exampleEn).length;
            return (
              <div key={l.id} className="border-2 border-slate-200 rounded-2xl bg-white">
                <button
                  onClick={() => setOpenId(openId === l.id ? null : l.id)}
                  aria-expanded={openId === l.id}
                  className="w-full flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-right cursor-pointer"
                >
                  <div>
                    <div className="font-black text-slate-800">{l.title}</div>
                    <div className="text-xs text-slate-500">
                      {l.words.length} מילים · ל{forWhom(l)}
                      {needsReview > 0 && <span className="text-violet-700 font-bold"> · ✨ {needsReview} לבדיקה</span>}
                      {incomplete > 0 && <span className="text-amber-700 font-bold"> · {incomplete} חסרות תרגום/משפט</span>}
                    </div>
                  </div>
                  <span className="text-sm font-bold text-indigo-600">{openId === l.id ? 'סגור ▲' : 'עריכה ▼'}</span>
                </button>
                {openId === l.id && (
                  <ListEditor list={l} qs={qs} students={students} aiEnabled={data.aiEnabled} onChanged={load} onDeleted={() => setOpenId(null)} />
                )}
              </div>
            );
          })}
        </div>
      )}
      {creating && (
        <ListSettingsModal
          title="רשימה חדשה"
          students={students}
          onClose={() => setCreating(false)}
          onSave={async (body) => {
            const res = await api<{ id: string }>(`/api/family/word-lists${qs}`, { method: 'POST', body });
            await load();
            setOpenId(res.id);
          }}
        />
      )}
    </Section>
  );
}

function ListEditor({
  list,
  qs,
  students,
  aiEnabled,
  onChanged,
  onDeleted,
}: {
  list: WordList;
  qs: string;
  students: StudentSummary[];
  aiEnabled: boolean;
  onChanged: () => Promise<void>;
  onDeleted: () => void;
}) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingSettings, setEditingSettings] = useState(false);
  const incomplete = list.words.filter((w) => !w.hebrew || !w.exampleEn || !w.exampleHe).length;

  async function run(label: string, fn: () => Promise<void>) {
    setBusy(label);
    setError(null);
    setNote(null);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'משהו השתבש');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="px-4 pb-4 space-y-4 border-t border-slate-200 pt-4">
      <ErrorNote message={error} />
      {note && <div className="text-sm font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">{note}</div>}

      {/* add words */}
      <div>
        <label className="block text-xs font-bold text-slate-600 mb-1">הוספת מילים – מילה בכל שורה. אפשר גם עם תרגום: apple - תפוח</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          dir="ltr"
          placeholder={'apple\nbanana - בננה\nbecause'}
          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium focus:outline-none focus:border-indigo-500 font-english"
        />
        <div className="flex flex-wrap gap-2 mt-2">
          <Btn
            variant="primary"
            disabled={!text.trim() || !!busy}
            onClick={() =>
              run('add', async () => {
                const r = await api<{ added: number; duplicates: number; invalid: string[] }>(
                  `/api/family/word-lists/${list.id}/words${qs}`,
                  { method: 'POST', body: { text } },
                );
                setText('');
                await onChanged();
                const parts = [`נוספו ${r.added} מילים`];
                if (r.duplicates) parts.push(`${r.duplicates} כבר היו ברשימה`);
                if (r.invalid.length) parts.push(`לא נוספו (לא באנגלית): ${r.invalid.join(', ')}`);
                setNote(parts.join(' · '));
              })
            }
          >
            {busy === 'add' ? 'מוסיף...' : 'הוסף מילים'}
          </Btn>
          {incomplete > 0 && (
            <Btn
              disabled={!aiEnabled || !!busy}
              title={aiEnabled ? undefined : 'צריך להגדיר ANTHROPIC_API_KEY בשרת'}
              onClick={() =>
                run('ai', async () => {
                  const r = await api<{ completed: number; remaining: number }>(`/api/family/word-lists/${list.id}/enrich${qs}`, {
                    method: 'POST',
                  });
                  await onChanged();
                  setNote(
                    `✨ הושלמו ${r.completed} מילים – כדאי לעבור עליהן ולתקן אם צריך` +
                      (r.remaining ? ` · נשארו עוד ${r.remaining}, לחצו שוב` : ''),
                  );
                })
              }
            >
              {busy === 'ai' ? '✨ משלים... (עד דקה)' : `✨ השלמה אוטומטית (${incomplete})`}
            </Btn>
          )}
        </div>
        {!aiEnabled && incomplete > 0 && (
          <div className="text-[11px] text-slate-500 mt-1">השלמה אוטומטית לא מוגדרת בשרת – אפשר למלא ידנית.</div>
        )}
      </div>

      {/* words */}
      {list.words.length > 0 && (
        <div className="space-y-2">
          {list.words.map((w) => (
            <WordEditor key={w.id} word={w} qs={qs} onChanged={onChanged} />
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
        <Btn onClick={() => setEditingSettings(true)}>⚙️ שם / למי</Btn>
        <Btn
          variant="danger"
          disabled={!!busy}
          onClick={() => {
            if (!window.confirm(`למחוק את הרשימה "${list.title}" ואת כל המילים שבה?`)) return;
            void run('delete', async () => {
              await api(`/api/family/word-lists/${list.id}${qs}`, { method: 'DELETE' });
              onDeleted();
              await onChanged();
            });
          }}
        >
          🗑️ מחיקת הרשימה
        </Btn>
      </div>

      {editingSettings && (
        <ListSettingsModal
          title="הגדרות רשימה"
          initial={{ title: list.title, studentId: list.studentId }}
          students={students}
          onClose={() => setEditingSettings(false)}
          onSave={async (body) => {
            await api(`/api/family/word-lists/${list.id}${qs}`, { method: 'PATCH', body });
            await onChanged();
          }}
        />
      )}
    </div>
  );
}

function WordEditor({ word, qs, onChanged }: { word: WordRow; qs: string; onChanged: () => Promise<void> }) {
  const [f, setF] = useState({ word: word.word, hebrew: word.hebrew, emoji: word.emoji, exampleEn: word.exampleEn, exampleHe: word.exampleHe });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirty =
    f.word !== word.word || f.hebrew !== word.hebrew || f.emoji !== word.emoji || f.exampleEn !== word.exampleEn || f.exampleHe !== word.exampleHe;

  useEffect(() => {
    setF({ word: word.word, hebrew: word.hebrew, emoji: word.emoji, exampleEn: word.exampleEn, exampleHe: word.exampleHe });
  }, [word]);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await api(`/api/family/words/${word.id}${qs}`, { method: 'PATCH', body: f });
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה');
    } finally {
      setBusy(false);
    }
  }

  const input = (key: keyof typeof f, placeholder: string, opts: { dir?: 'ltr' | 'rtl'; className?: string } = {}) => (
    <input
      value={f[key]}
      onChange={(e) => setF({ ...f, [key]: e.target.value })}
      placeholder={placeholder}
      dir={opts.dir}
      aria-label={placeholder}
      className={`px-2.5 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 ${opts.className ?? ''}`}
    />
  );

  return (
    <div className={`rounded-xl border p-2.5 ${word.aiGenerated ? 'border-violet-300 bg-violet-50/40' : 'border-slate-200 bg-slate-50/50'}`}>
      <div className="grid grid-cols-[3.5rem_1fr_1fr] sm:grid-cols-[3.5rem_9rem_1fr_1fr_1fr] gap-1.5">
        {input('emoji', 'אימוג׳י', { className: 'text-center text-lg' })}
        {input('word', 'מילה', { dir: 'ltr', className: 'font-english font-bold' })}
        {input('hebrew', 'תרגום')}
        {input('exampleEn', 'Example sentence', { dir: 'ltr', className: 'col-span-3 sm:col-span-1 font-english' })}
        {input('exampleHe', 'תרגום המשפט', { className: 'col-span-3 sm:col-span-1' })}
      </div>
      <div className="flex items-center justify-between mt-1.5">
        <div className="text-[11px]">
          {word.aiGenerated && <span className="font-bold text-violet-700">✨ הושלם אוטומטית – כדאי לבדוק</span>}
          {error && <span className="font-bold text-rose-700">{error}</span>}
        </div>
        <div className="flex gap-1">
          {(dirty || word.aiGenerated) && (
            <Btn variant={dirty ? 'primary' : 'success'} className="!py-1 !px-2.5 text-xs" disabled={busy} onClick={save}>
              {dirty ? 'שמור' : '✓ אישור'}
            </Btn>
          )}
          <Btn
            variant="ghost"
            className="!py-1 !px-2 text-xs !text-rose-600"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await api(`/api/family/words/${word.id}${qs}`, { method: 'DELETE' });
                await onChanged();
              } catch (err) {
                setError(err instanceof Error ? err.message : 'שגיאה');
                setBusy(false);
              }
            }}
          >
            🗑️
          </Btn>
        </div>
      </div>
    </div>
  );
}

function ListSettingsModal({
  title,
  initial,
  students,
  onClose,
  onSave,
}: {
  title: string;
  initial?: { title: string; studentId: string | null };
  students: StudentSummary[];
  onClose: () => void;
  onSave: (body: { title: string; studentId: string | null }) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.title ?? '');
  const [studentId, setStudentId] = useState<string>(initial?.studentId ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <Modal title={title} onClose={onClose}>
      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          try {
            await onSave({ title: name, studentId: studentId || null });
            onClose();
          } catch (err) {
            setError(err instanceof Error ? err.message : 'משהו השתבש');
            setBusy(false);
          }
        }}
      >
        <Field label="שם הרשימה" value={name} onChange={(e) => setName(e.target.value)} placeholder="למשל: יחידה 3 – Animals" maxLength={60} autoFocus />
        <label className="block">
          <span className="block text-xs font-bold text-slate-600 mb-1">למי הרשימה?</span>
          <select
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:outline-none focus:border-indigo-500 bg-white"
          >
            <option value="">כל הילדים</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.displayName}
              </option>
            ))}
          </select>
        </label>
        <ErrorNote message={error} />
        <div className="flex gap-2 justify-end">
          <Btn onClick={onClose}>ביטול</Btn>
          <Btn type="submit" variant="primary" disabled={busy || !name.trim()}>
            {busy ? 'שומר...' : 'שמור'}
          </Btn>
        </div>
      </form>
    </Modal>
  );
}
