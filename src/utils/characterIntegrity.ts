/**
 * Warlords character debug — skeleton + Rapier-sized capsule + laterality box.
 * Extends siPlace / playBake. Not a second physics body or mixer.
 */
import * as THREE from 'three';
import { measureHeight } from './siPlace';

const HELPER = '__charIntegrity';

export type LateralityStatus = 'ok' | 'swap' | 'collapse' | 'missing';

export type CharIntegrity = {
  pelvis: boolean;
  spine: boolean;
  leftFoot: boolean;
  rightFoot: boolean;
  leftHand: boolean;
  rightHand: boolean;
  heightM: number;
  feetSpanM: number;
  rootBetweenFeet: boolean;
  laterality: LateralityStatus;
  lateralityLx: number;
  lateralityRx: number;
  method: 'bones' | 'world';
};

const BONE = {
  pelvis: [/Bip001 Pelvis/i, /Bip001_Pelvis/i, /mixamorig.*Hips/i],
  spine: [/Bip001 Spine$/i, /Bip001_Spine$/i, /mixamorig.*Spine$/i],
  leftFoot: [/Bip001 L Foot/i, /Bip001_L_Foot/i, /LeftFoot/i],
  rightFoot: [/Bip001 R Foot/i, /Bip001_R_Foot/i, /RightFoot/i],
  leftHand: [/L_hand_container/, /Bip001 L Hand/i, /Bip001_L_Hand/i, /LeftHand/i],
  rightHand: [/R_hand_container/, /Bip001 R Hand/i, /Bip001_R_Hand/i, /RightHand/i],
} as const;

function findBone(
  root: THREE.Object3D,
  tests: readonly RegExp[]
): THREE.Object3D | null {
  let hit: THREE.Object3D | null = null;
  root.traverse((o) => {
    if (hit || !o.name) return;
    if (tests.some((re) => re.test(o.name))) hit = o;
  });
  return hit;
}

const _world = new THREE.Vector3();
const _inv = new THREE.Matrix4();
const _local = new THREE.Vector3();

function localOnRoot(root: THREE.Object3D, bone: THREE.Object3D): THREE.Vector3 {
  _inv.copy(root.matrixWorld).invert();
  bone.getWorldPosition(_world);
  return _local.copy(_world).applyMatrix4(_inv).clone();
}

function lateralityOf(
  root: THREE.Object3D,
  leftHand: THREE.Object3D | null,
  rightHand: THREE.Object3D | null
): { status: LateralityStatus; lx: number; rx: number } {
  if (!leftHand || !rightHand) return { status: 'missing', lx: 0, rx: 0 };
  const lx = localOnRoot(root, leftHand).x;
  const rx = localOnRoot(root, rightHand).x;
  if (Math.abs(lx) < 0.04 && Math.abs(rx) < 0.04) {
    return { status: 'collapse', lx, rx };
  }
  if (rx < -0.06 && lx > 0.06) return { status: 'swap', lx, rx };
  if (rx > 0.06 && lx < -0.06) return { status: 'ok', lx, rx };
  if (Math.sign(lx) === Math.sign(rx) && Math.abs(lx) > 0.04 && Math.abs(rx) > 0.04) {
    return { status: 'swap', lx, rx };
  }
  return { status: 'ok', lx, rx };
}

export function diagnoseCharacterIntegrity(
  root: THREE.Object3D
): CharIntegrity {
  const pelvis = findBone(root, BONE.pelvis);
  const spine = findBone(root, BONE.spine);
  const leftFoot = findBone(root, BONE.leftFoot);
  const rightFoot = findBone(root, BONE.rightFoot);
  const leftHand = findBone(root, BONE.leftHand);
  const rightHand = findBone(root, BONE.rightHand);
  const { h, method } = measureHeight(root);
  let feetSpanM = 0;
  let rootBetweenFeet = false;
  if (leftFoot && rightFoot) {
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    leftFoot.getWorldPosition(a);
    rightFoot.getWorldPosition(b);
    feetSpanM = Math.hypot(a.x - b.x, a.z - b.z);
    const midX = (a.x + b.x) * 0.5;
    const midZ = (a.z + b.z) * 0.5;
    rootBetweenFeet =
      Math.hypot(root.position.x - midX, root.position.z - midZ) < 0.18;
  }
  const lat = lateralityOf(root, leftHand, rightHand);
  return {
    pelvis: Boolean(pelvis),
    spine: Boolean(spine),
    leftFoot: Boolean(leftFoot),
    rightFoot: Boolean(rightFoot),
    leftHand: Boolean(leftHand),
    rightHand: Boolean(rightHand),
    heightM: h,
    feetSpanM,
    rootBetweenFeet,
    laterality: lat.status,
    lateralityLx: lat.lx,
    lateralityRx: lat.rx,
    method,
  };
}

function markerMat(color: number) {
  return new THREE.MeshBasicMaterial({
    color,
    depthTest: false,
    transparent: true,
    opacity: 0.9,
  });
}

