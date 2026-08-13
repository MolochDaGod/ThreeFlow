/**
 * SI place for ThreeFlow — port of character-viewer siCharacterFit /
 * grudge-world-scale. Do NOT squash every asset to 1.2 m (that stretch
 * + 100× trap is why captains/weapons/islands looked wrong).
 *
 * 1 unit = 1 m. HUMAN_HEIGHT_M = 1.8.
 * Unit decade unclamped. Never height-fit weapons / islands / buildings.
 */
import * as THREE from 'three';

export const HUMAN_HEIGHT_M = 1.8;

export type PlaceKind =
  | 'captain'
  | 'unit'
  | 'enemy'
  | 'weapon'
  | 'island'
  | 'mesh'
  | 'import';

export type SiDiagnosis =
  | 'ok'
  | 'x10'
  | 'x100'
  | 'x1000'
  | 'x0.1'
  | 'x0.01'
  | 'x0.001';

export interface SiPlaceReport {
  kind: PlaceKind;
  beforeH: number;
  afterH: number;
  unitFix: number;
  diagnosis: SiDiagnosis;
  method: 'bones' | 'world';
}

const _v = new THREE.Vector3();

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
  const boneBox = new THREE.Box3();
  let bones = 0;
  root.traverse((o) => {
    if ((o as THREE.Bone).isBone) {
      o.getWorldPosition(_v);
      boneBox.expandByPoint(_v);
      bones++;
    }
  });
  const worldBox = new THREE.Box3().setFromObject(root);
  const worldH = worldBox.isEmpty()
    ? 1e-4
    : Math.max(worldBox.getSize(new THREE.Vector3()).y, 1e-4);

  if (bones >= 6 && !boneBox.isEmpty()) {
    const boneH = Math.max(boneBox.getSize(new THREE.Vector3()).y, 1e-4);
    // Meshopt bind-pose bones can be tiny while world is SI — trust world.
    if (boneH < HUMAN_HEIGHT_M * 0.35 && worldH > HUMAN_HEIGHT_M * 0.5) {
      return { h: worldH, box: worldBox, method: 'world' };
    }
    // All kit variants visible → world AABB huge; prefer bones for heroes.
    if (worldH > boneH * 4 && boneH > HUMAN_HEIGHT_M * 0.4) {
      return { h: boneH, box: boneBox, method: 'bones' };
    }
    return { h: boneH, box: boneBox, method: 'bones' };
  }
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
  if (ratio > 400 && ratio < 4000) return { unitFix: 0.001, diagnosis: 'x1000' };
  if (ratio > 6 && ratio < 40) return { unitFix: 0.1, diagnosis: 'x10' };
  return { unitFix: 1, diagnosis: 'ok' };
}

function groundFeet(root: THREE.Object3D, groundY: number) {
  updateSkins(root);
  const { box } = measureHeight(root);
  if (box.isEmpty()) return;
  root.position.y += groundY - box.min.y;
  root.updateMatrixWorld(true);
}

function applyUniform(root: THREE.Object3D, s: number) {
  if (s === 1 || !Number.isFinite(s) || s <= 0) return;
  root.scale.multiplyScalar(s);
  root.updateMatrixWorld(true);
}

/**
 * Place a dropped/imported asset. Uniform scale only — never per-axis stretch.
 */
export function placeAssetSi(
  root: THREE.Object3D,
  kind: PlaceKind,
  dropPos: THREE.Vector3
): SiPlaceReport {
  root.scale.set(1, 1, 1);
  root.position.copy(dropPos);
  updateSkins(root);

  const expected =
    kind === 'weapon' ? 1.0 : kind === 'enemy' ? 2.4 : HUMAN_HEIGHT_M;
  const first = measureHeight(root);
  let beforeH = first.h;
  let method = first.method;

  // Islands / big scenes: only fix classic cm-as-m, never squash to hero height.
  if (kind === 'island' || kind === 'mesh') {
    const size = first.box.getSize(new THREE.Vector3());
    const longest = Math.max(size.x, size.y, size.z, 1e-4);
    const { unitFix, diagnosis } = diagnoseUnitScale(longest, 40);
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

  // Weapons: unit decade vs ~1 m long. NEVER fit to 1.8 m human.
  if (kind === 'weapon') {
    const size = first.box.getSize(new THREE.Vector3());
    const longest = Math.max(size.x, size.y, size.z, 1e-4);
    const { unitFix, diagnosis } = diagnoseUnitScale(longest, expected);
    applyUniform(root, unitFix);
    const mid = new THREE.Box3().setFromObject(root);
    const midLong = mid.getSize(new THREE.Vector3());
    const L = Math.max(midLong.x, midLong.y, midLong.z, 1e-4);
    // Residual clamp only if still insane (>8 m sword or <8 cm)
    if (L > 8) applyUniform(root, 1.1 / L);
    else if (L < 0.08) applyUniform(root, 0.9 / L);
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

  // Captains / units / humanoid imports: decade then residual fit to 1.8 m.
  const { unitFix, diagnosis } = diagnoseUnitScale(beforeH, expected);
  applyUniform(root, unitFix);
  const mid = measureHeight(root);
  let fitS = expected / Math.max(mid.h, 1e-4);
  if (fitS > 15) fitS = 1;
  applyUniform(root, fitS);
  let after = measureHeight(root);
  if (after.h > expected * 1.5 || after.h < expected * 0.5) {
    applyUniform(root, expected / Math.max(after.h, 1e-4));
    after = measureHeight(root);
  }
  groundFeet(root, dropPos.y);
  after = measureHeight(root);

  const report: SiPlaceReport = {
    kind,
    beforeH,
    afterH: after.h,
    unitFix,
    diagnosis,
    method,
  };
  console.info(
    `[siPlace] ${kind} ${root.name || ''} before=${beforeH.toFixed(3)} ${diagnosis}(×${unitFix}) → ${after.h.toFixed(3)}m (${(after.h / HUMAN_HEIGHT_M).toFixed(2)}× human)`
  );
  return report;
}

export function kindFromGroup(
  group?: string | null,
  filePath?: string
): PlaceKind {
  if (group === 'captains') return 'captain';
  if (group === 'units') return 'unit';
  if (group === 'enemies') return 'enemy';
  if (group === 'weapons') return 'weapon';
  if (group === 'islands' || group === 'zones') return 'island';
  if (group === 'meshes') return 'mesh';
  const p = (filePath || '').toLowerCase();
  if (/\/characters\/|toon-rts|captain-/.test(p)) return 'captain';
  if (/\/weapons\//.test(p)) return 'weapon';
  if (/island|biome|lobby/.test(p)) return 'island';
  return 'import';
}
