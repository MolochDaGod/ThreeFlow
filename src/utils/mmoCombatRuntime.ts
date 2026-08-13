/**
 * Editor preview of uMMORPG / Warlords aggro, threat, cast, telegraph.
 * Play authority stays GrudgeBuilder. Yuka steers the root only.
 */
import * as THREE from 'three';
import {
  AGGRO_CONFIG,
  DEFAULT_MMO_STAMP,
  THREAT_CONFIG,
  type MmoCombatStamp,
  type TelegraphVariant,
} from '@/config/mmoCombat';

const HELPER = '__mmoCombatHelper';

export type AggroBand = 'none' | 'detect' | 'aggro' | 'assist' | 'leash';

export type ThreatEntry = {
  id: string;
  amount: number;
  lastHitAt: number;
  tauntUntil: number;
};

export class ThreatTable {
  private rows = new Map<string, ThreatEntry>();
  tankMul: number;
  decayPerSec: number;

  constructor(tankMul: number = THREAT_CONFIG.tankMul, decayPerSec: number = THREAT_CONFIG.decayPerSec) {
    this.tankMul = tankMul;
    this.decayPerSec = decayPerSec;
  }

  addDamage(id: string, damage: number, isTank: boolean, now = performance.now()) {
    const mul = THREAT_CONFIG.damageMul * (isTank ? this.tankMul : 1);
    this.add(id, damage * mul, now);
  }

  addHeal(id: string, heal: number, now = performance.now()) {
    this.add(id, heal * THREAT_CONFIG.healMul, now);
  }

  taunt(id: string, now = performance.now()) {
    this.add(id, THREAT_CONFIG.tauntThreat, now);
    const row = this.rows.get(id);
    if (row) row.tauntUntil = now + THREAT_CONFIG.tauntLockSec * 1000;
  }

  assist(id: string, now = performance.now()) {
    this.add(id, THREAT_CONFIG.assistSeed, now);
  }

  tick(dt: number, now = performance.now()) {
    for (const [id, row] of this.rows) {
      if (now < row.tauntUntil) continue;
      row.amount -= this.decayPerSec * dt;
      if (row.amount <= 0) this.rows.delete(id);
    }
  }

  top(now = performance.now()): ThreatEntry | null {
    let best: ThreatEntry | null = null;
    for (const row of this.rows.values()) {
      if (now < row.tauntUntil) return row;
      if (!best || row.amount > best.amount) best = row;
    }
    return best;
  }

  list(): ThreatEntry[] {
    return [...this.rows.values()].sort((a, b) => b.amount - a.amount);
  }

  private add(id: string, amount: number, now: number) {
    const cur = this.rows.get(id);
    if (cur) {
      cur.amount += amount;
      cur.lastHitAt = now;
      return;
    }
    this.rows.set(id, { id, amount, lastHitAt: now, tauntUntil: 0 });
  }
}

export function senseAggro(
  self: THREE.Vector3,
  spawn: THREE.Vector3,
  other: THREE.Vector3,
  stamp: MmoCombatStamp
): AggroBand {
  const fromSpawn = self.distanceTo(spawn);
  if (fromSpawn > stamp.leashRadius) return 'leash';
  const d = self.distanceTo(other);
  if (d <= stamp.aggroRadius) return 'aggro';
  if (d <= stamp.detectionRadius) return 'detect';
  if (d <= stamp.assistRadius) return 'assist';
  return 'none';
}

export function stampMmoCombat(obj: THREE.Object3D, partial?: Partial<MmoCombatStamp>) {
  const stamp: MmoCombatStamp = { ...DEFAULT_MMO_STAMP, ...partial };
  obj.userData.mmoCombat = stamp;
  obj.userData.aggroRadius = stamp.aggroRadius;
  obj.userData.leashRadius = stamp.leashRadius;
  return stamp;
}

export function readMmoStamp(obj: THREE.Object3D): MmoCombatStamp {
  const raw = obj.userData.mmoCombat as Partial<MmoCombatStamp> | undefined;
  return { ...DEFAULT_MMO_STAMP, ...raw };
}

export function showAggroRings(scene: THREE.Scene, obj: THREE.Object3D): string {
  clearNamed(scene, HELPER);
  const stamp = readMmoStamp(obj);
  const origin = new THREE.Vector3();
  obj.getWorldPosition(origin);
  origin.y += 0.05;
  addRing(scene, origin, stamp.detectionRadius, 0xffc53d, 0.18);
  addRing(scene, origin, stamp.aggroRadius, 0xff4d4f, 0.32);
  addRing(scene, origin, stamp.assistRadius, 0x69c0ff, 0.16);
  addRing(scene, origin, stamp.leashRadius, 0x8b93b7, 0.12);
  return `rings detect ${stamp.detectionRadius} / aggro ${stamp.aggroRadius} / assist ${stamp.assistRadius} / leash ${stamp.leashRadius}`;
}

