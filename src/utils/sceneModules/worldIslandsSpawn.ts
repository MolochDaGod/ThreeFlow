/**
 * Place Warlords hand + generative islands on the seafloor grid.
 * Weld shelf at −10, peak at +elevation, water at 0. Harvest on main prefabs.
 */
import * as THREE from 'three';
import { ASSETS_CDN } from '@/config/assetApi';
import { WORLD_STACK } from '@/config/fleetSystems';
import { SEAFLOOR_GRID } from '@/config/hdTerrainDeploy';
import {
  allIslandsForSector,
  BIOME_LAND,
  localToWorld,
  type WorldIslandDef,
} from '@/config/worldIslands';
import { stampContentLayer } from '@/utils/contentLayers';
import { getProductionGltfLoader } from '@/utils/gltfProdLoader';
import { tagTerrain, weldIslandToSeafloor } from '@/utils/terrainGround';
import { applyTerrainLook, lookFromBiome } from '@/utils/terrainLook';
import { kitForSector, natureCdnUrl } from '@/config/sectorKits';
import { placeAssetSi } from '@/utils/siPlace';
import {
  WARLORDS_ANIMALS,
  WARLORDS_COTW_ANIMALS,
} from '@/config/warlordsCatalog';

export const ISLANDS_ROOT = '__worldIslands';

