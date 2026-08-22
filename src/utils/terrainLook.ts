/**
 * Terrain three-system: look + nav + collider on the existing mesh.
 * Looks: seafloor · mountain · tropical. Not harvestables.
 * GrassField rule — rewire materials on the real GLB, do not spawn a new ground.
 */
import * as THREE from 'three';
import { THREE_LAYER_TERRAIN, type TerrainLookId } from '@/config/fleetSystems';
import { stampContentLayer } from './contentLayers';
import { tagTerrain, type TerrainKind } from './terrainGround';
import { bindGrassField } from './grassField';

export function isHarvestNode(o: THREE.Object3D): boolean {
  const layer = String(o.userData?.contentLayer || '');
  if (o.userData?.harvestKind) return true;
  return layer === 'harvestable' || layer === 'item';
}

export function lookFromBiome(biome: string | undefined): TerrainLookId {
  const b = String(biome || '').toLowerCase();
  if (/abyssal|seafloor|seabed|ocean|void/.test(b)) return 'seafloor';
  if (/frost|frozen|volcan|ashen|ember|desert|crag|mountain|ice/.test(b))
    return 'mountain';
  if (/ethereal|forest|storm|nexus|tropical|jungle|pirate/.test(b))
    return 'tropical';
  return 'tropical';
}

export function lookFromHdPreset(preset: string | undefined): TerrainLookId {
  if (preset === 'mountains' || preset === 'crags') return 'mountain';
  return 'tropical';
}

export function applyTerrainLook(
  root: THREE.Object3D,
  look: TerrainLookId,
  extra?: { terrainId?: string; sectorId?: string; kind?: TerrainKind }
) {
  const def = THREE_LAYER_TERRAIN.looks[look];
  const tint = new THREE.Color(def.tint);
  root.traverse((o) => {
    if (isHarvestNode(o)) return;
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const mats = Array.isArray(m.material) ? m.material : [m.material];
    for (const mat of mats) {
      const std = mat as THREE.MeshStandardMaterial;
      if (!std || !('color' in std) || !std.color) continue;
      if (!std.userData) std.userData = {};
      if (std.map) {
        if (!std.userData.lookBase) std.userData.lookBase = std.color.getHex();
        std.color.setHex(std.userData.lookBase);
        std.color.multiply(tint);
      } else {
        std.color.setHex(def.tint);
      }
      if ('roughness' in std) std.roughness = def.roughness;
      std.needsUpdate = true;
    }
  });
  delete root.userData.harvestKind;
  stampContentLayer(root, def.contentLayer, {
    siHeightM: root.userData.siHeightM || undefined,
  });
  root.userData.terrainLook = look;
  root.userData.physLayer = def.phys;
  root.userData.physBody = 'fixed';
  root.userData.physShape = def.shape;
  root.userData.physSensor = false;
  root.userData.surface = def.surface;
  tagTerrain(root, {
    terrainId:
      extra?.terrainId || String(root.userData.terrainId || root.name || look),
    sectorId: extra?.sectorId || root.userData.sectorId,
    kind: extra?.kind || (look === 'seafloor' ? 'seafloor' : 'hd'),
  });
  bindGrassField(root, look);
}
