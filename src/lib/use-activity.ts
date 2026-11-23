'use client';

import { useEffect, useRef } from 'react';

/** Fire-and-forget activity report (survives navigation thanks to keepalive). */
export function logActivity(module: string, answers: number, correct: number, seconds: number) {
  if (!answers && !seconds) return;
  void fetch('/api/me/activity', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ module, answers, correct, seconds: Math.round(seconds) }),
    keepalive: true,
  }).catch(() => {});
}

/**
 * Logs one practice round: the timer starts when `roundKey` changes (a new round),
 * and the round is logged once when `done` becomes true. Idle time is capped per round.
 */
export function useRoundActivity(module: string, roundKey: unknown, done: boolean, answers: number, correct: number) {
  const startedAt = useRef<number>(Date.now());
  const logged = useRef(false);

  useEffect(() => {
    startedAt.current = Date.now();
    logged.current = false;
  }, [roundKey]);

  useEffect(() => {
    if (!done || logged.current || !answers) return;
    logged.current = true;
    const seconds = Math.min((Date.now() - startedAt.current) / 1000, Math.max(60, answers * 90));
    logActivity(module, answers, correct, seconds);
  }, [done, answers, correct, module]);
}
