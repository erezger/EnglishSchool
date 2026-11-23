'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ALL_WORDS, LEVELS, type Level } from '@/content/game';
import { initGameVoices, onVoicesChanged, setSlowSpeech, stopGameSpeech } from '@/lib/game-speech';
import type { KidSettings } from '@/lib/modules';
import { playSfx, type Sfx } from '@/lib/sfx';
import { logActivity } from '@/lib/use-activity';
import { useProgress, type ProgressData, type SaveStatus } from '@/lib/use-progress';

export type Tab = 'learn' | 'blend' | 'spell' | 'quiz' | 'challenges';

type Toast = { id: number; text: string; icon: string };
type CoinPop = { id: number; amount: number };

type GameCtx = {
  user: { id: string; displayName: string };
  settings: KidSettings;
  data: ProgressData;
  status: SaveStatus;
  coins: number;
  list: (key: string) => string[];
  mutate: (op: (d: ProgressData) => ProgressData) => void;
  flush: () => Promise<void>;
  award: (amount: number, message?: string) => void;
  recordMistake: (word: string) => void;
  markWordRead: (word: string, withReward?: boolean) => void;
  toast: (text: string, icon?: string) => void;
  sfx: (type: Sfx) => void;
  confetti: () => void;
  level: Level;
  selectLevel: (id: number) => void;
  tab: Tab;
  setTab: (t: Tab) => void;
  modal: null | 'abc' | 'voice' | 'shop';
  setModal: (m: null | 'abc' | 'voice' | 'shop') => void;
  leave: (href: string) => Promise<void>;
  // effects (rendered by GameApp)
  toasts: Toast[];
  coinPops: CoinPop[];
  confettiKey: number;
};

const Ctx = createContext<GameCtx | null>(null);
export const useGame = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useGame outside GameProvider');
  return c;
};

const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
const utcToday = () => new Date().toISOString().slice(0, 10); // same "day" as the original game

