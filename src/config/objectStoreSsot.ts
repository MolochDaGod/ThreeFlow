/**
 * info.grudge-studio.com / ObjectStore — static definition SSOT.
 * Do not invent a second item, map, or home-island contract.
 * Player state stays Railway. Binaries stay R2.
 */
import {
  STUDIO_ASSETS,
  STUDIO_INFO,
  STUDIO_INFO_API,
  STUDIO_OBJECTSTORE,
} from './branding';

export const INFO_DOCS = `${STUDIO_INFO}/docs`;
export const INFO_API = STUDIO_INFO_API;
export const OBJECTSTORE_API = STUDIO_OBJECTSTORE;

export const INFO_JSON = {
  studio: `${INFO_API}/studio.json`,
  homeIsland: `${INFO_API}/home-island-contract.json`,
  mapRegistry: `${INFO_API}/map-registry.json`,
  professions: `${INFO_API}/professions.json`,
  biomes: `${INFO_API}/biome-ecosystems.json`,
  nature: `${INFO_API}/organized-nature-manifest.json`,
  warlordsCatalog: `${INFO_API}/warlords-catalog.json`,
  warlordsZones: `${INFO_API}/warlords-zones.json`,
  controllers: `${INFO_API}/controllers.json`,
  ai: `${INFO_API}/ai.json`,
  weapons: `${INFO_API}/weapons.json`,
  materials: `${INFO_API}/materials.json`,
} as const;

/** Home-island contract v1.3 — info.grudge-studio.com/api/v1/home-island-contract.json */
export const HOME_ISLAND_CONTRACT = {
  version: '1.3.0',
  worldSizeM: 1024,
  characterHeightM: 2,
  mountainPeakHeightM: 20,
  foundations: ['driftwood_bay', 'ironfang_spire'] as const,
  zoneTypes: [
    'mountain',
    'forest',
    'field',
    'shore',
    'water',
    'clearing',
  ] as const,
  r2Concept: `${STUDIO_ASSETS}/models/nature/stylized/concept/example_home_island.glb`,
  r2Ds2: `${STUDIO_ASSETS}/models/environment/home-island/ds2-terrain.glb`,
  harvestPacks: [
    `${STUDIO_ASSETS}/models/environment/island_tree.glb`,
    `${STUDIO_ASSETS}/models/environment/island_rock.glb`,
    `${STUDIO_ASSETS}/models/environment/gem_cluster.glb`,
  ],
  bannedNature: [
    'CommonTree',
    'TwistedTree',
    'DeadTree',
    'Rock_Medium',
    'Bush_Common',
    'nature-megakit',
    '/models/lowpoly/',
  ],
  pipeline: [
    'ThreeFlow / studio-editor stamps home island',
    'Scene AI tags trees · rocks · water (this editor)',
    'PATCH /api/island/state Railway (not D1)',
    'Play this scene (Player layer) in the same SPA',
  ],
} as const;

/** Create → play funnel from studio.json productionWiring */
export const GAME_FLOWS = [
  {
    id: 'create-play',
    label: 'Create → play',
    steps: [
      'id.grudge-studio.com/login',
      'character.grudge-studio.com/foundry (create only)',
      'client.grudge-studio.com?characterId=',
      'home-island | play | tutorial',
    ],
  },
  {
    id: 'defs-vs-player',
    label: 'Definitions vs player',
    steps: [
      'ObjectStore / info JSON = recipes · professions · maps',
      'R2 assets.grudge-studio.com = GLB / icons',
      'Railway /api/account = bag · mats',
      'Railway /api/characters/:id/progress = profession XP',
    ],
  },
  {
    id: 'home-island',
    label: 'Home island (1024 m)',
    steps: [...HOME_ISLAND_CONTRACT.pipeline],
  },
  {
    id: 'harvest-craft',
    label: 'Harvest → craft',
    steps: [
      '6 gather: Mining · Logging · Skinning · Fishing · Herbalism · Scavenging',
      '5 craft: Miner · Forester · Mystic · Chef · Engineer',
      'scrap→engineer · herb→mystic · hide→forester',
      'Mats → account bag · XP → character',
    ],
  },
  {
    id: 'map-families',
    label: 'Do not mix map families',
    steps: [
      'Warlords era = 9 sectors (haven_shore…)',
      'Home-block 3×3 ≠ sector IDs',
      'Home island = 1024 m Driftwood / Ironfang',
      'Pirate lobby = chicken-gun maps',
    ],
  },
] as const;

export function isBannedNature(name: string): boolean {
  const s = String(name || '');
  return HOME_ISLAND_CONTRACT.bannedNature.some((b) =>
    s.includes(b.replace('..5 megakit', ''))
  );
}

export async function fetchInfoJson<T = unknown>(url: string): Promise<T> {
  const r = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!r.ok) throw new Error(`${url} ${r.status}`);
  return (await r.json()) as T;
}
