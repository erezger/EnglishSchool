/**
 * Practice modules a parent can turn on/off per kid. Shared by client and server.
 * (The parent-sent mastery check is not a module: it is always available when sent.)
 */
export const MODULES = [
  { id: 'daily', title: '5 דקות ביום', icon: '⏰' },
  { id: 'spell', title: 'שומעים ומאייתים', icon: '🐝' },
  { id: 'dictation', title: 'הכתבה', icon: '✍️' },
  { id: 'reading', title: 'קוראים ומבינים', icon: '📖' },
  { id: 'speaking', title: 'אומרים בקול (מיקרופון)', icon: '🎤' },
  { id: 'grammar', title: 'דקדוק', icon: '📘' },
  { id: 'placement', title: 'מבחן מיקום', icon: '🧭' },
] as const;

export type ModuleId = (typeof MODULES)[number]['id'];
export const GOAL_OPTIONS = [0, 5, 10, 15, 20, 30] as const;
export type KidSettings = { disabledModules: ModuleId[]; dailyGoalMinutes: number };

const IDS = MODULES.map((m) => m.id) as readonly string[];

export function cleanSettings(raw: unknown): KidSettings {
  const r = (raw && typeof raw === 'object' ? raw : {}) as { disabledModules?: unknown; dailyGoalMinutes?: unknown };
  const disabled = Array.isArray(r.disabledModules)
    ? [...new Set(r.disabledModules.filter((m): m is ModuleId => typeof m === 'string' && IDS.includes(m)))]
    : [];
  const goal = Number(r.dailyGoalMinutes);
  return { disabledModules: disabled, dailyGoalMinutes: (GOAL_OPTIONS as readonly number[]).includes(goal) ? goal : 0 };
}

export function moduleEnabled(settings: KidSettings, id: ModuleId): boolean {
  return !settings.disabledModules.includes(id);
}
