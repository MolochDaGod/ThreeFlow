/**
 * One icon host for HUD slots AND deploy payload.
 * ui.grudge-studio.com/icons — same files as main-panel. Not a second pack.
 */
export const HUD_ICON_HOST = 'https://ui.grudge-studio.com/icons';

export function hudIcon(rel: string): string {
  const clean = rel.replace(/^\/+/, '');
  if (/^https?:\/\//i.test(clean)) return clean;
  return `${HUD_ICON_HOST}/${clean}`;
}

/** Hotbar 1–0 · same URLs written to GameManager.deploy.hud */
export const HOTBAR_ICONS: { id: string; key: string; rel: string }[] = [
  { id: 's1', key: '1', rel: 'pack/weapons/Sword_01.png' },
  { id: 's2', key: '2', rel: 'pack/weapons/Axe_01.png' },
  { id: 's3', key: '3', rel: 'pack/weapons/Hammer_01.png' },
  { id: 's4', key: '4', rel: 'pack/weapons/Bow_01.png' },
  { id: 's5', key: '5', rel: 'pack/weapons/Staff_01.png' },
  { id: 's6', key: '6', rel: 'skills/class/warrior/warrior_01.png' },
  { id: 's7', key: '7', rel: 'skills/class/hunter/hunter_01.png' },
  { id: 's8', key: '8', rel: 'skills/class/firemage/firemage_01.png' },
  { id: 's9', key: '9', rel: 'skills/class/paladin/paladin_01.png' },
  { id: 's0', key: '0', rel: 'pack/misc/Effect.png' },
];

export const FRAME_ICONS: Record<string, string> = {
  'player-frame': hudIcon('pack/armor/Chest_01.png'),
  'target-frame': hudIcon('skills/class/warrior/warrior_01.png'),
  minimap: hudIcon('pack/misc/Effect.png'),
  'cast-bar': hudIcon('skills/class/firemage/firemage_01.png'),
  'chat-window': hudIcon('skills/class/engineer/engineer_01.png'),
  'quest-tracker': hudIcon('skills/class/hunter/hunter_01.png'),
  'interaction-prompt': hudIcon('pack/misc/Effect.png'),
  'inventory-grid': hudIcon('pack/misc/Effect.png'),
  'paperdoll-equipment': hudIcon('pack/armor/Chest_01.png'),
};

export type HudSlot = {
  id: string;
  key: string;
  icon: string;
};

export function hotbarSlots(): HudSlot[] {
  return HOTBAR_ICONS.map((s) => ({
    id: s.id,
    key: s.key,
    icon: hudIcon(s.rel),
  }));
}

export function bagSlots(count: number): HudSlot[] {
  const pool = HOTBAR_ICONS;
  return Array.from({ length: count }, (_, i) => {
    const s = pool[i % pool.length];
    return {
      id: `bag-${i}`,
      key: String(i + 1),
      icon: i < 12 ? hudIcon(s.rel) : '',
    };
  });
}
