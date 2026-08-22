/**
 * Fleet systems hosted in ThreeFlow — practices + hosts from Forge / package SSOT.
 * Not a second editor, physics engine, or player DB.
 * Sources: forge bestPractices.ts, rapier-physics-patterns, grudge-3d-game-packages.
 */
import {
  STUDIO_AI,
  STUDIO_AI_HEALTH,
  STUDIO_ASSETS,
  STUDIO_CODER,
  STUDIO_FORGE,
  STUDIO_FORGE_EDITOR,
  STUDIO_ID,
  STUDIO_OBJECTSTORE,
  STUDIO_PLAY,
} from './branding';

export const FLEET_DEPS = [
  {
    name: 'three',
    pin: '^0.185',
    role: 'Renderer / scene / one AnimationMixer',
  },
  {
    name: '@dimforge/rapier3d-compat',
    pin: '^0.19',
    role: 'World physics + colliders',
  },
  { name: 'three-mesh-bvh', pin: '^0.9', role: 'Terrain ray / mesh queries' },
  {
    name: 'three-pathfinding',
    pin: '^1.3',
    role: 'Navmesh path (editor bake)',
  },
  {
    name: 'yuka',
    pin: '^0.7',
    role: 'Root steering · Think/Vision/Memory — not combat math',
  },
  {
    name: '@tweenjs/tween.js',
    pin: '^18.5',
    role: 'Editor fly-by / focus tweens',
  },
  { name: 'vite', pin: '^6', role: 'SPA production bundle' },
  {
    name: 'vite-plugin-wasm',
    pin: '^3.6',
    role: 'Rapier WASM — lazy, not first paint',
  },
  { name: 'postprocessing', pin: '^6.39', role: 'Play-mode bloom / SMAA' },
  {
    name: '@grudge-studio/core',
    pin: '0.3.0 file',
    role: 'Fleet URLs + auth keys (vendored)',
  },
  {
    name: '@grudge-studio/asset-resolver',
    pin: '0.3.0 file',
    role: 'CDN asset URL join (vendored)',
  },
  {
    name: '@grudge-studio/assets',
    pin: '0.3.0 file',
    role: 'grudge6 / nature / baked path helpers',
  },
  {
    name: '@grudge-studio/animator',
    pin: '0.3.0 file',
    role: 'LocomotionCore / skill blends',
  },
  {
    name: '@grudge-studio/engine',
    pin: '0.3.0 file',
    role: 'Boot / terrain / physics defaults',
  },
] as const;

/**
 * Choices, not bans. Owner can override. R3F stays on Forge (Vue already has
 * the scene). Cannon still fights Rapier on one body. TLA plugin still crashes
 * this Vite. @grudge-studio/* is vendored under vendor/ (npm registry unpublished).
 */
export const FLEET_SKIP = [
  {
    name: '@react-three/fiber',
    reason:
      'Forge already owns R3F. This app is Vue + three — a second React canvas would split the scene.',
  },
  {
    name: '@react-three/rapier',
    reason:
      'Same Rapier world already via rapier3d-compat. Wrapper is for R3F JSX.',
  },
  {
    name: 'cannon-es',
    reason: 'Two physics engines on one body. Keep Rapier only.',
  },
  {
    name: 'vite-plugin-top-level-await',
    reason:
      'Crashes Vite 6.4 SWC here. Rapier already boots via wasm plugin + dynamic import.',
  },
  {
    name: 'colyseus.js',
    reason: 'No ThreeFlow room. Add when a room server exists.',
  },
] as const;

/** Forge layer matrix — do not invent extra groups. */
export const PHYS_LAYERS = [
  'Default',
  'Terrain',
  'Player',
  'NPC',
  'Item',
  'Projectile',
  'Trigger',
  'Water',
  'IgnoreRaycast',
  'UI3D',
] as const;
export type PhysLayer = (typeof PHYS_LAYERS)[number];

/** Forge Recast / surface tags — Walk · Climb · Swim · Jump · Dig · None */
export const SURFACE_KINDS = [
  'Walk',
  'Climb',
  'Swim',
  'Jump',
  'Dig',
  'None',
] as const;
export type SurfaceKind = (typeof SURFACE_KINDS)[number];

