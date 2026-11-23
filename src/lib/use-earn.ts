'use client';

import { useCallback, useRef } from 'react';
import { canEarnToday } from './earning';
import { todayStr } from './review';

/**
 * For practice pages: `earnToday(key, amount)` returns what this item will pay now — `amount` the
 * first time today, 0 after that. Pass the same key to `payDaily` inside the progress op, which is
 * what really guards against paying twice.
 */
export function useEarnToday(data: Record<string, unknown>) {
  const ref = useRef(data);
  ref.current = data;
  const claimed = useRef(new Set<string>());
  return useCallback((key: string, amount: number): number => {
    const tag = `${todayStr()}:${key}`;
    if (amount <= 0 || claimed.current.has(tag) || !canEarnToday(ref.current, key)) return 0;
    claimed.current.add(tag);
    return amount;
  }, []);
}
