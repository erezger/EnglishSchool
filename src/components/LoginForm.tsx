'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api, ApiError } from '@/lib/api-client';

type Mode = 'student' | 'parent';
type Recent = { username: string; displayName: string; role: Mode };

const RECENT_KEY = 'ec_recent_users';
const MAX_RECENT = 8;

function readRecent(): Recent[] {
  try {
    const list = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    return Array.isArray(list) ? list.filter((r) => r && typeof r.username === 'string') : [];
  } catch {
    return [];
  }
}

function writeRecent(list: Recent[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, MAX_RECENT)));
  } catch {
    /* private mode */
  }
}

function safeNext(next: string | undefined): string | null {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : null;
}

export default function LoginForm({
  initialMode,
  next,
  notice,
}: {
  initialMode: Mode;
  next?: string;
  notice?: string;
}) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [recent, setRecent] = useState<Recent[]>([]);
  const [picked, setPicked] = useState<Recent | null>(null);
  const [username, setUsername] = useState('');
  const [manual, setManual] = useState(false);
  const [pin, setPin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => setRecent(readRecent()), []);

  const recentForMode = recent.filter((r) => r.role === mode);
  const effectiveUsername = picked?.username ?? username;

  const submit = useCallback(
    async (secret: string) => {
      const user = effectiveUsername.trim();
      if (!user) {
        setError('נא להקליד שם משתמש');
        setPin('');
        return;
      }
      setBusy(true);
      setError(null);
      try {
        const res = await api<{ role: 'admin' | 'parent' | 'student'; displayName: string }>('/api/auth/login', {
          method: 'POST',
          body: { username: user, secret },
        });
        const role: Mode = res.role === 'student' ? 'student' : 'parent';
        const entry: Recent = { username: user.toLowerCase(), displayName: res.displayName, role };
        writeRecent([entry, ...readRecent().filter((r) => r.username !== entry.username)]);
        const target = role === 'student' ? '/' : (safeNext(next) ?? '/parent');
        window.location.assign(target); // full reload: fresh app state for the new user
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'משהו השתבש, נסו שוב');
        setPin('');
        setPassword('');
        setBusy(false);
      }
    },
    [effectiveUsername, next],
  );

  // PIN auto-submits at 4 digits
  useEffect(() => {
    if (mode === 'student' && pin.length === 4 && !busy) void submit(pin);
  }, [pin, mode, busy, submit]);

  // Physical keyboard for the PIN pad
  useEffect(() => {
    if (mode !== 'student') return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target.tagName === 'INPUT') return;
      if (/^\d$/.test(e.key)) setPin((p) => (p.length < 4 ? p + e.key : p));
      else if (e.key === 'Backspace') setPin((p) => p.slice(0, -1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode]);

  function switchMode(m: Mode) {
    setMode(m);
    setPicked(null);
    setManual(false);
    setPin('');
    setPassword('');
    setError(null);
  }

  function forget(r: Recent) {
    const list = readRecent().filter((x) => x.username !== r.username);
    writeRecent(list);
    setRecent(list);
  }

  const showPicker = mode === 'student' && !picked && !manual && recentForMode.length > 0;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-2 bg-white/90 border border-indigo-200 px-4 py-1.5 rounded-full text-sm font-extrabold text-indigo-700 shadow-sm mb-3">
            <span>✨</span>
            <span>אנגלית בקליק PRO</span>
          </div>
          <h1 className="text-3xl font-black text-slate-800">{mode === 'student' ? 'מי לומד/ת עכשיו? 🌟' : 'כניסת הורים 🔒'}</h1>
        </div>

        <div className="bg-white/95 rounded-3xl shadow-xl border border-indigo-100 p-5 sm:p-6">
          <div className="flex bg-slate-100 p-1 rounded-2xl gap-1 mb-5" role="tablist">
            {(['student', 'parent'] as const).map((m) => (
              <button
                key={m}
                role="tab"
                aria-selected={mode === m}
                onClick={() => switchMode(m)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-extrabold transition cursor-pointer ${
                  mode === m ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {m === 'student' ? '🧒 תלמיד/ה' : '👨‍👩‍👧 הורה / מורה'}
              </button>
            ))}
          </div>

          {notice && <div className="mb-4 text-sm font-bold text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">{notice}</div>}

          {showPicker ? (
            <div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {recentForMode.map((r) => (
                  <div key={r.username} className="relative">
                    <button
                      onClick={() => {
                        setPicked(r);
                        setError(null);
                      }}
                      className="w-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl p-4 font-black text-lg shadow-md hover:scale-[1.03] active:scale-95 transition cursor-pointer"
                    >
                      <div className="text-3xl mb-1">{r.displayName.slice(0, 1)}</div>
                      <div className="truncate">{r.displayName}</div>
                    </button>
                    <button
                      onClick={() => forget(r)}
                      title="הסר מהרשימה"
                      aria-label={`הסר את ${r.displayName} מהרשימה`}
                      className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-white border border-slate-300 text-slate-500 text-xs font-bold shadow cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setManual(true)}
                className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-300 text-slate-600 font-bold text-sm hover:bg-slate-50 cursor-pointer"
              >
                ➕ משתמש/ת אחר/ת
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (mode === 'parent') void submit(password);
                else if (pin.length === 4) void submit(pin);
              }}
            >
              {picked ? (
                <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-2xl px-4 py-3 mb-4">
                  <span className="font-black text-indigo-900 text-lg">{picked.displayName}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setPicked(null);
                      setPin('');
                      setError(null);
                    }}
                    className="text-xs font-bold text-indigo-700 underline cursor-pointer"
                  >
                    לא אני
                  </button>
                </div>
              ) : (
                <label className="block mb-4">
                  <span className="block text-sm font-bold text-slate-700 mb-1">שם משתמש</span>
                  <input
                    autoFocus
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    dir="auto"
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:outline-none text-lg font-bold"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && mode === 'parent') {
                        e.preventDefault();
                        passwordRef.current?.focus();
                      }
                    }}
                  />
                </label>
              )}

              {mode === 'student' ? (
                <PinPad pin={pin} setPin={setPin} disabled={busy} />
              ) : (
                <>
                  <label className="block mb-4">
                    <span className="block text-sm font-bold text-slate-700 mb-1">סיסמה</span>
                    <input
                      ref={passwordRef}
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      dir="ltr"
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:outline-none text-lg"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={busy || !password}
                    className="w-full py-3 rounded-2xl bg-gradient-to-l from-indigo-600 to-purple-600 text-white font-black text-lg shadow-md disabled:opacity-50 cursor-pointer"
                  >
                    {busy ? 'מתחבר...' : 'כניסה'}
                  </button>
                </>
              )}
            </form>
          )}

          {error && (
            <div role="alert" className="mt-4 text-sm font-bold text-rose-800 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 animate-shake">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PinPad({ pin, setPin, disabled }: { pin: string; setPin: (fn: (p: string) => string) => void; disabled: boolean }) {
  const press = (d: string) => setPin((p) => (p.length < 4 ? p + d : p));
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
  return (
    <div>
      <div className="text-center text-sm font-bold text-slate-700 mb-2">הקוד הסודי שלי</div>
      <div className="flex justify-center gap-3 mb-5" dir="ltr" aria-label={`${pin.length} מתוך 4 ספרות`}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-12 h-14 rounded-2xl border-2 flex items-center justify-center text-3xl font-black transition ${
              i < pin.length ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white'
            }`}
          >
            {i < pin.length ? '●' : ''}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2.5" dir="ltr">
        {keys.map((k) => (
          <PadKey key={k} label={k} onClick={() => press(k)} disabled={disabled} />
        ))}
        <PadKey label="⌫" onClick={() => setPin((p) => p.slice(0, -1))} disabled={disabled} subtle aria="מחק" />
        <PadKey label="0" onClick={() => press('0')} disabled={disabled} />
        <PadKey label="✕" onClick={() => setPin(() => '')} disabled={disabled} subtle aria="נקה" />
      </div>
    </div>
  );
}

function PadKey({
  label,
  onClick,
  disabled,
  subtle,
  aria,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
  subtle?: boolean;
  aria?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={aria ?? label}
      className={`h-16 rounded-2xl text-2xl font-black transition active:scale-95 cursor-pointer disabled:opacity-50 ${
        subtle ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' : 'bg-white border-2 border-slate-200 text-slate-800 hover:border-indigo-400 hover:bg-indigo-50 shadow-sm'
      }`}
    >
      {label}
    </button>
  );
}