/**
 * Open-world vertical stack (SI metres). Same 3×3 as warlords-zones.
 * Seafloor = the 9 sector DS2 meshes, tiled and Y-fit to this band.
 * Islands weld their shelf here so slope meets the floor; water surface is 0
 * so each island owns its entrance band (weld → water).
 *
 * Visual + collider law: THREE_LAYER_TERRAIN (stylized-components).
 */
export const WORLD_STACK = {
  seafloorY: -100,
  islandWeldY: -10,
  waterY: 0,
  /** warlords-zones.json sizeMeters — DS2 mesh is scaled to this cell. */
  sectorTileM: 10000,
  /** Author DS2 bake width before XZ scale-to-cell. */
  sectorMeshM: 420,
  grid: 3,
  worldSeed: 'grudge-world-1',
  worldName: 'Aethermoor',
  lodCulledM: 100,
  lodHorizonM: 50,
  lodPhysicsM: 30,
} as const;

/**
 * Play GPU / tick budget — threejs-production-best-practices + WebGL Insights.
 * Cap fill-rate, reuse queries, keep the shadow frustum on the player.
 */
export const PLAY_PERF = {
  pixelRatioMax: 1.5,
  shadowMap: 1024,
  shadowHalfM: 42,
  shadowFarM: 180,
  cameraNear: 0.12,
  cameraFarPlay: 6000,
  cameraFarEdit: 20000,
  queryRebuildFrames: 30,
} as const;

/** One wind for grass, water flow, and open-sea sail. SI m/s. */
export const WORLD_WIND = {
  dirX: 0.92,
  dirZ: 0.39,
  speedMs: 5.5,
} as const;

/**
 * Terrain three-system — look + nav + collider. Not harvestables.
 * https://github.com/MolochDaGod/stylized-components (GrassField: rewire existing mesh).
 * Three looks: seafloor · mountain · tropical. Harvest nodes stay on island prefabs.
 */
export const TERRAIN_LOOKS = ['seafloor', 'mountain', 'tropical'] as const;
export type TerrainLookId = (typeof TERRAIN_LOOKS)[number];

/** Cortiz GrassField season deltas — applied onto the existing field uniforms. */
export const GRASS_SEASONS = ['spring', 'autumn'] as const;
export type GrassSeasonId = (typeof GRASS_SEASONS)[number];

export const THREE_LAYER_TERRAIN = {
  source: 'https://github.com/MolochDaGod/stylized-components',
  author: 'Christian Ortiz (Cortiz) — MIT, keep attribution',
  systems: ['look', 'nav', 'collider'] as const,
  looks: {
    seafloor: {
      id: 'seafloor' as const,
      contentLayer: 'seafloor' as const,
      y: WORLD_STACK.seafloorY,
      phys: 'Terrain' as PhysLayer,
      shape: 'heightfield' as const,
      surface: 'Walk' as SurfaceKind,
      ds2: 'zone' as const,
      tint: 0x3a5a62,
      roughness: 0.92,
      bind: 'DS2 seafloor tiles — look + heightfield + nav',
    },
    mountain: {
      id: 'mountain' as const,
      contentLayer: 'terrain' as const,
      y: WORLD_STACK.islandWeldY,
      phys: 'Terrain' as PhysLayer,
      shape: 'heightfield' as const,
      surface: 'Walk' as SurfaceKind,
      ds2: 'mountains' as const,
      tint: 0x7a7268,
      roughness: 0.94,
      bind: 'Mountain / crag DS2 — look + heightfield + nav',
    },
    tropical: {
      id: 'tropical' as const,
      contentLayer: 'terrain' as const,
      y: WORLD_STACK.islandWeldY,
      phys: 'Terrain' as PhysLayer,
      shape: 'heightfield' as const,
      surface: 'Walk' as SurfaceKind,
      ds2: 'zone' as const,
      tint: 0x5e8a4a,
      roughness: 0.88,
      bind: 'Tropical / haven DS2 — look + heightfield + nav',
    },
  },
} as const;

