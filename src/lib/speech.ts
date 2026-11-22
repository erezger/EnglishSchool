'use client';

/**
 * Browser text-to-speech for English practice (Web Speech API).
 * Same letter-name spellings the original game uses (src/legacy/app.js LETTER_BANK).
 */
export const LETTER_NAMES: Record<string, string> = {
  a: 'Ay', b: 'Bee', c: 'See', d: 'Dee', e: 'Ee', f: 'Eff', g: 'Jee', h: 'Aitch', i: 'Eye', j: 'Jay',
  k: 'Kay', l: 'Ell', m: 'Em', n: 'En', o: 'Oh', p: 'Pee', q: 'Cue', r: 'Are', s: 'Ess', t: 'Tee',
  u: 'You', v: 'Vee', w: 'Double you', x: 'Ex', y: 'Why', z: 'Zee',
};

export function speechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

let preferredVoiceName = '';
export function setPreferredVoice(name: string) {
  preferredVoiceName = name;
}

function pickVoice(): SpeechSynthesisVoice | null {
  if (!speechSupported()) return null;
  const voices = window.speechSynthesis.getVoices().filter((v) => /^en[-_]/i.test(v.lang));
  if (!voices.length) return null;
  return (
    voices.find((v) => v.name === preferredVoiceName) ??
    voices.find((v) => /en[-_]US/i.test(v.lang) && /google|natural|samantha|aria|jenny/i.test(v.name)) ??
    voices.find((v) => /en[-_]US/i.test(v.lang)) ??
    voices[0]
  );
}

function utterance(text: string, rate: number): SpeechSynthesisUtterance {
  const u = new SpeechSynthesisUtterance(text);
  const voice = pickVoice();
  if (voice) u.voice = voice;
  u.lang = voice?.lang ?? 'en-US';
  u.rate = rate;
  u.pitch = 1;
  return u;
}

let sequenceId = 0;

export function stopSpeaking() {
  sequenceId++;
  if (speechSupported()) window.speechSynthesis.cancel();
}

/** Speaks one piece of text. Resolves when done (or immediately if unsupported). */
export function speak(text: string, { rate = 0.9, interrupt = true } = {}): Promise<void> {
  if (!speechSupported() || !text) return Promise.resolve();
  if (interrupt) stopSpeaking();
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(safety);
      resolve();
    };
    // Some browsers/systems never fire onend (e.g. no voices installed) — never let the game hang on it.
    const safety = setTimeout(finish, 1200 + text.length * 180 / rate);
    const u = utterance(text, rate);
    u.onend = finish;
    u.onerror = finish;
    window.speechSynthesis.resume();
    window.speechSynthesis.speak(u);
  });
}

export function speakLetter(ch: string, rate = 0.95) {
  const name = LETTER_NAMES[ch.toLowerCase()];
  if (name) void speak(name, { rate });
}

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * "boy … Bee … Oh … Why … boy", calling onLetter(index) as each letter is spoken
 * (index = position in the word; -1 when done). Cancelled by stopSpeaking().
 */
export async function spellOut(word: string, onLetter: (index: number) => void, { slow = false } = {}): Promise<void> {
  stopSpeaking();
  const id = sequenceId;
  const rate = slow ? 0.7 : 0.85;
  await speak(word, { rate, interrupt: false });
  for (let i = 0; i < word.length; i++) {
    if (id !== sequenceId) return;
    const ch = word[i];
    const name = LETTER_NAMES[ch.toLowerCase()];
    if (!name) {
      await pause(350); // space / hyphen / apostrophe
      continue;
    }
    await pause(slow ? 260 : 160);
    if (id !== sequenceId) return;
    onLetter(i);
    await speak(name, { rate: slow ? 0.75 : 0.9, interrupt: false });
  }
  if (id !== sequenceId) return;
  onLetter(-1);
  await pause(250);
  if (id === sequenceId) await speak(word, { rate, interrupt: false });
}

/** Voices load asynchronously in Chrome; call once on mount. */
export function warmUpVoices(onReady?: () => void) {
  if (!speechSupported()) return;
  if (window.speechSynthesis.getVoices().length) onReady?.();
  window.speechSynthesis.onvoiceschanged = () => onReady?.();
}
