/**
 * SI place — same law as Open fitCharacterHeight.
 * Height is corrected by ONE uniform scale on the whole asset (setScalar /
 * multiplyScalar). Never scale.x / .y / .z apart — that stretches the mesh.
 * 1 unit = 1 m. Human 1.8 · orc/barb 2.0. Weapons / islands are not 1.8 m people.
 */
import * as THREE from 'three';

export const HUMAN_HEIGHT_M = 1.8;
export const ORC_HEIGHT_M = 2.0;
export const BARBARIAN_HEIGHT_M = 2.0;

/** Race height from catalog name / id. Human yardstick unless orc or barbarian. */
export function raceHeightM(hint = ''): number {
  const s = hint.toLowerCase();
  if (/\borc\b|orc[_-]|\/orc/.test(s)) return ORC_HEIGHT_M;
  if (/barb/.test(s)) return BARBARIAN_HEIGHT_M;
  return HUMAN_HEIGHT_M;
}

/** Residual fit only below this — islands / sectors stay decade-only. */
const PROP_FIT_MAX_M = 80;

export type PlaceKind =
  | 'captain'
  | 'unit'
  | 'enemy'
  | 'weapon'
  | 'island'
  | 'sector'
  | 'mesh'
  | 'import';

export type SiDiagnosis =
  'ok' | 'x10' | 'x100' | 'x1000' | 'x0.1' | 'x0.01' | 'x0.001';

export interface SiPlaceReport {
  kind: PlaceKind;
  beforeH: number;
  afterH: number;
  unitFix: number;
  diagnosis: SiDiagnosis;
  method: 'bones' | 'world';
}

function updateSkins(root: THREE.Object3D) {
  root.updateMatrixWorld(true);
  root.traverse((o) => {
    const sm = o as THREE.SkinnedMesh;
    if (sm.isSkinnedMesh) sm.skeleton?.update();
  });
}

export function measureHeight(root: THREE.Object3D): {
  h: number;
  box: THREE.Box3;
  method: 'bones' | 'world';
} {
  updateSkins(root);
  const body = new THREE.Box3();
  let skins = 0;
  root.traverse((o) => {
    const sm = o as THREE.SkinnedMesh;
    if (!sm.isSkinnedMesh || !sm.visible) return;
    try {
      body.expandByObject(sm);
      skins++;
    } catch {
      /* skip broken skin */
    }
  });
  if (skins > 0 && !body.isEmpty()) {
    const h = Math.max(body.getSize(new THREE.Vector3()).y, 1e-4);
    return { h, box: body, method: 'bones' };
  }
  const worldBox = new THREE.Box3().setFromObject(root);
  const worldH = worldBox.isEmpty()
    ? 1e-4
    : Math.max(worldBox.getSize(new THREE.Vector3()).y, 1e-4);
  return { h: worldH, box: worldBox, method: 'world' };
}

export function diagnoseUnitScale(
  measured: number,
  expected: number
): { unitFix: number; diagnosis: SiDiagnosis } {
  if (!(measured > 0) || !Number.isFinite(measured)) {
    return { unitFix: 1, diagnosis: 'ok' };
  }
  const ratio = measured / expected;
  if (ratio > 40 && ratio < 400) return { unitFix: 0.01, diagnosis: 'x100' };
  if (ratio > 400 && ratio < 4000)
    return { unitFix: 0.001, diagnosis: 'x1000' };
  if (ratio > 6 && ratio < 40) return { unitFix: 0.1, diagnosis: 'x10' };
  return { unitFix: 1, diagnosis: 'ok' };
}

function findNamed(
  root: THREE.Object3D,
  tests: RegExp[]
): THREE.Object3D | null {
  let hit: THREE.Object3D | null = null;
  root.traverse((o) => {
    if (hit || !o.name) return;
    if (tests.some((re) => re.test(o.name))) hit = o;
  });
  return hit;
}

function boneWorld(o: THREE.Object3D, into: THREE.Vector3) {
  o.getWorldPosition(into);
  return into;
}

const _footL = new THREE.Vector3();
const _footR = new THREE.Vector3();
const _rootW = new THREE.Vector3();
const _midW = new THREE.Vector3();
const _localA = new THREE.Vector3();
const _localB = new THREE.Vector3();