/** WaterFloor stack — atmosphere only. Not a terrain look. Not harvest. */
export const WATER_FLOOR_STACK = {
  source: 'https://github.com/MolochDaGod/stylized-components',
  layers: {
    seabed: {
      id: 'seabed' as const,
      contentLayer: 'seafloor' as const,
      y: WORLD_STACK.seafloorY,
      phys: 'Terrain' as PhysLayer,
      shape: 'heightfield' as const,
      surface: 'Walk' as SurfaceKind,
      sensor: false,
    },
    water: {
      id: 'water' as const,
      contentLayer: 'water' as const,
      y: WORLD_STACK.waterY,
      phys: 'Water' as PhysLayer,
      shape: 'cuboid' as const,
      surface: 'Swim' as SurfaceKind,
      sensor: true,
    },
    intersection: {
      id: 'intersection' as const,
      contentLayer: 'weather' as const,
      y: WORLD_STACK.islandWeldY,
      phys: 'IgnoreRaycast' as PhysLayer,
      shape: 'cuboid' as const,
      surface: 'None' as SurfaceKind,
      sensor: true,
    },
  },
} as const;

export type WaterFloorLayer = keyof typeof WATER_FLOOR_STACK.layers;
export type StylizedTerrainLayer = TerrainLookId;

export function isTerrainLook(id: string | undefined): id is TerrainLookId {
  return Boolean(id && (TERRAIN_LOOKS as readonly string[]).includes(id));
}

export const CONTENT_LAYERS = [
  {
    id: 'terrain',
    label: 'Terrain',
    phys: 'Terrain' as PhysLayer,
    surface: 'Walk' as SurfaceKind,
    siHeightM: 400,
    detail: 'Mountain / tropical look · heightfield · nav. Not harvest.',
  },
  {
    id: 'seafloor',
    label: 'Seafloor',
    phys: 'Terrain' as PhysLayer,
    surface: 'Walk' as SurfaceKind,
    siHeightM: WORLD_STACK.islandWeldY - WORLD_STACK.seafloorY,
    detail: 'Seafloor look · heightfield · nav. Not harvest.',
  },
  {
    id: 'water',
    label: 'Water',
    phys: 'Water' as PhysLayer,
    surface: 'Swim' as SurfaceKind,
    siHeightM: WORLD_STACK.waterY - WORLD_STACK.islandWeldY,
    detail: 'L1 WaterFloor — Voronoi surface at y=0 · cuboid sensor Swim',
  },
  {
    id: 'void',
    label: 'Void',
    phys: 'Trigger' as PhysLayer,
    surface: 'None' as SurfaceKind,
    siHeightM: 2000,
    detail: 'Map-wide hole · not walkable · fall forever',
  },
  {
    id: 'lava',
    label: 'Lava',
    phys: 'Terrain' as PhysLayer,
    surface: 'Walk' as SurfaceKind,
    siHeightM: 2000,
    detail: 'Map-wide hazard floor · same brick mesh, heat tint',
  },
  {
    id: 'quicksand',
    label: 'Quicksand',
    phys: 'Terrain' as PhysLayer,
    surface: 'Dig' as SurfaceKind,
    siHeightM: 2000,
    detail: 'Map-wide sink floor · Dig surface',
  },
  {
    id: 'harvestable',
    label: 'Harvestable',
    phys: 'Item' as PhysLayer,
    surface: 'Walk' as SurfaceKind,
    siHeightM: 2,
    detail: 'Wood / ore / scrap / herb / hide / fish nodes',
  },
  {
    id: 'npc',
    label: 'NPC',
    phys: 'NPC' as PhysLayer,
    surface: 'Walk' as SurfaceKind,
    siHeightM: 1.8,
    detail: 'Workers / allies / captains that are not player',
  },
  {
    id: 'monster',
    label: 'Monster',
    phys: 'NPC' as PhysLayer,
    surface: 'Walk' as SurfaceKind,
    siHeightM: 2.4,
    detail: 'Hostile — same NPC phys as wildlife',
  },
  {
    id: 'animal',
    label: 'Animal',
    phys: 'NPC' as PhysLayer,
    surface: 'Walk' as SurfaceKind,
    siHeightM: 1.2,
    detail: 'Wildlife — NPC phys',
  },
  {
    id: 'projectile',
    label: 'Projectile',
    phys: 'Projectile' as PhysLayer,
    surface: 'None' as SurfaceKind,
    siHeightM: 0.4,
    detail: 'Arrows / bolts / slash residuals',
  },
  {
    id: 'weather',
    label: 'Weather',
    phys: 'IgnoreRaycast' as PhysLayer,
    surface: 'None' as SurfaceKind,
    siHeightM: 1,
    detail: 'Rain / snow / fog / storm FX',
  },
  {
    id: 'player',
    label: 'Player',
    phys: 'Player' as PhysLayer,
    surface: 'Walk' as SurfaceKind,
    siHeightM: 1.8,
    detail: 'Play-as roster — pick one character to possess',
  },
  {
    id: 'item',
    label: 'Item',
    phys: 'Item' as PhysLayer,
    surface: 'Walk' as SurfaceKind,
    siHeightM: 0.5,
    detail: 'Loot / placed gear',
  },
  {
    id: 'trigger',
    label: 'Trigger',
    phys: 'Trigger' as PhysLayer,
    surface: 'None' as SurfaceKind,
    siHeightM: 2,
    detail: 'Sensor volumes',
  },
] as const;

