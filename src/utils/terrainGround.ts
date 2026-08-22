/**
 * Terrain identifiers + "asset to ground".
 * HD / sector / island roots must stamp isTerrain + terrainId/sectorId
 * so snap can raycast the same height field (grudge-world-scale / fleet raycast).
 */
import * as THREE from 'three';
import { mapSurfaceWalkable, WORLD_STACK } from '@/config/fleetSystems';
import { peekPlayQuery } from './contentLayers';
import { isMapSurfaceObject } from './mapSurface';

function isHarvestHit(o: THREE.Object3D): boolean {
  const layer = String(o.userData?.contentLayer || '');
  if (o.userData?.grassField || o.name === '__grassField') return true;
  return (
    Boolean(o.userData?.harvestKind) ||
    layer === 'harvestable' ||
    layer === 'item'
  );
}

export type TerrainKind = 'sector' | 'map' | 'hd' | 'island' | 'seafloor';
export type IslandKind = 'static' | 'faction' | 'prefab';

export interface TerrainStamp {
  terrainId: string;
  sectorId?: string;
  kind: TerrainKind;
  playUrl?: string;
  islandKind?: IslandKind;
}

export function tagTerrain(root: THREE.Object3D, stamp: TerrainStamp) {
  root.userData = {
    ...root.userData,
    isTransformControls: true,
    isTerrain: true,
    terrainId: stamp.terrainId,
    sectorId: stamp.sectorId || stamp.terrainId,
    terrainKind: stamp.kind,
    playUrl: stamp.playUrl || '',
    islandKind: stamp.islandKind,
  };
  root.traverse((o) => {
    if (o === root) return;
    if ((o as THREE.Mesh).isMesh) {
      o.userData.isTerrainMesh = true;
      o.userData.terrainId = stamp.terrainId;
      o.userData.sectorId = stamp.sectorId || stamp.terrainId;
    }
  });
}

export function findTerrainRoot(
  obj: THREE.Object3D | null
): THREE.Object3D | null {
  let p: THREE.Object3D | null = obj;
  while (p) {
    if (p.userData?.isTerrain) return p;
    p = p.parent;
  }
  return null;
}

const _ray = new THREE.Raycaster();
const _origin = new THREE.Vector3();
const _down = new THREE.Vector3(0, -1, 0);
const _n = new THREE.Vector3();

function walkableGroundRoots(scene: THREE.Scene): THREE.Object3D[] {
  const out: THREE.Object3D[] = [];
  scene.traverse((o) => {
    if (o === scene) return;
    const layer = String(o.userData?.contentLayer || '');
    if (layer === 'void' || layer === 'water') return;
    if (o.userData?.isTerrain && mapSurfaceWalkable(layer || 'terrain')) {
      out.push(o);
      return;
    }
    if (isMapSurfaceObject(o) && mapSurfaceWalkable(layer || 'terrain'))
      out.push(o);
  });
  return out;
}

/** Same height field body snap uses — foot IK must sample this, not a second ground. */
export function sampleTerrainAt(
  scene: THREE.Scene,
  x: number,
  z: number
): { y: number; normal: THREE.Vector3 | null; layer: string } {
  const q = peekPlayQuery();
  const targets =
    q && q.scene === scene && q.grounds.length
      ? q.grounds
      : walkableGroundRoots(scene);
  if (!targets.length)
    return { y: Number.NEGATIVE_INFINITY, normal: null, layer: 'void' };
  _origin.set(x, 800, z);
  _ray.set(_origin, _down);
  _ray.far = 2000;
  const hits = _ray
    .intersectObjects(targets, true)
    .filter((h) => !isHarvestHit(h.object));
  if (!hits.length)
    return { y: Number.NEGATIVE_INFINITY, normal: null, layer: 'void' };
  const h = hits[0];
  let normal: THREE.Vector3 | null = null;
  if (h.face) {
    normal = _n
      .copy(h.face.normal)
      .transformDirection(h.object.matrixWorld)
      .normalize()
      .clone();
  }
  const root = findTerrainRoot(h.object) || h.object;
  const layer = String(root.userData?.contentLayer || 'terrain');
  return { y: h.point.y, normal, layer };
}