/** Re-pivot so the group origin sits between the feet on XZ. Hip is not the root. */
export function centerRootBetweenFeet(root: THREE.Object3D) {
  updateSkins(root);
  const l =
    findNamed(root, [
      /Bip001 L Foot/i,
      /Bip001_L_Foot/i,
      /mixamorig.*LeftFoot/i,
    ]) || findNamed(root, [/L Foot/i, /LeftFoot/i]);
  const r =
    findNamed(root, [
      /Bip001 R Foot/i,
      /Bip001_R_Foot/i,
      /mixamorig.*RightFoot/i,
    ]) || findNamed(root, [/R Foot/i, /RightFoot/i]);
  if (!l || !r) return false;
  boneWorld(l, _footL);
  boneWorld(r, _footR);
  _midW.set((_footL.x + _footR.x) * 0.5, 0, (_footL.z + _footR.z) * 0.5);
  root.getWorldPosition(_rootW);
  const dx = _midW.x - _rootW.x;
  const dz = _midW.z - _rootW.z;
  if (dx * dx + dz * dz < 1e-8) return true;
  _localA.set(_rootW.x, _rootW.y, _rootW.z);
  _localB.set(_rootW.x + dx, _rootW.y, _rootW.z + dz);
  root.worldToLocal(_localA);
  root.worldToLocal(_localB);
  const lx = _localB.x - _localA.x;
  const lz = _localB.z - _localA.z;
  for (const c of root.children) {
    if (c.name.startsWith('__')) continue;
    c.position.x -= lx;
    c.position.z -= lz;
  }
  root.position.x += dx;
  root.position.z += dz;
  root.updateMatrixWorld(true);
  return true;
}

function groundFeet(root: THREE.Object3D, groundY: number) {
  updateSkins(root);
  const { box } = measureHeight(root);
  if (box.isEmpty()) return;
  root.position.y += groundY - box.min.y;
  root.updateMatrixWorld(true);
}

/** One number on the whole root. Never scale.x / scale.y / scale.z apart. */
function applyUniform(root: THREE.Object3D, s: number) {
  if (s === 1 || !Number.isFinite(s) || s <= 0) return;
  root.scale.multiplyScalar(s);
  forceUniformScale(root);
  root.updateMatrixWorld(true);
}

function forceUniformScale(root: THREE.Object3D) {
  const { x, y, z } = root.scale;
  if (Math.abs(x - y) < 1e-6 && Math.abs(y - z) < 1e-6) return;
  const s = (Math.abs(x) + Math.abs(y) + Math.abs(z)) / 3 || 1;
  console.warn(
    `[siPlace] refused non-uniform scale (${x.toFixed(4)}, ${y.toFixed(4)}, ${z.toFixed(4)}) → ${s.toFixed(4)}`
  );
  root.scale.setScalar(s);
}

/**
 * Measure Y height → multiply the whole asset by (target / height).
 * No per-axis, no second pass, no fit clamp that blocks 100×.
 */
function scaleUniformToHeight(root: THREE.Object3D, targetH: number): number {
  updateSkins(root);
  const { h } = measureHeight(root);
  if (!(h > 1e-6) || !(targetH > 1e-6)) return 1;
  const s = targetH / h;
  if (!Number.isFinite(s) || s <= 0) return 1;
  applyUniform(root, s);
  return s;
}

/**
 * Place a dropped asset. Height is fixed by ONE uniform scale on the whole root.
 * Never scale.x / .y / .z apart (that is the stretch/pull that deforms meshes).
 */
