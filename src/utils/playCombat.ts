/**
 * Play-as combat — ported patterns from Grudge-Studio-Build saber-academy
 * (artifacts/saber-academy/src/game/SaberGame.ts), not a second engine.
 *
 * Camera: self-owned orbit follow. camYaw = atan2(player-cam XZ).
 * Mouse: LMB attack · RMB focus toggle · Tab cycle (grudge-combat-targeting).
 * Bow/staff: delayed shot + swept-segment hit (saber-projectile-sweep).
 * Melee: facing cone. NPCs/lookouts reuse the same shot sweep.
 */
import * as THREE from 'three';
import { getPlayAs, peekPlayQuery } from './contentLayers';
import { sampleTerrainAt, snapObjectToTerrain } from './terrainGround';
import { WORLD_STACK, WORLD_WIND } from '@/config/fleetSystems';
import { followPlayShadow } from './playBake';
import { dropEnemyLoot, markAnimalCarcass, tryPickupLoot } from './lootChest';
import { findRaceKitRoot, hideCarryVisuals } from './raceKit';
import {
  COMBO_ROLES,
  ensureKitRole,
  getKitAnimBind,
  playKitRole,
  setKitGait,
  type KitAnimRole,
} from './kitAnim';
import { useSceneStore } from '@/store/sceneEditStore';
import { ElMessage } from 'element-plus';

export type WeaponCat = 'melee' | 'bow' | 'magic';

type Shot = {
  node: THREE.Object3D;
  vel: THREE.Vector3;
  from: THREE.Vector3;
  origin: THREE.Vector3;
  range: number;
  damage: number;
  hostile: boolean;
};

export type PlayCombat = {
  playing: boolean;
  camYaw: number;
  camPitch: number;
  camDist: number;
  locked: THREE.Object3D | null;
  attackT: number;
  comboI: number;
  comboWindow: number;
  lungeSpeed: number;
  lungeT: number;
  bowPending: number;
  shots: Shot[];
  marker: THREE.Sprite | null;
  lookAcc: Map<string, number>;
  vy: number;
  grounded: boolean;
  jumpReady: boolean;
  moveAcc: number;
  jumpCd: number;
  climbing: boolean;
  climbN: THREE.Vector3;
  climbRole: 'hang' | 'climb' | 'climbUp' | 'climbDown' | 'mantle' | null;
  sailing: boolean;
  heading: number;
  /** hh-hang shooting demo: 1P / RMB aim / spring zoom */
  firstPerson: boolean;
  aiming: boolean;
  camDistMin: number;
  camDistMax: number;
};

const CAM_SENS = 0.0022;
const WALK = 4.2;
const MELEE_REACH = 3.2;
const RANGED_RELEASE = 0.28;
const ARROW_SPD = 42;
const ARROW_RANGE = 46;
const GRAVITY = -18;
const JUMP_V = 6.2;
const JUMP_NEED_M = 2.2;
const CLIMB_REACH = 1.65;
const CLIMB_SPEED = 1.9;

const _probe = new THREE.Raycaster();
const _chest = new THREE.Vector3();
const _fwd = new THREE.Vector3();
const _look = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _desired = new THREE.Vector3();
const _right = new THREE.Vector3();
const _ahead = new THREE.Vector3();
const _eye = new THREE.Vector3();
const _occludeRay = new THREE.Raycaster();
const _here = new THREE.Vector3();
const _camFwd = new THREE.Vector3();
const _camRight = new THREE.Vector3();
const _move = new THREE.Vector3();
const _along = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);
const _lockT = new THREE.Vector3();
const _dest = new THREE.Vector3();
const _shotP = new THREE.Vector3();
const _shotDir = new THREE.Vector3();
const _ab = new THREE.Vector3();
const _ap = new THREE.Vector3();
const _closest = new THREE.Vector3();
const _hitN = new THREE.Vector3();
const _hold = new THREE.Vector3();
const _bestFwd = new THREE.Vector3();
const _bestTo = new THREE.Vector3();
const _sortA = new THREE.Vector3();
const _sortB = new THREE.Vector3();
const _sortHere = new THREE.Vector3();
const _atkHere = new THREE.Vector3();
const _atkP = new THREE.Vector3();
const _atkT = new THREE.Vector3();
const _atkFwd = new THREE.Vector3();
const _atkDir = new THREE.Vector3();
const _meleeFwd = new THREE.Vector3();
const _meleeP = new THREE.Vector3();
const _meleeDir = new THREE.Vector3();
const _lookHere = new THREE.Vector3();
const _origin = new THREE.Vector3();
const _vel = new THREE.Vector3();
const _unitY = new THREE.Vector3(0, 1, 0);
const _arrowGeo = new THREE.CylinderGeometry(0.02, 0.04, 0.55, 6);
const _orbGeo = new THREE.SphereGeometry(0.12, 10, 8);
const _arrowMat = new THREE.MeshStandardMaterial({
  color: 0xffd65a,
  emissive: 0x553300,
});
const _orbMat = new THREE.MeshStandardMaterial({
  color: 0x7fd0ff,
  emissive: 0x226688,
});
const _nFallback = new THREE.Vector3(0, 0, 1);

