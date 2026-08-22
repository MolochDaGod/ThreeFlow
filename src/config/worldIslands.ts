/**
 * Warlords open-world island table — production map SSOT.
 * Sector ids + 3×3 grid stay warlords-zones.json. Seed stays grudge-world-1.
 * Display name Aethermoor is the info hub title, not a second world PK.
 * Island localPos is 0…sectorTileM inside that sector.
 */
import { WORLD_STACK } from './fleetSystems';
import { SEAFLOOR_GRID, seedForTarget } from './hdTerrainDeploy';

export type IslandClass =
  'main' | 'medium' | 'small' | 'capturable' | 'arena' | 'generative';

export type IslandKind = 'static' | 'faction' | 'prefab';

export interface WorldIslandDef {
  id: string;
  sectorId: string;
  name: string;
  localPos: [number, number];
  radius: number;
  elevation: number;
  biome: string;
  islandClass: IslandClass;
  islandKind: IslandKind;
  model?: string;
  tags?: string[];
  resource?: string;
  landmark?: string;
}

export interface SectorIslandPack {
  sectorId: string;
  name: string;
  biome: string;
  islands: WorldIslandDef[];
}

/** Biome fog / water (0–1) from the Warlords island map outline. */
export const BIOME_FOG: Record<string, [number, number, number]> = {
  ethereal: [0.7, 0.8, 1.0],
  forest: [0.2, 0.4, 0.1],
  frozen: [0.9, 0.95, 1.0],
  desert: [0.9, 0.7, 0.3],
  nexus: [0.8, 0.6, 0.9],
  tropical: [0.6, 0.85, 0.7],
  storm: [0.3, 0.3, 0.35],
  abyssal: [0.05, 0.02, 0.1],
  volcanic: [0.6, 0.15, 0.05],
};

export const BIOME_WATER: Record<string, [number, number, number]> = {
  ethereal: [0.5, 0.7, 1.0],
  forest: [0.2, 0.5, 0.2],
  frozen: [0.7, 0.85, 1.0],
  desert: [0.3, 0.6, 0.5],
  nexus: [0.2, 0.4, 0.6],
  tropical: [0.1, 0.6, 0.5],
  storm: [0.15, 0.2, 0.3],
  abyssal: [0.05, 0.02, 0.08],
  volcanic: [0.8, 0.2, 0.05],
};

export const BIOME_LAND: Record<string, number> = {
  ethereal: 0x8aa0c8,
  forest: 0x3d5c32,
  frozen: 0xc8d4e0,
  desert: 0xc4a06a,
  nexus: 0x6a5a78,
  tropical: 0x4a8a4a,
  storm: 0x5a6570,
  abyssal: 0x2a1a38,
  volcanic: 0x6a3020,
};

const T = WORLD_STACK.sectorTileM;

export function sectorGridIndex(
  sectorId: string
): { col: number; row: number } | null {
  for (let row = 0; row < SEAFLOOR_GRID.length; row++) {
    const col = SEAFLOOR_GRID[row].indexOf(sectorId);
    if (col >= 0) return { col, row };
  }
  return null;
}

/** Sector center in world XZ. Grid row 0 = north (−Z). */
export function sectorOrigin(sectorId: string): { x: number; z: number } {
  const g = sectorGridIndex(sectorId);
  if (!g) return { x: 0, z: 0 };
  const cols = SEAFLOOR_GRID[0].length;
  const rows = SEAFLOOR_GRID.length;
  return {
    x: (g.col - (cols - 1) / 2) * T,
    z: (g.row - (rows - 1) / 2) * T,
  };
}

export function localToWorld(
  sectorId: string,
  localX: number,
  localZ: number
): { x: number; z: number } {
  const o = sectorOrigin(sectorId);
  return { x: o.x + (localX - T / 2), z: o.z + (localZ - T / 2) };
}

function pack(
  sectorId: string,
  name: string,
  biome: string,
  rows: Omit<WorldIslandDef, 'sectorId' | 'biome'>[]
): SectorIslandPack {
  return {
    sectorId,
    name,
    biome,
    islands: rows.map((r) => ({ ...r, sectorId, biome })),
  };
}