export function showTelegraph(
  scene: THREE.Scene,
  obj: THREE.Object3D,
  facing?: THREE.Vector3
): { stop: () => void; label: string } {
  const stamp = readMmoStamp(obj);
  const origin = new THREE.Vector3();
  obj.getWorldPosition(origin);
  const dir = facing ? facing.clone() : new THREE.Vector3(0, 0, 1);
  dir.y = 0;
  if (dir.lengthSq() < 1e-6) dir.set(0, 0, 1);
  dir.normalize();

  const mesh = makeTelegraphMesh(stamp.telegraph, stamp.range, stamp.arc);
  mesh.name = HELPER;
  mesh.position.copy(origin);
  mesh.position.y += 0.08;
  mesh.lookAt(origin.clone().add(dir));
  if (stamp.telegraph !== 'incoming') {
    mesh.rotateX(-Math.PI / 2);
  }
  scene.add(mesh);

  const total = Math.max(0.35, stamp.telegraphSec);
  const t0 = performance.now();
  let alive = true;
  const tick = () => {
    if (!alive) return;
    const p = Math.min(1, (performance.now() - t0) / (total * 1000));
    const mat = mesh.material as THREE.MeshBasicMaterial;
    mat.opacity = 0.22 + p * 0.55;
    const pulse = 0.85 + p * 0.3 + Math.sin(p * Math.PI * 8) * 0.06;
    mesh.scale.setScalar(pulse);
    if (p >= 1) {
      alive = false;
      scene.remove(mesh);
      mesh.geometry.dispose();
      mat.dispose();
      return;
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  return {
    stop: () => {
      alive = false;
      scene.remove(mesh);
    },
    label: `${stamp.telegraph} ${total.toFixed(2)}s range ${stamp.range}m`,
  };
}

export function previewThreat(
  caster: THREE.Object3D,
  others: THREE.Object3D[]
): { top: string; rows: string[] } {
  const stamp = readMmoStamp(caster);
  const table = new ThreatTable(stamp.tankMul, stamp.decayPerSec);
  others.forEach((o, i) => {
    const combat = o.userData?.mmoCombat as { tankMul?: number } | undefined;
    const isTank = Boolean(o.userData?.isTank || (combat?.tankMul ?? 0) > 1);
    table.addDamage(o.name || o.uuid, 40 + i * 15, isTank);
  });
  if (!others.length) table.addDamage('player', 80, false);
  const top = table.top();
  return {
    top: top ? `${top.id} ${top.amount.toFixed(0)}` : 'empty',
    rows: table.list().map((r) => `${r.id}: ${r.amount.toFixed(0)}`),
  };
}

export function previewCast(obj: THREE.Object3D): string {
  const stamp = readMmoStamp(obj);
  return `cast ${stamp.castTimeSec}s · interrupt ${stamp.interruptWindowSec}s · ${stamp.skillId} · telegraph ${stamp.telegraph}/${stamp.telegraphSec}s`;
}

function addRing(
  scene: THREE.Scene,
  origin: THREE.Vector3,
  radius: number,
  color: number,
  opacity: number
) {
  const geo = new THREE.RingGeometry(Math.max(0.2, radius - 0.12), radius, 64);
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = HELPER;
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.copy(origin);
  scene.add(mesh);
}

function makeTelegraphMesh(
  variant: TelegraphVariant,
  range: number,
  arc: number
): THREE.Mesh {
  let geo: THREE.BufferGeometry;
  if (variant === 'cone') {
    geo = new THREE.CircleGeometry(range, 32, -arc * 0.5, arc);
  } else if (variant === 'incoming') {
    geo = new THREE.RingGeometry(0.35, Math.max(0.8, range * 0.12), 24);
  } else {
    geo = new THREE.CircleGeometry(range, 48);
  }
  const color = variant === 'incoming' ? 0xff9c6e : variant === 'aoe' ? 0xff4d4f : 0xffc53d;
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  return new THREE.Mesh(geo, mat);
}

function clearNamed(scene: THREE.Scene, name: string) {
  const doomed: THREE.Object3D[] = [];
  scene.traverse((o) => {
    if (o.name === name) doomed.push(o);
  });
  for (const o of doomed) o.parent?.remove(o);
}

export { AGGRO_CONFIG };