function isClimbName(o: THREE.Object3D): boolean {
  if (o.userData?.surface === 'Climb') return true;
  const s =
    `${o.name} ${o.userData?.harvestKind || ''} ${o.userData?.contentLayer || ''}`.toLowerCase();
  return /rock|ore|wall|cliff|boulder|incline|ledge|tree|trunk|bark|ruin|spire/.test(
    s
  );
}

export function probeClimb(
  scene: THREE.Scene,
  player: THREE.Object3D
): THREE.Intersection | null {
  player.getWorldPosition(_chest);
  _chest.y += 1.15;
  _fwd.set(Math.sin(player.rotation.y), 0, Math.cos(player.rotation.y));
  _probe.set(_chest, _fwd);
  _probe.far = CLIMB_REACH;
  const hits = _probe.intersectObjects(scene.children, true);
  for (const h of hits) {
    let o: THREE.Object3D | null = h.object;
    let self = false;
    while (o) {
      if (o === player || o.userData?.playAs) {
        self = true;
        break;
      }
      o = o.parent;
    }
    if (self || h.object.name === 'customPlane') continue;
    const n = hitNormal(h);
    const steep = n.y < 0.58;
    const tagged =
      isClimbName(h.object) || isClimbName(h.object.parent || h.object);
    if (steep || tagged) {
      (h as THREE.Intersection & { worldN: THREE.Vector3 }).worldN = n;
      return h;
    }
  }
  return null;
}

function hitNormal(h: THREE.Intersection): THREE.Vector3 {
  if (!h.face) return _nFallback.set(0, 0, 1);
  return _hitN
    .copy(h.face.normal)
    .transformDirection(h.object.matrixWorld)
    .normalize();
}

function wallN(
  h: THREE.Intersection | null,
  fallback: THREE.Vector3
): THREE.Vector3 {
  const extra = h as (THREE.Intersection & { worldN?: THREE.Vector3 }) | null;
  return extra?.worldN || (h ? hitNormal(h) : fallback);
}

export function tryTraverse(
  scene: THREE.Scene,
  player: THREE.Object3D,
  c: PlayCombat
): 'climb' | 'jump' | 'release' | 'none' {
  const kit = findRaceKitRoot(player) || player;
  const mods = useSceneStore().sceneApi?.animationModules;
  const wall = probeClimb(scene, player);
  if (c.climbing) {
    if (!wall) {
      c.climbing = false;
      c.climbRole = null;
      c.grounded = false;
      c.vy = 2.4;
      void ensureKitRole(kit, 'jump').then(() =>
        playKitRole(kit, 'jump', mods)
      );
      return 'release';
    }
    c.climbN.copy(wallN(wall, c.climbN));
    player.position.y += 1.05;
    c.climbRole = 'mantle';
    void ensureKitRole(kit, 'mantle').then(() =>
      playKitRole(kit, 'mantle', mods)
    );
    return 'climb';
  }
  if (wall) {
    const n = wallN(wall, _nFallback.set(0, 0, 1));
    c.climbing = true;
    c.grounded = false;
    c.vy = 0;
    c.climbN.copy(n);
    _hold.copy(wall.point).addScaledVector(n, 0.38);
    player.position.x = _hold.x;
    player.position.z = _hold.z;
    player.position.y = Math.max(player.position.y, wall.point.y - 0.4);
    player.rotation.y = Math.atan2(-n.x, -n.z);
    c.climbRole = 'hang';
    void ensureKitRole(kit, 'hang').then(() => playKitRole(kit, 'hang', mods));
    return 'climb';
  }
  if (c.grounded && c.jumpReady && c.jumpCd <= 0) {
    c.vy = JUMP_V;
    c.grounded = false;
    c.jumpCd = 0.45;
    void ensureKitRole(kit, 'jump').then(() => playKitRole(kit, 'jump', mods));
    return 'jump';
  }
  return 'none';
}