/** 27+ hand-placed islands from the Warlords map outline, bound to existing sector ids. */
export const SECTOR_ISLAND_PACKS: SectorIslandPack[] = [
  pack('ethereal_falls', 'Wraithlight Shoals', 'ethereal', [
    {
      id: 'shoal-platform',
      name: 'Shoal Platform',
      localPos: [350, 7500],
      radius: 120,
      elevation: 5,
      islandClass: 'main',
      islandKind: 'static',
      tags: ['spectral'],
      landmark: 'Crumbled ruins',
      resource: 'ghost',
    },
    {
      id: 'phantom-rock',
      name: 'Phantom Rock',
      localPos: [200, 9300],
      radius: 50,
      elevation: 12,
      islandClass: 'small',
      islandKind: 'static',
      landmark: 'Ghostly spire',
      resource: 'ghost',
    },
    {
      id: 'memory-reef',
      name: 'Memory Reef',
      localPos: [700, 7600],
      radius: 60,
      elevation: 3,
      islandClass: 'small',
      islandKind: 'static',
      landmark: 'Crystallized memories',
      resource: 'ghost',
    },
  ]),
  pack('frostbite_expanse', 'Glassfall Tundra', 'frozen', [
    {
      id: 'glacier-shelf',
      name: 'Glacier Shelf',
      localPos: [2400, 7500],
      radius: 160,
      elevation: 15,
      islandClass: 'main',
      islandKind: 'static',
      landmark: 'Massive ice sheet',
      resource: 'ice',
    },
    {
      id: 'frost-ruins',
      name: 'Frost Ruins',
      localPos: [2200, 9300],
      radius: 80,
      elevation: 8,
      islandClass: 'medium',
      islandKind: 'faction',
      landmark: 'Ancient dwarf ruins',
      resource: 'ice',
    },
    {
      id: 'icefall-point',
      name: 'Icefall Point',
      localPos: [2700, 7400],
      radius: 45,
      elevation: 6,
      islandClass: 'small',
      islandKind: 'static',
      resource: 'ice',
    },
  ]),
  pack('thornwood_wilds', 'Briarwood Hollow', 'forest', [
    {
      id: 'elder-grove',
      name: 'Elder Grove',
      localPos: [350, 7500],
      radius: 170,
      elevation: 20,
      islandClass: 'main',
      islandKind: 'static',
      landmark: 'Massive ancient forest',
      resource: 'forest',
    },
    {
      id: 'druid-circle',
      name: 'Druid Circle',
      localPos: [200, 9300],
      radius: 90,
      elevation: 6,
      islandClass: 'medium',
      islandKind: 'static',
      landmark: 'Sacred meeting ground',
      resource: 'forest',
    },
    {
      id: 'wolf-den',
      name: 'Wolf Den',
      localPos: [600, 7400],
      radius: 60,
      elevation: 4,
      islandClass: 'small',
      islandKind: 'static',
      landmark: 'Beast lair',
      resource: 'forest',
    },
  ]),
  pack('stormbreak_reef', 'Howling Straits', 'storm', [
    {
      id: 'thunder-mesa',
      name: 'Thunder Mesa',
      localPos: [1350, 350],
      radius: 140,
      elevation: 25,
      islandClass: 'main',
      islandKind: 'static',
      landmark: 'Elevated plateau',
      resource: 'lightning',
    },
    {
      id: 'lightning-spire',
      name: 'Lightning Spire',
      localPos: [1100, 600],
      radius: 40,
      elevation: 30,
      islandClass: 'small',
      islandKind: 'static',
      landmark: 'Tall narrow spire',
      resource: 'lightning',
    },
    {
      id: 'reef-break',
      name: 'Reef Break',
      localPos: [1600, 500],
      radius: 70,
      elevation: 4,
      islandClass: 'small',
      islandKind: 'static',
      resource: 'lightning',
    },
  ]),
  pack('convergence_nexus', 'The Crucible', 'nexus', [
    {
      id: 'pirate-haven',
      name: 'Pirate Haven',
      localPos: [1500, 3500],
      radius: 200,
      elevation: 8,
      islandClass: 'main',
      islandKind: 'static',
      model: 'models/lobby/pirate-islands/scene.glb',
      landmark: 'Chicken Gun pirate lobby',
      resource: 'pirate',
    },
    {
      id: 'capital-isle',
      name: 'Capital Isle',
      localPos: [1300, 2800],
      radius: 160,
      elevation: 12,
      islandClass: 'main',
      islandKind: 'faction',
      landmark: 'Racalvin HQ',
      resource: 'pirate',
    },
    {
      id: 'flag-north',
      name: 'Flag Island North',
      localPos: [1500, 2500],
      radius: 60,
      elevation: 5,
      islandClass: 'capturable',
      islandKind: 'prefab',
      tags: ['capturable'],
    },
    {
      id: 'flag-east',
      name: 'Flag Island East',
      localPos: [1800, 3500],
      radius: 55,
      elevation: 5,
      islandClass: 'capturable',
      islandKind: 'prefab',
      tags: ['capturable'],
    },
    {
      id: 'flag-south',
      name: 'Flag Island South',
      localPos: [1500, 4500],
      radius: 60,
      elevation: 5,
      islandClass: 'capturable',
      islandKind: 'prefab',
      tags: ['capturable'],
    },
    {
      id: 'flag-west',
      name: 'Flag Island West',
      localPos: [1200, 3500],
      radius: 55,
      elevation: 5,
      islandClass: 'capturable',
      islandKind: 'prefab',
      tags: ['capturable'],
    },
    {
      id: 'grande-arena',
      name: 'Grande Arena',
      localPos: [1700, 2800],
      radius: 70,
      elevation: 10,
      islandClass: 'arena',
      islandKind: 'prefab',
      landmark: 'PvP arena',
    },
  ]),
  pack('ashen_wastes', 'Cinderwind Flats', 'desert', [
    {
      id: 'mesa-grande',
      name: 'Mesa Grande',
      localPos: [350, 3500],
      radius: 150,
      elevation: 40,
      islandClass: 'main',
      islandKind: 'static',
      landmark: 'Towering sandstone mesa',
      resource: 'sand',
    },
    {
      id: 'oasis-isle',
      name: 'Oasis Isle',
      localPos: [200, 6300],
      radius: 90,
      elevation: 5,
      islandClass: 'medium',
      islandKind: 'static',
      landmark: 'Green oasis',
      resource: 'sand',
    },
    {
      id: 'tomb-spire',
      name: 'Tomb Spire',
      localPos: [600, 3100],
      radius: 55,
      elevation: 12,
      islandClass: 'small',
      islandKind: 'static',
      landmark: 'Pharaoh monument',
      resource: 'sand',
    },
  ]),
  pack('abyssal_trench', 'The Maw Below', 'abyssal', [
    {
      id: 'shard-platform',
      name: 'Shard Platform',
      localPos: [1400, 350],
      radius: 110,
      elevation: 7,
      islandClass: 'main',
      islandKind: 'static',
      landmark: 'Fractured remnant',
      resource: 'void',
    },
    {
      id: 'demon-gate',
      name: 'Demon Gate',
      localPos: [1600, 2600],
      radius: 80,
      elevation: 15,
      islandClass: 'medium',
      islandKind: 'faction',
      landmark: 'Pulsing void portal',
      resource: 'void',
    },
    {
      id: 'wreck-cluster',
      name: 'Wreck Cluster',
      localPos: [1250, 200],
      radius: 50,
      elevation: 3,
      islandClass: 'small',
      islandKind: 'static',
      landmark: 'Ship graveyard',
      resource: 'void',
    },
  ]),
  pack('haven_shore', "Serpent's Wake", 'tropical', [
    {
      id: 'palm-atoll',
      name: 'Palm Atoll',
      localPos: [2400, 3500],
      radius: 130,
      elevation: 6,
      islandClass: 'main',
      islandKind: 'static',
      landmark: 'Lush tropical island',
      resource: 'jungle',
    },
    {
      id: 'pirate-cove',
      name: 'Pirate Cove',
      localPos: [2200, 6300],
      radius: 85,
      elevation: 10,
      islandClass: 'medium',
      islandKind: 'static',
      landmark: 'Hidden pirate bay',
      resource: 'jungle',
    },
    {
      id: 'reef-garden',
      name: 'Reef Garden',
      localPos: [2650, 3100],
      radius: 50,
      elevation: 3,
      islandClass: 'small',
      islandKind: 'static',
      landmark: 'Coral garden',
      resource: 'jungle',
    },
  ]),
  pack('ember_depths', 'Scoria Caldera', 'volcanic', [
    {
      id: 'forge-island',
      name: 'Forge Island',
      localPos: [2400, 400],
      radius: 180,
      elevation: 35,
      islandClass: 'main',
      islandKind: 'faction',
      landmark: 'Active volcanic island',
      resource: 'lava',
    },
    {
      id: 'obsidian-shelf',
      name: 'Obsidian Shelf',
      localPos: [2200, 200],
      radius: 100,
      elevation: 8,
      islandClass: 'medium',
      islandKind: 'static',
      landmark: 'Cooled lava platform',
      resource: 'lava',
    },
    {
      id: 'ember-spire',
      name: 'Ember Spire',
      localPos: [2650, 600],
      radius: 55,
      elevation: 25,
      islandClass: 'small',
      islandKind: 'static',
      landmark: 'Smoking volcanic stack',
      resource: 'lava',
    },
  ]),
];

