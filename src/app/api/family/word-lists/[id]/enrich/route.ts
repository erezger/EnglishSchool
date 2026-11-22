import { guardianContext } from '@/lib/family';
import { HttpError, json, route } from '@/lib/http';
import { allow } from '@/lib/rate-limit';
import { enrichList } from '@/lib/words';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/family/word-lists/:id/enrich
 * AI fills empty fields (meaning, emoji, example) of up to 30 words; parents review them after.
 */
export const POST = route<Ctx>(async (req, { params }) => {
  const { familyId } = await guardianContext(req);
  if (!allow(`enrich:${familyId}`, 20, 60 * 60_000)) {
    throw new HttpError(429, 'rate_limited', 'הגעתם למגבלת ההשלמות לשעה, נסו שוב מאוחר יותר');
  }
  return json(await enrichList(familyId, (await params).id));
});
