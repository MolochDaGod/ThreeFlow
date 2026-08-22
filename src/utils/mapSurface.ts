/**
 * Map-wide mesh layers — the studio brick plane at y=0, retinted and stacked.
 * Same albedo/normal as initPlaneGround. Roles live on CONTENT_LAYERS.
 */
import * as THREE from 'three';
import {
  MAP_SURFACE_LAYERS,
  isMapSurfaceLayer,
  mapSurfaceDefaultY,
  mapSurfaceWalkable,
  type ContentLayerId,
  type MapSurfaceLayerId,
} from '@/config/fleetSystems';
import { stampContentLayer } from './contentLayers';

export const STUDIO_PLANE_NAME = 'customPlane';
export const MAP_WIDE_M = 2000;

export const MAP_SURFACE_LOOK: Record<
  MapSurfaceLayerId,
  {
    color: number;
    roughness: number;
    metalness: number;
    opacity: number;
    emissive: number;
    emissiveIntensity: number;
  }
> = {
  terrain: {
    color: 0xffffff,
    roughness: 0.8,
    metalness: 0.2,
    opacity: 1,
    emissive: 0x000000,
    emissiveIntensity: 0,
  },
  seafloor: {
    color: 0x6a7060,
    roughness: 0.94,
    metalness: 0.04,
    opacity: 1,
    emissive: 0x000000,
    emissiveIntensity: 0,
  },
  water: {
    color: 0x2a6a88,
    roughness: 0.28,
    metalness: 0.12,
    opacity: 0.62,
    emissive: 0x041018,
    emissiveIntensity: 0.08,
  },
  void: {
    color: 0x0a0c12,
    roughness: 1,
    metalness: 0,
    opacity: 0.22,
    emissive: 0x000000,
    emissiveIntensity: 0,
  },
  lava: {
    color: 0xc43a12,
    roughness: 0.42,
    metalness: 0.18,
    opacity: 1,
    emissive: 0x8a1808,
    emissiveIntensity: 0.55,
  },
  quicksand: {
    color: 0xc4a06a,
    roughness: 0.96,
    metalness: 0.04,
    opacity: 1,
    emissive: 0x000000,
    emissiveIntensity: 0,
  },
};

let sharedMaps: { map: THREE.Texture; normalMap: THREE.Texture } | null = null;
let mapsLoading: Promise<{
  map: THREE.Texture;
  normalMap: THREE.Texture;
}> | null = null;

export async function studioGroundMaps() {
  if (sharedMaps) return sharedMaps;
  if (!mapsLoading) {
    mapsLoading = (async () => {
      const loader = new THREE.TextureLoader();
      const map = await loader.loadAsync(
        new URL('../assets/textures/textures-5.webp', import.meta.url).href
      );
      map.repeat.set(1000, 1000);
      map.wrapS = map.wrapT = THREE.RepeatWrapping;
      map.anisotropy = 16;
      map.colorSpace = THREE.SRGBColorSpace;
      const normalMap = await loader.loadAsync(
        new URL('../assets/textures/textures-normal-5.webp', import.meta.url)
          .href
      );
      normalMap.repeat.set(1000, 1000);
      normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
      normalMap.anisotropy = 16;
      sharedMaps = { map, normalMap };
      return sharedMaps;
    })();
  }
  return mapsLoading;
}

export function isMapSurfaceObject(
  obj: THREE.Object3D | null | undefined
): boolean {
  if (!obj) return false;
  return (
    obj.userData?.mapSurface === true ||
    obj.name === STUDIO_PLANE_NAME ||
    Boolean(obj.userData?.planeGeometry)
  );
}

export function applyMapSurfaceLook(
  obj: THREE.Object3D,
  id: MapSurfaceLayerId
) {
  const look = MAP_SURFACE_LOOK[id];
  obj.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const mat of mats) {
      const m = mat as THREE.MeshPhysicalMaterial;
      if (!m || !('color' in m)) continue;
      m.color?.setHex(look.color);
      if ('roughness' in m) m.roughness = look.roughness;
      if ('metalness' in m) m.metalness = look.metalness;
      m.transparent = look.opacity < 1;
      m.opacity = look.opacity;
      m.depthWrite = look.opacity >= 0.95;
      if ('emissive' in m && m.emissive) m.emissive.setHex(look.emissive);
      if ('emissiveIntensity' in m)
        m.emissiveIntensity = look.emissiveIntensity;
      m.needsUpdate = true;
    }
  });
}

export function stampMapSurface(obj: THREE.Object3D, id: MapSurfaceLayerId) {
  stampContentLayer(obj, id as ContentLayerId, { siHeightM: MAP_WIDE_M });
  obj.userData.mapSurface = true;
  obj.userData.planeGeometry = obj.userData.planeGeometry || 'brick';
  obj.userData.isTerrain = mapSurfaceWalkable(id);
  if (obj.userData.isTerrain) {
    obj.userData.terrainId = obj.userData.terrainId || `map-${id}`;
    obj.userData.terrainKind = id === 'seafloor' ? 'seafloor' : 'map';
  } else {
    obj.userData.terrainKind = undefined;
  }
  applyMapSurfaceLook(obj, id);
}

export async function createMapSurfaceMesh(
  id: MapSurfaceLayerId
): Promise<THREE.Mesh> {
  const { map, normalMap } = await studioGroundMaps();
  const look = MAP_SURFACE_LOOK[id];
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(MAP_WIDE_M, MAP_WIDE_M),
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(look.color),
      map,
      normalMap,
      roughness: look.roughness,
      metalness: look.metalness,
      transparent: look.opacity < 1,
      opacity: look.opacity,
      emissive: new THREE.Color(look.emissive),
      emissiveIntensity: look.emissiveIntensity,
      side: THREE.DoubleSide,
      depthWrite: look.opacity >= 0.95,
    })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = id !== 'void' && id !== 'water';
  mesh.castShadow = false;
  mesh.userData.isTransformControls = true;
  stampMapSurface(mesh, id);
  return mesh;
}

export function listMapSurfaces(scene: THREE.Scene): THREE.Object3D[] {
  const out: THREE.Object3D[] = [];
  scene.traverse((o) => {
    if (o !== scene && isMapSurfaceObject(o)) out.push(o);
  });
  return out;
}

export function hydrateMapSurfaces(scene: THREE.Scene) {
  scene.traverse((o) => {
    if (o === scene || !isMapSurfaceObject(o)) return;
    const raw = String(o.userData.contentLayer || 'terrain');
    const id = isMapSurfaceLayer(raw) ? raw : 'terrain';
    stampMapSurface(o, id);
  });
}

export async function spawnMapSurface(
  scene: THREE.Scene,
  id: MapSurfaceLayerId,
  y?: number
): Promise<THREE.Mesh> {
  const mesh = await createMapSurfaceMesh(id);
  const existing = scene.getObjectByName(STUDIO_PLANE_NAME);
  mesh.name =
    !existing && id === 'terrain' ? STUDIO_PLANE_NAME : `mapSurface-${id}`;
  mesh.position.y = y ?? mapSurfaceDefaultY(id);
  scene.add(mesh);
  return mesh;
}

export { MAP_SURFACE_LAYERS };
export type { MapSurfaceLayerId };
