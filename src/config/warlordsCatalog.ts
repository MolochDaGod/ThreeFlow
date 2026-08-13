import { DRAG_MODEL_TYPE, MODEL_TYPE } from '@/enums/enum';
import type { ModelType } from '@/types/renderModelTypes';

/** Canonical binaries — assets.grudge-studio.com (R2). Do not invent hosts. */
export const WARLORDS_CDN = 'https://assets.grudge-studio.com';

/** Live ObjectStore placeables (uMMORPG + Warlords entity extract). */
export const UMMORPG_PLACEABLES_URL =
  'https://objectstore.grudge-studio.com/api/v1/ummorpg-placeables-for-forge.json';

export type WarlordsAssetGroup =
  | 'captains'
  | 'units'
  | 'enemies'
  | 'weapons'
  | 'meshes'
  | 'islands'
  | 'zones';

export interface WarlordsDragItem extends ModelType {
  group: WarlordsAssetGroup;
  isAnimation?: boolean;
  modelType: DRAG_MODEL_TYPE;
  /** Hard Road DS2 procedural terrain — https://hardroad.xyz/demos/ds2-terrain.html */
  terrainPreset?: 'mountains' | 'crags' | 'zone';
}

export const WARLORDS_GROUP_LABELS: Record<WarlordsAssetGroup, string> = {
  captains: 'Captains',
  units: 'Units',
  enemies: 'Enemies',
  weapons: 'Weapons',
  meshes: 'Meshes',
  islands: 'Islands',
  zones: 'HD zones',
};

const ENT = `${WARLORDS_CDN}/models/warlords/entities`;
const ICO = `${WARLORDS_CDN}/game-assets/icons/pack/entities`;
const TOON = `${WARLORDS_CDN}/asset-packs/toon-rts-characters/glb/characters`;
const WPN = `${WARLORDS_CDN}/models/weapons`;
const WPN_ICO = `${WARLORDS_CDN}/game-assets/icons/pack/weapons`;

function item(
  group: WarlordsAssetGroup,
  key: string,
  name: string,
  filePath: string,
  icon: string,
  isAnimation = false,
  extra?: Partial<WarlordsDragItem>
): WarlordsDragItem {
  return {
    group,
    key,
    name,
    id: key,
    filePath,
    fileType: MODEL_TYPE.GLB,
    icon,
    isAnimation,
    modelType: DRAG_MODEL_TYPE.Model,
    ...extra,
  };
}

/** Play bodies — Toon RTS GLB (grudge6-cdn-ssot). Not races bake / FBX / Meshy. */
export const WARLORDS_CAPTAINS: WarlordsDragItem[] = (
  [
    ['human', 'Human captain'],
    ['barbarian', 'Barbarian captain'],
    ['elf', 'Elf captain'],
    ['dwarf', 'Dwarf captain'],
    ['orc', 'Orc captain'],
    ['undead', 'Undead captain'],
  ] as const
).map(([race, name]) =>
  item(
    'captains',
    `captain-${race}`,
    name,
    `${TOON}/${race}.glb`,
    `${ICO}/${race === 'human' ? 'Human_Warrior' : `${race}_warrior`}.png`,
    true
  )
);

/** Unique uMMORPG unit GLBs (cdn_ready). Mage/paladin/merc rows still point at race FBX kits — skipped. */
export const WARLORDS_UNITS: WarlordsDragItem[] = [
  ['barb_archer', 'Barb Archer', 'barb_archer.png'],
  ['barb_warrior', 'Barb Warrior', 'barb_warrior.png'],
  ['dwarf_archer', 'Dwarf Archer', 'dwarf_archer.png'],
  ['dwarf_warrior', 'Dwarf Warrior', 'dwarf_warrior.png'],
  ['elf_archer', 'Elf Archer', 'elf_archer.png'],
  ['elf_warrior', 'Elf Warrior', 'elf_warrior.png'],
  ['human_archer', 'Human Archer', 'human_archer.png'],
  ['human_warrior', 'Human Warrior', 'Human_Warrior.png'],
  ['orc_archer', 'Orc Archer', 'orc_archer.png'],
  ['orc_warrior', 'Orc Warrior', 'orc_warrior.png'],
  ['undead_archer', 'Undead Archer', 'undead_archer.png'],
  ['undead_warrior', 'Undead Warrior', 'undead_warrior.png'],
].map(([id, name, icon]) =>
  item('units', id, name, `${ENT}/${id}.glb`, `${ICO}/${icon}`, true)
);

