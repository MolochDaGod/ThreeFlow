/**
 * Warlords entity prefab stamps — metadata + default scripts.
 * Mesh must already be a unique CDN GLB. Never drop fused race/survival packs.
 */
import * as THREE from 'three';
import { stampMmoCombat } from './mmoCombatRuntime';
import { stampCollider } from './systemsRuntime';

export type PrefabKind =
  | 'unit'
  | 'structure'
  | 'vehicle'
  | 'siege'
  | 'mount';

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
    obj.userData.behavior = obj.userData.behavior || 'patrol';
    obj.userData.aiBrain = obj.userData.aiBrain || 'patrol';
    stampMmoCombat(obj, {
      skillId: stamp.skillId || 'basic_swing',
      telegraph: 'cone',
      range: stamp.prefabKind === 'mount' ? 4 : 6,
    });
    stampCollider(obj, 'NPC', 'kinematicPosition', 'capsule');
    return;
  }
  if (stamp.prefabKind === 'siege') {
    obj.userData.behavior = 'idle';
    stampCollider(obj, 'Item', 'fixed', 'cuboid');
    return;
  }
  if (stamp.prefabKind === 'vehicle') {
    stampCollider(obj, 'Default', 'kinematicPosition', 'cuboid');
    return;
  }
  stampCollider(obj, 'Terrain', 'fixed', 'cuboid');
}

export function slugPrefabId(id: string): string {
  return id
    .replace(/^entities\//i, '')
    .replace(/^ummorpg-placeable\//i, '')
    .replace(/^ummorpg-/i, '')
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
}
