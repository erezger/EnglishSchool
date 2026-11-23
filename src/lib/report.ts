import { DICTATION } from '@/content/dictation';
import { GRAMMAR } from '@/content/grammar';
import { SENTENCES } from '@/content/phonics';
import { weekActivity } from './activity';
import { recentChecks } from './checks';
import { getKidSettings } from './kid-settings';
import { query } from './db';
import { getProgress, summarize, type ProgressData } from './progress';

const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

function dictationText(id: string): string {
  if (id.startsWith('game:')) return SENTENCES.find((s) => `game:${s.id}` === id)?.text ?? id;
  for (const list of Object.values(DICTATION)) {
    const hit = list.find((s) => s.id === id);
    if (hit) return hit.text;
  }
  return 'משפט מרשימת מילים';
}

/** Weak spots worth practicing, from the kid's progress data. */
function weakSpots(data: ProgressData) {
  const spelling = Object.entries((data.spellingStats as Record<string, { w?: number; s?: number }>) ?? {})
    .filter(([, st]) => (st?.w ?? 0) > 0 && (st?.s ?? 0) < 3)
    .sort((a, b) => (b[1].w ?? 0) - (a[1].w ?? 0))
    .map(([w]) => w);
  const dictation = Object.entries((data.dictationStats as Record<string, { c?: number; w?: number }>) ?? {})
    .filter(([, st]) => (st?.c ?? 0) === 0 && (st?.w ?? 0) > 0)
    .map(([id]) => dictationText(id));
  const grammar = Object.entries((data.grammarStats as Record<string, { best?: number }>) ?? {})
    .filter(([, st]) => (st?.best ?? 0) < 80)
    .map(([id, st]) => ({ title: GRAMMAR.find((t) => t.id === id)?.title ?? id, best: st?.best ?? 0 }));
  return { spelling: spelling.slice(0, 20), mistakes: strings(data.mistakes).slice(0, 20), dictation: dictation.slice(0, 10), grammar };
}

export async function buildReport(studentId: string, familyId: string) {
  const suspicious = query<{ n: string }>(
    "SELECT count(*) AS n FROM audit_log WHERE action = 'coins.suspicious' AND target_id = $1 AND created_at > now() - interval '7 days'",
    [studentId],
  );
  const [activity, progress, settings, checks] = await Promise.all([
    weekActivity(studentId),
    getProgress(studentId),
    getKidSettings(studentId),
    recentChecks(familyId),
  ]);
  const data = progress?.data ?? {};
  const goal = settings.dailyGoalMinutes;
  return {
    days: activity.days,
    modules: activity.modules,
    goal,
    goalDaysMet: goal ? activity.days.filter((d) => d.minutes >= goal).length : null,
    summary: summarize(data),
    weak: weakSpots(data),
    checks: (checks.get(studentId) ?? []).filter((c) => c.status === 'done').slice(0, 3),
    suspiciousCoins: Number((await suspicious).rows[0]?.n ?? 0),
  };
}

export type Report = Awaited<ReturnType<typeof buildReport>>;
