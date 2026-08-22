/**
 * Enemy camp prefab — 1 cabin + 4 Warlords units (1 lookout, 3 auto-harvest).
 * Uses existing entity GLBs, harvest carry law, and MMO aggro stamps.
 */
import * as THREE from 'three';
import { getProductionGltfLoader } from './gltfProdLoader';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { WARLORDS_CDN } from '@/config/warlordsCatalog';
import { stampWarlordsPrefab } from './prefabStamp';
import { stampMmoCombat } from './mmoCombatRuntime';
import {
  hideCarryVisuals,
  bootstrapWorkerKit,
  raceIdFromName,
} from './raceKit';
import { stampAutoHarvest } from './npcHarvest';
import { peekPlayQuery, stampContentLayer } from './contentLayers';
import { dropEnemyLoot, tryPickupLoot, findClickableRoot } from './lootChest';
import { placeAssetSi, raceHeightM } from './siPlace';
import type { HarvestKind } from '@/config/harvestBag';

export const ENEMY_CAMP_KEY = 'enemy-camp';
export const ENEMY_CAMP_SCHEME = 'prefab://enemy-camp';

const ENT = `${WARLORDS_CDN}/models/warlords/entities`;
const TOON = `${WARLORDS_CDN}/asset-packs/toon-rts-characters/glb/characters`;

const CABIN = `${ENT}/barbarian_cabin.glb`;

const UNITS: {
  role: 'lookout' | HarvestKind;
  url: string;
  name: string;
  offset: THREE.Vector3;
}[] = [
  {
    role: 'lookout',
    url: `${ENT}/orc_archer.glb`,
    name: 'Lookout · orc archer',
    offset: new THREE.Vector3(0, 0, 5.2),
  },
  {
    role: 'wood',
    url: `${TOON}/orc.glb`,
    name: 'Worker · orc lumber',
    offset: new THREE.Vector3(4.2, 0, 1.4),
  },
  {
    role: 'ore',
    url: `${TOON}/barbarian.glb`,
    name: 'Worker · barb miner',
    offset: new THREE.Vector3(-4.2, 0, 1.4),
  },
  {
    role: 'herb',
    url: `${TOON}/human.glb`,
    name: 'Worker · human gather',
    offset: new THREE.Vector3(2.4, 0, -3.6),
  },
];

function loader() {
  return getProductionGltfLoader();
}

async function loadGlb(url: string): Promise<THREE.Object3D> {
  const gltf = await loader().loadAsync(url);
  return clone(gltf.scene);
}

function addHarvestNode(
  parent: THREE.Group,
  name: string,
  pos: THREE.Vector3,
  kind: HarvestKind
) {
  const color: Record<HarvestKind, number> = {
    wood: 0x2f6b32,
    stone: 0x8a8680,
    ore: 0x6b5a3a,
    scrap: 0x5a5e62,
    herb: 0x4a8a3a,
    hide: 0x8a6038,
    fish: 0x3a6a8a,
    gold: 0xd4af37,
    meat: 0xa83a3a,
    bone: 0xd8d0c0,
  };
  const tall = kind === 'wood' || kind === 'herb';
  const mesh = new THREE.Mesh(
    tall
      ? new THREE.ConeGeometry(0.55, kind === 'wood' ? 2.4 : 1.1, 7)
      : new THREE.DodecahedronGeometry(0.48),
    new THREE.MeshStandardMaterial({ color: color[kind], roughness: 0.88 })
  );
  mesh.name = name;
  mesh.position.copy(pos);
  mesh.position.y = tall ? (kind === 'wood' ? 1.2 : 0.6) : 0.35;
  mesh.castShadow = true;
  mesh.userData.isTransformControls = true;
  mesh.userData.harvestKind = kind;
  stampContentLayer(mesh, 'harvestable', {
    harvestKind: kind,
    siHeightM: tall ? 2.4 : 0.8,
  });
  parent.add(mesh);
}

