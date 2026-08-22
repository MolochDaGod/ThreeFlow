/**
 * NPC worker auto-harvest — Xtra_bag / Xtra_wood only on workers while carrying.
 * Gather to 10, return to camp. Player never uses these meshes.
 */
import * as THREE from 'three';
import { GAMES_AI_DISTANCES } from '@/config/gamesAi';
import { peekPlayQuery } from './contentLayers';
import { hideCarryVisuals, setCarryVisuals } from './raceKit';
import {
  type HarvestKind,
  carryVisualFor,
  HARVEST_STACK_MAX,
} from '@/config/harvestBag';

export const HARVEST_RETURN_COUNT = HARVEST_STACK_MAX;

type HarvestPhase = 'seek' | 'gather' | 'return' | 'combat';

export type HarvestJob = {
  kind: HarvestKind;
  count: number;
  phase: HarvestPhase;
  camp: THREE.Vector3;
  gatherAcc: number;
};

const NODE_RE: Record<HarvestKind, RegExp> = {
  wood: /tree|pine|oak|lumber|log|timber|wood(?!land)/i,
  stone: /stone|boulder|gravel(?!road)/i,
  ore: /ore|mineral|vein|crystal/i,
  scrap: /scrap|wreck|junk|debris|ruin/i,
  herb: /flower|herb|plant|bloom|mushroom/i,
  hide: /hide|carcass|skin|pelt|beast|deer|raccoon|mink|beaver|buffalo|lynx|lion/i,
  fish: /fish|shore|dock|pond|river/i,
  gold: /gold|coin|nugget/i,
  meat: /meat|flesh|carcass|mallard|deer|buffalo|lion|alligator/i,
  bone: /bone|skull|skeleton|carcass/i,
};

const CAMP_RE = /camp|cabin|house|armory|hall|town|depot|storage|tent/i;

function jobOf(obj: THREE.Object3D): HarvestJob | null {
  return (obj.userData.harvestJob as HarvestJob) || null;
}

export function isAutoHarvestNpc(obj: THREE.Object3D): boolean {
  if (obj.userData.player === true || obj.userData.campRole === 'lookout')
    return false;
  const brain = String(obj.userData.aiBrain || obj.userData.behavior || '');
  if (brain === 'auto_harvest' || brain === 'harvest') return true;
  const name = `${obj.name} ${obj.userData.prefabId || ''}`.toLowerCase();
  return /worker|lumber|gather|harvest|miner|skinner|fisher|herbal|scaveng/.test(
    name
  );
}

export function stampAutoHarvest(obj: THREE.Object3D, kind?: HarvestKind) {
  obj.userData.behavior = 'auto_harvest';
  obj.userData.aiBrain = 'auto_harvest';
  obj.userData.worker = true;
  const camp = new THREE.Vector3();
  obj.getWorldPosition(camp);
  obj.userData.harvestJob = {
    kind: kind || inferKind(obj),
    count: 0,
    phase: 'seek',
    camp: camp.clone(),
    gatherAcc: 0,
  } satisfies HarvestJob;
  hideCarryVisuals(obj);
}

function inferKind(obj: THREE.Object3D): HarvestKind {
  const s = `${obj.name} ${obj.userData.prefabId || ''}`.toLowerCase();
  if (/fish/.test(s)) return 'fish';
  if (/herb|flower/.test(s)) return 'herb';
  if (/skin|hide|pelt/.test(s)) return 'hide';
  if (/scrap|junk/.test(s)) return 'scrap';
  if (/miner|ore|gold/.test(s)) return 'ore';
  if (/stone|quarry/.test(s)) return 'stone';
  return 'wood';
}

function isHarvestNode(obj: THREE.Object3D, kind: HarvestKind): boolean {
  if (obj.userData?.isTerrain) return false;
  if (obj.userData?.raceKit || obj.userData?.prefabKind === 'unit')
    return false;
  if (obj.userData?.lootable) return false;
  const s =
    `${obj.name} ${obj.userData.prefabId || obj.userData.harvestKind || ''}`.toLowerCase();
  return NODE_RE[kind]?.test(s) || obj.userData.harvestKind === kind;
}

function isCamp(obj: THREE.Object3D): boolean {
  if (obj.userData?.prefabKind === 'structure') return true;
  const s = `${obj.name} ${obj.userData.prefabId || ''}`.toLowerCase();
  return CAMP_RE.test(s);
}

