import { randomBytes, scrypt as scryptCb, timingSafeEqual, type ScryptOptions } from 'node:crypto';

// scrypt is built into Node — no external dependency. Format: scrypt$N$r$p$salt$hash (base64url)
const N = 1 << 15;
const R = 8;
const P = 1;
const KEYLEN = 64;
const MAXMEM = 128 * N * R * 2;

function scrypt(secret: string, salt: Buffer, keylen: number, opts: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCb(secret, salt, keylen, opts, (err, key) => (err ? reject(err) : resolve(key)));
  });
}

export async function hashSecret(secret: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(secret, salt, KEYLEN, { N, r: R, p: P, maxmem: MAXMEM });
  return ['scrypt', N, R, P, salt.toString('base64url'), key.toString('base64url')].join('$');
}

export async function verifySecret(secret: string, stored: string | null): Promise<boolean> {
  if (!stored) return false;
  const [algo, n, r, p, saltB64, keyB64] = stored.split('$');
  if (algo !== 'scrypt' || !saltB64 || !keyB64) return false;
  const expected = Buffer.from(keyB64, 'base64url');
  const actual = await scrypt(secret, Buffer.from(saltB64, 'base64url'), expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: 128 * Number(n) * Number(r) * 2,
  });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

// Used when a username does not exist, so the response time does not reveal it.
let dummyHash: Promise<string> | null = null;
export async function burnVerifyTime(secret: string): Promise<void> {
  dummyHash ??= hashSecret('dummy-password-for-timing');
  await verifySecret(secret, await dummyHash);
}

/* ---------- validation ---------- */

export function normalizeUsername(raw: unknown): string {
  return String(raw ?? '').normalize('NFC').trim().toLowerCase();
}

/** Letters (incl. Hebrew), digits, _ . - ; 2-32 chars. */
export function isValidUsername(username: string): boolean {
  return /^[\p{L}\p{N}_.-]{2,32}$/u.test(username);
}

export function isValidPin(pin: unknown): pin is string {
  return typeof pin === 'string' && /^\d{4}$/.test(pin);
}

export function isValidPassword(pw: unknown): pw is string {
  return typeof pw === 'string' && pw.length >= 8 && pw.length <= 128;
}

export function cleanDisplayName(raw: unknown): string | null {
  const name = String(raw ?? '').normalize('NFC').trim().replace(/\s+/g, ' ');
  return name.length >= 1 && name.length <= 40 ? name : null;
}
