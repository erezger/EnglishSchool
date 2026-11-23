import { enrichWords } from './ai';
import { audit } from './audit';
import { query, withTransaction } from './db';
import { isUuid } from './ids';
import { HttpError } from './http';
import type { SessionUser } from './session';

export const MAX_LISTS_PER_FAMILY = 100;
export const MAX_WORDS_PER_LIST = 300;
const MAX_ENRICH_PER_CALL = 30;

export type WordRow = {
  id: string;
  word: string;
  hebrew: string;
  emoji: string;
  exampleEn: string;
  exampleHe: string;
  aiGenerated: boolean;
};
export type WordList = { id: string; title: string; studentId: string | null; words: WordRow[] };

/** English word or short phrase: letters, spaces, apostrophes, hyphens; 1-40 chars. */
export function cleanWord(raw: unknown): string | null {
  const word = String(raw ?? '').normalize('NFC').trim().replace(/\s+/g, ' ');
  return /^[A-Za-z](?:[A-Za-z' -]{0,38}[A-Za-z])?$/.test(word) ? word : null;
}

const clip = (raw: unknown, max: number) => String(raw ?? '').normalize('NFC').trim().replace(/\s+/g, ' ').slice(0, max);

/**
 * Parses pasted text: one word per line, optionally with a meaning:
 *   "apple"   "apple - תפוח"   "apple = תפוח"   "apple: תפוח"   "apple<TAB>תפוח"
 */
export function parseBulkWords(text: unknown): { items: { word: string; hebrew: string }[]; invalid: string[] } {
  const items: { word: string; hebrew: string }[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();
  for (const line of String(text ?? '').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const m = trimmed.match(/^(.+?)\s*(?:\t|\s-\s|=|:)\s*(.+)$/);
    const word = cleanWord(m ? m[1] : trimmed);
    if (!word) {
      invalid.push(trimmed.slice(0, 40));
      continue;
    }
    if (seen.has(word.toLowerCase())) continue;
    seen.add(word.toLowerCase());
    items.push({ word, hebrew: m ? clip(m[2], 60) : '' });
  }
  return { items, invalid };
}

type DbWord = {
  id: string;
  list_id: string;
  word: string;
  hebrew: string;
  emoji: string;
  example_en: string;
  example_he: string;
  ai_generated: boolean;
};
const toWord = (r: DbWord): WordRow => ({
  id: r.id,
  word: r.word,
  hebrew: r.hebrew,
  emoji: r.emoji,
  exampleEn: r.example_en,
  exampleHe: r.example_he,
  aiGenerated: r.ai_generated,
});

async function loadLists(where: string, params: unknown[]): Promise<WordList[]> {
  const lists = await query<{ id: string; title: string; student_id: string | null }>(
    `SELECT id, title, student_id FROM word_lists WHERE ${where} ORDER BY created_at DESC`,
    params,
  );
  if (!lists.rows.length) return [];
  const words = await query<DbWord>(
    `SELECT id, list_id, word, hebrew, emoji, example_en, example_he, ai_generated
       FROM words WHERE list_id = ANY($1) ORDER BY position, created_at`,
    [lists.rows.map((l) => l.id)],
  );
  return lists.rows.map((l) => ({
    id: l.id,
    title: l.title,
    studentId: l.student_id,
    words: words.rows.filter((w) => w.list_id === l.id).map(toWord),
  }));
}

export function familyWordLists(familyId: string): Promise<WordList[]> {
  return loadLists('family_id = $1', [familyId]);
}

/** Lists a student may practice: family-wide lists + lists assigned to them. */
export function studentWordLists(familyId: string, studentId: string): Promise<WordList[]> {
  return loadLists('family_id = $1 AND (student_id IS NULL OR student_id = $2)', [familyId, studentId]);
}

async function assertStudentInFamily(familyId: string, studentId: unknown): Promise<string | null> {
  if (studentId === null || studentId === undefined || studentId === '') return null;
  if (typeof studentId !== 'string' || !isUuid(studentId)) throw new HttpError(400, 'invalid_student', 'ילד/ה לא תקין/ה');
  const { rows } = await query("SELECT 1 FROM users WHERE id = $1 AND family_id = $2 AND role = 'student'", [
    studentId,
    familyId,
  ]);
  if (!rows[0]) throw new HttpError(400, 'invalid_student', 'ילד/ה לא תקין/ה');
  return studentId;
}

async function getListInFamily(familyId: string, listId: string) {
  if (!isUuid(listId)) throw new HttpError(404, 'not_found', 'הרשימה לא נמצאה');
  const { rows } = await query<{ id: string; title: string; student_id: string | null }>(
    'SELECT id, title, student_id FROM word_lists WHERE id = $1 AND family_id = $2',
    [listId, familyId],
  );
  if (!rows[0]) throw new HttpError(404, 'not_found', 'הרשימה לא נמצאה');
  return rows[0];
}

function requireTitle(raw: unknown): string {
  const title = clip(raw, 60);
  if (!title) throw new HttpError(400, 'invalid_title', 'שם הרשימה: 1-60 תווים');
  return title;
}

export async function createList(actor: SessionUser, familyId: string, body: Record<string, unknown>) {
  const title = requireTitle(body.title);
  const studentId = await assertStudentInFamily(familyId, body.studentId);
  const count = await query<{ n: string }>('SELECT count(*) AS n FROM word_lists WHERE family_id = $1', [familyId]);
  if (Number(count.rows[0].n) >= MAX_LISTS_PER_FAMILY) throw new HttpError(400, 'too_many_lists', 'הגעתם למספר הרשימות המרבי');
  const { rows } = await query<{ id: string }>(
    'INSERT INTO word_lists (family_id, student_id, title, created_by) VALUES ($1, $2, $3, $4) RETURNING id',
    [familyId, studentId, title, actor.id],
  );
  return { id: rows[0].id };
}

export async function updateList(familyId: string, listId: string, body: Record<string, unknown>) {
  await getListInFamily(familyId, listId);
  const title = requireTitle(body.title);
  const studentId = await assertStudentInFamily(familyId, body.studentId);
  await query('UPDATE word_lists SET title = $2, student_id = $3 WHERE id = $1', [listId, title, studentId]);
}

export async function deleteList(actor: SessionUser, familyId: string, listId: string) {
  const list = await getListInFamily(familyId, listId);
  await query('DELETE FROM word_lists WHERE id = $1', [listId]);
  await audit(actor.id, 'wordlist.delete', null, { title: list.title });
}

export async function addWords(familyId: string, listId: string, text: unknown) {
  await getListInFamily(familyId, listId);
  const { items, invalid } = parseBulkWords(text);
  if (!items.length && !invalid.length) throw new HttpError(400, 'empty', 'לא הוזנו מילים');

  return withTransaction(async (client) => {
    const { rows } = await client.query<{ n: string; maxpos: number | null }>(
      'SELECT count(*) AS n, max(position) AS maxpos FROM words WHERE list_id = $1',
      [listId],
    );
    const existing = Number(rows[0].n);
    if (existing + items.length > MAX_WORDS_PER_LIST) {
      throw new HttpError(400, 'too_many_words', `ברשימה אפשר עד ${MAX_WORDS_PER_LIST} מילים`);
    }
    let pos = (rows[0].maxpos ?? 0) + 1;
    let added = 0;
    for (const it of items) {
      const res = await client.query(
        `INSERT INTO words (list_id, word, hebrew, position) VALUES ($1, $2, $3, $4)
         ON CONFLICT (list_id, lower(word)) DO NOTHING`,
        [listId, it.word, it.hebrew, pos++],
      );
      added += res.rowCount ?? 0;
    }
    return { added, duplicates: items.length - added, invalid };
  });
}

async function getWordInFamily(familyId: string, wordId: string) {
  if (!isUuid(wordId)) throw new HttpError(404, 'not_found', 'המילה לא נמצאה');
  const { rows } = await query<{ id: string; list_id: string }>(
    `SELECT w.id, w.list_id FROM words w JOIN word_lists l ON l.id = w.list_id
      WHERE w.id = $1 AND l.family_id = $2`,
    [wordId, familyId],
  );
  if (!rows[0]) throw new HttpError(404, 'not_found', 'המילה לא נמצאה');
  return rows[0];
}

/** A parent edit (or "approve") always clears the AI flag. */
export async function updateWord(familyId: string, wordId: string, body: Record<string, unknown>) {
  await getWordInFamily(familyId, wordId);
  const word = body.word === undefined ? undefined : cleanWord(body.word);
  if (word === null) throw new HttpError(400, 'invalid_word', 'מילה באנגלית בלבד: אותיות, רווח, מקף או גרש');
  try {
    await query(
      `UPDATE words SET
         word = COALESCE($2, word),
         hebrew = COALESCE($3, hebrew),
         emoji = COALESCE($4, emoji),
         example_en = COALESCE($5, example_en),
         example_he = COALESCE($6, example_he),
         ai_generated = false
       WHERE id = $1`,
      [
        wordId,
        word ?? null,
        body.hebrew === undefined ? null : clip(body.hebrew, 60),
        body.emoji === undefined ? null : clip(body.emoji, 16),
        body.exampleEn === undefined ? null : clip(body.exampleEn, 160),
        body.exampleHe === undefined ? null : clip(body.exampleHe, 160),
      ],
    );
  } catch (err) {
    if ((err as { code?: string }).code === '23505') throw new HttpError(409, 'duplicate', 'המילה כבר קיימת ברשימה');
    throw err;
  }
}

export async function deleteWord(familyId: string, wordId: string) {
  await getWordInFamily(familyId, wordId);
  await query('DELETE FROM words WHERE id = $1', [wordId]);
}

/**
 * Fills ONLY empty fields of up to 30 incomplete words with AI suggestions (marked ai_generated).
 * Never overwrites anything a parent typed.
 */
export async function enrichList(familyId: string, listId: string) {
  const list = await getListInFamily(familyId, listId);
  const { rows } = await query<DbWord>(
    `SELECT id, list_id, word, hebrew, emoji, example_en, example_he, ai_generated FROM words
      WHERE list_id = $1 AND (hebrew = '' OR example_en = '' OR example_he = '')
      ORDER BY position LIMIT $2`,
    [listId, MAX_ENRICH_PER_CALL],
  );
  if (!rows.length) return { completed: 0, remaining: 0 };

  let grade: number | null = null;
  if (list.student_id) {
    const g = await query<{ grade: number | null }>('SELECT grade FROM users WHERE id = $1', [list.student_id]);
    grade = g.rows[0]?.grade ?? null;
  }

  const results = await enrichWords(
    rows.map((r) => ({ word: r.word, ...(r.hebrew ? { hebrew: r.hebrew } : {}) })),
    grade,
  );
  const byWord = new Map(results.map((r) => [r.word.toLowerCase(), r]));
  let completed = 0;
  for (const r of rows) {
    const s = byWord.get(r.word.toLowerCase());
    if (!s) continue;
    await query(
      `UPDATE words SET
         hebrew = CASE WHEN hebrew = '' THEN $2 ELSE hebrew END,
         emoji = CASE WHEN emoji = '' THEN $3 ELSE emoji END,
         example_en = CASE WHEN example_en = '' THEN $4 ELSE example_en END,
         example_he = CASE WHEN example_he = '' THEN $5 ELSE example_he END,
         ai_generated = true
       WHERE id = $1`,
      [r.id, s.hebrew, s.emoji, s.example_en, s.example_he],
    );
    completed++;
  }
  const left = await query<{ n: string }>(
    `SELECT count(*) AS n FROM words
      WHERE list_id = $1 AND (hebrew = '' OR example_en = '' OR example_he = '')`,
    [listId],
  );
  return { completed, remaining: Number(left.rows[0].n) };
}
