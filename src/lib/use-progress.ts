'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type ProgressData = Record<string, unknown>;
type Op = (data: ProgressData) => ProgressData;
export type SaveStatus = 'saved' | 'saving' | 'error';

const RETRY_MS = 5000;

/**
 * Student progress for React pages, saved with the same versioned API the game uses.
 * Changes are kept as operations (e.g. "add 3 coins"), so if the server copy changed
 * meanwhile (409: another device, a parent reset) they are re-applied on top of it
 * instead of overwriting it.
 */
export function useProgress(initial: { data: ProgressData; version: number }, options: { pollMs?: number } = {}) {
  const base = useRef(initial);
  const pending = useRef<Op[]>([]);
  const saving = useRef(false);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [data, setData] = useState<ProgressData>(initial.data);
  const [status, setStatus] = useState<SaveStatus>('saved');
  const [remoteChanges, setRemoteChanges] = useState(0); // bumps when another device / a parent changed progress

  const current = () => pending.current.reduce((d, op) => op(d), base.current.data);

  const inflight = useRef<Promise<void> | null>(null);

  /**
   * Sends pending changes. If a save is already running, waits for it and then sends
   * whatever is still pending — so `await flush()` means "everything is on the server"
   * (or the save failed), which callers rely on before navigating away.
   */
  const flush = useCallback((): Promise<void> => {
    if (inflight.current) {
      return inflight.current.then(() => (pending.current.length && !retryTimer.current ? flush() : undefined));
    }
    if (pending.current.length === 0) return Promise.resolve();
    inflight.current = saveLoop().finally(() => {
      inflight.current = null;
    });
    return inflight.current;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveLoop(): Promise<void> {
    saving.current = true;
    setStatus('saving');
    try {
      while (pending.current.length) {
        const sentOps = pending.current.length;
        const payload = current();
        const body = JSON.stringify({ data: payload, baseVersion: base.current.version });
        const res = await fetch('/api/me/progress', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body,
          keepalive: body.length < 60_000, // browsers cap keepalive bodies at 64KB
        });
        if (res.status === 401) {
          window.location.href = '/login?expired=1';
          return;
        }
        if (res.status === 409) {
          const { current: server } = (await res.json()) as { current: { data: ProgressData; version: number } };
          base.current = { data: server.data, version: server.version };
          setData(current()); // our ops re-applied on the newer server copy
          continue;
        }
        if (!res.ok) throw new Error(`save failed ${res.status}`);
        const { version, coins } = (await res.json()) as { version: number; coins?: number };
        base.current = { data: typeof coins === 'number' ? { ...payload, coins } : payload, version };
        pending.current = pending.current.slice(sentOps);
        setData(current());
      }
      setStatus('saved');
    } catch {
      setStatus('error');
      retryTimer.current ??= setTimeout(() => {
        retryTimer.current = null;
        void flush();
      }, RETRY_MS);
    } finally {
      saving.current = false;
    }
  }

  const mutate = useCallback(
    (op: Op) => {
      pending.current.push(op);
      setData(current());
      void flush();
    },
    [flush],
  );

  // Try to send anything left when the tab is hidden/closed
  useEffect(() => {
    const onHide = () => document.visibilityState === 'hidden' && void flush();
    document.addEventListener('visibilitychange', onHide);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, [flush]);

  // Optional polling: adopt changes made elsewhere when we have nothing unsaved
  useEffect(() => {
    if (!options.pollMs) return;
    const check = async () => {
      if (document.visibilityState !== 'visible' || inflight.current || pending.current.length) return;
      try {
        const res = await fetch('/api/me/progress', { cache: 'no-store' });
        if (res.status === 401) {
          window.location.href = '/login?expired=1';
          return;
        }
        if (!res.ok) return;
        const server = (await res.json()) as { data: ProgressData; version: number };
        if (server.version > base.current.version && !inflight.current && !pending.current.length) {
          base.current = { data: server.data, version: server.version };
          setData(server.data);
          setRemoteChanges((n) => n + 1);
        }
      } catch {
        /* offline: try again next tick */
      }
    };
    const t = setInterval(check, options.pollMs);
    window.addEventListener('focus', check);
    return () => {
      clearInterval(t);
      window.removeEventListener('focus', check);
    };
  }, [options.pollMs]);

  return { data, status, mutate, flush, remoteChanges, hasPending: () => pending.current.length > 0 };
}