export function inferWeaponCat(obj: THREE.Object3D | null): WeaponCat {
  const s =
    `${obj?.name || ''} ${obj?.userData?.prefabId || ''} ${obj?.userData?.catalogKey || ''} ${obj?.userData?.animPack || ''}`.toLowerCase();
  if (/bow|longbow|archer|ranger/.test(s)) return 'bow';
  if (/staff|mage|wand|mystic|magic|orb/.test(s)) return 'magic';
  return 'melee';
}

export function createPlayCombat(): PlayCombat {
  return {
    playing: false,
    camYaw: Math.PI,
    camPitch: 0.35,
    camDist: 5.4,
    locked: null,
    attackT: 0,
    comboI: 0,
    comboWindow: 0,
    lungeSpeed: 0,
    lungeT: 0,
    bowPending: 0,
    shots: [],
    marker: null,
    lookAcc: new Map(),
    vy: 0,
    grounded: true,
    jumpReady: false,
    moveAcc: 0,
    jumpCd: 0,
    climbing: false,
    climbN: new THREE.Vector3(0, 0, 1),
    climbRole: null,
    sailing: false,
    heading: Math.PI,
    firstPerson: false,
    aiming: false,
    camDistMin: 1.8,
    camDistMax: 12,
  };
}

const _aimNdc = new THREE.Vector2(0, 0);
const _aimRay = new THREE.Raycaster();

function isSelf(o: THREE.Object3D, player: THREE.Object3D) {
  let p: THREE.Object3D | null = o;
  while (p) {
    if (p === player || p.userData?.playAs || p.userData?.player) return true;
    p = p.parent;
  }
  return false;
}

/** Center-screen aim — shooting.html getCenterScreenRaycastHit. */
export function getCenterScreenHit(
  scene: THREE.Scene,
  camera: THREE.Camera,
  player: THREE.Object3D,
  far = 80
): THREE.Intersection | null {
  _aimRay.setFromCamera(_aimNdc, camera);
  _aimRay.far = far;
  const q = peekPlayQuery();
  const roots =
    q && q.scene === scene && q.aimRoots.length ? q.aimRoots : scene.children;
  const hits = _aimRay.intersectObjects(roots, true);
  for (const h of hits) {
    if (isSelf(h.object, player)) continue;
    if (h.object.userData?.grassField || h.object.name === '__grassField')
      continue;
    if (h.object.name === 'worldWater' || h.object.name === 'worldSkyDome')
      continue;
    return h;
  }
  return null;
}

export function setAiming(c: PlayCombat, on: boolean) {
  c.aiming = on;
}

export function toggleFirstPerson(c: PlayCombat, player: THREE.Object3D) {
  c.firstPerson = !c.firstPerson;
  player.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh || (o as THREE.SkinnedMesh).isSkinnedMesh)
      o.visible = !c.firstPerson;
  });
}

export function nudgeCamDist(c: PlayCombat, delta: number) {
  c.camDist = THREE.MathUtils.clamp(
    c.camDist + delta,
    c.camDistMin,
    c.camDistMax
  );
}

export function hostiles(scene: THREE.Scene): THREE.Object3D[] {
  const q = peekPlayQuery();
  if (q && q.scene === scene) {
    return q.hostiles.filter(
      (o) => o.parent && o.visible && o.userData?.hp !== 0
    );
  }
  const out: THREE.Object3D[] = [];
  scene.traverse((o) => {
    if (o === scene || o.userData?.player || o.userData?.playAs) return;
    const layer = o.userData?.contentLayer;
    if (o.userData?.carcass || o.userData?.lootable) return;
    if (
      layer === 'monster' ||
      layer === 'npc' ||
      layer === 'animal' ||
      o.userData?.enemyCampMember
    ) {
      out.push(o);
    }
  });
  return out;
}

function chest(o: THREE.Object3D, into: THREE.Vector3) {
  o.getWorldPosition(into);
  into.y += (Number(o.userData.siHeightM) || 1.8) * 0.62;
  return into;
}