export function GameProvider({
  user,
  settings,
  progress,
  children,
}: {
  user: { id: string; displayName: string };
  settings: KidSettings;
  progress: { data: ProgressData; version: number };
  children: ReactNode;
}) {
  const { data, status, mutate, flush, remoteChanges } = useProgress(progress, { pollMs: 5000 });
  const firstOpen = LEVELS.find((l) => !strings(progress.data.completedLevels).map(Number).includes(l.id)) ?? LEVELS[0];
  const [levelId, setLevelId] = useState(firstOpen.id);
  const [tab, setTabState] = useState<Tab>('learn');
  const [modal, setModal] = useState<null | 'abc' | 'voice' | 'shop'>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [coinPops, setCoinPops] = useState<CoinPop[]>([]);
  const [confettiKey, setConfettiKey] = useState(0);
  const seq = useRef(0);
  const activity = useRef({ answers: 0, correct: 0, seconds: 0, lastTouch: Date.now() });

  const muted = !!data.sfxMuted;
  const sfx = useCallback((t: Sfx) => playSfx(t, muted), [muted]);
  const toast = useCallback((text: string, icon = '✨') => {
    const id = ++seq.current;
    setToasts([{ id, text, icon }]);
    setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== id)), 2400);
  }, []);
  const confetti = useCallback(() => setConfettiKey((k) => k + 1), []);

  const award = useCallback(
    (amount: number, message?: string) => {
      if (!amount || amount <= 0) return;
      activity.current.answers++;
      activity.current.correct++;
      mutate((d) => ({ ...d, coins: (Number(d.coins) || 0) + amount }));
      sfx('coin');
      const id = ++seq.current;
      setCoinPops((p) => [...p, { id, amount }]);
      setTimeout(() => setCoinPops((p) => p.filter((x) => x.id !== id)), 1200);
      if (message) toast(`${message} (+${amount} 🪙)`, '🪙');
    },
    [mutate, sfx, toast],
  );

  const recordMistake = useCallback(
    (word: string) => {
      activity.current.answers++;
      const w = word.toLowerCase();
      if (!ALL_WORDS[w]) return;
      mutate((d) => (strings(d.mistakes).includes(w) ? d : { ...d, mistakes: [...strings(d.mistakes), w] }));
    },
    [mutate],
  );

  const markWordRead = useCallback(
    (word: string, withReward = false) => {
      const w = word.toLowerCase();
      if (strings(data.readWords).includes(w)) return;
      mutate((d) => (strings(d.readWords).includes(w) ? d : { ...d, readWords: [...strings(d.readWords), w] }));
      if (withReward) award(3, `קראת מילה חדשה: ${w}!`);
    },
    [data.readWords, mutate, award],
  );

  const selectLevel = useCallback((id: number) => {
    setLevelId(id);
    setTabState('learn');
  }, []);
  const setTab = useCallback(
    (t: Tab) => {
      // from the sentences level, the tabs jump back to level 1 (except challenges) — like the original
      if (LEVELS.find((l) => l.id === levelId)?.isSentenceLevel && t !== 'challenges') setLevelId(1);
      setTabState(t);
    },
    [levelId],
  );

  const flushActivity = useCallback(() => {
    const a = activity.current;
    if (!a.answers && a.seconds < 15) return;
    logActivity('game', a.answers, a.correct, a.seconds);
    activity.current = { answers: 0, correct: 0, seconds: 0, lastTouch: a.lastTouch };
  }, []);

  const leave = useCallback(
    async (href: string) => {
      flushActivity();
      stopGameSpeech();
      await flush();
      window.location.assign(href);
    },
    [flush, flushActivity],
  );

  // voices + slow speech follow the saved settings
  useEffect(() => {
    const init = () => initGameVoices(String(data.preferredVoiceName ?? ''));
    init();
    onVoicesChanged(init);
  }, [data.preferredVoiceName]);
  useEffect(() => setSlowSpeech(!!data.slowSpeech), [data.slowSpeech]);

  // daily streak on first open of the day (same rule as the original)
  useEffect(() => {
    const today = utcToday();
    const last = typeof progress.data.lastActiveDate === 'string' ? progress.data.lastActiveDate : today;
    if (last === today) return;
    const diff = Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${last}T00:00:00Z`)) / 86_400_000);
    mutate((d) => ({ ...d, dailyStreak: diff === 1 ? (Number(d.dailyStreak) || 1) + 1 : 1, lastActiveDate: today }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // a parent reset / another device changed things
  useEffect(() => {
    if (remoteChanges > 0) toast('ההתקדמות עודכנה', '🔄');
  }, [remoteChanges, toast]);

  // activity: active time while visible and touched in the last minute
  useEffect(() => {
    const touch = () => (activity.current.lastTouch = Date.now());
    ['click', 'keydown', 'pointerdown'].forEach((e) => document.addEventListener(e, touch, { passive: true }));
    const tick = setInterval(() => {
      if (document.visibilityState === 'visible' && Date.now() - activity.current.lastTouch < 60_000) activity.current.seconds += 15;
    }, 15_000);
    const flushT = setInterval(flushActivity, 120_000);
    const onHide = () => document.visibilityState === 'hidden' && flushActivity();
    document.addEventListener('visibilitychange', onHide);
    return () => {
      ['click', 'keydown', 'pointerdown'].forEach((e) => document.removeEventListener(e, touch));
      clearInterval(tick);
      clearInterval(flushT);
      document.removeEventListener('visibilitychange', onHide);
    };
  }, [flushActivity]);

  const level = LEVELS.find((l) => l.id === levelId) ?? LEVELS[0];
  const value = useMemo<GameCtx>(
    () => ({
      user,
      settings,
      data,
      status,
      coins: Number(data.coins) || 0,
      list: (k) => strings(data[k]),
      mutate,
      flush,
      award,
      recordMistake,
      markWordRead,
      toast,
      sfx,
      confetti,
      level,
      selectLevel,
      tab,
      setTab,
      modal,
      setModal,
      leave,
      toasts,
      coinPops,
      confettiKey,
    }),
    [user, settings, data, status, mutate, flush, award, recordMistake, markWordRead, toast, sfx, confetti, level, selectLevel, tab, setTab, modal, leave, toasts, coinPops, confettiKey],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