export function placeAssetSi(
  root: THREE.Object3D,
  kind: PlaceKind,
  dropPos: THREE.Vector3
): SiPlaceReport {
  root.scale.setScalar(1);
  root.position.copy(dropPos);
  forceUniformScale(root);
  updateSkins(root);

  const stamped = Number(root.userData?.siHeightM);
  const hint = `${root.name || ''} ${root.userData?.catalogKey || ''} ${root.userData?.r2Key || ''}`;
  const first = measureHeight(root);
  const beforeH = first.h;
  const method = first.method;

  const asHumanoid =
    kind === 'captain' ||
    kind === 'unit' ||
    kind === 'enemy' ||
    (kind === 'import' && method === 'bones');

  const expected = (() => {
    if (kind === 'weapon') {
      return Number.isFinite(stamped) && stamped > 0.15 && stamped < 8
        ? stamped
        : 1.0;
    }
    if (kind === 'island') {
      return Number.isFinite(stamped) && stamped >= 80 ? stamped : 40;
    }
    if (asHumanoid) {
      if (Number.isFinite(stamped) && stamped >= 1.4 && stamped <= 8)
        return stamped;
      if (kind === 'enemy') return 2.4;
      return raceHeightM(hint);
    }
    if (Number.isFinite(stamped) && stamped > 0.15 && stamped < PROP_FIT_MAX_M)
      return stamped;
    return 1.2;
  })();

  // Weapons: uniform scale so longest edge ≈ catalog size. Never Y-stretch to 1.8 m.
  if (kind === 'weapon') {
    const size = first.box.getSize(new THREE.Vector3());
    const longest = Math.max(size.x, size.y, size.z, 1e-4);
    const { unitFix, diagnosis } = diagnoseUnitScale(longest, expected);
    applyUniform(root, unitFix);
    const mid = new THREE.Box3()
      .setFromObject(root)
      .getSize(new THREE.Vector3());
    const L = Math.max(mid.x, mid.y, mid.z, 1e-4);
    if (L > expected * 1.25 || L < expected * 0.75) {
      applyUniform(root, expected / L);
    }
    groundFeet(root, dropPos.y);
    forceUniformScale(root);
    const after = measureHeight(root);
    root.userData.baseUniform = root.scale.x;
    return {
      kind,
      beforeH: longest,
      afterH: after.h,
      unitFix,
      diagnosis,
      method: after.method,
    };
  }

  // Islands / sectors: decade only (still uniform). Never height-fit to a human.
  if (kind === 'island' || kind === 'sector' || expected >= PROP_FIT_MAX_M) {
    const size = first.box.getSize(new THREE.Vector3());
    const longest = Math.max(size.x, size.y, size.z, 1e-4);
    const { unitFix, diagnosis } = diagnoseUnitScale(longest, expected);
    applyUniform(root, unitFix);
    groundFeet(root, dropPos.y);
    const after = measureHeight(root);
    return {
      kind,
      beforeH: longest,
      afterH: after.h,
      unitFix,
      diagnosis,
      method: after.method,
    };
  }

  const { unitFix, diagnosis } = diagnoseUnitScale(beforeH, expected);
  applyUniform(root, unitFix);

  const mid = measureHeight(root);
  const closeEnough = mid.h >= expected * 0.92 && mid.h <= expected * 1.08;
  if (!closeEnough) {
    scaleUniformToHeight(root, expected);
  }

  groundFeet(root, dropPos.y);
  if (asHumanoid) centerRootBetweenFeet(root);
  forceUniformScale(root);
  const after = measureHeight(root);
  root.userData.baseUniform = root.scale.x;

  const report: SiPlaceReport = {
    kind,
    beforeH,
    afterH: after.h,
    unitFix,
    diagnosis,
    method,
  };
  console.info(
    `[siPlace] ${kind} ${root.name || ''} uniform ×${root.scale.x.toFixed(4)} before=${beforeH.toFixed(3)} → ${after.h.toFixed(3)}m (${(after.h / HUMAN_HEIGHT_M).toFixed(2)}× human)`
  );
  return report;
}

export function kindFromGroup(
  group?: string | null,
  filePath?: string
): PlaceKind {
  if (group === 'captains') return 'captain';
  if (group === 'units') return 'unit';
  if (group === 'enemies' || group === 'animals') return 'enemy';
  if (group === 'harvest') return 'mesh';
  if (group === 'weapons') return 'weapon';
  if (group === 'vfx') return 'weapon';
  if (group === 'sectors') return 'sector';
  if (group === 'islands' || group === 'zones' || group === 'scenes')
    return 'island';
  if (group === 'meshes' || group === 'textures' || group === 'animations')
    return 'mesh';
  const p = (filePath || '').toLowerCase();
  if (/\/characters\/|toon-rts|captain-/.test(p)) return 'captain';
  if (/\/weapons\//.test(p)) return 'weapon';
  if (/island|biome|lobby/.test(p)) return 'island';
  return 'import';
}
