import { DRAG_MODEL_TYPE, MODEL_TYPE } from '@/enums/enum';
import type { ModelType } from '@/types/renderModelTypes';
import { slugPrefabId, type PrefabKind } from '@/utils/prefabStamp';
import {
  ICON_PACK,
  PLACEABLES_API,
  PREFABS_API,
  assetUrl,
  iconUrl,
} from './assetApi';
import { assetUuidFromKey, defaultSiHeight, r2KeyFromUrl } from './assetId';
import {
  cdnUrlForTarget,
  findHdTarget,
  SEAFLOOR_GRID,
} from './hdTerrainDeploy';
import { minimapUrl } from './sectorMinimaps';
import { fetchNatureRows } from './natureManifest';
import { loadEditorPrefabs } from '@/utils/editorPrefabs';
import { loadDiskAnimIndex } from '@/utils/animPackDisk';
import { itemFitsSector } from './sectorKits';
import { packForSector } from './worldIslands';
import { libraryIcon } from './libraryIcons';
import {
  MIXAMO_PACK_FOLDERS,
  WARLORDS_LIBRARY_CLIPS,
} from './warlordsAnimLibrary';

/** Canonical binaries — assets.grudge-studio.com (R2). Do not invent hosts. */
export const WARLORDS_CDN = 'https://assets.grudge-studio.com';

/** Live ObjectStore placeables (uMMORPG + Warlords entity extract). */
export const UMMORPG_PLACEABLES_URL = PLACEABLES_API;

/** Warlords entity prefab index — metadata. Unique GLB comes from placeables. */
export const WARLORDS_PREFABS_URL = PREFABS_API;

export type WarlordsAssetGroup =
  | 'captains'
  | 'units'
  | 'animals'
  | 'enemies'
  | 'weapons'
  | 'harvest'
  | 'meshes'
  | 'islands'
  | 'zones'
  | 'sectors'
  | 'scenes'
  | 'vfx'
  | 'textures'
  | 'animations'
  | 'prefabs';

export interface WarlordsDragItem extends ModelType {
  group: WarlordsAssetGroup;
  isAnimation?: boolean;
  modelType: DRAG_MODEL_TYPE;
  /** Hard Road DS2 procedural terrain — https://hardroad.xyz/demos/ds2-terrain.html */
  terrainPreset?: 'mountains' | 'crags' | 'zone';
  /** Warlords sector / map id for terrain snap + play URL */
  sectorId?: string;
  terrainId?: string;
  isTerrain?: boolean;
  islandKind?: 'static' | 'faction' | 'prefab';
  playUrl?: string;
  tab?: 'warlords' | 'd1' | 'r2' | 'vfx';
  prefabId?: string;
  prefabKind?: 'unit' | 'structure' | 'vehicle' | 'siege' | 'mount';
  meshName?: string;
  playScript?: string;
  biomes?: string[];
  siHeightM?: number;
  placeable?: boolean;
  /** D1-style asset UUID from r2Key — not a player/character UUID */
  assetUuid?: string;
  iconUuid?: string;
  r2Key?: string;
  meshStatus?: string;
  harvestKind?:
    | 'wood'
    | 'stone'
    | 'ore'
    | 'scrap'
    | 'herb'
    | 'hide'
    | 'fish'
    | 'gold'
    | 'meat'
    | 'bone';
  harvestDrops?: Array<'hide' | 'meat' | 'bone' | 'fish'>;
  animalRole?: 'prey' | 'predator';
  air?: boolean;
  contentLayer?:
    | 'terrain'
    | 'seafloor'
    | 'water'
    | 'void'
    | 'lava'
    | 'quicksand'
    | 'harvestable'
    | 'npc'
    | 'monster'
    | 'animal'
    | 'projectile'
    | 'weather'
    | 'player'
    | 'item'
    | 'trigger';
}

export const WARLORDS_GROUP_LABELS: Record<WarlordsAssetGroup, string> = {
  captains: 'Captains',
  units: 'Units',
  animals: 'Animals',
  enemies: 'Enemies',
  weapons: 'Weapons',
  harvest: 'Harvest',
  meshes: 'World layers',
  islands: 'Islands',
  zones: 'Live DS2',
  sectors: 'Sectors · DS2',
  scenes: 'Scenes',
  vfx: 'VFX',
  textures: 'Textures',
  animations: 'Anims',
  prefabs: 'Prefabs',
};

/** Chip order on the Warlords library. */
export const LIBRARY_FOLDER_ORDER: WarlordsAssetGroup[] = [
  'sectors',
  'islands',
  'harvest',
  'captains',
  'units',
  'animals',
  'enemies',
  'weapons',
  'meshes',
  'prefabs',
  'scenes',
  'zones',
  'vfx',
  'textures',
  'animations',
];

const ENT = `${WARLORDS_CDN}/models/warlords/entities`;
const ICO = `${ICON_PACK}/entities`;
const TOON = `${WARLORDS_CDN}/asset-packs/toon-rts-characters/glb/characters`;
const WPN = `${WARLORDS_CDN}/models/weapons`;
const WPN_ICO = `${WARLORDS_CDN}/game-assets/icons/pack/weapons`;

const OK_ICON = {
  flag: `${ICON_PACK}/entities/Flag_Icon.png`,
  house: `${ICON_PACK}/entities/House_Icon.png`,
  boat: `${ICON_PACK}/entities/Boat_Icon.png`,
  totem: `${ICON_PACK}/entities/totem1.png`,
  human: `${ICON_PACK}/entities/Human_Warrior.png`,
};

export function item(
  group: WarlordsAssetGroup,
  key: string,
  name: string,
  filePath: string,
  icon: string,
  isAnimation = false,
  extra?: Partial<WarlordsDragItem>
): WarlordsDragItem {
  const scheme = /^(prefab|hardroad|blob):/i.test(filePath);
  const resolved = scheme ? filePath : assetUrl(filePath);
  const r2Key = extra?.r2Key || r2KeyFromUrl(resolved || filePath);
  const siHeightM =
    extra?.siHeightM ?? defaultSiHeight(group, extra?.prefabKind);
  const ext = (resolved.split('?')[0].split('.').pop() || 'glb').toLowerCase();
  const imageType = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'hdr'].includes(ext)
    ? (ext as MODEL_TYPE)
    : MODEL_TYPE.GLB;
  const {
    r2Key: _rk,
    siHeightM: _si,
    assetUuid: _au,
    fileType: extraType,
    ...rest
  } = extra || {};
  return {
    group,
    key,
    name,
    id: key,
    filePath: resolved,
    fileType: extraType || imageType,
    icon: libraryIcon({
      group,
      id: extra?.sectorId || extra?.terrainId || key,
      name,
      preferred: iconUrl(icon),
    }),
    isAnimation,
    modelType: DRAG_MODEL_TYPE.Model,
    ...rest,
    r2Key,
    siHeightM,
    assetUuid: extra?.assetUuid || assetUuidFromKey(r2Key || key),
    placeable: extra?.placeable ?? !filePath.startsWith('hardroad://'),
  };
}

