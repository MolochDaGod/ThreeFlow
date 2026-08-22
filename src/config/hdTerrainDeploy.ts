/**
 * HD terrain deploy targets — existing Warlords sectors + uMMORPG maps.
 * Paths follow map-registry `models/environment/sectors/{sectorId}/`.
 * Load screen contract matches Open HelpersLoadScreen (catalog first, then GLB).
 */

import { ASSETS_CDN } from './assetApi';
import { GAMES_AI_DISTANCES, GAMES_AI_SOURCE } from './gamesAi';

export const WARLORDS_CDN = ASSETS_CDN;

export type HdDeployKind = 'sector' | 'map';
export type HdTerrainPreset = 'mountains' | 'crags' | 'zone';

export interface HdDeployTarget {
  id: string;
  label: string;
  kind: HdDeployKind;
  /** Hard Road DS2 preset — same map as warlordsCatalog.sectorPreset */
  preset: HdTerrainPreset;
  /** R2 key after Node Draco bake */
  r2Key: string;
  playUrl: string;
  /** Production world archetype */
  archetype: 'mountain' | 'plains' | 'home' | 'event' | 'boss';
}

/** Same mapping as warlordsCatalog.sectorPreset — do not invent a second table. */
export function presetForTarget(id: string): HdTerrainPreset {
  if (id.includes('frost') || id.includes('abyssal') || id.includes('storm'))
    return 'crags';
  if (
    id.includes('haven') ||
    id.includes('thorn') ||
    id === 'pirate-islands' ||
    id === 'home-island'
  )
    return 'zone';
  return 'mountains';
}

/** Mix catalog preset seed with the existing target id so sectors are not clones. */
export function seedForTarget(id: string, baseSeed: number): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (baseSeed ^ (h >>> 0)) >>> 0;
}

function archetypeFor(
  id: string,
  kind: HdDeployKind
): HdDeployTarget['archetype'] {
  if (kind === 'map') return id === 'home-island' ? 'home' : 'event';
  if (id.includes('ember') || id.includes('ashen')) return 'mountain';
  if (id.includes('haven') || id.includes('thorn')) return 'plains';
  return 'mountain';
}

/** map-registry warlords_era_open_world ids — do not invent new sector names. */
export const HD_SECTOR_TARGETS: HdDeployTarget[] = [
  'ethereal_falls',
  'frostbite_expanse',
  'thornwood_wilds',
  'stormbreak_reef',
  'convergence_nexus',
  'ashen_wastes',
  'abyssal_trench',
  'haven_shore',
  'ember_depths',
].map((id) => ({
  id,
  label: `Sector · ${id.replace(/_/g, ' ')}`,
  kind: 'sector' as const,
  preset: presetForTarget(id),
  r2Key: `models/environment/sectors/${id}/ds2-terrain.glb`,
  playUrl: `https://client.grudge-studio.com/play?sector=${id}&mode=zone&worldSeed=grudge-world-1`,
  archetype: archetypeFor(id, 'sector'),
}));

/** Existing island / lobby maps (islandDeployments). */
export const HD_MAP_TARGETS: HdDeployTarget[] = [
  {
    id: 'pirate-islands',
    label: 'Map · Pirate islands lobby',
    kind: 'map',
    preset: presetForTarget('pirate-islands'),
    r2Key: 'models/lobby/pirate-islands/ds2-terrain.glb',
    playUrl:
      'https://client.grudge-studio.com/island-3d?mode=lobby&map=pirate-islands',
    archetype: archetypeFor('pirate-islands', 'map'),
  },
  {
    id: 'home-island',
    label: 'Map · Home island',
    kind: 'map',
    preset: presetForTarget('home-island'),
    r2Key: 'models/environment/home-island/ds2-terrain.glb',
    playUrl: 'https://client.grudge-studio.com/home-island',
    archetype: archetypeFor('home-island', 'map'),
  },
];

