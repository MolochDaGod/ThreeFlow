/**
 * In-app scene identity — classify trees / rocks / water / layers.
 * Does not pop AI. Uses existing CONTENT_LAYERS + harvest kinds.
 */
import * as THREE from 'three';
import { CONTENT_LAYERS, type ContentLayerId } from '@/config/fleetSystems';

export type ScenePartKind =
  | 'tree'
  | 'rock'
  | 'ore'
  | 'water'
  | 'terrain'
  | 'player'
  | 'npc'
  | 'monster'
  | 'animal'
  | 'harvest'
  | 'structure'
  | 'unknown';

export type NpcRole = 'vendor' | 'ally' | 'enemy';
export type AnimalRole = 'aggro' | 'passive' | 'pet';

export type ScenePart = {
  uuid: string;
  name: string;
  kind: ScenePartKind;
  layer: ContentLayerId | 'unset';
  origin: string;
  siM: number;
};

export type SceneGap = {
  id: string;
  title: string;
  detail: string;
  fix:
    | 'add-layer'
    | 'stamp-player'
    | 'stamp-water'
    | 'stamp-harvest'
    | 'add-npc'
    | 'add-hud';
};

const TREE_RE = /tree|pine|oak|palm|timber|lumber|willow|birch|forest/i;
const ROCK_RE = /rock|stone|boulder|pebble|cliff|gravel/i;
const ORE_RE = /ore|mineral|vein|crystal|mine/i;
const WATER_RE = /water|ocean|lake|river|sea|pond|shore|wave/i;
const HOME_RE = /home.?island|example_home_island|island/i;

export function classifyPart(o: THREE.Object3D): ScenePartKind {
  const s = `${o.name} ${o.userData.r2Key || ''} ${o.userData.harvestKind || ''} ${o.userData.contentLayer || ''}`;
  if (
    o.userData.playAs ||
    o.userData.player ||
    o.userData.contentLayer === 'player'
  )
    return 'player';
  if (o.userData.contentLayer === 'water' || WATER_RE.test(s)) return 'water';
  if (o.userData.isTerrain || o.userData.contentLayer === 'terrain')
    return 'terrain';
  if (o.userData.contentLayer === 'monster') return 'monster';
  if (o.userData.contentLayer === 'animal') return 'animal';
  if (o.userData.contentLayer === 'npc') return 'npc';
  if (o.userData.harvestKind === 'wood' || TREE_RE.test(s)) return 'tree';
  if (o.userData.harvestKind === 'ore' || ORE_RE.test(s)) return 'ore';
  if (o.userData.harvestKind === 'stone' || ROCK_RE.test(s)) return 'rock';
  if (o.userData.harvestKind || o.userData.contentLayer === 'harvestable')
    return 'harvest';
  if (o.userData.prefabKind === 'structure') return 'structure';
  return 'unknown';
}

export function originOf(o: THREE.Object3D): string {
  const key = String(o.userData.r2Key || o.userData.catalogKey || '');
  if (/example_home_island|home-island/.test(key) || HOME_RE.test(o.name)) {
    return 'Home island · info contract v1.3 · 1024 m · char ref 2.0 m · concept GLB example_home_island (not DS2). “(n)” = Three.js duplicate name.';
  }
  if (o.userData.ds2Preset || /hardroad|ds2|hd-/.test(key + o.name)) {
    return `Hard Road DS2 heightfield · preset ${o.userData.ds2Preset || 'zone'} · ${o.userData.worldMeters || 400} m`;
  }
  if (o.userData.r2Key) return `CDN ${o.userData.r2Key}`;
  if (o.userData.mapSurface || o.name === 'customPlane') {
    return `Map-wide brick plane · ${o.userData.contentLayer || 'terrain'} · y=${o.position.y.toFixed(2)} · 2000 m`;
  }
  return 'Placed / imported mesh';
}