/** Warlords land creatures + skeletons (verified 200 on CDN). */
export const WARLORDS_ENEMIES: WarlordsDragItem[] = [
  item(
    'enemies',
    'drake',
    'Drake',
    `${WARLORDS_CDN}/models/creatures/land/drake.glb`,
    `${ICO}/Dragon_Glider_Icon.png`,
    true
  ),
  item(
    'enemies',
    'ifrit',
    'Ifrit',
    `${WARLORDS_CDN}/models/creatures/land/ifrit.glb`,
    `${ICO}/totem_2.png`,
    true
  ),
  item(
    'enemies',
    'lava-golem',
    'Lava golem',
    `${WARLORDS_CDN}/models/creatures/land/lava_golem.glb`,
    `${ICO}/totem_3.png`,
    true
  ),
  item(
    'enemies',
    'free-reptile',
    'Reptile',
    `${WARLORDS_CDN}/models/creatures/land/free_reptile.glb`,
    `${ICO}/Scorpid_Launcher_Icon.png`,
    true
  ),
  item(
    'enemies',
    'monsters-x',
    'Monster pack',
    `${WARLORDS_CDN}/models/creatures/land/monsters_x_free.glb`,
    `${ICO}/totem1.png`,
    true
  ),
  item(
    'enemies',
    'creature-crab',
    'Crab',
    `${WARLORDS_CDN}/models/creatures/land/creature_crab.glb`,
    `${ICO}/Skeeter_Icon.png`,
    true
  ),
  item(
    'enemies',
    'skeleton',
    'Skeleton',
    `${WARLORDS_CDN}/models/skeletons/Skeleton.glb`,
    `${ICO}/undead_warrior.png`,
    true
  ),
  item(
    'enemies',
    'skeleton-archer',
    'Skeleton archer',
    `${WARLORDS_CDN}/models/skeletons/Skeleton_Archer.glb`,
    `${ICO}/undead_archer.png`,
    true
  ),
];

/** Only HEAD-200 weapon / siege GLBs. weapon-models.json still lists many FBX-only keys. */
export const WARLORDS_WEAPONS: WarlordsDragItem[] = [
  item('weapons', 'hand-axe', 'Hand axe', `${WPN}/axe/HandAxe.glb`, `${WPN_ICO}/Axe_01.png`),
  item('weapons', 'greataxe', 'Greataxe', `${WPN}/greataxe/Greataxe.glb`, `${WPN_ICO}/Axe_20.png`),
  item(
    'weapons',
    'greatsword',
    'Greatsword',
    `${WPN}/greatsword/Greatsword.glb`,
    `${WPN_ICO}/Sword_30.png`
  ),
  item(
    'weapons',
    'two-handed-sword',
    'Two-handed sword',
    `${WPN}/greatsword/TwoHandedSword.glb`,
    `${WPN_ICO}/Sword_27.png`
  ),
  item('weapons', 'bow', 'Bow', `${WPN}/bow/Bow.glb`, `${WPN_ICO}/Bow_01.png`),
  item('weapons', 'orc-bow', 'Orc bow', `${WPN}/bow/orc_bow.glb`, `${WPN_ICO}/Bow_02.png`),
  item(
    'weapons',
    'catapult',
    'Catapult',
    `${ENT}/catapult.glb`,
    `${ICO}/Catapult.png`
  ),
  item(
    'weapons',
    'heavy-catapult',
    'Heavy catapult',
    `${ENT}/heavy_catapult.glb`,
    `${ICO}/Heavy_Catapult.png`
  ),
  item(
    'weapons',
    'bolt-thrower',
    'Bolt thrower',
    `${ENT}/bolt_thrower.glb`,
    `${ICO}/Bolt_Thrower.png`
  ),
];

/** uMMORPG island / lobby / event maps (islandDeployments + map-registry). */
export const WARLORDS_ISLANDS: WarlordsDragItem[] = [
  item(
    'islands',
    'home-island',
    'Home island',
    `${WARLORDS_CDN}/models/nature/stylized/concept/example_home_island.glb`,
    `${ICO}/House_Icon.png`
  ),
  item(
    'islands',
    'pirate-islands',
    'Pirate islands',
    `${WARLORDS_CDN}/models/lobby/pirate-islands/scene.glb`,
    `${ICO}/Boat_Icon.png`
  ),
  item(
    'islands',
    'lyoko',
    'Lyoko mountain',
    `${WARLORDS_CDN}/models/biomes/ethereal/lyoko_mountain_sector.glb`,
    `${ICO}/Flag_Icon.png`
  ),
  item(
    'islands',
    'spiral-mountain',
    'Spiral mountain',
    `${WARLORDS_CDN}/models/biomes/event/spiral_mountain_reimagined.glb`,
    `${ICO}/totem_4.png`
  ),
  item(
    'islands',
    'hoth-boss',
    'Hoth boss room',
    `${WARLORDS_CDN}/models/biomes/frozen/hoth_boss_room_low_poly.glb`,
    `${ICO}/undead_crypt.png`
  ),
  item(
    'islands',
    'iceland',
    'Iceland scene',
    `${WARLORDS_CDN}/models/biomes/cold/iceland_scene_for_canimatic.glb`,
    `${ICO}/undead_crypt.png`
  ),
];

