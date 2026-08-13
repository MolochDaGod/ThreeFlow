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
  { name: 'three', pin: '^0.185', role: 'Renderer / scene' },
  { name: '@dimforge/rapier3d-compat', pin: '^0.19', role: 'World physics + colliders' },
  { name: 'three-mesh-bvh', pin: '^0.9', role: 'Terrain ray / mesh queries' },
  { name: 'three-pathfinding', pin: '^1.3', role: 'Navmesh path (editor bake)' },
  {
    name: 'yuka',
    pin: '^0.7',
    role: 'Root steering · Think/Vision/Memory — not combat math',
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

export const PHYS_BODIES = [
  'fixed',
  'kinematicPosition',
  'dynamic',
] as const;
export type PhysBody = (typeof PHYS_BODIES)[number];

export const PHYS_SHAPES = [
  'trimesh',
  'cuboid',
  'capsule',
  'heightfield',
] as const;
export type PhysShape = (typeof PHYS_SHAPES)[number];

/** Forge deathmatch + marker brains — same `behavior` field names. */
export const AI_BRAINS = [
  { id: 'idle', label: 'Idle', detail: 'Stand. No path write.' },
  { id: 'patrol', label: 'Patrol', detail: 'Yuka wander on nav zone.' },
  { id: 'chase', label: 'Chase', detail: 'Seek player tag / selected.' },
  { id: 'attack', label: 'Attack', detail: 'Forge enemy-deathmatch ATTACK.' },
  { id: 'flee', label: 'Flee', detail: 'Low-HP flee from Forge FSM.' },
  { id: 'spawnpoint', label: 'Spawn point', detail: 'Marker. No tick.' },
  {
    id: 'player-deathmatch',
    label: 'Player (deathmatch)',
    detail: 'Forge player-deathmatch — play camera owns motion.',
  },
  {
    id: 'enemy-deathmatch',
    label: 'Enemy (deathmatch)',
    detail: 'PATROL → CHASE → ATTACK / INVESTIGATE / FLEE.',
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
  | 'script';

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
  script: [
    {
      title: 'three.js editor script surface',
      detail:
        'Function body sees THREE, scene, camera, renderer, selected. No require/import. Persistent play scripts live on Forge.',
    },
    {
      title: 'Prefer Forge design tools for lighting',
      detail:
        'Do not spam raw entities from a script when Forge ai/tools/design already places lights/cameras.',
    },
  ],
};

export const SCRIPT_PRESETS: { name: string; source: string }[] = [
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
    name: 'Rotate selected 90° Y',
    source: `if (!selected) return 'nothing selected';
selected.rotation.y += Math.PI / 2;
selected.updateMatrixWorld(true);
return selected.rotation.y;`,
  },
];

export const PIRATE_LOBBY_URL =
  'https://assets.grudge-studio.com/models/lobby/pirate-islands/scene.glb';