export const HAND_PLACED_ISLANDS: WorldIslandDef[] =
  SECTOR_ISLAND_PACKS.flatMap((p) => p.islands);

export function packForSector(sectorId: string): SectorIslandPack | undefined {
  return SECTOR_ISLAND_PACKS.find((p) => p.sectorId === sectorId);
}

const GEN_CLASSES: {
  id: string;
  chance: number;
  r0: number;
  r1: number;
  elev: number;
}[] = [
  { id: 'rock', chance: 0.35, r0: 15, r1: 30, elev: 4 },
  { id: 'sandbar', chance: 0.25, r0: 20, r1: 40, elev: 1.5 },
  { id: 'shipwreck', chance: 0.12, r0: 15, r1: 25, elev: 2 },
  { id: 'hermit-tower', chance: 0.08, r0: 10, r1: 12, elev: 8 },
  { id: 'coral-garden', chance: 0.08, r0: 12, r1: 22, elev: 1.5 },
  { id: 'leviathan-bones', chance: 0.05, r0: 30, r1: 50, elev: 3 },
  { id: 'floating-debris', chance: 0.05, r0: 10, r1: 20, elev: 1 },
  { id: 'mystic-shrine', chance: 0.02, r0: 8, r1: 10, elev: 4 },
];

function mulberry(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickClass(rand: () => number) {
  let x = rand();
  for (const c of GEN_CLASSES) {
    x -= c.chance;
    if (x <= 0) return c;
  }
  return GEN_CLASSES[0];
}

/** Seeded 3–12 generative islands per sector. Same seed = same layout. */
export function generativeIslandsFor(sectorId: string): WorldIslandDef[] {
  const pack = packForSector(sectorId);
  if (!pack) return [];
  const rand = mulberry(seedForTarget(sectorId, 0xa31e0001));
  const count = 3 + Math.floor(rand() * 10);
  const placed = [...pack.islands];
  const out: WorldIslandDef[] = [];
  let guard = 0;
  while (out.length < count && guard++ < 80) {
    const lx = 200 + rand() * (T - 400);
    const lz = 200 + rand() * (T - 400);
    const tooClose = [...placed, ...out].some((i) => {
      const min = i.islandClass === 'generative' ? 50 : 200;
      return (
        Math.hypot(i.localPos[0] - lx, i.localPos[1] - lz) < min + i.radius
      );
    });
    if (tooClose) continue;
    const cls = pickClass(rand);
    const radius = cls.r0 + rand() * (cls.r1 - cls.r0);
    out.push({
      id: `gen-${sectorId}-${out.length}`,
      name: `${cls.id} ${out.length + 1}`,
      sectorId,
      localPos: [+lx.toFixed(1), +lz.toFixed(1)],
      radius: +radius.toFixed(1),
      elevation: cls.elev,
      biome: pack.biome,
      islandClass: 'generative',
      islandKind: 'prefab',
      tags: [cls.id],
    });
  }
  return out;
}

export function allIslandsForSector(sectorId: string): WorldIslandDef[] {
  const pack = packForSector(sectorId);
  return [...(pack?.islands || []), ...generativeIslandsFor(sectorId)];
}
