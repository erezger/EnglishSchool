// Shared (client + server) catalog of looks a kid can start with.
// Must match SHOP_AVATARS / SHOP_PETS / SHOP_THEMES ids in src/content/game.ts.

export const AVATARS = [
  { id: 'av_girl', emoji: '👧🏻', name: 'ילדה חכמה' },
  { id: 'av_astro', emoji: '👩‍🚀', name: 'אסטרונאוטית' },
  { id: 'av_fairy', emoji: '🧚‍♀️', name: 'פיית מילים' },
  { id: 'av_hero', emoji: '🦸‍♀️', name: 'גיבורת-על' },
  { id: 'av_queen', emoji: '👸', name: 'מלכת האנגלית' },
  { id: 'av_robot', emoji: '🤖', name: 'רובוט גאון' },
] as const;

export const PETS = [
  { id: 'pet_dog', emoji: '🐶', name: 'כלבלב' },
  { id: 'pet_cat', emoji: '🐱', name: 'חתלתול' },
  { id: 'pet_uni', emoji: '🦄', name: 'חד-קרן' },
  { id: 'pet_dragon', emoji: '🐉', name: 'דרקון' },
  { id: 'pet_panda', emoji: '🐼', name: 'פנדה' },
  { id: 'pet_owl', emoji: '🦉', name: 'ינשוף חכם' },
] as const;

export const THEMES = [
  { id: 'theme-classic', name: 'קלאסי סגול', icon: '💜' },
  { id: 'theme-unicorn', name: 'חד-קרן ורוד', icon: '🦄' },
  { id: 'theme-ocean', name: 'אוקיינוס כחול', icon: '🌊' },
  { id: 'theme-space', name: 'חלל וכוכבים', icon: '🌌' },
  { id: 'theme-neon', name: 'ניאון זוהר', icon: '⚡' },
] as const;

export const TOTAL_LEVELS = 7;

export function avatarEmoji(id: string | undefined): string {
  return AVATARS.find((a) => a.id === id)?.emoji ?? '👧🏻';
}

export function petEmoji(id: string | undefined): string {
  return PETS.find((p) => p.id === id)?.emoji ?? '🐶';
}
