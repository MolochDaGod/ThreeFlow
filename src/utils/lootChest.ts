/**
 * Worker carry drop — detach Xtra_bag / Xtra_wood, fall to terrain as pickable.
 * Holds the gathered harvest qty. Player pickup → bag (100 / stack 10), never Xtra mesh.
 */
import * as THREE from 'three';
import { peekPlayQuery } from './contentLayers';
import { findVisibleCarryMesh, hideCarryVisuals, isCarryMesh } from './raceKit';
import {
  addHarvestLoot,
  type HarvestKind,
  HARVEST_DEFS,
} from '@/config/harvestBag';

export type LootKind = HarvestKind;

const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();

export function spawnLootFromCarryMesh(
  scene: THREE.Scene,
  source: THREE.Mesh,
  kind: HarvestKind,
  qty: number
): THREE.Object3D {
  const at = new THREE.Vector3();
  source.updateWorldMatrix(true, false);
  source.getWorldPosition(at);
  source.getWorldQuaternion(_q);
  source.getWorldScale(_s);
  const dropped = new THREE.Mesh(
    source.geometry.clone(),
    cloneMat(source.material)
  );
  dropped.name = `Dropped ${HARVEST_DEFS[kind]?.name || kind} ×${qty}`;
  dropped.position.copy(at);
  dropped.quaternion.copy(_q);
  dropped.scale.copy(_s);
  dropped.castShadow = true;
  dropped.visible = true;
  dropped.userData.isTransformControls = true;
  dropped.userData.lootable = true;
  dropped.userData.lootKind = kind;
  dropped.userData.lootQty = qty;
  dropped.userData.lootId = HARVEST_DEFS[kind]?.id;
  dropped.userData.harvestProfession = HARVEST_DEFS[kind]?.harvest;
  dropped.userData.craftProfession = HARVEST_DEFS[kind]?.craft;
  dropped.userData.fallVel = 0;
  dropped.userData.physLayer = 'Item';
  dropped.userData.contentLayer = 'item';
  dropped.userData.surface = 'Walk';
  scene.add(dropped);
  source.visible = false;
  return dropped;
}

function cloneMat(mat: THREE.Material | THREE.Material[]) {
  const one = Array.isArray(mat) ? mat[0] : mat;
  return one?.clone?.() || new THREE.MeshStandardMaterial({ color: 0x8a5a2b });
}

export function lootKindFromEnemy(obj: THREE.Object3D): HarvestKind {
  const job = obj.userData.harvestJob as { kind?: HarvestKind } | undefined;
  if (job?.kind) return job.kind;
  if (obj.userData.carryWood) return 'wood';
  if (obj.userData.carryBag) return 'ore';
  return 'wood';
}

/** Detach worker Xtra_bag / Xtra_wood → world item with gathered qty. */
export function dropEnemyLoot(
  scene: THREE.Scene,
  obj: THREE.Object3D
): THREE.Object3D | null {
  if (obj.userData.player) return null;
  if (obj.userData.lootDropped) return null;
  if (!obj.userData.worker && !obj.userData.carryMode) return null;
  const job = obj.userData.harvestJob as
    { count?: number; kind?: HarvestKind } | undefined;
  const qty = Math.max(0, Number(job?.count) || 0);
  if (qty <= 0 && !obj.userData.carryMode) return null;
  const kind = lootKindFromEnemy(obj);
  const mesh = findVisibleCarryMesh(obj);
  obj.userData.lootDropped = true;
  if (job) {
    job.count = 0;
    (job as { phase: string }).phase = 'combat';
  }
  let dropped: THREE.Object3D | null = null;
  if (mesh) {
    dropped = spawnLootFromCarryMesh(scene, mesh, kind, Math.max(1, qty));
  }
  hideCarryVisuals(obj);
  return dropped;
}

export function tickLootFall(scene: THREE.Scene, dt: number) {
  const g = 9.81;
  const q = peekPlayQuery();
  const list =
    q && q.scene === scene
      ? q.loot
      : (() => {
          const out: THREE.Object3D[] = [];
          scene.traverse((o) => {
            if (o.userData?.lootable && o.userData.fallVel !== undefined)
              out.push(o);
          });
          return out;
        })();
  for (const o of list) {
    if (!o.userData?.lootable || o.userData.fallVel === undefined) continue;
    if (o.userData.fallen) continue;
    o.userData.fallVel += g * dt;
    o.position.y -= o.userData.fallVel * dt;
    if (o.position.y <= 0.08) {
      o.position.y = 0.08;
      o.userData.fallen = true;
      o.userData.fallVel = 0;
    }
  }
}

export function animalDrops(obj: THREE.Object3D): HarvestKind[] {
  const extra = obj.userData?.harvestDrops;
  if (Array.isArray(extra) && extra.length) {
    return extra.filter(
      (k): k is HarvestKind =>
        typeof k === 'string' && Boolean(HARVEST_DEFS[k as HarvestKind])
    );
  }
  const one = obj.userData?.harvestKind as HarvestKind | undefined;
  return one && HARVEST_DEFS[one] ? [one] : ['hide'];
}

/** Kill → carcass. Body stays. Click harvests meat / leather / bone. */
export function markAnimalCarcass(obj: THREE.Object3D) {
  obj.userData.carcass = true;
  obj.userData.lootable = true;
  obj.userData.hp = 0;
  obj.userData.harvestDrops = animalDrops(obj);
  obj.visible = true;
}

export function tryPickupLoot(obj: THREE.Object3D): {
  ok: boolean;
  kind?: HarvestKind;
  qty?: number;
  message?: string;
} {
  if (!obj.userData?.lootable) return { ok: false };
  if (obj.userData.carcass) {
    const drops = animalDrops(obj);
    const names: string[] = [];
    for (const kind of drops) {
      const r = addHarvestLoot(kind, 1);
      if (!r.ok) {
        return {
          ok: false,
          kind,
          qty: 1,
          message: `Bag full — harvested ${names.join(', ') || 'nothing yet'}`,
        };
      }
      names.push(HARVEST_DEFS[kind].name);
    }
    obj.userData.lootable = false;
    obj.visible = false;
    return {
      ok: true,
      kind: drops[0],
      qty: drops.length,
      message: `Skinned ${obj.name}: ${names.join(', ')} → bag`,
    };
  }
  const kind = (obj.userData.lootKind as HarvestKind) || 'wood';
  const qty = Number(obj.userData.lootQty) || 1;
  const r = addHarvestLoot(kind, qty);
  obj.parent?.remove(obj);
  if (!r.ok) {
    return {
      ok: false,
      kind,
      qty,
      message: `Bag full (100 slots · stack ${qty} ${r.name || kind})`,
    };
  }
  return {
    ok: true,
    kind,
    qty,
    message: `+${qty} ${r.name} → bag (stack 10 · 100 slots)`,
  };
}

export function findClickableRoot(hit: THREE.Object3D): THREE.Object3D {
  let p: THREE.Object3D | null = hit;
  while (p) {
    if (
      p.userData?.lootable ||
      p.userData?.carcass ||
      p.userData?.enemyCampMember ||
      p.userData?.enemyCamp ||
      isCarryMesh(p.name)
    )
      return p;
    p = p.parent;
  }
  return hit;
}