function ensureMarker(scene: THREE.Scene, c: PlayCombat): THREE.Sprite {
  if (c.marker) return c.marker;
  const g = document.createElement('canvas');
  g.width = g.height = 64;
  const ctx = g.getContext('2d')!;
  ctx.fillStyle = '#ff5566';
  ctx.beginPath();
  ctx.moveTo(10, 12);
  ctx.lineTo(54, 12);
  ctx.lineTo(32, 52);
  ctx.closePath();
  ctx.fill();
  const spr = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(g),
      depthTest: false,
      transparent: true,
    })
  );
  spr.scale.set(0.7, 0.7, 0.7);
  spr.renderOrder = 999;
  spr.visible = false;
  scene.add(spr);
  c.marker = spr;
  return spr;
}

export function bestInView(
  camera: THREE.Camera,
  list: THREE.Object3D[],
  coneOnly = false
): THREE.Object3D | null {
  camera.getWorldDirection(_bestFwd);
  const cam = camera.position;
  const to = _bestTo;
  let best: THREE.Object3D | null = null;
  let bestDot = -Infinity;
  let near: THREE.Object3D | null = null;
  let nearD = Infinity;
  for (const e of list) {
    chest(e, to);
    const d = to.distanceTo(cam);
    if (d < nearD) {
      nearD = d;
      near = e;
    }
    if (d < 0.2) continue;
    to.sub(cam).normalize();
    const dot = to.dot(_bestFwd);
    if (dot > 0.55 && dot > bestDot) {
      bestDot = dot;
      best = e;
    }
  }
  return coneOnly ? best : best || near;
}

export function toggleFocus(
  scene: THREE.Scene,
  camera: THREE.Camera,
  c: PlayCombat
) {
  if (c.locked) {
    c.locked = null;
    if (c.marker) c.marker.visible = false;
    return;
  }
  c.locked = bestInView(camera, hostiles(scene));
}

export function cycleTarget(
  scene: THREE.Scene,
  player: THREE.Object3D,
  c: PlayCombat
) {
  player.getWorldPosition(_sortHere);
  const list = hostiles(scene).sort((a, b) => {
    a.getWorldPosition(_sortA);
    b.getWorldPosition(_sortB);
    return (
      _sortA.distanceToSquared(_sortHere) - _sortB.distanceToSquared(_sortHere)
    );
  });
  if (!list.length) {
    c.locked = null;
    return;
  }
  const i = c.locked ? list.indexOf(c.locked) : -1;
  c.locked = list[(i + 1) % list.length];
}

function weaponCatFrom(player: THREE.Object3D): WeaponCat {
  return inferWeaponCat(player);
}

function findHostileRoot(o: THREE.Object3D | null): THREE.Object3D | null {
  let p: THREE.Object3D | null = o;
  while (p) {
    const layer = String(p.userData?.contentLayer || '');
    if (
      layer === 'monster' ||
      layer === 'animal' ||
      p.userData?.campRole === 'lookout'
    )
      return p;
    p = p.parent;
  }
  return null;
}

