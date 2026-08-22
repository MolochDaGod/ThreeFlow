/**
 * Warlords entity prefab stamps — metadata + default scripts.
 * Mesh must already be a unique CDN GLB. Never drop fused race/survival packs.
 */
import * as THREE from 'three';
import { stampMmoCombat } from './mmoCombatRuntime';
import { stampCollider } from './systemsRuntime';
import { inferContentLayer, stampContentLayer } from './contentLayers';

export type PrefabKind = 'unit' | 'structure' | 'vehicle' | 'siege' | 'mount';

export interface PrefabStamp {
  prefabId: string;
  prefabKind: PrefabKind;
  siHeightM?: number;
  placeable?: boolean;
  skillId?: string;
}

export function stampWarlordsPrefab(obj: THREE.Object3D, stamp: PrefabStamp) {
  obj.userData.prefabId = stamp.prefabId;
  obj.userData.prefabKind = stamp.prefabKind;
  obj.userData.warlordsPrefab = stamp;
  if (stamp.siHeightM) obj.userData.siHeightM = stamp.siHeightM;

  if (stamp.prefabKind === 'unit' || stamp.prefabKind === 'mount') {
    const worker = /worker|lumber|gather|harvest|miner/i.test(
      `${obj.name} ${stamp.prefabId}`
    );
    obj.userData.behavior =
      obj.userData.behavior || (worker ? 'auto_harvest' : 'patrol');
    obj.userData.aiBrain =
      obj.userData.aiBrain || (worker ? 'auto_harvest' : 'patrol');
    stampMmoCombat(obj, {
      skillId: stamp.skillId || 'basic_swing',
      telegraph: 'cone',
      range: stamp.prefabKind === 'mount' ? 4 : 6,
    });
    stampCollider(obj, 'NPC', 'kinematicPosition', 'capsule');
    stampContentLayer(
      obj,
      inferContentLayer({
        name: obj.name,
        prefabKind: stamp.prefabKind,
        player: obj.userData.player === true,
      })
    );
    return;
  }
  if (stamp.prefabKind === 'siege') {
    obj.userData.behavior = 'idle';
    stampCollider(obj, 'Item', 'fixed', 'cuboid');
    stampContentLayer(obj, 'item');
    return;
  }
  if (stamp.prefabKind === 'vehicle') {
    stampCollider(obj, 'Default', 'kinematicPosition', 'cuboid');
    stampContentLayer(
      obj,
      inferContentLayer({ name: obj.name, prefabKind: 'vehicle' })
    );
    return;
  }
  stampCollider(obj, 'Terrain', 'fixed', 'cuboid');
  stampContentLayer(
    obj,
    inferContentLayer({ name: obj.name, prefabKind: stamp.prefabKind })
  );
}

export function slugPrefabId(id: string): string {
  return id
    .replace(/^entities\//i, '')
    .replace(/^ummorpg-placeable\//i, '')
    .replace(/^ummorpg-/i, '')
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
}