export async function spawnEnemyCamp(
  scene: THREE.Scene,
  origin: THREE.Vector3
): Promise<THREE.Group> {
  const campId = `camp-${Math.random().toString(36).slice(2, 8)}`;
  const root = new THREE.Group();
  root.name = 'Enemy camp';
  root.position.copy(origin);
  root.userData.isTransformControls = true;
  root.userData.enemyCamp = { id: campId };
  root.userData.prefabId = 'PFAB-ENT-ENEMY-CAMP';
  root.userData.prefabKind = 'structure';

  const cabin = await loadGlb(CABIN);
  cabin.name = 'Enemy cabin';
  cabin.userData.isTransformControls = true;
  cabin.userData.prefabKind = 'structure';
  cabin.userData.enemyCamp = { id: campId };
  cabin.userData.siHeightM = 4;
  placeAssetSi(cabin, 'mesh', new THREE.Vector3(0, 0, 0));
  stampWarlordsPrefab(cabin, {
    prefabId: 'barbarian_cabin',
    prefabKind: 'structure',
    siHeightM: 4,
  });
  root.add(cabin);

  addHarvestNode(root, 'lumber_tree_a', new THREE.Vector3(8.5, 0, 3.2), 'wood');
  addHarvestNode(
    root,
    'lumber_tree_b',
    new THREE.Vector3(-8.2, 0, 4.0),
    'wood'
  );
  addHarvestNode(root, 'ore_rock_a', new THREE.Vector3(6.4, 0, -6.2), 'ore');
  addHarvestNode(
    root,
    'stone_boulder_a',
    new THREE.Vector3(-5.8, 0, -5.4),
    'stone'
  );
  addHarvestNode(
    root,
    'scrap_wreck_a',
    new THREE.Vector3(9.2, 0, -2.0),
    'scrap'
  );
  addHarvestNode(
    root,
    'herb_flower_a',
    new THREE.Vector3(-7.4, 0, 1.2),
    'herb'
  );
  addHarvestNode(
    root,
    'hide_carcass_a',
    new THREE.Vector3(1.2, 0, -8.0),
    'hide'
  );
  addHarvestNode(root, 'fish_shore_a', new THREE.Vector3(-1.5, 0, 8.4), 'fish');

  const members: THREE.Object3D[] = [];
  for (const spec of UNITS) {
    const unit = await loadGlb(spec.url);
    unit.name = spec.name;
    unit.position.copy(spec.offset);
    unit.userData.isTransformControls = true;
    unit.userData.enemyCampMember = true;
    unit.userData.enemyCampId = campId;
    unit.userData.campRole = spec.role;
    unit.userData.siHeightM = raceHeightM(spec.name);
    placeAssetSi(unit, 'unit', spec.offset.clone());
    unit.position.copy(spec.offset);
    if (spec.role === 'lookout') {
      hideCarryVisuals(unit);
      unit.userData.behavior = 'lookout';
      unit.userData.aiBrain = 'patrol';
    } else {
      bootstrapWorkerKit(unit, raceIdFromName(spec.name, spec.url));
      hideCarryVisuals(unit);
      stampAutoHarvest(unit, spec.role);
      const camp = new THREE.Vector3();
      cabin.getWorldPosition(camp);
      if (unit.userData.harvestJob) unit.userData.harvestJob.camp = camp;
    }
    stampWarlordsPrefab(unit, {
      prefabId: spec.role,
      prefabKind: 'unit',
      siHeightM: raceHeightM(spec.name),
    });
    stampContentLayer(unit, spec.role === 'lookout' ? 'monster' : 'npc', {
      siHeightM: raceHeightM(spec.name),
    });
    stampMmoCombat(unit, {
      aggroRadius: spec.role === 'lookout' ? 18 : 12,
      detectionRadius: spec.role === 'lookout' ? 28 : 18,
      leashRadius: 40,
    });
    root.add(unit);
    members.push(unit);
  }

  root.userData.enemyCamp.memberUuids = members.map((m) => m.uuid);
  scene.add(root);
  root.updateMatrixWorld(true);
  return root;
}

export function alertEnemyCamp(scene: THREE.Scene, member: THREE.Object3D) {
  const campId = member.userData.enemyCampId || member.userData.enemyCamp?.id;
  if (!campId) {
    dropEnemyLoot(scene, member);
    member.userData.behavior = 'pursue';
    member.userData.aiBrain = 'pursue';
    return;
  }
  scene.traverse((o) => {
    if (
      o.userData.enemyCampId !== campId &&
      o.userData.enemyCamp?.id !== campId
    )
      return;
    if (!o.userData.enemyCampMember) return;
    if (!o.userData.lootDropped) dropEnemyLoot(scene, o);
    o.userData.behavior = 'pursue';
    o.userData.aiBrain = 'pursue';
    if (o.userData.harvestJob) o.userData.harvestJob.phase = 'combat';
    hideCarryVisuals(o);
  });
}

const _lookHere = new THREE.Vector3();
const _lookThere = new THREE.Vector3();

export function tickLookouts(scene: THREE.Scene, dt: number) {
  const q = peekPlayQuery();
  const threats =
    q && q.scene === scene
      ? q.friendlies.filter((o) => o.parent)
      : (() => {
          const out: THREE.Object3D[] = [];
          scene.traverse((o) => {
            if (o.userData.raceKit && !o.userData.enemyCampMember) out.push(o);
            if (o.userData.prefabKind === 'unit' && !o.userData.enemyCampMember)
              out.push(o);
          });
          return out;
        })();
  if (!threats.length) return;
  const lookouts =
    q && q.scene === scene
      ? q.lookouts
      : (() => {
          const out: THREE.Object3D[] = [];
          scene.traverse((o) => {
            if (o.userData.campRole === 'lookout') out.push(o);
          });
          return out;
        })();
  for (const lookout of lookouts) {
    if (lookout.userData.aiBrain === 'pursue') continue;
    lookout.getWorldPosition(_lookHere);
    lookout.rotation.y += dt * 0.35;
    for (const t of threats) {
      t.getWorldPosition(_lookThere);
      if (
        _lookHere.distanceTo(_lookThere) <= (lookout.userData.aggroRadius || 18)
      ) {
        alertEnemyCamp(scene, lookout);
        break;
      }
    }
  }
}

export function handleCampClick(
  scene: THREE.Scene,
  hit: THREE.Object3D
): { kind: 'loot' | 'aggro' | 'none'; message?: string } {
  const root = findClickableRoot(hit);
  if (root.userData.lootable) {
    const r = tryPickupLoot(root);
    if (r.message) {
      return { kind: r.ok ? 'loot' : 'none', message: r.message };
    }
  }
  if (root.userData.enemyCampMember) {
    alertEnemyCamp(scene, root);
    return { kind: 'aggro', message: 'Camp aggro — loot dropped' };
  }
  return { kind: 'none' };
}