const _nearP = new THREE.Vector3();

function nearest(
  scene: THREE.Scene,
  from: THREE.Vector3,
  test: (o: THREE.Object3D) => boolean
): THREE.Object3D | null {
  let best: THREE.Object3D | null = null;
  let bestD = Infinity;
  const q = peekPlayQuery();
  const list = q && q.scene === scene ? q.harvestNodes : null;
  const consider = (o: THREE.Object3D) => {
    if (o === scene || !test(o)) return;
    o.getWorldPosition(_nearP);
    const d = _nearP.distanceToSquared(from);
    if (d < bestD) {
      bestD = d;
      best = o;
    }
  };
  if (list) list.forEach(consider);
  else scene.traverse(consider);
  return best;
}

function walkToward(
  obj: THREE.Object3D,
  dest: THREE.Vector3,
  dt: number,
  speed: number
) {
  const here = new THREE.Vector3();
  obj.getWorldPosition(here);
  const dx = dest.x - here.x;
  const dz = dest.z - here.z;
  const dist = Math.hypot(dx, dz);
  if (dist < 0.45) return dist;
  const step = Math.min(dist, speed * dt);
  const parent = obj.parent;
  if (parent) {
    const local = dest.clone();
    parent.worldToLocal(local);
    const cur = obj.position.clone();
    const lx = local.x - cur.x;
    const lz = local.z - cur.z;
    const ld = Math.hypot(lx, lz) || 1;
    obj.position.x += (lx / ld) * step;
    obj.position.z += (lz / ld) * step;
  } else {
    obj.position.x += (dx / dist) * step;
    obj.position.z += (dz / dist) * step;
  }
  obj.rotation.y = Math.atan2(dx, dz);
  return dist - step;
}

export function tickNpcHarvest(scene: THREE.Scene, dt: number) {
  const dtClamped = Math.min(0.05, Math.max(0, dt));
  const q = peekPlayQuery();
  const npcs =
    q && q.scene === scene
      ? q.harvestNpcs
      : (() => {
          const out: THREE.Object3D[] = [];
          scene.traverse((obj) => {
            if (isAutoHarvestNpc(obj)) out.push(obj);
          });
          return out;
        })();
  for (const obj of npcs) {
    if (!isAutoHarvestNpc(obj)) continue;
    if (obj.userData.player) continue;
    if (!obj.userData.harvestJob) stampAutoHarvest(obj);
    const job = jobOf(obj);
    if (!job || job.phase === 'combat') continue;

    const here = new THREE.Vector3();
    obj.getWorldPosition(here);
    const carry = carryVisualFor(job.kind);

    if (job.phase === 'seek' || job.phase === 'gather') {
      hideCarryVisuals(obj);
      const node = nearest(scene, here, (o) => isHarvestNode(o, job.kind));
      if (!node) {
        job.phase = job.count > 0 ? 'return' : 'seek';
        continue;
      }
      const dest = new THREE.Vector3();
      node.getWorldPosition(dest);
      const dist = walkToward(
        obj,
        dest,
        dtClamped,
        GAMES_AI_DISTANCES.walkSpeed
      );
      if (dist > 1.2) {
        job.phase = 'seek';
        continue;
      }
      job.phase = 'gather';
      job.gatherAcc += dtClamped;
      if (job.gatherAcc >= 0.55) {
        job.gatherAcc = 0;
        job.count = Math.min(HARVEST_RETURN_COUNT, job.count + 1);
      }
      if (job.count >= HARVEST_RETURN_COUNT) {
        job.phase = 'return';
        setCarryVisuals(obj, carry);
      }
      continue;
    }

    if (job.phase === 'return') {
      setCarryVisuals(obj, carry);
      const campObj = nearest(scene, here, isCamp);
      const dest = campObj
        ? campObj.getWorldPosition(new THREE.Vector3())
        : job.camp.clone();
      const dist = walkToward(
        obj,
        dest,
        dtClamped,
        GAMES_AI_DISTANCES.walkSpeed
      );
      if (dist <= 1.4) {
        job.count = 0;
        job.phase = 'seek';
        hideCarryVisuals(obj);
      }
    }
  }
}
