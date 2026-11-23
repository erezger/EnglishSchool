'use client';

import { LETTER_BANK } from '@/content/game';

/**
 * The game's English speech (same behaviour as the original): best English voice first,
 * a saved preferred voice, normal / slow speed, letter names and phonics sounds.
 */
let voices: SpeechSynthesisVoice[] = [];
let selected: SpeechSynthesisVoice | null = null;
let slow = false;

const supported = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

export function initGameVoices(preferredName: string) {
  if (!supported()) return;
  const score = (v: SpeechSynthesisVoice) => {
    const n = (v.name || '').toLowerCase();
    let s = 0;
    if (v.lang === 'en-US') s += 4;
    else if (v.lang === 'en-GB') s += 3;
    if (/google|samantha|aria|natural|jenny/.test(n)) s += 5;
    if (v.localService) s += 1;
    return s;
  };
  voices = (window.speechSynthesis.getVoices() || []).filter((v) => v.lang?.toLowerCase().startsWith('en')).sort((a, b) => score(b) - score(a));
  selected = voices.find((v) => v.name === preferredName) ?? voices[0] ?? null;
}

export function onVoicesChanged(cb: () => void) {
  if (supported()) window.speechSynthesis.onvoiceschanged = cb;
}

export const gameVoices = () => voices.slice(0, 12);
export const selectedVoiceName = () => selected?.name ?? '';
export function selectVoice(name: string) {
  selected = voices.find((v) => v.name === name) ?? selected;
}
export function setSlowSpeech(value: boolean) {
  slow = value;
}

function utter(text: string, multiplier: number) {
  const u = new SpeechSynthesisUtterance(text);
  u.lang = selected?.lang ?? 'en-US';
  if (selected) u.voice = selected;
  u.rate = Math.max(0.5, Math.min(1.2, (slow ? 0.68 : 0.92) * multiplier));
  u.pitch = 1.04;
  u.volume = 1;
  return u;
}

function say(parts: [string, number][]) {
  if (!supported()) return;
  try {
    window.speechSynthesis.cancel();
    window.speechSynthesis.resume();
    for (const [text, m] of parts) window.speechSynthesis.speak(utter(text, m));
  } catch {
    /* ignore */
  }
}

export const speakWord = (text: string) => text && say([[String(text), 1]]);
export function speakLetterName(key: string) {
  const info = LETTER_BANK[key.toLowerCase()];
  say([[info ? info.ttsLetterName : key.toUpperCase(), 0.92]]);
}
export function speakPhonics(key: string, withExample = false) {
  const info = LETTER_BANK[key.toLowerCase()];
  const parts: [string, number][] = [[info ? info.phoneme : key, 0.85]];
  if (withExample && info?.exampleWord) parts.push([info.exampleWord, 0.95]);
  say(parts);
}
export function stopGameSpeech() {
  if (supported()) window.speechSynthesis.cancel();
}
