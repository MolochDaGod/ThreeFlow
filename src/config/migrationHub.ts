/**
 * ThreeFlow hub — migrations landing + asset organizer.
 * Indexes existing fleet SSOT. Not a second prefab DB or player store.
 */
import {
  STUDIO_ASSETS,
  STUDIO_CASTING,
  STUDIO_FORGE_EDITOR,
  STUDIO_FOUNDRY,
  STUDIO_GRUDOX,
  STUDIO_ID,
  STUDIO_INFO,
  STUDIO_OPEN,
  STUDIO_PLAY,
  STUDIO_VFX,
  STUDIO_WATER,
} from './branding';
import { PREFABS_API, PLACEABLES_API } from './assetApi';

const INFO_API = `${STUDIO_INFO}/api/v1`;
const INFO_JSON = {
  mapRegistry: `${INFO_API}/map-registry.json`,
  homeIsland: `${INFO_API}/home-island-contract.json`,
  weapons: `${INFO_API}/weapons.json`,
  nature: `${INFO_API}/organized-nature-manifest.json`,
} as const;

export const HUB_EDITOR = '/editor';

export type HubSurface = {
  id: string;
  name: string;
  role: string;
  href: string;
  owns: string;
};

export const HUB_SURFACES: HubSurface[] = [
  {
    id: 'threeflow',
    name: 'ThreeFlow editor',
    role: 'Warlords scene · library · stamp',
    href: HUB_EDITOR,
    owns: 'Layout + prefab drop. Not player SSOT.',
  },
  {
    id: 'forge',
    name: 'Forge',
    role: 'Map deploy · .gfscene',
    href: STUDIO_FORGE_EDITOR,
    owns: 'R3F + Rapier play bake',
  },
  {
    id: 'foundry',
    name: 'Character Foundry',
    role: 'Create hero · 4-slot',
    href: STUDIO_FOUNDRY,
    owns: 'Create only — handoff ?characterId=',
  },
  {
    id: 'play',
    name: 'Warlords play',
    role: 'Era play',
    href: STUDIO_PLAY,
    owns: 'Client / GrudgeBuilder',
  },
  {
    id: 'water',
    name: 'Water lab',
    role: 'Boats · ocean · dock',
    href: STUDIO_WATER,
    owns: 'water.* authoring — do not iframe into land',
  },
  {
    id: 'casting',
    name: 'Casting lab',
    role: 'T0 weapons · skills',
    href: STUDIO_CASTING,
    owns: 'Weapon catalog + play stack',
  },
  {
    id: 'vfx',
    name: 'VFX lab',
    role: 'ThreeFlow scene · edits',
    href: `${HUB_EDITOR}?scene=vfx`,
    owns: 'HDR + Draco + loadRaceKit. Catalog JSON stays on vfx.grudge.studio.',
  },
  {
    id: 'open',
    name: 'Grudge Open',
    role: 'Library / Danger',
    href: STUDIO_OPEN,
    owns: 'Steam-like catalog',
  },
  {
    id: 'grudox',
    name: 'GRUDOX',
    role: 'Cabinets / Vox',
    href: STUDIO_GRUDOX,
    owns: 'Not Warlords play',
  },
  {
    id: 'cdn',
    name: 'Assets CDN',
    role: 'R2 binaries',
    href: STUDIO_ASSETS,
    owns: 'GLB / FBX / tex — not definitions',
  },
  {
    id: 'defs',
    name: 'ObjectStore / info',
    role: 'JSON contracts',
    href: `${STUDIO_INFO}/docs`,
    owns: 'Recipes · maps · weapons JSON',
  },
  {
    id: 'id',
    name: 'Grudge ID',
    role: 'Login',
    href: STUDIO_ID,
    owns: 'SSO only',
  },
];

export type MigrationLane = {
  id: string;
  from: string;
  to: string;
  system: string;
  rule: string;
};

