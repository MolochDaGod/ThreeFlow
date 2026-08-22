/**
 * Open-world seafloor — L0 Seabed of THREE_LAYER_TERRAIN.
 * 9 Warlords sector DS2 meshes tiled 3×3 (warlords-zones.json).
 * Y-fit to WORLD_STACK (−100…−10). Heightfield Walk. Not a second terrain generator.
 * Visual water is L1 WaterFloor in worldAtmosphere — do not spawn a ground plane here.
 */
import * as THREE from 'three';
import { WORLD_STACK } from '@/config/fleetSystems';
import {
  SEAFLOOR_GRID,
  cdnUrlForTarget,
  findHdTarget,
} from '@/config/hdTerrainDeploy';
import { getProductionGltfLoader } from '@/utils/gltfProdLoader';
import { stampContentLayer } from '@/utils/contentLayers';
import { fitSeafloorTile, tagTerrain } from '@/utils/terrainGround';
import { applyTerrainLook } from '@/utils/terrainLook';

export const SEAFLOOR_ROOT = '__seafloorGrid';

/** Stretch the 420 m DS2 bake across the 10 km zone cell. Y already fit. */
function scaleSeafloorXZ(root: THREE.Object3D, tileM: number) {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  if (box.isEmpty()) return;
  const sx = tileM / Math.max(box.max.x - box.min.x, 1);
  const sz = tileM / Math.max(box.max.z - box.min.z, 1);
  const cx = (box.min.x + box.max.x) * 0.5;
  const cz = (box.min.z + box.max.z) * 0.5;
  root.scale.x *= sx;
  root.scale.z *= sz;
  root.updateMatrixWorld(true);
  const after = new THREE.Box3().setFromObject(root);
  const acx = (after.min.x + after.max.x) * 0.5;
  const acz = (after.min.z + after.max.z) * 0.5;
  root.position.x += cx - acx;
  root.position.z += cz - acz;
  root.updateMatrixWorld(true);
}

export function disposeSeafloorGrid(scene: THREE.Scene) {
  const old = scene.getObjectByName(SEAFLOOR_ROOT);
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

export async function spawnSeafloorGrid(
  scene: THREE.Scene,
  onProgress?: (pct: number, msg: string) => void
): Promise<THREE.Group> {
  disposeSeafloorGrid(scene);
  const root = new THREE.Group();
  root.name = SEAFLOOR_ROOT;
  root.userData.isTransformControls = true;
  const loader = getProductionGltfLoader();
  const tile = WORLD_STACK.sectorTileM;
  const rows = SEAFLOOR_GRID.length;
  const cols = SEAFLOOR_GRID[0].length;
  const total = rows * cols;
  let n = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const id = SEAFLOOR_GRID[row][col];
      const target = findHdTarget(id);
      n++;
      onProgress?.((n / total) * 90, `seafloor ${id}`);
      if (!target) continue;
      const gltf = await loader.loadAsync(cdnUrlForTarget(target));
      const tileRoot = gltf.scene;
      tileRoot.name = `seafloor-${id}`;
      tileRoot.position.set(
        (col - (cols - 1) / 2) * tile,
        0,
        (row - (rows - 1) / 2) * tile
      );
      root.add(tileRoot);
      tileRoot.updateMatrixWorld(true);
      fitSeafloorTile(tileRoot);
      scaleSeafloorXZ(tileRoot, tile);
      applyTerrainLook(tileRoot, 'seafloor', {
        terrainId: `seafloor-${id}`,
        sectorId: id,
        kind: 'seafloor',
      });
    }
  }
  tagTerrain(root, { terrainId: 'seafloor-grid', kind: 'seafloor' });
  stampContentLayer(root, 'seafloor', {
    siHeightM: WORLD_STACK.islandWeldY - WORLD_STACK.seafloorY,
  });
  scene.add(root);
  onProgress?.(100, 'seafloor ready');
  return root;
}

export function seafloorCoverM() {
  return WORLD_STACK.sectorTileM * WORLD_STACK.grid;
}