function islandMesh(def: WorldIslandDef): THREE.Mesh {
  const rise = def.elevation - WORLD_STACK.islandWeldY;
  const geo = new THREE.ConeGeometry(def.radius, Math.max(rise, 2), 10);
  const mat = new THREE.MeshStandardMaterial({
    color: BIOME_LAND[def.biome] || 0x6a7848,
    roughness: 0.9,
    metalness: 0.04,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

const harvestSrc = new Map<string, Promise<THREE.Object3D | null>>();

function harvestTemplate(r2: string): Promise<THREE.Object3D | null> {
  let hit = harvestSrc.get(r2);
  if (!hit) {
    hit = getProductionGltfLoader()
      .loadAsync(natureCdnUrl(r2))
      .then((g) => g.scene)
      .catch(() => null);
    harvestSrc.set(r2, hit);
  }
  return hit;
}

function harvestStub(kind: string): THREE.Mesh {
  return new THREE.Mesh(
    kind === 'wood'
      ? new THREE.ConeGeometry(0.6, 2.4, 6)
      : new THREE.DodecahedronGeometry(0.5),
    new THREE.MeshStandardMaterial({
      color: kind === 'wood' ? 0x2f6b32 : 0x8a8680,
      roughness: 0.88,
    })
  );
}

async function stampHarvest(parent: THREE.Object3D, def: WorldIslandDef) {
  if (def.islandClass !== 'main' && def.islandClass !== 'medium') return;
  const kit = kitForSector(def.sectorId);
  const jobs: { r2?: string; kind: 'wood' | 'stone'; x: number; h: number }[] =
    [
      { r2: kit.trees[0], kind: 'wood', x: -4, h: 6 },
      { r2: kit.rocks[0], kind: 'stone', x: 4, h: 1.6 },
    ];
  for (const job of jobs) {
    const src = job.r2 ? await harvestTemplate(job.r2) : null;
    const node = src ? src.clone(true) : harvestStub(job.kind);
    node.name = `${def.id}-${job.kind}`;
    node.userData.harvestKind = job.kind;
    node.userData.r2Key = job.r2;
    node.userData.siHeightM = job.h;
    stampContentLayer(node, 'harvestable', {
      harvestKind: job.kind,
      siHeightM: job.h,
    });
    placeAssetSi(
      node,
      'mesh',
      new THREE.Vector3(job.x, def.elevation + 0.2, 0)
    );
    parent.add(node);
  }
}

function animalRow(key: string) {
  return (
    WARLORDS_COTW_ANIMALS.find((r) => r.key === key) ||
    WARLORDS_ANIMALS.find((r) => r.key === key) ||
    null
  );
}

async function stampWildlife(parent: THREE.Object3D, def: WorldIslandDef) {
  if (def.islandClass !== 'main') return;
  const kit = kitForSector(def.sectorId);
  const key = kit.wildlife[0];
  const row = key ? animalRow(key) : null;
  if (!row?.filePath) return;
  try {
    const gltf = await getProductionGltfLoader().loadAsync(row.filePath);
    const node = gltf.scene.clone(true);
    node.name = row.name;
    node.userData.harvestKind = row.harvestKind;
    node.userData.harvestDrops = row.harvestDrops;
    node.userData.animalRole = row.animalRole;
    node.userData.air = row.air;
    node.userData.siHeightM = row.siHeightM;
    node.userData.r2Key = row.r2Key;
    node.userData.hp = row.animalRole === 'predator' ? 90 : 35;
    stampContentLayer(node, row.contentLayer || 'animal', {
      harvestKind: row.harvestKind,
      siHeightM: row.siHeightM,
    });
    const y = (def.elevation || 2) + (row.air ? 4 : 0.2);
    placeAssetSi(node, 'mesh', new THREE.Vector3(6, y, 3));
    parent.add(node);
  } catch {
    /* CDN not uploaded yet — skip */
  }
}

async function tryLoadModel(
  def: WorldIslandDef
): Promise<THREE.Object3D | null> {
  if (!def.model) return null;
  try {
    const url = def.model.startsWith('http')
      ? def.model
      : `${ASSETS_CDN}/${def.model}`;
    const gltf = await getProductionGltfLoader().loadAsync(url);
    return gltf.scene;
  } catch {
    return null;
  }
}

export function disposeWorldIslands(scene: THREE.Scene) {
  const old = scene.getObjectByName(ISLANDS_ROOT);
  if (!old) return;
  old.removeFromParent();
  old.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    m.geometry?.dispose();
    const mats = Array.isArray(m.material) ? m.material : [m.material];
    mats.forEach((mat) => mat.dispose());
  });
}

export async function spawnWorldIslands(
  scene: THREE.Scene,
  onProgress?: (pct: number, msg: string) => void
): Promise<THREE.Group> {
  disposeWorldIslands(scene);
  const root = new THREE.Group();
  root.name = ISLANDS_ROOT;
  root.userData.isTransformControls = true;
  const ids = SEAFLOOR_GRID.flat();
  let n = 0;
  for (const sectorId of ids) {
    const list = allIslandsForSector(sectorId);
    onProgress?.(10 + (n / ids.length) * 80, `islands ${sectorId}`);
    for (const def of list) {
      const loaded = await tryLoadModel(def);
      const body = loaded || islandMesh(def);
      const wrap = new THREE.Group();
      wrap.name = def.name;
      wrap.add(body);
      const wz = localToWorld(sectorId, def.localPos[0], def.localPos[1]);
      wrap.position.set(wz.x, 0, wz.z);
      weldIslandToSeafloor(wrap);
      tagTerrain(wrap, {
        terrainId: def.id,
        sectorId,
        kind: 'island',
        islandKind: def.islandKind,
      });
      wrap.userData.islandDef = def;
      wrap.userData.siHeightM = def.elevation + 10;
      applyTerrainLook(wrap, lookFromBiome(def.biome), {
        terrainId: def.id,
        sectorId,
        kind: 'island',
      });
      await stampHarvest(wrap, def);
      await stampWildlife(wrap, def);
      root.add(wrap);
    }
    n++;
  }
  scene.add(root);
  onProgress?.(100, `islands ${root.children.length}`);
  return root;
}

function islandMeshes(isle: THREE.Object3D): THREE.Mesh[] {
  let list = isle.userData._lodMeshes as THREE.Mesh[] | undefined;
  if (!list) {
    list = [];
    isle.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) list!.push(m);
    });
    isle.userData._lodMeshes = list;
  }
  return list;
}

/** Spec LOD: hide island geometry beyond 100 m. Horizon 50–100 is a blip only. */
export function tickWorldIslands(scene: THREE.Scene, camera: THREE.Camera) {
  const root = scene.getObjectByName(ISLANDS_ROOT);
  if (!root) return;
  const cam = camera.position;
  const culled = WORLD_STACK.lodCulledM;
  const horizon = WORLD_STACK.lodHorizonM;
  for (const isle of root.children) {
    const d = Math.hypot(isle.position.x - cam.x, isle.position.z - cam.z);
    const show = d <= culled;
    if (isle.visible !== show) isle.visible = show;
    const shadow = d < horizon;
    if (isle.userData._lodShadow === shadow) continue;
    isle.userData._lodShadow = shadow;
    for (const m of islandMeshes(isle)) m.castShadow = shadow;
  }
}