export const HD_DEPLOY_TARGETS: HdDeployTarget[] = [
  ...HD_SECTOR_TARGETS,
  ...HD_MAP_TARGETS,
];

/**
 * warlords-zones.json 3×3 — do not invent a second open-world grid.
 * Row 0 is north (−Z). Used to tile sector GLBs as seafloor.
 */
export const SEAFLOOR_GRID: readonly (readonly string[])[] = [
  ['ethereal_falls', 'frostbite_expanse', 'thornwood_wilds'],
  ['stormbreak_reef', 'convergence_nexus', 'ashen_wastes'],
  ['abyssal_trench', 'haven_shore', 'ember_depths'],
] as const;

export function findHdTarget(id: string): HdDeployTarget | undefined {
  return HD_DEPLOY_TARGETS.find((row) => row.id === id);
}

export function cdnUrlForTarget(target: HdDeployTarget): string {
  return `${WARLORDS_CDN}/${target.r2Key}`;
}

/** Open / Danger mapInstanceApi + worldMeshDeploy + HelpersLoadScreen. */
export function buildHdDeployManifest(opts: {
  target: HdDeployTarget;
  preset: string;
  quality: string;
  worldMeters: number;
  mesh: number;
  sim: number;
  source: string;
  rawFile: string;
  bakedFile?: string;
}): Record<string, unknown> {
  const cdn = cdnUrlForTarget(opts.target);
  return {
    version: 1,
    updated: new Date().toISOString(),
    source: opts.source,
    pipeline: [
      'threeflow-generate',
      'gltf-exporter',
      'node-draco',
      'r2-sector',
    ],
    target: opts.target,
    preset: opts.preset,
    quality: opts.quality,
    worldMeters: opts.worldMeters,
    sim: opts.sim,
    mesh: opts.mesh,
    files: {
      rawGlb: opts.rawFile,
      bakedGlb: opts.bakedFile ?? null,
    },
    cdnUrl: cdn,
    r2Key: opts.target.r2Key,
    loadScreen: {
      pattern: 'helpers',
      label: `LOADING ${opts.target.kind.toUpperCase()}`,
      hint: 'Catalog first · then Draco terrain · one GPU context',
    },
    map: {
      id: `hd-${opts.target.id}`,
      name: opts.target.label,
      kind: opts.target.kind,
      bake: 'draco',
      assets: [cdn],
      cdnFallbacks: [cdn],
      layers: ['Terrain'],
      colliders: ['heightfield'],
      approxMb: opts.quality === 'deploy' ? 4 : 2,
      instance: {
        exclusive: opts.target.kind === 'sector',
        requiresTerrain: true,
        requiresHeight: true,
        hideDangerRoomShell: false,
      },
      deploy: opts.target.playUrl,
    },
    ai: {
      source: GAMES_AI_SOURCE,
      states: ['idle', 'wander', 'patrol', 'follow', 'pursue'],
      distances: { ...GAMES_AI_DISTANCES },
      steering: 'yuka',
      physics: 'rapier',
      mixer: 'one-on-kit',
    },
    node: {
      id: `hd-terrain-${opts.target.id}`,
      meshKey: opts.target.r2Key,
      kind: 'island',
      position: [0, 0, 0],
      scale: 1,
      physicsLayer: 'Terrain',
      collider: { kind: 'heightfield' },
      location: {
        sectorId: opts.target.kind === 'sector' ? opts.target.id : undefined,
        archetype: opts.target.archetype,
        tags: ['ds2', 'hd-terrain', opts.preset],
        pin: `ds2_${opts.target.id}`,
      },
    },
    wrangler: `wrangler r2 object put grudge-assets/${opts.target.r2Key} --file=deploys/hd-terrain/out/${opts.target.id}/terrain.glb --content-type=model/gltf-binary --remote`,
    bakeCommand: 'pnpm bake:hd-terrain',
  };
}
