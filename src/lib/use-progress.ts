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
export function useProgress(initial: { data: ProgressData; version: number }) {
  const base = useRef(initial);
  const pending = useRef<Op[]>([]);
  const saving = useRef(false);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [data, setData] = useState<ProgressData>(initial.data);
  const [status, setStatus] = useState<SaveStatus>('saved');

  const current = () => pending.current.reduce((d, op) => op(d), base.current.data);

  const flush = useCallback(async (): Promise<void> => {
    if (saving.current || pending.current.length === 0) return;
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
        const { version } = (await res.json()) as { version: number };
        base.current = { data: payload, version };
        pending.current = pending.current.slice(sentOps);
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
  }, []);

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

  return { data, status, mutate, flush, hasPending: () => pending.current.length > 0 };
}
