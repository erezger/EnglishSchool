import { redirect } from 'next/navigation';
import { query } from './db';
import { cleanSettings, moduleEnabled, type KidSettings, type ModuleId } from './modules';

export async function getKidSettings(userId: string): Promise<KidSettings> {
  const { rows } = await query<{ settings: unknown }>('SELECT settings FROM users WHERE id = $1', [userId]);
  return cleanSettings(rows[0]?.settings);
}

/** For practice pages: send the kid back to the hub if a parent turned this module off. */
export async function requireModule(userId: string, id: ModuleId): Promise<KidSettings> {
  const settings = await getKidSettings(userId);
  if (!moduleEnabled(settings, id)) redirect('/practice?off=1');
  return settings;
}