export function tryAttack(
  scene: THREE.Scene,
  camera: THREE.Camera,
  player: THREE.Object3D,
  c: PlayCombat
) {
  if (c.attackT > 0) return;
  player.getWorldPosition(_atkHere);
  let carcass: THREE.Object3D | null = null;
  let carcassD = 2.4;
  const carcassList = peekPlayQuery()?.carcass;
  const scanCarcass = (o: THREE.Object3D) => {
    if (!o.userData?.carcass || !o.userData?.lootable) return;
    o.getWorldPosition(_atkP);
    const d = _atkP.distanceTo(_atkHere);
    if (d < carcassD) {
      carcassD = d;
      carcass = o;
    }
  };
  if (carcassList) carcassList.forEach(scanCarcass);
  else scene.traverse(scanCarcass);
  if (carcass) {
    const r = tryPickupLoot(carcass);
    if (r.message) {
      if (r.ok) ElMessage.success(r.message);
      else ElMessage.warning(r.message);
    }
    return;
  }
  const cat = weaponCatFrom(player);
  const screen = getCenterScreenHit(scene, camera, player);
  const aim =
    c.locked && scene.getObjectByProperty('uuid', c.locked.uuid)
      ? c.locked
      : screen?.object
        ? findHostileRoot(screen.object)
        : bestInView(camera, hostiles(scene), true);
  if (c.aiming || c.firstPerson) {
    player.rotation.y = c.camYaw;
  } else if (aim) {
    aim.getWorldPosition(_atkT);
    player.rotation.y = Math.atan2(_atkT.x - _atkHere.x, _atkT.z - _atkHere.z);
  } else {
    camera.getWorldDirection(_atkFwd);
    player.rotation.y = Math.atan2(_atkFwd.x, _atkFwd.z);
  }
  c.attackT = cat === 'magic' ? 0.55 : 0.38;
  const kit = findRaceKitRoot(player) || player;
  const mods = useSceneStore().sceneApi?.animationModules;
  if (c.comboWindow <= 0) c.comboI = 0;
  const role: KitAnimRole =
    cat === 'bow' ? 'attack' : COMBO_ROLES[c.comboI % COMBO_ROLES.length];
  void ensureKitRole(kit, role).then((clip) => {
    playKitRole(kit, role, mods);
    if (!clip) return;
    c.attackT = Math.max(c.attackT, Math.min(0.72, clip.duration * 0.42));
    c.comboWindow = clip.duration + 0.22;
    const src = getKitAnimBind(kit)?.sources[role] || clip.name || '';
    if (/dash|lunge|thrust/.test(src)) {
      c.lungeT = Math.min(0.32, clip.duration * 0.28);
      c.lungeSpeed = 7.4;
    }
  });
  if (cat !== 'bow') c.comboI = (c.comboI + 1) % COMBO_ROLES.length;
  if (cat === 'bow' || (cat === 'magic' && role === 'attack')) {
    c.bowPending = RANGED_RELEASE;
    c.locked = aim || c.locked;
  } else {
    resolveMelee(scene, player, camera);
  }
}

function resolveMelee(
  scene: THREE.Scene,
  player: THREE.Object3D,
  _camera: THREE.Camera
) {
  player.getWorldPosition(_atkHere);
  _meleeFwd.set(Math.sin(player.rotation.y), 0, Math.cos(player.rotation.y));
  for (const e of hostiles(scene)) {
    e.getWorldPosition(_meleeP);
    const dx = _meleeP.x - _atkHere.x;
    const dz = _meleeP.z - _atkHere.z;
    const d = Math.hypot(dx, dz);
    if (d > MELEE_REACH || d < 1e-3) continue;
    _meleeDir.set(dx / d, 0, dz / d);
    if (_meleeDir.dot(_meleeFwd) < 0.15) continue;
    hurt(scene, e, 18, _meleeDir);
  }
}

function fireShot(
  scene: THREE.Scene,
  fromObj: THREE.Object3D,
  toward: THREE.Vector3,
  hostile: boolean,
  kind: 'arrow' | 'orb'
) {
  chest(fromObj, _origin);
  _vel.copy(toward).sub(_origin);
  if (_vel.lengthSq() < 1e-6) {
    _vel.set(Math.sin(fromObj.rotation.y), 0, Math.cos(fromObj.rotation.y));
  }
  _vel.normalize();
  const node = new THREE.Mesh(
    kind === 'orb' ? _orbGeo : _arrowGeo,
    kind === 'orb' ? _orbMat : _arrowMat
  );
  if (kind === 'arrow') {
    node.quaternion.setFromUnitVectors(_unitY, _vel);
  }
  node.position.copy(_origin).addScaledVector(_vel, 0.55);
  scene.add(node);
  return {
    node,
    vel: _vel.clone().multiplyScalar(kind === 'orb' ? 26 : ARROW_SPD),
    from: node.position.clone(),
    origin: _origin.clone(),
    range: ARROW_RANGE,
    damage: kind === 'orb' ? 22 : 16,
    hostile,
  } satisfies Shot;
}

function closestOnSeg(
  a: THREE.Vector3,
  b: THREE.Vector3,
  p: THREE.Vector3
): number {
  _ab.subVectors(b, a);
  _ap.subVectors(p, a);
  const t = THREE.MathUtils.clamp(
    _ap.dot(_ab) / Math.max(_ab.lengthSq(), 1e-8),
    0,
    1
  );
  _closest.copy(a).addScaledVector(_ab, t);
  return _closest.distanceTo(p);
}