function boneMarker(
  bone: THREE.Object3D,
  color: number,
  radius: number,
  name: string
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 8, 8), markerMat(color));
  mesh.name = name;
  mesh.userData.editorGizmo = true;
  bone.add(mesh);
  return mesh;
}

function lateralityBox(sign: 1 | -1, color: number): THREE.Mesh {
  const geo = new THREE.BoxGeometry(0.28, 0.55, 0.36);
  const mat = new THREE.MeshBasicMaterial({
    color,
    wireframe: true,
    transparent: true,
    opacity: 0.55,
    depthTest: false,
  });
  const box = new THREE.Mesh(geo, mat);
  box.name = HELPER + (sign > 0 ? 'RightBox' : 'LeftBox');
  box.position.set(sign * 0.22, 1.05, 0.04);
  return box;
}

export function bindCharacterDebug(root: THREE.Object3D) {
  clearCharacterDebug(root);
  const group = new THREE.Group();
  group.name = HELPER;
  group.userData.editorGizmo = true;
  const skel = root.getObjectByProperty('type', 'Bone') as
    THREE.Bone | undefined;
  const skinned: THREE.SkinnedMesh[] = [];
  root.traverse((o) => {
    if (skinned.length) return;
    const sm = o as THREE.SkinnedMesh;
    if (sm.isSkinnedMesh && sm.skeleton) skinned.push(sm);
  });
  const helper = skinned[0]
    ? new THREE.SkeletonHelper(skinned[0])
    : null;
  if (helper) {
    helper.name = HELPER + 'Skel';
    const line = helper.material as THREE.LineBasicMaterial;
    if (line) {
      line.depthTest = false;
      line.transparent = true;
      line.opacity = 0.85;
      line.color?.set?.(0x7dffb0);
    }
    group.add(helper);
  } else if (skel) {
    const h = new THREE.SkeletonHelper(root);
    h.name = HELPER + 'Skel';
    group.add(h);
  }
  const { h } = measureHeight(root);
  const radius = 0.35;
  const cylH = Math.max(0.4, h - radius * 2);
  const geo = new THREE.CapsuleGeometry(radius, cylH, 4, 10);
  const mat = new THREE.MeshBasicMaterial({
    color: 0x5ad4c8,
    wireframe: true,
    transparent: true,
    opacity: 0.45,
    depthTest: false,
  });
  const cap = new THREE.Mesh(geo, mat);
  cap.name = HELPER + 'Capsule';
  cap.position.y = radius + cylH * 0.5;
  group.add(cap);
  const mark = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xffc53d })
  );
  mark.name = HELPER + 'Root';
  mark.position.y = 0.06;
  group.add(mark);

  const axes = new THREE.AxesHelper(0.55);
  axes.name = HELPER + 'Axes';
  axes.position.y = 0.02;
  group.add(axes);

  group.add(lateralityBox(1, 0xff6b6b));
  group.add(lateralityBox(-1, 0x6ba8ff));

  const sockets: Array<[readonly RegExp[], number, number, string]> = [
    [BONE.pelvis, 0xffc53d, 0.05, HELPER + 'Pelvis'],
    [BONE.spine, 0xffffff, 0.045, HELPER + 'Spine'],
    [BONE.leftHand, 0x4aa3ff, 0.04, HELPER + 'LHand'],
    [BONE.rightHand, 0xff5a5a, 0.04, HELPER + 'RHand'],
    [BONE.leftFoot, 0x5ad4c8, 0.035, HELPER + 'LFoot'],
    [BONE.rightFoot, 0xc77dff, 0.035, HELPER + 'RFoot'],
  ];
  const markers: THREE.Object3D[] = [];
  for (const [tests, color, r, name] of sockets) {
    const bone = findBone(root, tests);
    if (!bone) continue;
    markers.push(boneMarker(bone, color, r, name));
  }
  group.userData.boneMarkers = markers;

  root.add(group);
  root.userData.charDebug = true;
}

export function clearCharacterDebug(root: THREE.Object3D) {
  const old = root.getObjectByName(HELPER);
  const extra: THREE.Object3D[] = [];
  root.traverse((o) => {
    if (o.name?.startsWith(HELPER) && o !== old) extra.push(o);
  });
  for (const o of extra) {
    o.removeFromParent();
    const m = o as THREE.Mesh;
    if (m.isMesh) {
      m.geometry?.dispose?.();
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      mats.forEach((x) => x?.dispose?.());
    }
  }
  if (old) {
    old.removeFromParent();
    old.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.geometry?.dispose?.();
        const mats = Array.isArray(m.material) ? m.material : [m.material];
        mats.forEach((x) => x?.dispose?.());
      }
    });
  }
  root.userData.charDebug = false;
}

export function toggleCharacterDebug(root: THREE.Object3D): boolean {
  if (root.userData.charDebug) {
    clearCharacterDebug(root);
    return false;
  }
  bindCharacterDebug(root);
  return true;
}
