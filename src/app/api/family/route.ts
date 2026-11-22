import { getFamilyOverview, guardianContext } from '@/lib/family';
import { json, route } from '@/lib/http';

export const dynamic = 'force-dynamic';

/** GET /api/family[?familyId=] — dashboard data: kids + progress, guardians, rewards, redemptions. */
export const GET = route(async (req) => {
  const { familyId } = await guardianContext(req);
  return json(await getFamilyOverview(familyId));
});