/** Hard Road DS2 erosion terrain — higher-def zones / mountains (not a GLB). */
export const WARLORDS_HD_ZONES: WarlordsDragItem[] = [
  item(
    'zones',
    'hd-mountains',
    'HD mountains',
    'hardroad://ds2-terrain?preset=mountains',
    `${ICO}/Flag_Icon.png`,
    false,
    { terrainPreset: 'mountains' }
  ),
  item(
    'zones',
    'hd-crags',
    'HD crags',
    'hardroad://ds2-terrain?preset=crags',
    `${ICO}/totem_4.png`,
    false,
    { terrainPreset: 'crags' }
  ),
  item(
    'zones',
    'hd-zone',
    'HD zone',
    'hardroad://ds2-terrain?preset=zone',
    `${ICO}/House_Icon.png`,
    false,
    { terrainPreset: 'zone' }
  ),
];

type PlaceableItem = {
  id: string;
  label: string;
  group?: string;
  kind?: string;
  modelUrl?: string | null;
  iconUrl?: string | null;
  meshStatus?: string;
};

function placeableGroup(row: PlaceableItem): WarlordsAssetGroup | null {
  if (row.kind === 'siege') return 'weapons';
  if (row.group === 'characters' || row.kind === 'unit') return 'units';
  if (row.group === 'buildings' || row.group === 'vehicles' || row.kind === 'structure') {
    return 'meshes';
  }
  if (row.kind === 'vehicle' || row.kind === 'mount') return 'meshes';
  return 'meshes';
}

export function placeableToDragItem(row: PlaceableItem): WarlordsDragItem | null {
  const url = row.modelUrl ?? '';
  if (row.meshStatus !== 'cdn_ready') return null;
  if (!url.startsWith('https://assets.grudge-studio.com/')) return null;
  if (!url.toLowerCase().endsWith('.glb')) return null;
  const group = placeableGroup(row);
  if (!group) return null;
  const key = row.id.replace(/^ummorpg-placeable\//, 'ummorpg-');
  return item(group, key, row.label, url, row.iconUrl || `${ICO}/Flag_Icon.png`);
}

function mergeByKey(base: WarlordsDragItem[], extra: WarlordsDragItem[]): WarlordsDragItem[] {
  const seen = new Set(base.map((row) => row.filePath));
  const out = [...base];
  for (const row of extra) {
    if (seen.has(row.filePath)) continue;
    seen.add(row.filePath);
    out.push(row);
  }
  return out;
}

/** Static SSOT snapshot — captains / units / enemies / weapons / islands always available. */
export const WARLORDS_STATIC_LIBRARY: WarlordsDragItem[] = [
  ...WARLORDS_CAPTAINS,
  ...WARLORDS_UNITS,
  ...WARLORDS_ENEMIES,
  ...WARLORDS_WEAPONS,
  ...WARLORDS_ISLANDS,
  ...WARLORDS_HD_ZONES,
];

export async function loadWarlordsLibrary(): Promise<WarlordsDragItem[]> {
  try {
    const res = await fetch(UMMORPG_PLACEABLES_URL);
    if (!res.ok) return WARLORDS_STATIC_LIBRARY;
    const data = (await res.json()) as { items?: PlaceableItem[] };
    const live = (data.items ?? [])
      .map(placeableToDragItem)
      .filter((row): row is WarlordsDragItem => Boolean(row));
    return mergeByKey(WARLORDS_STATIC_LIBRARY, live);
  } catch {
    return WARLORDS_STATIC_LIBRARY;
  }
}

export function itemsInGroup(
  list: WarlordsDragItem[],
  group: WarlordsAssetGroup | 'all'
): WarlordsDragItem[] {
  if (group === 'all') return list;
  return list.filter((row) => row.group === group);
}

/** Left-library default (replaces demo police / taxi GLBs). */
export const defaultModelList: WarlordsDragItem[] = WARLORDS_STATIC_LIBRARY;
