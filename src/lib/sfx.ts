'use client';

/** Web Audio sound effects of the game (same tones as the original). */
export type Sfx = 'pop' | 'coin' | 'wrong' | 'fanfare';

let ctx: AudioContext | null = null;
function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const C = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!C) return null;
  ctx ??= new C();
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function tone(c: AudioContext, type: OscillatorType, freq: number, start: number, dur: number, vol: number, endFreq?: number, linear = false) {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (endFreq) {
    if (linear) osc.frequency.linearRampToValueAtTime(endFreq, start + dur * 0.9);
    else osc.frequency.exponentialRampToValueAtTime(endFreq, start + dur * 0.8);
  }
  gain.gain.setValueAtTime(vol, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(start);
  osc.stop(start + dur + 0.01);
}

export function playSfx(type: Sfx, muted: boolean) {
  if (muted) return;
  try {
    const c = audio();
    if (!c) return;
    const now = c.currentTime;
    if (type === 'pop') tone(c, 'sine', 520, now, 0.1, 0.14, 780);
    else if (type === 'coin') [987.77, 1318.51].forEach((f, i) => tone(c, 'triangle', f, now + i * 0.075, 0.24, 0.18));
    else if (type === 'wrong') tone(c, 'sawtooth', 220, now, 0.22, 0.1, 160, true);
    else if (type === 'fanfare') [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(c, 'triangle', f, now + i * 0.09, 0.3, 0.16));
  } catch {
    /* autoplay restrictions */
  }
}
