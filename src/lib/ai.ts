import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { HttpError } from './http';

/**
 * AI completion of vocabulary entries (Hebrew meaning, emoji, example sentence).
 * Server-side only; needs ANTHROPIC_API_KEY. Parents always review/edit the result.
 */
export function aiEnabled(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

let client: Anthropic | null = null;
function getClient(): Anthropic {
  client ??= new Anthropic({ timeout: 90_000, maxRetries: 2 });
  return client;
}

export type EnrichInput = { word: string; hebrew?: string };
export type EnrichResult = { word: string; hebrew: string; emoji: string; example_en: string; example_he: string };

const ITEM_SCHEMA = {
  type: 'object',
  properties: {
    word: { type: 'string' },
    hebrew: { type: 'string' },
    emoji: { type: 'string' },
    example_en: { type: 'string' },
    example_he: { type: 'string' },
  },
  required: ['word', 'hebrew', 'emoji', 'example_en', 'example_he'],
  additionalProperties: false,
} as const;

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: { items: { type: 'array', items: ITEM_SCHEMA } },
  required: ['items'],
  additionalProperties: false,
};

const OutputZ = z.object({
  items: z.array(
    z.object({
      word: z.string(),
      hebrew: z.string(),
      emoji: z.string(),
      example_en: z.string(),
      example_he: z.string(),
    }),
  ),
});

const SYSTEM_PROMPT = `You prepare English vocabulary cards for Israeli children (Hebrew speakers) in elementary school who are learning English as a foreign language. A parent will review every card before the child sees it.

For each input word return:
- word: exactly as given.
- hebrew: the most common meaning a child of this age would need, in natural Hebrew without nikud. If the input includes a "hebrew" meaning from the parent, keep that meaning (you may fix spelling). Verbs in the infinitive (e.g. לרוץ). When Hebrew differs by gender, give both forms with " / " (e.g. שמח / שמחה). Keep it short (1-4 words).
- emoji: one emoji that clearly shows the meaning, or "" if none fits well.
- example_en: one short, simple, kid-friendly sentence (4-9 words) using the word with that meaning. Use only very common words and simple tenses. No names of real people, no scary or sensitive topics.
- example_he: a natural Hebrew translation of example_en.

Return the items in the same order as the input.`;

/** Asks Claude to complete up to 30 words. Throws HttpError with a Hebrew message on failure. */
export async function enrichWords(words: EnrichInput[], grade: number | null): Promise<EnrichResult[]> {
  if (!aiEnabled()) throw new HttpError(503, 'ai_disabled', 'השלמה עם AI לא מוגדרת בשרת (חסר ANTHROPIC_API_KEY)');
  if (words.length === 0) return [];

  let response: Anthropic.Beta.Messages.BetaMessage;
  try {
    response = await getClient().beta.messages.create({
      model: 'claude-opus-5-5',
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low', format: { type: 'json_schema', schema: OUTPUT_SCHEMA } },
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: JSON.stringify({ child_grade: grade ?? 'elementary school', words }),
        },
      ],
    });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      console.error('[ai] authentication failed — check ANTHROPIC_API_KEY');
      throw new HttpError(503, 'ai_auth', 'מפתח ה-AI בשרת לא תקין');
    }
    if (err instanceof Anthropic.RateLimitError) {
      throw new HttpError(429, 'ai_rate_limited', 'שירות ה-AI עמוס כרגע, נסו שוב בעוד דקה');
    }
    if (err instanceof Anthropic.APIError) {
      console.error('[ai] API error', err.status, err.message);
      throw new HttpError(502, 'ai_error', 'שירות ה-AI לא זמין כרגע, נסו שוב מאוחר יותר');
    }
    console.error('[ai] request failed', err);
    throw new HttpError(502, 'ai_error', 'לא הצלחנו להתחבר לשירות ה-AI');
  }

  if (response.stop_reason === 'refusal') {
    throw new HttpError(422, 'ai_refused', 'ה-AI לא השלים את המילים האלה. אפשר להשלים ידנית');
  }
  if (response.stop_reason === 'max_tokens') {
    throw new HttpError(422, 'ai_truncated', 'יותר מדי מילים בבת אחת, נסו פחות מילים');
  }

  const text = response.content.find((b) => b.type === 'text');
  if (!text || text.type !== 'text') throw new HttpError(502, 'ai_error', 'תשובה לא צפויה משירות ה-AI');
  const parsed = OutputZ.safeParse(JSON.parse(text.text));
  if (!parsed.success) throw new HttpError(502, 'ai_error', 'תשובה לא צפויה משירות ה-AI');

  // Match results back to inputs by word (never trust order blindly), trim lengths.
  const byWord = new Map(parsed.data.items.map((it) => [it.word.trim().toLowerCase(), it]));
  return words
    .map((input) => byWord.get(input.word.toLowerCase()))
    .filter((it): it is NonNullable<typeof it> => !!it)
    .map((it) => ({
      word: it.word,
      hebrew: it.hebrew.trim().slice(0, 60),
      emoji: it.emoji.trim().slice(0, 16),
      example_en: it.example_en.trim().slice(0, 160),
      example_he: it.example_he.trim().slice(0, 160),
    }));
}
