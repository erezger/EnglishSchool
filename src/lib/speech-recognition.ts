'use client';

/**
 * Thin wrapper around the browser's speech recognition (Chrome / Edge: webkitSpeechRecognition).
 * Note: in Chrome the audio is processed by Google's servers.
 */
type RecognitionResultList = ArrayLike<ArrayLike<{ transcript: string; confidence: number }>>;
type RecognitionLike = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onresult: ((e: { results: RecognitionResultList }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type RecognitionCtor = new () => RecognitionLike;

function ctor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function recognitionSupported(): boolean {
  return ctor() !== null;
}

export type ListenResult = { ok: true; alternatives: string[] } | { ok: false; error: 'no-speech' | 'not-allowed' | 'unsupported' | 'other' };

let active: RecognitionLike | null = null;

/** Listens for one short utterance (a word or phrase) and returns what was heard. */
export function listenOnce(lang = 'en-US', timeoutMs = 7000): Promise<ListenResult> {
  const C = ctor();
  if (!C) return Promise.resolve({ ok: false, error: 'unsupported' });
  active?.abort();
  return new Promise((resolve) => {
    const rec = new C();
    active = rec;
    let settled = false;
    const finish = (r: ListenResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (active === rec) active = null;
      resolve(r);
    };
    const timer = setTimeout(() => {
      rec.abort();
      finish({ ok: false, error: 'no-speech' });
    }, timeoutMs);
    rec.lang = lang;
    rec.interimResults = false;
    rec.maxAlternatives = 5;
    rec.continuous = false;
    rec.onresult = (e) => {
      const alts: string[] = [];
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i];
        for (let j = 0; j < r.length; j++) alts.push(r[j].transcript);
      }
      finish({ ok: true, alternatives: alts });
    };
    rec.onerror = (e) => {
      finish({ ok: false, error: e.error === 'no-speech' ? 'no-speech' : e.error === 'not-allowed' || e.error === 'service-not-allowed' ? 'not-allowed' : 'other' });
    };
    rec.onend = () => finish({ ok: false, error: 'no-speech' });
    try {
      rec.start();
    } catch {
      finish({ ok: false, error: 'other' });
    }
  });
}

export function stopListening() {
  active?.abort();
  active = null;
}

function levenshtein(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

const clean = (s: string) => s.toLowerCase().replace(/[^a-z' ]+/g, ' ').replace(/\s+/g, ' ').trim();

/** Did any recognised alternative say the target? Exact word match, or one letter off for longer words. */
export function heardTarget(alternatives: string[], target: string): boolean {
  const t = clean(target);
  const tolerance = t.replace(/ /g, '').length >= 5 ? 1 : 0;
  return alternatives.some((alt) => {
    const a = clean(alt);
    if (a === t || ` ${a} `.includes(` ${t} `)) return true;
    return a.split(' ').some((w) => levenshtein(w, t) <= tolerance) || levenshtein(a, t) <= tolerance;
  });
}
