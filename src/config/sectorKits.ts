/**
 * One deploy/usage pattern for all 9 Warlords sectors.
 * Sector ids stay warlords-zones / SEAFLOOR_GRID. Biomes stay worldIslands.
 * Harvest GLBs stay organized-nature (isolated, not megakit).
 */
import { packForSector } from './worldIslands';
import {
  findHdTarget,
  presetForTarget,
  SEAFLOOR_GRID,
} from './hdTerrainDeploy';
import { ASSETS_CDN } from './assetApi';

export const SECTOR_BIOMES = [
  'ethereal',
  'frozen',
  'forest',
  'storm',
  'nexus',
  'desert',
  'abyssal',
  'tropical',
  'volcanic',
] as const;
export type SectorBiome = (typeof SECTOR_BIOMES)[number];

/** Isolated realistic nature — same keys as organized-nature-manifest. */
export const NATURE_KEYS = {
  palm: 'models/nature/realistic/trees/palm/palm_a.glb',
  pine: 'models/nature/realistic/trees/pine/pine_a.glb',
  oak: 'models/nature/realistic/trees/deciduous/oak_b.glb',
  snow: 'models/nature/realistic/trees/snow/snow_pine_a.glb',
  flowering: 'models/nature/realistic/trees/deciduous/flowering_a.glb',
  gnarled: 'models/nature/realistic/trees/deciduous/gnarled_a.glb',
  boulder: 'models/nature/realistic/rocks/boulder_a.glb',
  cliff: 'models/nature/realistic/rocks/cliff_chunk_a.glb',
} as const;

/** Live biome-ecosystems treePolicy → isolated tree keys. */
const BIOME_TREES: Record<SectorBiome, (keyof typeof NATURE_KEYS)[]> = {
  tropical: ['palm'],
  storm: ['palm', 'gnarled'],
  forest: ['oak', 'pine'],
  frozen: ['snow'],
  desert: ['gnarled', 'palm'],
  volcanic: ['gnarled'],
  ethereal: ['flowering', 'gnarled'],
  abyssal: ['gnarled'],
  nexus: ['oak', 'palm'],
};

const BIOME_ROCKS: Record<SectorBiome, (keyof typeof NATURE_KEYS)[]> = {
  tropical: ['boulder'],
  storm: ['cliff', 'boulder'],
  forest: ['boulder'],
  frozen: ['cliff', 'boulder'],
  desert: ['cliff'],
  volcanic: ['cliff'],
  ethereal: ['cliff'],
  abyssal: ['cliff'],
  nexus: ['boulder'],
};

/** Existing catalog creature keys — do not invent new wildlife. */
const BIOME_WILDLIFE: Record<SectorBiome, string[]> = {
  tropical: [
    'cotw-raccoon',
    'cotw-buffalo',
    'cotw-mallard',
    'cotw-alligator',
    'creature-crab',
  ],
  storm: ['cotw-beaver', 'cotw-mallard', 'cotw-alligator', 'creature-crab'],
  forest: [
    'cotw-deer',
    'cotw-raccoon',
    'cotw-mink',
    'cotw-lynx',
    'free-reptile',
  ],
  frozen: ['cotw-mink', 'cotw-mallard', 'cotw-lynx'],
  desert: ['cotw-buffalo', 'cotw-lioness'],
  volcanic: ['cotw-lioness', 'ifrit', 'lava-golem', 'drake'],
  ethereal: ['cotw-deer'],
  abyssal: ['cotw-alligator'],
  nexus: ['cotw-raccoon'],
};

export type SectorKit = {
  sectorId: string;
  name: string;
  biome: SectorBiome;
  terrainR2: string;
  ds2Preset: ReturnType<typeof presetForTarget>;
  playUrl: string;
  trees: string[];
  rocks: string[];
  wildlife: string[];
};

export function biomeOfSector(sectorId: string): SectorBiome {
  const b = packForSector(sectorId)?.biome;
  if (b && (SECTOR_BIOMES as readonly string[]).includes(b))
    return b as SectorBiome;
  return 'forest';
}

export function kitForSector(sectorId: string): SectorKit {
  const pack = packForSector(sectorId);
  const hd = findHdTarget(sectorId);
  const biome = biomeOfSector(sectorId);
  return {
    sectorId,
    name: pack?.name || sectorId.replace(/_/g, ' '),
    biome,
    terrainR2:
      hd?.r2Key || `models/environment/sectors/${sectorId}/ds2-terrain.glb`,
    ds2Preset: hd?.preset || presetForTarget(sectorId),
    playUrl: hd?.playUrl || '',
    trees: BIOME_TREES[biome].map((k) => NATURE_KEYS[k]),
    rocks: BIOME_ROCKS[biome].map((k) => NATURE_KEYS[k]),
    wildlife: BIOME_WILDLIFE[biome],
  };
}

export function allSectorKits(): SectorKit[] {
  return SEAFLOOR_GRID.flat().map(kitForSector);
}

export function natureCdnUrl(r2Key: string) {
  return `${ASSETS_CDN}/${r2Key.replace(/^\/+/, '')}`;
}

/** Which biomes a nature row belongs to (library filter). */
export function biomesForNatureHint(hint: string): SectorBiome[] {
  const s = hint.toLowerCase();
  if (/palm|coconut/.test(s)) return ['tropical', 'storm', 'desert', 'nexus'];
  if (/snow/.test(s)) return ['frozen'];
  if (/pine/.test(s)) return ['forest', 'frozen'];
  if (/oak|birch|deciduous|flowering|garden/.test(s))
    return ['forest', 'ethereal', 'nexus'];
  if (/gnarled|creepy|ancient/.test(s))
    return ['abyssal', 'volcanic', 'ethereal', 'desert'];
  if (/cliff/.test(s))
    return ['storm', 'frozen', 'desert', 'volcanic', 'abyssal', 'ethereal'];
  if (/rock|boulder/.test(s)) return [...SECTOR_BIOMES];
  if (/crab/.test(s)) return ['tropical', 'storm'];
  if (/ifrit|lava|drake/.test(s)) return ['volcanic'];
  if (/reptile/.test(s)) return ['forest'];
  if (/raccoon|deer|mink|beaver/.test(s)) return ['forest', 'tropical'];
  if (/mallard/.test(s)) return ['tropical', 'storm', 'frozen'];
  if (/buffalo/.test(s)) return ['desert', 'tropical'];
  if (/lynx/.test(s)) return ['forest', 'frozen'];
  if (/lion/.test(s)) return ['desert', 'volcanic'];
  if (/alligator|aligator/.test(s)) return ['tropical', 'storm', 'abyssal'];
  return [];
}

export function itemFitsSector(
  opts: {
    sectorId?: string;
    biomes?: string[];
    name?: string;
    r2Key?: string;
    key?: string;
  },
  sectorId: string
): boolean {
  if (!sectorId || sectorId === 'all') return true;
  if (opts.sectorId && opts.sectorId === sectorId) return true;
  const kit = kitForSector(sectorId);
  if (opts.biomes?.includes(kit.biome)) return true;
  const hint = `${opts.name || ''} ${opts.r2Key || ''} ${opts.key || ''}`;
  const guessed = biomesForNatureHint(hint);
  if (guessed.length && guessed.includes(kit.biome)) return true;
  if (
    opts.r2Key &&
    (kit.trees.includes(opts.r2Key) || kit.rocks.includes(opts.r2Key))
  )
    return true;
  return guessed.length === 0 && !opts.sectorId && !opts.biomes;
}
