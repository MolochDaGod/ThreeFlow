/**
 * Placeable content-layer prefabs — water / seafloor / weather / trigger.
 * Reuses worldAtmosphere textures + Forge layer stamps. Not a second weather engine.
 */
import * as THREE from 'three';
import { stampContentLayer } from './contentLayers';
import { WORLD_STACK, type ContentLayerId } from '@/config/fleetSystems';
import { createWaterFloorMesh } from './waterFloor';
import { applyTerrainLook } from './terrainLook';

export const LAYER_PREFABS = {
  water: 'prefab://water-plane',
  seafloor: 'prefab://seafloor-grid',
  mapTerrain: 'prefab://map-surface-terrain',
  mapSeafloor: 'prefab://map-surface-seafloor',
  mapWater: 'prefab://map-surface-water',
  mapVoid: 'prefab://map-surface-void',
  mapLava: 'prefab://map-surface-lava',
  mapQuicksand: 'prefab://map-surface-quicksand',
  weatherCloud: 'prefab://weather-cloud',
  weatherFall: 'prefab://weather-fall',
  spawnpoint: 'prefab://spawnpoint',
  trigger: 'prefab://trigger-volume',
} as const;

function tex(url: URL, repeat: number, color = true) {
  const t = new THREE.TextureLoader().load(url.href);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function place(root: THREE.Object3D, pos: THREE.Vector3) {
  root.position.copy(pos);
  root.userData.isTransformControls = true;
}

export function spawnWaterPlane(
  scene: THREE.Scene,
  pos: THREE.Vector3
): THREE.Mesh {
  const mesh = createWaterFloorMesh(40, 40);
  mesh.name = 'Water';
  place(mesh, pos);
  mesh.position.y = WORLD_STACK.waterY;
  mesh.userData.followCamXZ = false;
  scene.add(mesh);
  return mesh;
}

export function spawnSeafloorPlane(
  scene: THREE.Scene,
  pos: THREE.Vector3
): THREE.Mesh {
  // Tiny local pad only — open world uses spawnSeafloorGrid (9 sector tiles).
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 80, 16, 16),
    new THREE.MeshStandardMaterial({
      color: 0x3a4038,
      roughness: 0.94,
      metalness: 0.02,
    })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.name = 'Seafloor pad';
  place(mesh, pos);
  mesh.position.y = WORLD_STACK.seafloorY;
  stampContentLayer(mesh, 'seafloor', {
    siHeightM: WORLD_STACK.islandWeldY - WORLD_STACK.seafloorY,
  });
  mesh.userData.physLayer = 'Terrain';
  mesh.userData.physBody = 'fixed';
  applyTerrainLook(mesh, 'seafloor', {
    terrainId: 'seafloor',
    kind: 'seafloor',
  });
  scene.add(mesh);
  return mesh;
}

export function spawnWeatherCloud(
  scene: THREE.Scene,
  pos: THREE.Vector3
): THREE.Mesh {
  const smoke = tex(new URL('../assets/image/smoke.png', import.meta.url), 1);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(48, 18),
    new THREE.MeshBasicMaterial({
      map: smoke,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
      side: THREE.DoubleSide,
      color: 0xe8eef6,
    })
  );
  mesh.name = 'Cloud';
  place(mesh, pos);
  mesh.position.y = pos.y + 24;
  mesh.rotation.x = -0.35;
  stampContentLayer(mesh, 'weather', { siHeightM: 20 });
  mesh.userData.physLayer = 'IgnoreRaycast';
  scene.add(mesh);
  return mesh;
}

export function spawnWeatherFall(
  scene: THREE.Scene,
  pos: THREE.Vector3
): THREE.Mesh {
  const rain = tex(new URL('../assets/image/rain.png', import.meta.url), 1);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(6, 28),
    new THREE.MeshBasicMaterial({
      map: rain,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
      side: THREE.DoubleSide,
      color: 0xcfe8ff,
    })
  );
  mesh.name = 'Waterfall';
  place(mesh, pos);
  mesh.position.y = pos.y + 14;
  stampContentLayer(mesh, 'weather', { siHeightM: 28 });
  mesh.userData.physLayer = 'IgnoreRaycast';
  scene.add(mesh);
  return mesh;
}

export function spawnTriggerVolume(
  scene: THREE.Scene,
  pos: THREE.Vector3
): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(2, 2, 2),
    new THREE.MeshStandardMaterial({
      color: 0x4a7ab0,
      transparent: true,
      opacity: 0.28,
      roughness: 0.4,
    })
  );
  mesh.name = 'Trigger';
  place(mesh, pos);
  mesh.position.y = pos.y + 1;
  stampContentLayer(mesh, 'trigger', { siHeightM: 2 });
  mesh.userData.physLayer = 'Trigger';
  mesh.userData.physBody = 'fixed';
  mesh.userData.physShape = 'cuboid';
  mesh.userData.surface = 'None';
  scene.add(mesh);
  return mesh;
}

export function spawnSpawnPoint(
  scene: THREE.Scene,
  pos: THREE.Vector3
): THREE.Group {
  const root = new THREE.Group();
  root.name = 'Spawn point';
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 2, 8),
    new THREE.MeshStandardMaterial({ color: 0xe8c56b, roughness: 0.45 })
  );
  pole.position.y = 1;
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(0.55, 16),
    new THREE.MeshStandardMaterial({ color: 0x3a6a8a, roughness: 0.7 })
  );
  disc.rotation.x = -Math.PI / 2;
  root.add(pole, disc);
  place(root, pos);
  stampContentLayer(root, 'trigger', { siHeightM: 2 });
  root.userData.physLayer = 'Trigger';
  root.userData.behavior = 'spawnpoint';
  root.userData.aiBrain = 'spawnpoint';
  scene.add(root);
  return root;
}

export function spawnLayerPrefab(
  scene: THREE.Scene,
  scheme: string,
  pos: THREE.Vector3
): THREE.Object3D | null {
  switch (scheme) {
    case LAYER_PREFABS.water:
      return spawnWaterPlane(scene, pos);
    case LAYER_PREFABS.seafloor:
      return null;
    case LAYER_PREFABS.weatherCloud:
      return spawnWeatherCloud(scene, pos);
    case LAYER_PREFABS.weatherFall:
      return spawnWeatherFall(scene, pos);
    case LAYER_PREFABS.trigger:
      return spawnTriggerVolume(scene, pos);
    case LAYER_PREFABS.spawnpoint:
      return spawnSpawnPoint(scene, pos);
    default:
      return null;
  }
}

export function isLayerPrefab(path: string): boolean {
  return Object.values(LAYER_PREFABS).includes(
    path as (typeof LAYER_PREFABS)[keyof typeof LAYER_PREFABS]
  );
}

export type { ContentLayerId };