export type ContentLayerId = (typeof CONTENT_LAYERS)[number]['id'];

/** Harvest / NPC / items — not terrain looks. */
export const ENTITY_CONTENT_LAYERS = CONTENT_LAYERS.filter(
  (l) =>
    l.id !== 'terrain' &&
    l.id !== 'seafloor' &&
    l.id !== 'water' &&
    l.id !== 'void' &&
    l.id !== 'lava' &&
    l.id !== 'quicksand'
);

/** Studio brick plane roles — same 2000 m mesh, many stacked in one scene. */
export const MAP_SURFACE_LAYERS = [
  'terrain',
  'seafloor',
  'water',
  'void',
  'lava',
  'quicksand',
] as const;
export type MapSurfaceLayerId = (typeof MAP_SURFACE_LAYERS)[number];

export function isMapSurfaceLayer(
  id: string | undefined
): id is MapSurfaceLayerId {
  return Boolean(id && (MAP_SURFACE_LAYERS as readonly string[]).includes(id));
}

/** Feet / snap may stand on these. Void + water are not walk floors. */
export function mapSurfaceWalkable(id: string | undefined): boolean {
  return (
    id === 'terrain' || id === 'seafloor' || id === 'lava' || id === 'quicksand'
  );
}

export function mapSurfaceDefaultY(id: string | undefined): number {
  if (id === 'seafloor') return WORLD_STACK.seafloorY;
  if (id === 'void') return WORLD_STACK.seafloorY - 20;
  if (id === 'lava') return WORLD_STACK.waterY - 0.35;
  return WORLD_STACK.waterY;
}

export function contentLayerDef(id: string | undefined) {
  return CONTENT_LAYERS.find((l) => l.id === id) || CONTENT_LAYERS[0];
}

export const PHYS_BODIES = ['fixed', 'kinematicPosition', 'dynamic'] as const;
export type PhysBody = (typeof PHYS_BODIES)[number];

export const PHYS_SHAPES = [
  'trimesh',
  'cuboid',
  'capsule',
  'heightfield',
] as const;
export type PhysShape = (typeof PHYS_SHAPES)[number];

/** Forge deathmatch + threejs-games 70-ai (idle/wander/patrol/follow/pursue). */
export const AI_BRAINS = [
  {
    id: 'idle',
    label: 'Idle',
    detail: 'threejs-games idle — turn in place. Follow if target walks off.',
  },
  {
    id: 'wander',
    label: 'Wander',
    detail: 'threejs-games wander — walk + turnEvery. Spotted → pursue.',
  },
  {
    id: 'patrol',
    label: 'Patrol',
    detail: 'threejs-games patrol — 10 m then turnSmooth. Spotted → pursue.',
  },
  {
    id: 'follow',
    label: 'Follow',
    detail: 'threejs-games follow — walk to 1.5 m then idle.',
  },
  {
    id: 'pursue',
    label: 'Pursue',
    detail: 'threejs-games pursue — run. Attack 1.25 m. Lost → baseState.',
  },
  {
    id: 'chase',
    label: 'Chase',
    detail: 'Alias of pursue (fleet name).',
  },
  {
    id: 'attack',
    label: 'Attack',
    detail: 'In range — Forge ATTACK / games attackDistance.',
  },
  { id: 'flee', label: 'Flee', detail: 'Low-HP. Running set in AI.js.' },
  { id: 'spawnpoint', label: 'Spawn point', detail: 'Marker. No tick.' },
  {
    id: 'player-deathmatch',
    label: 'Player (deathmatch)',
    detail: 'Forge player-deathmatch — play camera owns motion.',
  },
  {
    id: 'enemy-deathmatch',
    label: 'Enemy (deathmatch)',
    detail: 'patrol → pursue → attack / investigate / flee.',
  },
  {
    id: 'auto_harvest',
    label: 'Auto harvest',
    detail:
      'NPC gather to 10 then return to camp. Carry bag (ore/stone) or lumber only on the walk back.',
  },
] as const;
export type BrainKind = (typeof AI_BRAINS)[number]['id'];