function hurt(
  scene: THREE.Scene,
  obj: THREE.Object3D,
  dmg: number,
  dir: THREE.Vector3
) {
  const hp0 = Number(obj.userData.hp);
  obj.userData.hp = (Number.isFinite(hp0) ? hp0 : 80) - dmg;
  obj.position.x += dir.x * 0.35;
  obj.position.z += dir.z * 0.35;
  if (obj.userData.hp <= 0) {
    obj.userData.hp = 0;
    dropEnemyLoot(scene, obj);
    hideCarryVisuals(obj);
    if (
      obj.userData.harvestDrops ||
      obj.userData.animalRole ||
      obj.userData.harvestKind === 'hide'
    ) {
      markAnimalCarcass(obj);
    } else {
      obj.visible = false;
      obj.userData.contentLayer = 'item';
    }
  }
}

export function updateTpsCamera(
  camera: THREE.PerspectiveCamera,
  player: THREE.Object3D,
  scene: THREE.Scene,
  c: PlayCombat,
  dt: number
) {
  c.camPitch = THREE.MathUtils.clamp(c.camPitch, 0.05, 1.25);
  const si = Number(player.userData.siHeightM) || 1.8;
  player.getWorldPosition(_look);
  _look.y += si * (c.firstPerson ? 0.9 : 0.72);
  const fwdX = Math.sin(c.camYaw);
  const fwdZ = Math.cos(c.camYaw);
  if (c.aiming || c.firstPerson) player.rotation.y = c.camYaw;
  if (c.firstPerson) {
    _eye.copy(_look);
    _eye.x += fwdX * 0.12;
    _eye.z += fwdZ * 0.12;
    camera.position.lerp(_eye, 1 - Math.exp(-14 * dt));
    _ahead.set(
      _look.x + fwdX,
      _look.y - Math.sin(c.camPitch - 0.35) * 0.4,
      _look.z + fwdZ
    );
    camera.lookAt(_ahead);
    return;
  }
  const cosP = Math.cos(c.camPitch);
  const sinP = Math.sin(c.camPitch);
  _dir.set(-fwdX * cosP, sinP, -fwdZ * cosP).normalize();
  let dist = c.aiming ? Math.min(c.camDist, 2.8) : c.camDist;
  _occludeRay.set(_look, _dir);
  _occludeRay.near = 0.2;
  _occludeRay.far = dist;
  const q = peekPlayQuery();
  const occluders =
    q && q.scene === scene && q.occluders.length ? q.occluders : scene.children;
  const hits = _occludeRay.intersectObjects(occluders, true);
  for (const h of hits) {
    if (isSelf(h.object, player)) continue;
    if (h.distance < dist) dist = Math.max(1.4, h.distance - 0.35);
    break;
  }
  _desired.copy(_look).addScaledVector(_dir, dist);
  if (c.aiming) {
    _right.set(fwdZ, 0, -fwdX).normalize();
    _desired.addScaledVector(_right, 0.55);
  }
  if (_desired.y < 0.6) _desired.y = 0.6;
  camera.position.lerp(_desired, 1 - Math.exp(-9 * dt));
  camera.lookAt(_look);
}