/** Play bodies — Toon RTS GLB (grudge6-cdn-ssot). SI place + race kit equip on drop. */
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
    `${ICO}/${
      race === 'human'
        ? 'Human_Warrior'
        : race === 'barbarian'
          ? 'barb_warrior'
          : `${race}_warrior`
    }.png`,
    true,
    {
      siHeightM: race === 'orc' || race === 'barbarian' ? 2.0 : 1.8,
      prefabKind: 'unit',
      contentLayer: 'player',
      tab: 'd1',
      r2Key: `asset-packs/toon-rts-characters/glb/characters/${race}.glb`,
    }
  )
);

/**
 * Sketchfab ML hero dumps — review + Bip001 clip source only.
 * Not Toon RTS play bodies. Weapons are fused in the mesh; clips bake into
 * existing weapon packs (polearm / sword_shield / 2h_melee / longbow / magic).
 */
export const WARLORDS_SKETCHFAB_HEROES: WarlordsDragItem[] = (
  [
    ['hero_old_zilong', 'Review · Zilong (spear)'],
    ['hero_old_karina', 'Review · Karina (daggers)'],
    ['hero_ruby_new', 'Review · Ruby (scythe)'],
    ['hero_clint_2020', 'Review · Clint (pistol)'],
    ['hero_estes_old_2016', 'Review · Estes (staff)'],
    ['hero_natalia_old_2016', 'Review · Natalia (daggers)'],
    ['hero_assassin_skin', 'Review · Assassin (daggers)'],
    ['hero_old_eudora', 'Review · Eudora (staff)'],
    ['hero_hilda', 'Review · Hilda (2H axe)'],
    ['hero_fanny_old', 'Review · Fanny (cables)'],
    ['hero_old_rafaela', 'Review · Rafaela (staff)'],
    ['hero_miya_2016', 'Review · Miya (bow)'],
  ] as const
).map(([id, name]) =>
  item(
    'units',
    `review-${id}`,
    name,
    `/models/sketchfab-heroes/${id}.glb`,
    `${ICO}/Human_Warrior.png`,
    false,
    {
      siHeightM: 1.8,
      prefabKind: 'unit',
      contentLayer: 'npc',
    }
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
  item('units', id, name, `${ENT}/${id}.glb`, `${ICO}/${icon}`, true, {
    prefabKind: 'unit',
    contentLayer: 'npc',
    siHeightM: /orc|barb/i.test(id) ? 2.0 : 1.8,
  })
);

/** Warlords land creatures + skeletons (verified 200 on CDN). */
export const WARLORDS_ENEMIES: WarlordsDragItem[] = [
  item(
    'enemies',
    'drake',
    'Drake',
    `${WARLORDS_CDN}/models/creatures/land/drake.glb`,
    `${ICO}/Dragon_Glider_Icon.png`,
    true,
    { contentLayer: 'monster', siHeightM: 3 }
  ),
  item(
    'enemies',
    'ifrit',
    'Ifrit',
    `${WARLORDS_CDN}/models/creatures/land/ifrit.glb`,
    `${ICO}/totem1.png`,
    true,
    { contentLayer: 'monster', siHeightM: 2.8 }
  ),
  item(
    'enemies',
    'lava-golem',
    'Lava golem',
    `${WARLORDS_CDN}/models/creatures/land/lava_golem.glb`,
    `${ICO}/totem1.png`,
    true,
    { contentLayer: 'monster', siHeightM: 3.2 }
  ),
  item(
    'enemies',
    'free-reptile',
    'Reptile',
    `${WARLORDS_CDN}/models/creatures/land/free_reptile.glb`,
    `${ICO}/Scorpid_Launcher_Icon.png`,
    true,
    { contentLayer: 'monster', siHeightM: 1.6 }
  ),
  item(
    'enemies',
    'monsters-x',
    'Monster pack',
    `${WARLORDS_CDN}/models/creatures/land/monsters_x_free.glb`,
    `${ICO}/totem1.png`,
    true,
    { contentLayer: 'monster', siHeightM: 2.4 }
  ),
  item(
    'enemies',
    'skeleton',
    'Skeleton',
    `${WARLORDS_CDN}/models/skeletons/Skeleton.glb`,
    `${ICO}/undead_warrior.png`,
    true,
    { contentLayer: 'monster', siHeightM: 1.8 }
  ),
  item(
    'enemies',
    'skeleton-archer',
    'Skeleton archer',
    `${WARLORDS_CDN}/models/skeletons/Skeleton_Archer.glb`,
    `${ICO}/undead_archer.png`,
    true,
    { contentLayer: 'monster', siHeightM: 1.8 }
  ),
  item(
    'enemies',
    'ferus',
    'Ferus',
    `${WARLORDS_CDN}/models/creatures/land/ferus.glb`,
    `${ICO}/Scorpid_Launcher_Icon.png`,
    true,
    { contentLayer: 'monster', siHeightM: 1.6, biomes: ['forest', 'ethereal'] }
  ),
  item(
    'enemies',
    'peco-peco',
    'Peco Peco',
    `${WARLORDS_CDN}/models/creatures/land/peco_peco.glb`,
    `${ICO}/Skeeter_Icon.png`,
    true,
    { contentLayer: 'animal', siHeightM: 1.1, biomes: ['tropical', 'beach'] }
  ),
  item(
    'enemies',
    'army-turtle',
    'Army turtle',
    `${WARLORDS_CDN}/models/creatures/land/army_general_turtle.glb`,
    `${ICO}/Boat_Icon.png`,
    true,
    { contentLayer: 'monster', siHeightM: 2.0, biomes: ['beach', 'storm'] }
  ),
  item(
    'enemies',
    'the-ancient',
    'The Ancient',
    `${WARLORDS_CDN}/models/creatures/land/the_ancient.glb`,
    `${ICO}/totem1.png`,
    true,
    { contentLayer: 'monster', siHeightM: 2.2, biomes: ['ethereal', 'abyssal'] }
  ),
  item(
    'enemies',
    'mutant-dragon',
    'Mutant dragon',
    `${WARLORDS_CDN}/models/creatures/land/mutant_dragon.glb`,
    `${ICO}/Dragon_Glider_Icon.png`,
    true,
    { contentLayer: 'monster', siHeightM: 3.0, biomes: ['abyssal', 'volcanic'] }
  ),
  item(
    'enemies',
    'longhai',
    'Longhai',
    `${WARLORDS_CDN}/models/creatures/land/longhai.glb`,
    `${ICO}/Boat_Icon.png`,
    true,
    { contentLayer: 'monster', siHeightM: 2.4, biomes: ['storm', 'abyssal'] }
  ),
];

const COTW = `${WARLORDS_CDN}/models/creatures/cotw`;

/** Call of the Wild island animals — meat / leather / bone. Predators are monsters until killed. */
export const WARLORDS_COTW_ANIMALS: WarlordsDragItem[] = [
  item(
    'animals',
    'cotw-raccoon',
    'Raccoon',
    `${COTW}/raccoon.glb`,
    `${ICO}/Skeeter_Icon.png`,
    false,
    {
      contentLayer: 'animal',
      siHeightM: 0.35,
      harvestKind: 'hide',
      harvestDrops: ['hide', 'meat', 'bone'],
      animalRole: 'prey',
      biomes: ['forest', 'tropical'],
    }
  ),
  item(
    'animals',
    'cotw-mink',
    'American mink',
    `${COTW}/mink.glb`,
    `${ICO}/Skeeter_Icon.png`,
    false,
    {
      contentLayer: 'animal',
      siHeightM: 0.25,
      harvestKind: 'hide',
      harvestDrops: ['hide', 'meat'],
      animalRole: 'prey',
      biomes: ['forest', 'frozen'],
    }
  ),
  item(
    'animals',
    'cotw-beaver',
    'Beaver',
    `${COTW}/beaver.glb`,
    `${ICO}/Boat_Icon.png`,
    false,
    {
      contentLayer: 'animal',
      siHeightM: 0.45,
      harvestKind: 'hide',
      harvestDrops: ['hide', 'meat', 'bone'],
      animalRole: 'prey',
      biomes: ['forest', 'storm'],
    }
  ),
  item(
    'animals',
    'cotw-mallard',
    'Mallard',
    `${COTW}/mallard.glb`,
    `${ICO}/Boat_Icon.png`,
    false,
    {
      contentLayer: 'animal',
      siHeightM: 0.35,
      harvestKind: 'meat',
      harvestDrops: ['meat', 'bone'],
      animalRole: 'prey',
      air: true,
      biomes: ['tropical', 'storm', 'frozen'],
    }
  ),
  item(
    'animals',
    'cotw-deer',
    'Deer (COTW)',
    `${COTW}/deer.glb`,
    `${ICO}/Skeeter_Icon.png`,
    false,
    {
      contentLayer: 'animal',
      siHeightM: 1.2,
      harvestKind: 'hide',
      harvestDrops: ['hide', 'meat', 'bone'],
      animalRole: 'prey',
      biomes: ['forest', 'ethereal'],
    }
  ),
  item(
    'animals',
    'cotw-buffalo',
    'Cape buffalo',
    `${COTW}/buffalo.glb`,
    `${ICO}/Boat_Icon.png`,
    false,
    {
      contentLayer: 'animal',
      siHeightM: 1.7,
      harvestKind: 'hide',
      harvestDrops: ['hide', 'meat', 'bone'],
      animalRole: 'prey',
      biomes: ['desert', 'tropical'],
    }
  ),
  item(
    'animals',
    'cotw-lynx',
    'Lynx',
    `${COTW}/lynx.glb`,
    `${ICO}/Scorpid_Launcher_Icon.png`,
    false,
    {
      contentLayer: 'monster',
      siHeightM: 0.65,
      harvestKind: 'hide',
      harvestDrops: ['hide', 'meat', 'bone'],
      animalRole: 'predator',
      biomes: ['forest', 'frozen'],
    }
  ),
  item(
    'animals',
    'cotw-lioness',
    'Lioness',
    `${COTW}/lioness.glb`,
    `${ICO}/Scorpid_Launcher_Icon.png`,
    false,
    {
      contentLayer: 'monster',
      siHeightM: 1.05,
      harvestKind: 'hide',
      harvestDrops: ['hide', 'meat', 'bone'],
      animalRole: 'predator',
      biomes: ['desert', 'volcanic'],
    }
  ),
  item(
    'animals',
    'cotw-alligator',
    'Alligator',
    `${COTW}/alligator.glb`,
    `${ICO}/Skeeter_Icon.png`,
    false,
    {
      contentLayer: 'monster',
      siHeightM: 0.45,
      harvestKind: 'hide',
      harvestDrops: ['hide', 'meat', 'bone'],
      animalRole: 'predator',
      biomes: ['tropical', 'storm', 'abyssal'],
    }
  ),
];

/** Wildlife — CDN creatures, Animal layer (NPC phys). */
export const WARLORDS_ANIMALS: WarlordsDragItem[] = [
  item(
    'animals',
    'deer',
    'Deer',
    `${WARLORDS_CDN}/models/creatures/land/deer.glb`,
    `${ICO}/Skeeter_Icon.png`,
    true,
    { contentLayer: 'animal', siHeightM: 1.4, harvestKind: 'hide' }
  ),
  item(
    'animals',
    'wolf',
    'Wolf',
    `${WARLORDS_CDN}/models/creatures/land/wolf.glb`,
    `${ICO}/Scorpid_Launcher_Icon.png`,
    true,
    { contentLayer: 'animal', siHeightM: 1.1, harvestKind: 'hide' }
  ),
  item(
    'animals',
    'horse',
    'Horse',
    `${WARLORDS_CDN}/models/creatures/land/horse.glb`,
    `${ICO}/Boat_Icon.png`,
    true,
    { contentLayer: 'animal', prefabKind: 'mount', siHeightM: 1.8 }
  ),
  item(
    'animals',
    'creature-crab',
    'Crab',
    `${WARLORDS_CDN}/models/creatures/land/creature_crab.glb`,
    `${ICO}/Skeeter_Icon.png`,
    true,
    { contentLayer: 'animal', siHeightM: 0.6, harvestKind: 'fish' }
  ),
];

/** Only HEAD-200 weapon / siege GLBs. weapon-models.json still lists many FBX-only keys. */
export const WARLORDS_WEAPONS: WarlordsDragItem[] = [
  item(
    'weapons',
    'hand-axe',
    'Hand axe',
    `${WPN}/axe/HandAxe.glb`,
    `${WPN_ICO}/Axe_01.png`,
    false,
    {
      contentLayer: 'item',
    }
  ),
  item(
    'weapons',
    'greataxe',
    'Greataxe',
    `${WPN}/greataxe/Greataxe.glb`,
    `${WPN_ICO}/Axe_20.png`,
    false,
    {
      contentLayer: 'item',
    }
  ),
  item(
    'weapons',
    'greatsword',
    'Greatsword',
    `${WPN}/greatsword/Greatsword.glb`,
    `${WPN_ICO}/Sword_30.png`,
    false,
    { contentLayer: 'item' }
  ),
  item(
    'weapons',
    'two-handed-sword',
    'Two-handed sword',
    `${WPN}/greatsword/TwoHandedSword.glb`,
    `${WPN_ICO}/Sword_27.png`,
    false,
    { contentLayer: 'item' }
  ),
  item(
    'weapons',
    'imperial-dragon-spear',
    'Imperial dragon spear',
    `${WARLORDS_CDN}/models/weapons/imperial_dragon_spear.glb`,
    `${WPN_ICO}/Spear_01.png`,
    true,
    {
      contentLayer: 'item',
      tab: 'r2',
      r2Key: 'models/weapons/imperial_dragon_spear.glb',
      siHeightM: 1.8,
    }
  ),
  item(
    'weapons',
    'animated-repeater',
    'Animated repeater',
    `${WARLORDS_CDN}/models/weapons/animated_repeater.glb`,
    `${WPN_ICO}/Bow_01.png`,
    true,
    {
      contentLayer: 'item',
      tab: 'r2',
      r2Key: 'models/weapons/animated_repeater.glb',
      siHeightM: 0.9,
    }
  ),
  item(
    'weapons',
    'bow',
    'Bow',
    `${WPN}/bow/Bow.glb`,
    `${WPN_ICO}/Bow_01.png`,
    false,
    {
      contentLayer: 'item',
    }
  ),
  item(
    'weapons',
    'orc-bow',
    'Orc bow',
    `${WPN}/bow/orc_bow.glb`,
    `${WPN_ICO}/Bow_02.png`,
    false,
    {
      contentLayer: 'item',
    }
  ),
  item(
    'weapons',
    'catapult',
    'Catapult',
    `${ENT}/catapult.glb`,
    `${ICO}/Catapult.png`,
    false,
    { prefabKind: 'siege', siHeightM: 4, contentLayer: 'item' }
  ),
  item(
    'weapons',
    'heavy-catapult',
    'Heavy catapult',
    `${ENT}/heavy_catapult.glb`,
    `${ICO}/Heavy_Catapult.png`,
    false,
    { prefabKind: 'siege', siHeightM: 4, contentLayer: 'item' }
  ),
  item(
    'weapons',
    'bolt-thrower',
    'Bolt thrower',
    `${ENT}/bolt_thrower.glb`,
    `${ICO}/Bolt_Thrower.png`,
    false,
    { prefabKind: 'siege', siHeightM: 3, contentLayer: 'item' }
  ),
];

/** uMMORPG island / lobby / event maps (islandDeployments + map-registry). */
export const WARLORDS_ISLANDS: WarlordsDragItem[] = [
  item(
    'islands',
    'home-island',
    'Home island',
    `${WARLORDS_CDN}/models/nature/stylized/concept/example_home_island.glb`,
    minimapUrl('home-island'),
    false,
    {
      siHeightM: 1024,
      isTerrain: true,
      terrainId: 'home-island',
      r2Key: 'models/nature/stylized/concept/example_home_island.glb',
      contentLayer: 'terrain',
      islandKind: 'static',
    }
  ),
  item(
    'islands',
    'pirate-islands',
    'Pirate islands',
    `${WARLORDS_CDN}/models/lobby/pirate-islands/scene.glb`,
    minimapUrl('pirate-islands'),
    false,
    {
      sectorId: 'pirate-islands',
      terrainId: 'pirate-islands',
      isTerrain: true,
      contentLayer: 'terrain',
      islandKind: 'static',
    }
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
    `${ICO}/totem1.png`
  ),
  item(
    'islands',
    'hoth-boss',
    'Hoth boss room',
    `${WARLORDS_CDN}/models/biomes/frozen/hoth_boss_room_low_poly.glb`,
    `${ICO}/Flag_Icon.png`
  ),
  item(
    'islands',
    'iceland',
    'Iceland scene',
    `${WARLORDS_CDN}/models/biomes/cold/iceland_scene_for_canimatic.glb`,
    `${ICO}/Flag_Icon.png`
  ),
];

/** Hard Road DS2 erosion terrain — higher-def zones / mountains (not a GLB). */
export const WARLORDS_HD_ZONES: WarlordsDragItem[] = [
  item(
    'zones',
    'hd-mountains',
    'Live DS2 · mountains',
    'hardroad://ds2-terrain?preset=mountains',
    minimapUrl('ember_depths'),
    false,
    { terrainPreset: 'mountains', isTerrain: true, contentLayer: 'terrain' }
  ),
  item(
    'zones',
    'hd-crags',
    'Live DS2 · crags',
    'hardroad://ds2-terrain?preset=crags',
    minimapUrl('frostbite_expanse'),
    false,
    { terrainPreset: 'crags', isTerrain: true, contentLayer: 'terrain' }
  ),
  item(
    'zones',
    'hd-zone',
    'Live DS2 · zone',
    'hardroad://ds2-terrain?preset=zone',
    minimapUrl('haven_shore'),
    false,
    { terrainPreset: 'zone', isTerrain: true, contentLayer: 'terrain' }
  ),
];

/** 3×3 warlords-zones.json — same order as SEAFLOOR_GRID. Not islands. */
export const WARLORDS_SECTOR_IDS = SEAFLOOR_GRID.flat();

function sectorPreset(id: string): 'mountains' | 'crags' | 'zone' {
  if (id.includes('frost') || id.includes('abyssal') || id.includes('storm'))
    return 'crags';
  if (id.includes('haven') || id.includes('thorn')) return 'zone';
  return 'mountains';
}

function sectorIcon(id: string): string {
  return minimapUrl(id);
}

/** 9 Warlords era MMO sector floors — DS2 bake. Islands sit on these cells. */
export const WARLORDS_SECTORS: WarlordsDragItem[] = WARLORDS_SECTOR_IDS.map(
  (id) => {
    const target = findHdTarget(id);
    const baked = target
      ? cdnUrlForTarget(target)
      : `${WARLORDS_CDN}/models/environment/sectors/${id}/ds2-terrain.glb`;
    const pack = packForSector(id);
    const pretty = id.replace(/_/g, ' ');
    return item(
      'sectors',
      `sector-${id}`,
      pack ? `${pretty} · ${pack.name}` : `${pretty} · DS2`,
      baked,
      sectorIcon(id),
      false,
      {
        terrainPreset: sectorPreset(id),
        sectorId: id,
        terrainId: id,
        isTerrain: true,
        contentLayer: 'terrain',
        r2Key:
          target?.r2Key || `models/environment/sectors/${id}/ds2-terrain.glb`,
        siHeightM: 420,
        placeable: true,
        playUrl: `https://grudgewarlords.com/play?sector=${id}&mode=zone&worldSeed=grudge-world-1`,
        tab: 'warlords',
      }
    );
  }
);

export const WARLORDS_CAMP_PREFABS: WarlordsDragItem[] = [
  item(
    'prefabs',
    'enemy-camp',
    'Enemy camp · 4 units',
    'prefab://enemy-camp',
    `${ICO}/House_Icon.png`,
    false,
    {
      prefabId: 'PFAB-ENT-ENEMY-CAMP',
      prefabKind: 'structure',
      siHeightM: 4,
      placeable: true,
      tab: 'warlords',
    }
  ),
];

/** Home-island contract harvest packs + organized nature (HEAD 200). */
export const WARLORDS_HARVEST: WarlordsDragItem[] = [
  item(
    'harvest',
    'harvest-tree',
    'Island tree · logging',
    `${WARLORDS_CDN}/models/environment/island_tree.glb`,
    `${ICO}/totem1.png`,
    false,
    { contentLayer: 'harvestable', harvestKind: 'wood', siHeightM: 4 }
  ),
  item(
    'harvest',
    'harvest-plant-kit',
    'Assorted plant kit',
    `${WARLORDS_CDN}/models/nature/glb/assorted_plant_kit.glb`,
    `${ICO}/totem1.png`,
    true,
    {
      contentLayer: 'harvestable',
      harvestKind: 'herb',
      tab: 'r2',
      r2Key: 'models/nature/glb/assorted_plant_kit.glb',
      siHeightM: 1.2,
    }
  ),
  item(
    'harvest',
    'harvest-palm',
    'Palm · logging',
    `${WARLORDS_CDN}/models/nature/realistic/trees/palm/palm_a.glb`,
    `${ICO}/Boat_Icon.png`,
    false,
    {
      contentLayer: 'harvestable',
      harvestKind: 'wood',
      siHeightM: 6,
      biomes: ['tropical', 'storm', 'desert', 'nexus'],
    }
  ),
  item(
    'harvest',
    'harvest-pine',
    'Pine · logging',
    `${WARLORDS_CDN}/models/nature/realistic/trees/pine/pine_a.glb`,
    `${ICO}/totem1.png`,
    false,
    {
      contentLayer: 'harvestable',
      harvestKind: 'wood',
      siHeightM: 8,
      biomes: ['forest', 'frozen'],
    }
  ),
  item(
    'harvest',
    'harvest-oak',
    'Oak · logging',
    `${WARLORDS_CDN}/models/nature/realistic/trees/deciduous/oak_b.glb`,
    `${ICO}/House_Icon.png`,
    false,
    {
      contentLayer: 'harvestable',
      harvestKind: 'wood',
      siHeightM: 7,
      biomes: ['forest', 'ethereal', 'nexus'],
    }
  ),
  item(
    'harvest',
    'harvest-rock',
    'Island rock · mining',
    `${WARLORDS_CDN}/models/environment/island_rock.glb`,
    `${ICO}/totem1.png`,
    false,
    { contentLayer: 'harvestable', harvestKind: 'stone', siHeightM: 1.4 }
  ),
  item(
    'harvest',
    'harvest-boulder',
    'Boulder · mining',
    `${WARLORDS_CDN}/models/nature/realistic/rocks/boulder_a.glb`,
    `${ICO}/totem1.png`,
    false,
    {
      contentLayer: 'harvestable',
      harvestKind: 'stone',
      siHeightM: 2.2,
      biomes: ['tropical', 'forest', 'nexus', 'frozen'],
    }
  ),
  item(
    'harvest',
    'harvest-gem',
    'Gem cluster · mining',
    `${WARLORDS_CDN}/models/environment/gem_cluster.glb`,
    `${ICO}/totem1.png`,
    false,
    { contentLayer: 'harvestable', harvestKind: 'ore', siHeightM: 0.8 }
  ),
  item(
    'meshes',
    'skeleton-residual',
    'Skeleton residual',
    `${WARLORDS_CDN}/models/skeletons/Skeleton.glb`,
    `${ICO}/totem1.png`,
    false,
    { contentLayer: 'item', siHeightM: 1.6 }
  ),
];

/** Water / seafloor / weather / trigger — existing engine prefabs (no invented GLB). */
export const WARLORDS_LAYER_PREFABS: WarlordsDragItem[] = [
  item(
    'meshes',
    'water-plane',
    'Water plane · 40 m',
    'prefab://water-plane',
    `${ICO}/Boat_Icon.png`,
    false,
    { contentLayer: 'water', siHeightM: 4, placeable: true }
  ),
  item(
    'meshes',
    'seafloor-grid',
    'Seafloor · 9×10 km + islands',
    'prefab://seafloor-grid',
    minimapUrl('haven_shore'),
    false,
    {
      contentLayer: 'seafloor',
      siHeightM: 90,
      placeable: true,
      isTerrain: true,
    }
  ),
  item(
    'meshes',
    'map-surface-terrain',
    'Map floor · terrain 2000 m',
    'prefab://map-surface-terrain',
    `${ICO}/Flag_Icon.png`,
    false,
    {
      contentLayer: 'terrain',
      siHeightM: 2000,
      placeable: true,
      isTerrain: true,
    }
  ),
  item(
    'meshes',
    'map-surface-water',
    'Map floor · water 2000 m',
    'prefab://map-surface-water',
    `${ICO}/Boat_Icon.png`,
    false,
    { contentLayer: 'water', siHeightM: 2000, placeable: true }
  ),
  item(
    'meshes',
    'map-surface-seafloor',
    'Map floor · seafloor 2000 m',
    'prefab://map-surface-seafloor',
    minimapUrl('haven_shore'),
    false,
    {
      contentLayer: 'seafloor',
      siHeightM: 2000,
      placeable: true,
      isTerrain: true,
    }
  ),
  item(
    'meshes',
    'map-surface-lava',
    'Map floor · lava 2000 m',
    'prefab://map-surface-lava',
    `${ICO}/totem1.png`,
    false,
    { contentLayer: 'lava', siHeightM: 2000, placeable: true, isTerrain: true }
  ),
  item(
    'meshes',
    'map-surface-quicksand',
    'Map floor · quicksand 2000 m',
    'prefab://map-surface-quicksand',
    `${ICO}/Flag_Icon.png`,
    false,
    {
      contentLayer: 'quicksand',
      siHeightM: 2000,
      placeable: true,
      isTerrain: true,
    }
  ),
  item(
    'meshes',
    'map-surface-void',
    'Map floor · void (fall)',
    'prefab://map-surface-void',
    `${ICO}/Flag_Icon.png`,
    false,
    { contentLayer: 'void', siHeightM: 2000, placeable: true }
  ),
  item(
    'meshes',
    'weather-cloud',
    'Cloud',
    'prefab://weather-cloud',
    `${ICO}/Flag_Icon.png`,
    false,
    { contentLayer: 'weather', siHeightM: 20, placeable: true }
  ),
  item(
    'meshes',
    'weather-fall',
    'Waterfall',
    'prefab://weather-fall',
    `${ICO}/Boat_Icon.png`,
    false,
    { contentLayer: 'weather', siHeightM: 28, placeable: true }
  ),
  item(
    'prefabs',
    'spawnpoint',
    'Spawn point',
    'prefab://spawnpoint',
    `${ICO}/Flag_Icon.png`,
    false,
    { contentLayer: 'trigger', siHeightM: 2, placeable: true }
  ),
  item(
    'prefabs',
    'trigger-volume',
    'Trigger volume',
    'prefab://trigger-volume',
    `${ICO}/Flag_Icon.png`,
    false,
    { contentLayer: 'trigger', siHeightM: 2, placeable: true }
  ),
];

/** Chicken Gun pirate lobby + Haven Fruzer + dojo/training plates. */
export const WARLORDS_SCENES: WarlordsDragItem[] = [
  item(
    'scenes',
    'chicken-gun-pirate',
    'Chicken Gun · pirate lobby',
    `${WARLORDS_CDN}/models/lobby/pirate-islands/scene.glb`,
    minimapUrl('pirate-islands'),
    false,
    {
      sectorId: 'pirate-islands',
      terrainId: 'chicken_gun_pirate_lobby',
      isTerrain: true,
      contentLayer: 'terrain',
      islandKind: 'static',
      playUrl:
        'https://grudgewarlords.com/island-3d?mode=lobby&map=pirate-islands',
    }
  ),
  item(
    'scenes',
    'haven-fruzer',
    'Haven Shore · Fruzer islands',
    `${WARLORDS_CDN}/models/warlords/haven_shore/fruzer_islands.glb`,
    minimapUrl('haven_shore'),
    false,
    {
      sectorId: 'haven_shore',
      terrainId: 'haven_shore',
      isTerrain: true,
      contentLayer: 'terrain',
      islandKind: 'faction',
      playUrl:
        'https://grudgewarlords.com/play?sector=haven_shore&mode=zone&city=haven_port',
    }
  ),
  item(
    'scenes',
    'dojo-hoth',
    'Dojo · Hoth boss room',
    `${WARLORDS_CDN}/models/biomes/frozen/hoth_boss_room_low_poly.glb`,
    `${ICO}/Flag_Icon.png`,
    false,
    {
      sectorId: 'dojo',
      terrainId: 'dojo_hoth',
      isTerrain: true,
      contentLayer: 'terrain',
    }
  ),
  item(
    'scenes',
    'fruzer-coliseum',
    'Fruzer coliseum',
    `${WARLORDS_CDN}/models/maps/fruzer_coliseum.glb`,
    `${ICO}/Flag_Icon.png`,
    true,
    {
      terrainId: 'fruzer_coliseum',
      isTerrain: true,
      contentLayer: 'terrain',
      tab: 'r2',
      r2Key: 'models/maps/fruzer_coliseum.glb',
    }
  ),
  item(
    'scenes',
    'pvp-arena',
    'PvP arena',
    `${WARLORDS_CDN}/models/maps/pvp-arena.glb`,
    `${ICO}/Flag_Icon.png`,
    true,
    {
      terrainId: 'pvp_arena',
      isTerrain: true,
      contentLayer: 'terrain',
      tab: 'r2',
      r2Key: 'models/maps/pvp-arena.glb',
    }
  ),
  item(
    'scenes',
    'stylized-dungeon',
    'Stylized dungeon shell',
    `${WARLORDS_CDN}/models/dungeons/stylized_dungeon.glb`,
    `${ICO}/Flag_Icon.png`,
    true,
    {
      terrainId: 'stylized_dungeon',
      isTerrain: true,
      contentLayer: 'terrain',
      tab: 'r2',
      r2Key: 'models/dungeons/stylized_dungeon.glb',
    }
  ),
  item(
    'scenes',
    'catacombs',
    'Catacombs shell',
    `${WARLORDS_CDN}/models/dungeons/catacombs_map.glb`,
    `${ICO}/Flag_Icon.png`,
    true,
    {
      terrainId: 'catacombs',
      isTerrain: true,
      contentLayer: 'terrain',
      tab: 'r2',
      r2Key: 'models/dungeons/catacombs_map.glb',
    }
  ),
];

const VFX = `${WARLORDS_CDN}/models/vfx`;
export const WARLORDS_VFX: WarlordsDragItem[] = [
  ['explosion', 'Explosion'],
  ['muzzle', 'Muzzle'],
  ['fireball', 'Fireball'],
  ['lightning', 'Lightning'],
  ['energy-beam', 'Energy beam'],
  ['strawberry-strike', 'Strike'],
  ['aoe-warning', 'AoE warning'],
  ['spell-glyph', 'Spell glyph'],
  ['laser-beam', 'Laser'],
  ['light-beam', 'Light beam'],
].map(([id, name]) =>
  item(
    'vfx',
    `vfx-${id}`,
    name,
    `${VFX}/${id}.glb`,
    `${ICO}/totem1.png`,
    false,
    {
      tab: 'vfx',
      contentLayer: 'projectile',
      siHeightM: 0.4,
    }
  )
);

export const WARLORDS_TEXTURES: WarlordsDragItem[] = [
  item(
    'textures',
    'tex-wk',
    'WK atlas',
    `${WARLORDS_CDN}/textures/grudge6/western-kingdoms/WK_Standard_Units.webp`,
    `${ICO}/Human_Warrior.png`,
    false,
    { tab: 'r2' }
  ),
  item(
    'textures',
    'tex-brb',
    'BRB atlas',
    `${WARLORDS_CDN}/textures/grudge6/barbarians/BRB_StandardUnits_texture.webp`,
    `${ICO}/barb_warrior.png`,
    false,
    { tab: 'r2' }
  ),
  item(
    'textures',
    'tex-elf',
    'ELF atlas',
    `${WARLORDS_CDN}/textures/grudge6/elves/ELF_HighElves_Texture.webp`,
    `${ICO}/elf_warrior.png`,
    false,
    { tab: 'r2' }
  ),
  item(
    'textures',
    'tex-orc',
    'ORC atlas',
    `${WARLORDS_CDN}/textures/grudge6/orcs/ORC_StandardUnits.webp`,
    `${ICO}/orc_warrior.png`,
    false,
    { tab: 'r2' }
  ),
];

export const WARLORDS_ANIMS: WarlordsDragItem[] = [
  item(
    'animations',
    'anim-drake-1h',
    'Drake 1H attacks',
    `/anims/baked/sword_shield/drake_attack.json`,
    `${WPN_ICO}/Sword_30.png`,
    true,
    {
      tab: 'r2',
      placeable: false,
      r2Key: 'anims/baked/sword_shield/drake_attack.json',
      siHeightM: 1.8,
    }
  ),
  item(
    'animations',
    'anim-sword',
    'sword_shield pack',
    `/anims/baked/sword_shield/karina_attack1.json`,
    `${WPN_ICO}/Sword_30.png`,
    true,
    {
      tab: 'r2',
      placeable: false,
      r2Key: 'anims/baked/sword_shield',
      siHeightM: 1.8,
    }
  ),
  item(
    'animations',
    'anim-2h',
    '2h_melee pack',
    `/anims/baked/2h_melee/ruby_attack1.json`,
    `${WPN_ICO}/Axe_20.png`,
    true,
    {
      tab: 'r2',
      placeable: false,
      r2Key: 'anims/baked/2h_melee',
      siHeightM: 1.8,
    }
  ),
  item(
    'animations',
    'anim-spear',
    'polearm / spear pack',
    `/anims/baked/polearm/zilong_attack1.json`,
    `${WPN_ICO}/Spear_01.png`,
    true,
    {
      tab: 'r2',
      placeable: false,
      r2Key: 'anims/baked/polearm',
      siHeightM: 1.8,
    }
  ),
  item(
    'animations',
    'anim-bow',
    'longbow pack',
    `/anims/baked/longbow/miya_attack1.json`,
    `${WPN_ICO}/Bow_01.png`,
    true,
    {
      tab: 'r2',
      placeable: false,
      r2Key: 'anims/baked/longbow',
      siHeightM: 1.8,
    }
  ),
  item(
    'animations',
    'anim-magic',
    'magic / staff pack',
    `/anims/baked/magic/eudora_attack1.json`,
    `${ICO}/totem1.png`,
    true,
    { tab: 'r2', placeable: false, r2Key: 'anims/baked/magic', siHeightM: 1.8 }
  ),
  item(
    'animations',
    'anim-pistol',
    'pistol pack (Clint)',
    `/anims/baked/pistol/clint_attack1.json`,
    `${WPN_ICO}/Sword_27.png`,
    true,
    { tab: 'r2', placeable: false, r2Key: 'anims/baked/pistol', siHeightM: 1.8 }
  ),
  ...MIXAMO_PACK_FOLDERS.map((pack) =>
    item(
      'animations',
      `pack-${pack}`,
      `Mixamo · ${pack}`,
      `/anims/baked/${pack}`,
      `${WPN_ICO}/Sword_30.png`,
      true,
      {
        tab: 'r2',
        placeable: false,
        r2Key: `anims/baked/${pack}`,
        siHeightM: 1.8,
      }
    )
  ),
  ...WARLORDS_LIBRARY_CLIPS.map((c) =>
    item(
      'animations',
      `clip-${c.bakeRel.replace(/[^\w]+/g, '-')}`,
      `${c.pack} · ${c.label}`,
      `/anims/baked/${c.bakeRel}.json`,
      `${WPN_ICO}/Sword_30.png`,
      true,
      {
        tab: 'r2',
        placeable: false,
        r2Key: `anims/baked/${c.bakeRel}`,
        siHeightM: 1.8,
      }
    )
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
  if (
    row.group === 'buildings' ||
    row.group === 'vehicles' ||
    row.kind === 'structure'
  ) {
    return 'meshes';
  }
  if (row.kind === 'vehicle' || row.kind === 'mount') return 'meshes';
  return 'meshes';
}

function isUniqueEntityGlb(url: string): boolean {
  const u = url.toLowerCase();
  if (!u.endsWith('.glb')) return false;
  if (u.endsWith('.fbx')) return false;
  if (u.includes('/prod/gltf/characters/')) return false;
  if (u.includes('free_survival_asset_kit')) return false;
  if (u.includes('3_medieval_towers')) return false;
  return true;
}

export function placeableToDragItem(
  row: PlaceableItem
): WarlordsDragItem | null {
  const url = row.modelUrl ?? '';
  if (row.meshStatus !== 'cdn_ready') return null;
  if (!url.startsWith('https://assets.grudge-studio.com/')) return null;
  if (!isUniqueEntityGlb(url)) return null;
  const group = placeableGroup(row);
  if (!group) return null;
  const key = row.id.replace(/^ummorpg-placeable\//, 'ummorpg-');
  return item(
    group,
    key,
    row.label,
    url,
    row.iconUrl || `${ICO}/Flag_Icon.png`,
    false,
    {
      prefabKind: (row.kind as PrefabKind | undefined) || undefined,
      siHeightM: defaultSiHeight(group, row.kind),
      tab: 'd1',
    }
  );
}

type PrefabRow = {
  prefabId?: string;
  id: string;
  kind?: string;
  name?: string;
  displayName?: string;
  si?: { heightM?: number };
  game?: { placeable?: boolean };
  mesh?: { cdnUrl?: string | null; status?: string; r2Key?: string | null };
  icon?: { uuid?: string; cdnUrl?: string | null };
  status?: string;
};

function prefabGroup(kind?: string): WarlordsAssetGroup {
  if (kind === 'unit') return 'units';
  if (kind === 'siege') return 'weapons';
  return 'meshes';
}

function attachPrefabMeta(list: WarlordsDragItem[], prefabs: PrefabRow[]) {
  const bySlug = new Map<string, PrefabRow>();
  for (const p of prefabs) bySlug.set(slugPrefabId(p.id), p);
  for (const row of list) {
    const hit =
      bySlug.get(slugPrefabId(row.key)) ||
      bySlug.get(slugPrefabId(row.id.toString())) ||
      bySlug.get(slugPrefabId(row.r2Key || ''));
    if (!hit) continue;
    row.prefabId = String(hit.prefabId || hit.id);
    row.prefabKind = (hit.kind as PrefabKind) || row.prefabKind;
    if (hit.si?.heightM) row.siHeightM = hit.si.heightM;
    if (hit.icon?.cdnUrl) row.icon = hit.icon.cdnUrl;
    if (hit.icon?.uuid) row.iconUuid = hit.icon.uuid;
    if (hit.mesh?.r2Key) row.r2Key = hit.mesh.r2Key;
    if (hit.mesh?.status) row.meshStatus = hit.mesh.status;
    if (hit.game?.placeable === false) row.placeable = false;
  }
}

function prefabToDragItem(row: PrefabRow): WarlordsDragItem | null {
  const icon = row.icon?.cdnUrl || OK_ICON.flag;
  const meshUrl = row.mesh?.cdnUrl || '';
  const ready = row.mesh?.status === 'cdn_ready' && isUniqueEntityGlb(meshUrl);
  const group = prefabGroup(row.kind);
  const key = slugPrefabId(row.id);
  return item(
    group,
    key,
    row.displayName || row.name || key,
    ready ? meshUrl : row.icon?.cdnUrl || icon,
    icon,
    false,
    {
      prefabId: String(row.prefabId || row.id),
      prefabKind: (row.kind as PrefabKind) || undefined,
      iconUuid: row.icon?.uuid,
      siHeightM: row.si?.heightM ?? defaultSiHeight(group, row.kind),
      placeable: ready,
      meshStatus: row.mesh?.status || row.status || 'icon_only',
      r2Key: row.mesh?.r2Key || r2KeyFromUrl(meshUrl) || key,
      tab: 'd1',
    }
  );
}

function mergeByKey(
  base: WarlordsDragItem[],
  extra: WarlordsDragItem[]
): WarlordsDragItem[] {
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
  ...WARLORDS_SECTORS,
  ...WARLORDS_CAMP_PREFABS,
  ...WARLORDS_LAYER_PREFABS,
  ...WARLORDS_HARVEST,
  ...WARLORDS_SCENES,
  ...WARLORDS_CAPTAINS,
  ...WARLORDS_SKETCHFAB_HEROES,
  ...WARLORDS_UNITS,
  ...WARLORDS_ENEMIES,
  ...WARLORDS_ANIMALS,
  ...WARLORDS_COTW_ANIMALS,
  ...WARLORDS_WEAPONS,
  ...WARLORDS_ISLANDS,
  ...WARLORDS_HD_ZONES,
  ...WARLORDS_VFX,
  ...WARLORDS_TEXTURES,
  ...WARLORDS_ANIMS,
];

export function itemsForTab(
  list: WarlordsDragItem[],
  tab: 'warlords' | 'd1' | 'r2' | 'vfx'
): WarlordsDragItem[] {
  if (tab === 'vfx')
    return list.filter(
      (r) => r.group === 'vfx' || r.contentLayer === 'projectile'
    );
  if (tab === 'r2')
    return list.filter(
      (r) =>
        r.tab === 'r2' ||
        r.group === 'textures' ||
        r.group === 'animations' ||
        r.group === 'harvest'
    );
  if (tab === 'd1')
    return list.filter(
      (r) =>
        r.key.startsWith('ummorpg-') ||
        r.tab === 'd1' ||
        r.group === 'prefabs' ||
        Boolean(r.prefabId)
    );
  return list.filter(
    (r) =>
      r.tab !== 'r2' &&
      r.group !== 'textures' &&
      r.group !== 'animations' &&
      (r.group !== 'vfx' || r.contentLayer === 'projectile')
  );
}

export async function loadWarlordsLibrary(): Promise<WarlordsDragItem[]> {
  try {
    const [prefabRes, nature] = await Promise.all([
      fetch(WARLORDS_PREFABS_URL),
      fetchNatureRows(),
    ]);
    let merged = [...WARLORDS_STATIC_LIBRARY];
    if (prefabRes.ok) {
      const data = (await prefabRes.json()) as { prefabs?: PrefabRow[] };
      const prefabs = data.prefabs ?? [];
      attachPrefabMeta(merged, prefabs);
      const extra = prefabs
        .map(prefabToDragItem)
        .filter((row): row is WarlordsDragItem => Boolean(row));
      merged = mergeByKey(merged, extra);
    }
    const natureItems = nature.map((n) =>
      item(
        'harvest',
        n.key,
        n.name,
        n.url,
        n.harvestKind === 'wood' ? `${ICO}/totem1.png` : `${ICO}/Flag_Icon.png`,
        false,
        {
          contentLayer: 'harvestable',
          harvestKind: n.harvestKind,
          siHeightM: n.siHeightM,
          r2Key: n.path.replace(/^\//, ''),
          biomes: n.biomes,
        }
      )
    );
    merged = mergeByKey(merged, natureItems);
    const localPrefabs = loadEditorPrefabs().map((p) =>
      item(
        'prefabs',
        p.id.toLowerCase(),
        p.name,
        p.filePath,
        `${ICO}/House_Icon.png`,
        false,
        {
          prefabId: p.id,
          prefabKind: p.prefabKind,
          siHeightM: p.siHeightM,
          contentLayer: p.contentLayer as WarlordsDragItem['contentLayer'],
          harvestKind: p.harvestKind as WarlordsDragItem['harvestKind'],
          meshName: p.meshName,
          playScript: p.playScript,
          r2Key: p.r2Key,
          tab: 'd1',
        }
      )
    );
    merged = mergeByKey(merged, localPrefabs);
    const diskAnims = (await loadDiskAnimIndex()).map((c) =>
      item(
        'animations',
        `disk-${c.bakeRel}`,
        c.name,
        `/anims/baked/${c.bakeRel}.json`,
        `${WPN_ICO}/Sword_30.png`,
        true,
        {
          tab: 'r2',
          placeable: false,
          r2Key: c.bakeRel,
          siHeightM: 1.8,
          playScript: `anim:${c.bakeRel}`,
        }
      )
    );
    merged = mergeByKey(merged, diskAnims);
    try {
      const libRes = await fetch('/warlords-library/LIBRARY.json');
      if (libRes.ok) {
        const lib = (await libRes.json()) as { scopes?: Record<string, { local?: string }> };
        const localKit = item(
          'prefabs',
          'local-warlords-library',
          'Local erawarlords library',
          '/warlords-library/LIBRARY.json',
          `${ICO}/House_Icon.png`,
          false,
          {
            tab: 'd1',
            siHeightM: 1.8,
            placeable: false,
            r2Key: 'erawarlords/LIBRARY.json',
          }
        );
        merged = mergeByKey(merged, [localKit]);
        void lib;
      }
    } catch {
      /* live ThreeFlow has no local disk */
    }
    try {
      const { loadVfxStudioCatalog } = await import('./vfxLab');
      const studio = await loadVfxStudioCatalog();
      merged = mergeByKey(merged, studio);
    } catch {
      /* studio catalog optional */
    }
    return merged;
  } catch {
    return WARLORDS_STATIC_LIBRARY;
  }
}

export function itemsInGroup(
  list: WarlordsDragItem[],
  group: WarlordsAssetGroup | 'all'
): WarlordsDragItem[] {
  if (group === 'all') return list;
  if (group === 'prefabs') return list.filter((row) => Boolean(row.prefabId));
  return list.filter((row) => row.group === group);
}

export function catalogContentLayer(
  row: WarlordsDragItem
): NonNullable<WarlordsDragItem['contentLayer']> {
  if (row.contentLayer) return row.contentLayer;
  if (row.harvestKind) return 'harvestable';
  if (
    row.isTerrain ||
    row.group === 'sectors' ||
    row.group === 'zones' ||
    row.group === 'islands' ||
    row.group === 'scenes'
  )
    return 'terrain';
  if (row.group === 'captains') return 'player';
  if (row.group === 'units') return 'npc';
  if (row.group === 'animals') return 'animal';
  if (row.group === 'harvest') return 'harvestable';
  if (row.group === 'enemies') return 'monster';
  if (row.group === 'vfx') return 'projectile';
  if (row.group === 'weapons') return 'item';
  if (row.prefabKind === 'unit') return 'npc';
  return 'item';
}

export function itemsInSector(
  list: WarlordsDragItem[],
  sectorId: string
): WarlordsDragItem[] {
  if (!sectorId || sectorId === 'all') return list;
  return list.filter((row) =>
    itemFitsSector(
      {
        sectorId: row.sectorId,
        biomes: row.biomes,
        name: row.name,
        r2Key: row.r2Key,
        key: row.key,
      },
      sectorId
    )
  );
}

export function itemsInContentLayer(
  list: WarlordsDragItem[],
  layer: NonNullable<WarlordsDragItem['contentLayer']> | 'all'
): WarlordsDragItem[] {
  if (layer === 'all') return list;
  return list.filter((row) => catalogContentLayer(row) === layer);
}

/** Seafloor / mountain / tropical shells — never harvest rows. */
export function catalogTerrainLook(
  row: WarlordsDragItem
): 'seafloor' | 'mountain' | 'tropical' | null {
  if (row.harvestKind || catalogContentLayer(row) === 'harvestable')
    return null;
  const blob =
    `${row.name || ''} ${row.r2Key || ''} ${row.key || ''} ${row.terrainPreset || ''}`.toLowerCase();
  if (
    row.contentLayer === 'seafloor' ||
    /seafloor|seabed|ocean.?floor/.test(blob)
  )
    return 'seafloor';
  if (
    row.terrainPreset === 'mountains' ||
    row.terrainPreset === 'crags' ||
    /mountain|crag|ember|ashen|frost|volcan/.test(blob)
  )
    return 'mountain';
  if (
    row.isTerrain ||
    row.group === 'sectors' ||
    row.group === 'zones' ||
    row.group === 'islands' ||
    row.contentLayer === 'terrain' ||
    /haven|tropical|zone|thorn/.test(blob)
  )
    return 'tropical';
  return null;
}

export function itemsInTerrainLook(
  list: WarlordsDragItem[],
  look: 'seafloor' | 'mountain' | 'tropical' | 'all'
): WarlordsDragItem[] {
  if (look === 'all') return list.filter((row) => catalogTerrainLook(row));
  return list.filter((row) => catalogTerrainLook(row) === look);
}

/** Left-library default (replaces demo police / taxi GLBs). */
export const defaultModelList: WarlordsDragItem[] = WARLORDS_STATIC_LIBRARY;