export const FLEET_HOSTS = [
  {
    id: 'forge',
    name: 'Forge editor',
    url: STUDIO_FORGE_EDITOR,
    detail: 'Product scene editor · Rapier · .gfscene · AI Worker',
  },
  {
    id: 'ai',
    name: 'Grudge AI hub',
    url: STUDIO_AI,
    detail: 'Agentic worker · list_forge_best_practices · 70+ tools',
  },
  {
    id: 'ai-health',
    name: 'AI health',
    url: STUDIO_AI_HEALTH,
    detail: 'Probe before assuming the hub is up',
  },
  {
    id: 'forge-home',
    name: 'Forge home',
    url: STUDIO_FORGE,
    detail: 'Landing + catalog / agent jobs',
  },
  {
    id: 'assets',
    name: 'R2 CDN',
    url: STUDIO_ASSETS,
    detail: 'Binaries only — not player SSOT',
  },
  {
    id: 'objectstore',
    name: 'ObjectStore',
    url: STUDIO_OBJECTSTORE.replace(/\/api\/v1$/, ''),
    detail: 'JSON catalogs / search index',
  },
  {
    id: 'id',
    name: 'Grudge ID',
    url: STUDIO_ID,
    detail: 'SSO — never /auth/popup',
  },
  {
    id: 'coder',
    name: 'Coder',
    url: STUDIO_CODER,
    detail: 'Agentic source / three.js scripting workspace',
  },
  {
    id: 'play',
    name: 'Warlords play',
    url: STUDIO_PLAY,
    detail: 'Era play — not this editor',
  },
] as const;

export type PracticeContext =
  | 'scene'
  | 'assets'
  | 'deploy'
  | 'physics'
  | 'terrain'
  | 'pathfinding'
  | 'ai'
  | 'script'
  | 'defs'
  | 'build';

export type Practice = { title: string; detail: string };