export const MIGRATION_LANES: MigrationLane[] = [
  {
    id: 'characters',
    from: 'Unity / uMMORPG Players/*.prefab',
    to: 'Foundry + loadRaceKit Toon GLB',
    system: 'grudge6-cdn-ssot · character.grudge-studio.com',
    rule: 'Play mesh = {race}.glb via loadRaceKit. Not fused *_characters.glb, not Meshy.',
  },
  {
    id: 'prefabs',
    from: 'Unity .prefab / Guns turret seats',
    to: 'meshopt GLB + prefab JSON',
    system: 'grudge-asset-convert → R2 models/warlords/entities/{slug}.glb',
    rule: 'Register client.grudge-studio.com/api/v1/warlords-entity-prefabs.json. Skip unity_prefab_only.',
  },
  {
    id: 'placeables',
    from: 'uMMORPG placeable extract',
    to: 'cdn_ready unique entity GLB',
    system: PLACEABLES_API,
    rule: 'No .fbx, no kit_linked, no whole survival multipack.',
  },
  {
    id: 'weapons',
    from: 'Toon extra FBX / T0 ids',
    to: 'Casting catalog + hand bone attach',
    system: 'casting-t0-weapon-play',
    rule: 'Weapon owns mesh + pack + skills. Guns folder is vehicle seats, not pistols.',
  },
  {
    id: 'water',
    from: 'Boat / dock / fish author',
    to: 'water.grudge-studio.com',
    system: 'Tactical-Infinity Seascape + fleet catalog',
    rule: 'Water lab only. Do not iframe into land zones.',
  },
  {
    id: 'vfx',
    from: 'vfx.grudge.studio dark stage + fused *_Characters.glb',
    to: 'ThreeFlow /editor?scene=vfx',
    system: 'HDR IBL · Draco GLTF · loadRaceKit Toon RTS',
    rule: 'Edit VFX in this scene. Do not use Mixamo FBX or WK_Characters.glb.',
  },
  {
    id: 'maps',
    from: 'Stamped ThreeFlow scene',
    to: 'Forge .gfscene + Warlords play',
    system: 'forge-editor + Railway island state',
    rule: 'Rebind MapSurface only. Same Controller / weapon / camera.',
  },
  {
    id: 'player',
    from: 'localStorage / D1 temptation',
    to: 'Railway account + character UUID',
    system: 'grudge-production-wiring',
    rule: 'Bag/wallet = grudge_id. Progress = characters.id. Never second bag DB.',
  },
];

export const HUB_CATALOGS = [
  {
    id: 'prefabs',
    label: 'Warlords prefabs',
    url: PREFABS_API,
    note: 'One prefab index. Unique GLB only.',
  },
  {
    id: 'placeables',
    label: 'Placeables (same index)',
    url: PLACEABLES_API,
    note: 'cdn_ready rows feed the left library.',
  },
  {
    id: 'maps',
    label: 'Map registry',
    url: INFO_JSON.mapRegistry,
    note: '9 Warlords sectors — not home-block IDs.',
  },
  {
    id: 'home',
    label: 'Home-island contract',
    url: INFO_JSON.homeIsland,
    note: '1024 m · SI 2 m character.',
  },
  {
    id: 'weapons',
    label: 'Weapons JSON',
    url: INFO_JSON.weapons,
    note: 'Definitions — meshes stay on CDN.',
  },
  {
    id: 'nature',
    label: 'Nature manifest',
    url: INFO_JSON.nature,
    note: 'Isolate multipack meshName.',
  },
  {
    id: 'vfx-catalog',
    label: 'VFX studio catalog',
    url: `${STUDIO_VFX}/assets/catalog.json`,
    note: 'Edit in /editor?scene=vfx — not the dark standalone stage.',
  },
] as const;

export type HubPrefabRow = {
  id: string;
  prefabId?: string;
  kind?: string;
  name?: string;
  displayName?: string;
  mesh?: { cdnUrl?: string | null; status?: string; r2Key?: string | null };
  icon?: { cdnUrl?: string | null };
};

export async function fetchPrefabIndex(): Promise<HubPrefabRow[]> {
  const res = await fetch(PREFABS_API, { referrerPolicy: 'no-referrer' });
  if (!res.ok) throw new Error(`${res.status} prefabs`);
  const json = await res.json();
  const rows = Array.isArray(json)
    ? json
    : Array.isArray(json.prefabs)
      ? json.prefabs
      : Array.isArray(json.items)
        ? json.items
        : [];
  return rows as HubPrefabRow[];
}

export function editorAssetUrl(cdnUrl: string): string {
  return `${HUB_EDITOR}?asset=${encodeURIComponent(cdnUrl)}`;
}

export function prefabLabel(row: HubPrefabRow): string {
  return row.displayName || row.name || row.prefabId || row.id;
}


