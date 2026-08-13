/**
 * Terrain identifiers + "asset to ground".
 * HD / sector / island roots must stamp isTerrain + terrainId/sectorId
 * so snap can raycast the same height field (grudge-world-scale / fleet raycast).
 */
import * as THREE from 'three';

export type TerrainKind = 'sector' | 'map' | 'hd' | 'island';

export interface TerrainStamp {
  terrainId: string;
  sectorId?: string;
  kind: TerrainKind;
  playUrl?: string;
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

export function findTerrainRoot(obj: THREE.Object3D | null): THREE.Object3D | null {
  let p: THREE.Object3D | null = obj;
  while (p) {
    if (p.userData?.isTerrain) return p;
    p = p.parent;
  }
  return null;
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
  const terrains = listTerrainRoots(scene);
  const ray = new THREE.Raycaster(origin, new THREE.Vector3(0, -1, 0));
  ray.far = 4000;
  const hits = terrains.length
    ? ray.intersectObjects(terrains, true)
    : [];
  let groundY = 0;
  let terrainId = 'plane';
  if (hits.length) {
    groundY = hits[0].point.y;
    const root = findTerrainRoot(hits[0].object);
    terrainId = String(root?.userData?.terrainId || hits[0].object.userData?.terrainId || 'terrain');
  }
  object.position.y += groundY - box.min.y;
  object.updateMatrixWorld(true);
  return { ok: true, terrainId, y: object.position.y };
}