export const BEST_PRACTICES: Record<PracticeContext, Practice[]> = {
  scene: [
    {
      title: 'Edits go through the command stack',
      detail:
        'Like three.js editor History: mutate via commands so undo works. Forge uses CommandStack; this shell uses HistoryModules.',
    },
    {
      title: 'SI units — 1 unit = 1 metre',
      detail:
        'Humanoid ~1.8 m. Never squash islands or weapons to 1.2 m. Feet = bbox min.y, not pelvis.',
    },
    {
      title: '.gfscene.json is Forge game SSOT',
      detail:
        'This editor saves three.js ObjectLoader JSON to IndexedDB. Full physics/scripts/layers live on Forge. Open in Forge for play bake.',
    },
  ],
  assets: [
    {
      title: 'D1 is the index — R2 is the binary',
      detail:
        'Search/register in D1. GLB/tex/audio on assets.grudge-studio.com. Never ship production meshes in the SPA bundle.',
    },
    {
      title: 'Railway is player SSOT',
      detail:
        'Characters, bag, wallet, island ownership stay on Railway. Forge / this editor do not own the roster.',
    },
    {
      title: 'Canonical mesh is meshopt GLB on CDN',
      detail:
        'Drop FBX here for preview; production kits go through grudge-asset-convert → R2.',
    },
    {
      title: 'One production GLTF loader',
      detail:
        'getProductionGltfLoader: Draco + Meshopt; KTX2 bound after renderer. Never bare new GLTFLoader() for race kits.',
    },
  ],
  deploy: [
    {
      title: 'Assign a real publish channel',
      detail:
        'Editor work → Forge API / R2 user-assets. Playtest → Puter/L7. Games → fleet satellite. Never vague “publish”.',
    },
    {
      title: 'Scenes must reference durable URLs',
      detail:
        'assets.grudge-studio.com or ObjectStore paths only — never blob: or localhost in saved scenes.',
    },
    {
      title: 'Smoke the live host',
      detail:
        'This SPA: threeflow-grudgenexus.vercel.app. Forge: forge.grudge-studio.com. Games: /api/health + CDN HEAD.',
    },
  ],
  physics: [
    {
      title: 'Rapier only — one world',
      detail:
        '@dimforge/rapier3d-compat. No Cannon on the same body. Terrain/buildings = fixed; player = kinematic CCT capsule ~0.9/0.3.',
    },
    {
      title: 'Use the Forge layer matrix',
      detail:
        'Default / Terrain / Player / NPC / Item / Projectile / Trigger / Water. Do not invent extra groups.',
    },
    {
      title: 'Trimesh last-resort',
      detail:
        'Convex / cuboid / capsule for props. Heightfield for large terrain. CCD on thin projectiles.',
    },
  ],
  terrain: [
    {
      title: 'Stamp isTerrain + terrainId',
      detail:
        'Asset-to-ground raycasts stamped roots. Foot IK and body share the same height field.',
    },
    {
      title: 'BVH on terrain meshes',
      detail:
        'three-mesh-bvh computeBoundsTree + firstHitOnly. Do not linear-raycast a 400 m HD zone.',
    },
    {
      title: 'Map open keeps the same controller',
      detail:
        'Rebind terrain only. Weapon skills, view mode, controller stay (fleet law).',
    },
  ],
  pathfinding: [
    {
      title: 'Editor bake = three-pathfinding',
      detail:
        'Zone from walkable terrain geo. Production Forge bake is recast-navigation — do not fork a second recast here.',
    },
    {
      title: 'Agent radius in SI metres',
      detail:
        'Human ~0.3 m radius, 1.8 m height, 0.4 m climb. Same numbers Forge uses for CCT.',
    },
  ],
  ai: [
    {
      title: 'Brains are Forge behavior ids + mmoCombat stamps',
      detail:
        'behavior = idle | patrol | chase | enemy-deathmatch | spawnpoint. Aggro/threat/cast live on userData.mmoCombat (lore.ts rings). Skill: grudge-ai-brains.',
    },
    {
      title: 'Threat table, not nearest-player',
      detail:
        'Damage/heal/taunt write a table. Target = max threat inside leash. Tank mul 1.5, decay 4/s, taunt lock 3s.',
    },
    {
      title: 'Every enemy hit has a telegraph',
      detail:
        'Melee ≥0.35s, spell default 1.6s. Variants aoe / cone / incoming from AttackWarningSystem. Incoming may lead velocity; planted AoE/cone do not.',
    },
    {
      title: 'AI tools are undoable turns',
      detail:
        'Mutating Forge AI tools snapshot the scene. Pop the live worker — do not copy 70 tools into Vue.',
    },
    {
      title: 'One mixer per skeleton',
      detail:
        'Yuka steers the root. Animation stays on the existing mixer. Never a second mixer.',
    },
  ],
  defs: [
    {
      title: 'info.grudge-studio.com is definition SSOT',
      detail:
        'ObjectStore JSON: professions, weapons, maps, home-island-contract. Do not invent a second catalog in this SPA.',
    },
    {
      title: 'Home island is 1024 m · 2 m character ref',
      detail:
        'Driftwood Bay / Ironfang Spire only. Concept GLB is a shell — tag trees/rocks/water here. Railway home_islands is player seed, not D1.',
    },
    {
      title: 'Do not mix map families',
      detail:
        '9 Warlords sectors ≠ home-block 3×3 ≠ pirate lobby. assertMapIdForFamily before load.',
    },
    {
      title: '5 craft · 6 harvest — no extra professions',
      detail:
        'Miner Forester Mystic Chef Engineer. Mining Logging Skinning Fishing Herbalism Scavenging. scrap→engineer herb→mystic hide→forester.',
    },
    {
      title: 'Mats account · XP character',
      detail:
        'Railway /api/account/resources vs /api/characters/:id/progress. Never a second bag DB.',
    },
  ],
  script: [
    {
      title: 'three.js editor script surface',
      detail:
        'Function body sees THREE, scene, camera, renderer, selected. No require/import. Use ObjectStore presets — do not pop Coder/Forge.',
    },
    {
      title: 'Prefer Forge design tools for lighting',
      detail:
        'Do not spam raw entities from a script when Forge ai/tools/design already places lights/cameras.',
    },
  ],
  build: [
    {
      title: 'Vite 6 + Rapier WASM plugins',
      detail:
        'vite-plugin-wasm. TLA is native es2022. Rapier stays dynamic import. Unused npm/demo GLBs/icon dumps get deleted. Node >= 20. pnpm doctor.',
    },
    {
      title: 'Compress meshes offline — Vercel compresses HTTP',
      detail:
        'grudge-convert glb2glb (Meshopt/Draco + WebP). Do not add a second gzip plugin; Vercel already brotli/gzip.',
    },
    {
      title: 'Decoders come from three r185',
      detail:
        'DRACOLoader import.meta.url hashes WASM into /assets. Do not also ship public/draco. KTX2/Basis is lazy.',
    },
    {
      title: 'One play camera writer',
      detail:
        'Orbit is editor-only. Play-as TPS owns camera.position. Same Controller across map rebinds.',
    },
  ],
};