export function auditScene(scene: THREE.Scene): {
  parts: ScenePart[];
  counts: Record<string, number>;
  gaps: SceneGap[];
  islandNote: string | null;
} {
  const parts: ScenePart[] = [];
  scene.traverse((o) => {
    if (o === scene || o.type === 'Scene') return;
    if (
      !(o as THREE.Mesh).isMesh &&
      !o.userData?.isTransformControls &&
      !o.userData?.isTerrain &&
      o.name !== 'customPlane'
    ) {
      if (
        !o.userData?.contentLayer &&
        !o.userData?.prefabKind &&
        !o.userData?.raceKit
      )
        return;
    }
    if (o.parent && o.parent !== scene && (o.parent as THREE.Mesh).isMesh)
      return;
    const kind = classifyPart(o);
    const layer = (o.userData.contentLayer as ContentLayerId) || 'unset';
    const box = new THREE.Box3().setFromObject(o);
    const siM =
      Number(o.userData.siHeightM) ||
      (box.isEmpty() ? 0 : box.getSize(new THREE.Vector3()).y);
    parts.push({
      uuid: o.uuid,
      name: o.name || o.type,
      kind,
      layer,
      origin: originOf(o),
      siM: Math.round(siM * 10) / 10,
    });
  });
  const counts: Record<string, number> = {};
  for (const p of parts) counts[p.kind] = (counts[p.kind] || 0) + 1;
  const gaps: SceneGap[] = [];
  if (!parts.some((p) => p.kind === 'player')) {
    gaps.push({
      id: 'player',
      title: 'No play-as character',
      detail: 'Stamp a captain to Player layer, then Play this scene.',
      fix: 'stamp-player',
    });
  }
  if (!parts.some((p) => p.kind === 'water')) {
    gaps.push({
      id: 'water',
      title: 'No water layer',
      detail:
        'Name or stamp a mesh Water (Swim surface) so boats/fish can exist.',
      fix: 'stamp-water',
    });
  }
  if (!parts.some((p) => p.kind === 'tree' || p.kind === 'harvest')) {
    gaps.push({
      id: 'trees',
      title: 'No harvestable trees',
      detail:
        'Tag tree meshes harvestable / wood so NPCs and the player can chop.',
      fix: 'stamp-harvest',
    });
  }
  if (!parts.some((p) => p.kind === 'rock' || p.kind === 'ore')) {
    gaps.push({
      id: 'rocks',
      title: 'No minable rocks / ore',
      detail: 'Tag boulders harvestable stone or ore.',
      fix: 'stamp-harvest',
    });
  }
  if (!parts.some((p) => p.kind === 'npc' || p.kind === 'monster')) {
    gaps.push({
      id: 'npc',
      title: 'No NPC / monster',
      detail: 'Assign vendor / ally / enemy on a unit, or drop Enemy camp.',
      fix: 'add-npc',
    });
  }
  const island = parts.find((p) => /island|home/i.test(p.name + p.origin));
  return { parts, counts, gaps, islandNote: island ? island.origin : null };
}

export const NPC_ROLE_BRAIN: Record<NpcRole, string> = {
  vendor: 'idle',
  ally: 'follow',
  enemy: 'patrol',
};

export const ANIMAL_ROLE_BRAIN: Record<AnimalRole, string> = {
  aggro: 'pursue',
  passive: 'wander',
  pet: 'follow',
};

export function applyNpcRole(obj: THREE.Object3D, role: NpcRole) {
  obj.userData.npcRole = role;
  obj.userData.aiBrain = NPC_ROLE_BRAIN[role];
  obj.userData.behavior = NPC_ROLE_BRAIN[role];
  obj.userData.contentLayer = role === 'enemy' ? 'monster' : 'npc';
}

export function applyAnimalRole(obj: THREE.Object3D, role: AnimalRole) {
  obj.userData.animalRole = role;
  obj.userData.aiBrain = ANIMAL_ROLE_BRAIN[role];
  obj.userData.behavior = ANIMAL_ROLE_BRAIN[role];
  obj.userData.contentLayer = 'animal';
}

export { CONTENT_LAYERS };