export function listTerrainRoots(scene: THREE.Scene): THREE.Object3D[] {
  const out: THREE.Object3D[] = [];
  scene.traverse((o) => {
    if (o.userData?.isTerrain) out.push(o);
  });
  return out;
}

/**
 * Drop selected asset onto terrain under its XZ (or y=0 plane).
 * Uses bbox feet (min.y), not pelvis — same rule as character grounding.
 */
export function snapObjectToTerrain(
  object: THREE.Object3D,
  scene: THREE.Scene
): { ok: boolean; terrainId: string; y: number } {
  if (object.userData?.isTerrain) {
    return { ok: false, terrainId: '', y: object.position.y };
  }
  object.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(object);
  if (box.isEmpty()) {
    return { ok: false, terrainId: '', y: object.position.y };
  }
  const origin = new THREE.Vector3(
    (box.min.x + box.max.x) * 0.5,
    box.max.y + 8,
    (box.min.z + box.max.z) * 0.5
  );
  if (
    object.userData?.islandKind ||
    object.userData?.terrainKind === 'island'
  ) {
    weldIslandToSeafloor(object);
    return { ok: true, terrainId: 'island-weld', y: object.position.y };
  }
  const terrains = walkableGroundRoots(scene);
  const ray = new THREE.Raycaster(origin, new THREE.Vector3(0, -1, 0));
  ray.far = 4000;
  const hits = terrains.length
    ? ray
        .intersectObjects(terrains, true)
        .filter((h) => !isHarvestHit(h.object))
    : [];
  if (!hits.length) {
    return { ok: false, terrainId: 'void', y: object.position.y };
  }
  const groundY = hits[0].point.y;
  const root = findTerrainRoot(hits[0].object);
  const terrainId = String(
    root?.userData?.terrainId || hits[0].object.userData?.terrainId || 'terrain'
  );
  object.position.y += groundY - box.min.y;
  object.updateMatrixWorld(true);
  return { ok: true, terrainId, y: object.position.y };
}

/**
 * Fit a sector tile so its relief fills seafloorY…islandWeldY (−100…−10).
 * This remaps terrain height into the ocean band — not character/import stretch.
 */
export function fitSeafloorTile(root: THREE.Object3D) {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  if (box.isEmpty()) return;
  const h = Math.max(box.max.y - box.min.y, 0.01);
  const target = WORLD_STACK.islandWeldY - WORLD_STACK.seafloorY;
  const sy = target / h;
  root.scale.y *= sy;
  root.updateMatrixWorld(true);
  const after = new THREE.Box3().setFromObject(root);
  root.position.y += WORLD_STACK.seafloorY - after.min.y;
  root.updateMatrixWorld(true);
}

/** Island shelf at weld Y so slope meets seafloor; water at 0 is the entrance. */
export function weldIslandToSeafloor(root: THREE.Object3D) {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  if (box.isEmpty()) return;
  root.position.y += WORLD_STACK.islandWeldY - box.min.y;
  root.updateMatrixWorld(true);
  root.userData.islandWeldY = WORLD_STACK.islandWeldY;
  root.userData.waterY = WORLD_STACK.waterY;
}

export function parentToNearestIsland(
  scene: THREE.Scene,
  node: THREE.Object3D,
  maxDist = 120
): THREE.Object3D | null {
  const p = new THREE.Vector3();
  node.getWorldPosition(p);
  let best: THREE.Object3D | null = null;
  let bestD = maxDist;
  const q = new THREE.Vector3();
  for (const t of listTerrainRoots(scene)) {
    if (t === node || t.userData.terrainKind === 'seafloor') continue;
    if (t.userData.terrainKind !== 'island' && !t.userData.islandKind) continue;
    t.getWorldPosition(q);
    const d = Math.hypot(p.x - q.x, p.z - q.z);
    if (d < bestD) {
      bestD = d;
      best = t;
    }
  }
  if (!best) return null;
  best.attach(node);
  return best;
}