export const SCRIPT_PRESETS: { name: string; source: string }[] = [
  {
    name: 'Home island contract (info)',
    source: `const rows = [];
scene.traverse((o) => {
 if (!o.userData) return;
 if (o.userData.homeIslandContract || /home.?island|example_home/i.test(o.name + (o.userData.r2Key||''))) {
 rows.push({
 name: o.name,
 contract: o.userData.homeIslandContract || 'unstamped',
 worldSizeM: o.userData.worldSizeM || 1024,
 characterHeightM: o.userData.characterHeightM || 2,
 r2: o.userData.r2Key,
 ssot: 'info.grudge-studio.com/api/v1/home-island-contract.json',
 });
 }
});
return rows;`,
  },
  {
    name: 'List terrain stamps',
    source: `const roots = [];
scene.traverse((o) => { if (o.userData && o.userData.isTerrain) roots.push(o); });
console.log('terrain', roots.map((o) => ({ name: o.name, id: o.userData.terrainId })));
return roots.length;`,
  },
  {
    name: 'Dump selected userData',
    source: `if (!selected) return 'nothing selected';
console.log(selected.name, selected.userData);
return selected.userData;`,
  },
  {
    name: 'List Warlords prefabs',
    source: `const rows = [];
scene.traverse((o) => {
 if (o.userData && o.userData.prefabId) {
 rows.push({ name: o.name, prefabId: o.userData.prefabId, kind: o.userData.prefabKind });
 }
});
console.log(rows);
return rows;`,
  },
  {
    name: 'Rotate selected 90° Y',
    source: `if (!selected) return 'nothing selected';
selected.rotation.y += Math.PI / 2;
selected.updateMatrixWorld(true);
return selected.rotation.y;`,
  },
  {
    name: 'Stamp selected harvest wood',
    source: `if (!selected) return 'nothing selected';
selected.userData.harvestKind = 'wood';
selected.userData.contentLayer = 'harvestable';
selected.userData.siHeightM = selected.userData.siHeightM || 6;
return { name: selected.name, harvestKind: 'wood' };`,
  },
  {
    name: 'List harvest + prefabs',
    source: `const rows = [];
scene.traverse((o) => {
 if (!o.userData) return;
 if (o.userData.harvestKind || o.userData.prefabId || o.userData.playScript) {
 rows.push({
 name: o.name,
 harvest: o.userData.harvestKind || null,
 prefabId: o.userData.prefabId || null,
 script: Boolean(o.userData.playScript),
 si: o.userData.siHeightM || null,
 });
 }
});
return rows;`,
  },
];

export const PIRATE_LOBBY_URL =
  'https://assets.grudge-studio.com/models/lobby/pirate-islands/scene.glb';