export function moveCamRelative(
  player: THREE.Object3D,
  camera: THREE.Camera,
  scene: THREE.Scene,
  keys: Record<string, boolean>,
  c: PlayCombat,
  dt: number
) {
  player.getWorldPosition(_here);
  _camFwd.set(_here.x - camera.position.x, 0, _here.z - camera.position.z);
  if (_camFwd.lengthSq() < 1e-6)
    _camFwd.set(Math.sin(c.camYaw), 0, Math.cos(c.camYaw));
  _camFwd.normalize();
  _camRight.set(-_camFwd.z, 0, _camFwd.x);
  _move.set(0, 0, 0);
  if (keys.w) _move.add(_camFwd);
  if (keys.s) _move.sub(_camFwd);
  if (keys.d) _move.add(_camRight);
  if (keys.a) _move.sub(_camRight);
  const kit = findRaceKitRoot(player) || player;
  const mods = useSceneStore().sceneApi?.animationModules;
  if (c.jumpCd > 0) c.jumpCd = Math.max(0, c.jumpCd - dt);

  if (c.climbing) {
    const n = c.climbN;
    _along.crossVectors(_up, n).normalize();
    if (keys.w) player.position.y += CLIMB_SPEED * dt;
    if (keys.s) player.position.y -= CLIMB_SPEED * dt;
    if (keys.a) player.position.addScaledVector(_along, -CLIMB_SPEED * dt);
    if (keys.d) player.position.addScaledVector(_along, CLIMB_SPEED * dt);
    player.rotation.y = Math.atan2(-n.x, -n.z);
    const still = probeClimb(scene, player);
    if (!still) {
      c.climbing = false;
      c.climbRole = null;
      c.grounded = false;
      c.vy = 1.4;
    } else {
      c.climbN.copy(wallN(still, n));
    }
    if (c.attackT <= 0 && c.climbing) {
      const role = keys.w
        ? 'climbUp'
        : keys.s
          ? 'climbDown'
          : keys.a || keys.d
            ? 'climb'
            : 'hang';
      if (c.climbRole !== role) {
        c.climbRole = role;
        void ensureKitRole(kit, role).then(() => playKitRole(kit, role, mods));
      }
    }
    return;
  }

  const groundNow = sampleTerrainAt(scene, _here.x, _here.z);
  const onIsland =
    Number.isFinite(groundNow.y) &&
    groundNow.y >= WORLD_STACK.waterY - 1.2 &&
    groundNow.layer !== 'seafloor' &&
    groundNow.layer !== 'void' &&
    groundNow.layer !== 'water';
  if (!onIsland) {
    if (!c.sailing) c.heading = player.rotation.y;
    c.sailing = true;
    c.grounded = false;
    c.vy = 0;
    if (keys.a) c.heading += 1.15 * dt;
    if (keys.d) c.heading -= 1.15 * dt;
    const hx = Math.sin(c.heading);
    const hz = Math.cos(c.heading);
    const wx = WORLD_WIND.dirX;
    const wz = WORLD_WIND.dirZ;
    const align = Math.max(0, hx * wx + hz * wz);
    let knot = WORLD_WIND.speedMs * (0.32 + 0.68 * align);
    if (keys.w) knot += 2.6 + (keys.shift ? 2.4 * align : 0);
    if (keys.s) knot *= 0.42;
    player.position.x += (hx * knot + wx * WORLD_WIND.speedMs * 0.22) * dt;
    player.position.z += (hz * knot + wz * WORLD_WIND.speedMs * 0.22) * dt;
    player.position.y = WORLD_STACK.waterY + 0.35;
    player.rotation.y = c.heading;
    if (c.attackT <= 0) {
      void ensureKitRole(kit, 'swim').then(() =>
        playKitRole(kit, 'swim', mods)
      );
    }
    return;
  }
  if (c.sailing) {
    c.sailing = false;
    snapObjectToTerrain(player, scene);
    c.grounded = true;
  }

  if (_move.lengthSq() > 0 && c.grounded) {
    _move.normalize();
    const spd = keys.shift ? WALK * 1.55 : WALK;
    player.position.x += _move.x * spd * dt;
    player.position.z += _move.z * spd * dt;
    c.moveAcc += spd * dt;
    if (c.moveAcc >= JUMP_NEED_M) c.jumpReady = true;
    if (!c.locked) player.rotation.y = Math.atan2(_move.x, _move.z);
    else {
      c.locked.getWorldPosition(_lockT);
      player.rotation.y = Math.atan2(
        _lockT.x - player.position.x,
        _lockT.z - player.position.z
      );
    }
  }

  if (!c.grounded || c.vy !== 0) {
    c.vy += GRAVITY * dt;
    player.position.y += c.vy * dt;
  }
  const ground = groundNow;
  const si = Number(player.userData.siHeightM) || 1.8;
  const sole = player.position.y;
  if (
    Number.isFinite(ground.y) &&
    c.vy <= 0 &&
    sole <= ground.y + 0.08 + si * 0.02
  ) {
    snapObjectToTerrain(player, scene);
    c.vy = 0;
    c.grounded = true;
    if (ground.layer === 'quicksand') {
      player.position.y -= 0.28 * dt;
    }
  } else if (c.vy > 0 || !Number.isFinite(ground.y)) {
    c.grounded = false;
  }

  if (c.attackT <= 0 && !c.climbing && c.grounded) {
    setKitGait(kit, _move.lengthSq() > 0, !!keys.shift, mods);
  }
}

export function tickPlayCombat(
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  player: THREE.Object3D,
  c: PlayCombat,
  keys: Record<string, boolean>,
  dt: number
) {
  if (c.attackT > 0) c.attackT = Math.max(0, c.attackT - dt);
  if (c.comboWindow > 0) c.comboWindow = Math.max(0, c.comboWindow - dt);
  if (c.lungeT > 0) {
    const yaw = player.rotation.y;
    player.position.x += Math.sin(yaw) * c.lungeSpeed * dt;
    player.position.z += Math.cos(yaw) * c.lungeSpeed * dt;
    c.lungeT = Math.max(0, c.lungeT - dt);
  }
  if (c.bowPending > 0) {
    c.bowPending -= dt;
    if (c.bowPending <= 0) {
      const cat = weaponCatFrom(player);
      const tgt = c.locked && c.locked.parent ? c.locked : null;
      const screen = getCenterScreenHit(scene, camera, player);
      if (tgt) chest(tgt, _dest);
      else if (screen) _dest.copy(screen.point);
      else {
        camera.getWorldDirection(_dest);
        _dest.multiplyScalar(24).add(camera.position);
      }
      c.shots.push(
        fireShot(scene, player, _dest, false, cat === 'magic' ? 'orb' : 'arrow')
      );
    }
  }
  if (
    c.locked &&
    (!c.locked.parent || c.locked.userData.hp === 0 || !c.locked.visible)
  ) {
    c.locked = null;
  }
  if (c.locked) {
    const m = ensureMarker(scene, c);
    m.visible = true;
    chest(c.locked, m.position);
    m.position.y += 1.15;
  } else if (c.marker) c.marker.visible = false;

  for (let i = c.shots.length - 1; i >= 0; i--) {
    const s = c.shots[i];
    s.from.copy(s.node.position);
    s.node.position.addScaledVector(s.vel, dt);
    const traveled = s.node.position.distanceTo(s.origin);
    let hit: THREE.Object3D | null = null;
    const q = peekPlayQuery();
    const targets = s.hostile
      ? ([q?.playAs || getPlayAs(scene)].filter(Boolean) as THREE.Object3D[])
      : hostiles(scene);
    for (const e of targets) {
      chest(e, _shotP);
      if (closestOnSeg(s.from, s.node.position, _shotP) <= 0.9) {
        hit = e;
        break;
      }
    }
    if (hit || traveled >= s.range) {
      if (hit) {
        _shotDir.copy(s.vel).setY(0);
        if (_shotDir.lengthSq() > 1e-4) _shotDir.normalize();
        if (!s.hostile) hurt(scene, hit, s.damage, _shotDir);
        else {
          const hp0 = Number(hit.userData.hp);
          hit.userData.hp = (Number.isFinite(hp0) ? hp0 : 100) - s.damage;
        }
      }
      scene.remove(s.node);
      c.shots.splice(i, 1);
    }
  }

  tickLookoutArrows(scene, player, c, dt);
  moveCamRelative(player, camera, scene, keys, c, dt);
  updateTpsCamera(camera, player, scene, c, dt);
  followPlayShadow(scene, player);
}

function tickLookoutArrows(
  scene: THREE.Scene,
  player: THREE.Object3D,
  c: PlayCombat,
  dt: number
) {
  chest(player, _dest);
  const q = peekPlayQuery();
  const list =
    q && q.scene === scene
      ? q.lookouts
      : (() => {
          const out: THREE.Object3D[] = [];
          scene.traverse((o) => {
            if (o.userData?.campRole === 'lookout') out.push(o);
          });
          return out;
        })();
  for (const o of list) {
    if (!o.parent) continue;
    if (o.userData?.player || o.userData?.playAs) continue;
    const id = o.uuid;
    const acc = (c.lookAcc.get(id) || 0) + dt;
    o.getWorldPosition(_lookHere);
    if (_lookHere.distanceTo(player.position) > 28) {
      c.lookAcc.set(id, acc);
      continue;
    }
    if (acc >= 1.4) {
      c.lookAcc.set(id, 0);
      o.lookAt(_dest.x, _lookHere.y, _dest.z);
      c.shots.push(fireShot(scene, o, _dest, true, 'arrow'));
    } else c.lookAcc.set(id, acc);
  }
}

export function applyLook(c: PlayCombat, dx: number, dy: number) {
  c.camYaw -= dx * CAM_SENS;
  c.camPitch += dy * CAM_SENS;
}

export function disposePlayCombat(scene: THREE.Scene, c: PlayCombat) {
  for (const s of c.shots) scene.remove(s.node);
  c.shots = [];
  if (c.marker) {
    scene.remove(c.marker);
    c.marker = null;
  }
  c.playing = false;
  c.locked = null;
}
