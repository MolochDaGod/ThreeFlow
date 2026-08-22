/**
 * Editor-side terrain / collider / nav / AI stamps.
 * Rapier + BVH + three-pathfinding + Yuka — one world, fleet pins.
 * Play FSM / recast bake stay on Forge.
 */
import * as THREE from 'three';
import {
  WORLD_STACK,
  type BrainKind,
  type PhysBody,
  type PhysLayer,
  type PhysShape,
} from '@/config/fleetSystems';
import { listTerrainRoots } from './terrainGround';
import { stampAutoHarvest } from './npcHarvest';

const NAV_ZONE = 'threeflow';
const HELPER_NAME = '__fleetSystemsHelper';

type RapierPlayBody = {
  obj: THREE.Object3D;
  kind: string;
  body: {
    translation: () => { x: number; y: number; z: number };
    rotation: () => { x: number; y: number; z: number; w: number };
    setNextKinematicTranslation?: (t: {
      x: number;
      y: number;
      z: number;
    }) => void;
  };
};

let rapierWorld: {
  world: { free: () => void; timestep?: number; step: () => void };
  bodies: RapierPlayBody[];
  acc: number;
} | null = null;
let nav: {
  pathfinding: {
    findPath: (
      a: THREE.Vector3,
      b: THREE.Vector3,
      zone: string,
      group: number
    ) => THREE.Vector3[] | null;
    getGroup: (zone: string, p: THREE.Vector3) => number;
  };
  helper: THREE.Object3D & {
    setPath(p: THREE.Vector3[]): unknown;
    setPlayerPosition(p: THREE.Vector3): unknown;
    setTargetPosition(p: THREE.Vector3): unknown;
    reset(): unknown;
  };
} | null = null;
let yukaHandle: { stop: () => void } | null = null;

export function selectedObject(
  scene: THREE.Scene,
  uuid: string | null
): THREE.Object3D | null {
  if (!uuid) return null;
  return scene.getObjectByProperty('uuid', uuid) || null;
}

export function stampCollider(
  obj: THREE.Object3D,
  layer: PhysLayer,
  body: PhysBody,
  shape: PhysShape
) {
  obj.userData.physLayer = layer;
  obj.userData.physBody = body;
  obj.userData.physShape = shape;
}

export function stampBrain(obj: THREE.Object3D, brain: BrainKind) {
  obj.userData.aiBrain = brain;
  obj.userData.behavior = brain === 'chase' ? 'pursue' : brain;
  if (brain === 'auto_harvest') stampAutoHarvest(obj);
  obj.userData.gamesAi = {
    source: 'https://threejs-games.github.io/examples/70-ai/',
    state: brain === 'chase' ? 'pursue' : brain,
    sightDistance: 25,
    followDistance: 1.5,
    patrolDistance: 10,
    attackDistance: 1.25,
  };
  if (
    brain === 'chase' ||
    brain === 'pursue' ||
    brain === 'follow' ||
    brain === 'attack' ||
    brain === 'enemy-deathmatch'
  ) {
    obj.userData.mmoCombat = obj.userData.mmoCombat || {
      aggroRadius: 15,
      leashRadius: 50,
      detectionRadius: 25,
    };
  }
}

export function listStamped(scene: THREE.Scene): {
  terrains: number;
  colliders: number;
  brains: number;
  bvh: number;
} {
  let colliders = 0;
  let brains = 0;
  let bvh = 0;
  scene.traverse((o) => {
    if (o.userData?.physLayer) colliders += 1;
    if (o.userData?.aiBrain || o.userData?.behavior) brains += 1;
    const mesh = o as THREE.Mesh;
    if (mesh.isMesh && mesh.geometry && 'boundsTree' in mesh.geometry) {
      bvh += 1;
    }
  });
  return {
    terrains: listTerrainRoots(scene).length,
    colliders,
    brains,
    bvh,
  };
}

export async function bakeTerrainBvh(scene: THREE.Scene): Promise<number> {
  const { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } =
    await import('three-mesh-bvh');
  const proto = THREE.BufferGeometry.prototype as THREE.BufferGeometry & {
    computeBoundsTree?: typeof computeBoundsTree;
    disposeBoundsTree?: typeof disposeBoundsTree;
  };
  proto.computeBoundsTree = computeBoundsTree;
  proto.disposeBoundsTree = disposeBoundsTree;
  THREE.Mesh.prototype.raycast = acceleratedRaycast;

  let n = 0;
  for (const root of listTerrainRoots(scene)) {
    root.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh || !mesh.geometry) return;
      const geo = mesh.geometry as THREE.BufferGeometry & {
        computeBoundsTree?: () => void;
      };
      geo.computeBoundsTree?.();
      n += 1;
    });
  }
  return n;
}

export async function bakeNavFromTerrain(
  scene: THREE.Scene
): Promise<{ verts: number; ok: boolean; reason?: string }> {
  const { Pathfinding, PathfindingHelper } = await import('three-pathfinding');
  const geo = collectWalkableGeometry(scene);
  if (!geo) return { verts: 0, ok: false, reason: 'No stamped terrain mesh' };
  const pos = geo.getAttribute('position');
  if (!pos || pos.count < 3) {
    geo.dispose();
    return { verts: 0, ok: false, reason: 'Terrain has no triangles' };
  }
  const pathfinding = new Pathfinding();
  try {
    pathfinding.setZoneData(NAV_ZONE, Pathfinding.createZone(geo));
  } catch (err) {
    geo.dispose();
    return {
      verts: pos.count,
      ok: false,
      reason: err instanceof Error ? err.message : 'createZone failed',
    };
  }
  clearNamed(scene, HELPER_NAME);
  const helper = new PathfindingHelper();
  helper.name = HELPER_NAME;
  scene.add(helper);
  nav = { pathfinding, helper };
  return { verts: pos.count, ok: true };
}

export function previewNavPath(
  scene: THREE.Scene,
  startObj: THREE.Object3D,
  end: THREE.Vector3
): number {
  if (!nav) return 0;
  const start = new THREE.Vector3();
  startObj.getWorldPosition(start);
  const group = nav.pathfinding.getGroup(NAV_ZONE, start);
  const path = nav.pathfinding.findPath(start, end, NAV_ZONE, group);
  nav.helper.reset();
  nav.helper.setPlayerPosition(start);
  nav.helper.setTargetPosition(end);
  if (path && path.length) nav.helper.setPath(path);
  return path?.length || 0;
}

type RapierColliderDesc = {
  setSensor?: (s: boolean) => RapierColliderDesc;
};

type RapierNs = {
  init: () => Promise<void>;
  World: new (g: { x: number; y: number; z: number }) => {
    createRigidBody: (d: unknown) => RapierPlayBody['body'];
    createCollider: (s: unknown, b: unknown) => unknown;
    free: () => void;
    timestep?: number;
    step: () => void;
  };
  RigidBodyDesc: {
    dynamic: () => {
      setTranslation: (x: number, y: number, z: number) => unknown;
    };
    kinematicPositionBased: () => {
      setTranslation: (x: number, y: number, z: number) => unknown;
    };
    fixed: () => {
      setTranslation: (x: number, y: number, z: number) => unknown;
    };
  };
  ColliderDesc: {
    capsule: (hh: number, r: number) => RapierColliderDesc;
    cuboid: (x: number, y: number, z: number) => RapierColliderDesc;
    heightfield?: (
      nrows: number,
      ncols: number,
      heights: Float32Array,
      scale: { x: number; y: number; z: number }
    ) => RapierColliderDesc;
  };
};

export async function bakeRapierPreview(
  scene: THREE.Scene
): Promise<{ bodies: number }> {
  const mod = (await import('@dimforge/rapier3d-compat')) as unknown as
    RapierNs | { default: RapierNs };
  const RAPIER: RapierNs =
    'init' in mod && typeof mod.init === 'function'
      ? (mod as RapierNs)
      : (mod as { default: RapierNs }).default;
  await RAPIER.init();
  if (rapierWorld) {
    rapierWorld.world.free();
    rapierWorld = null;
  }
  const gravity = { x: 0, y: -9.81, z: 0 };
  const world = new RAPIER.World(gravity);
  world.timestep = 1 / 60;
  const playBodies: RapierPlayBody[] = [];
  let bodies = 0;
  scene.traverse((o) => {
    if (!o.userData?.physLayer) return;
    if (o.userData.physLayer === 'IgnoreRaycast') return;
    if (hasPhysDescendant(o)) return;
    const box = new THREE.Box3().setFromObject(o);
    if (box.isEmpty()) return;
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const bodyType = String(o.userData.physBody || 'fixed');
    const desc =
      bodyType === 'dynamic'
        ? RAPIER.RigidBodyDesc.dynamic()
        : bodyType === 'kinematicPosition'
          ? RAPIER.RigidBodyDesc.kinematicPositionBased()
          : RAPIER.RigidBodyDesc.fixed();
    const shapeKind = String(o.userData.physShape || 'cuboid');
    const sensor =
      Boolean(o.userData.physSensor) || o.userData.physLayer === 'Water';
    const cover = Number(o.userData.physCoverM);
    const waterCover = Number.isFinite(cover) && cover > 0;
    if (
      shapeKind === 'heightfield' &&
      typeof RAPIER.ColliderDesc.heightfield === 'function'
    ) {
      const hf = sampleHeightfield(o, 32);
      if (hf) {
        desc.setTranslation(hf.cx, 0, hf.cz);
        const body = world.createRigidBody(desc);
        const shape = RAPIER.ColliderDesc.heightfield(
          hf.nrows,
          hf.ncols,
          hf.heights,
          hf.scale
        );
        if (sensor) shape.setSensor?.(true);
        world.createCollider(shape, body);
        playBodies.push({ obj: o, kind: bodyType, body });
        bodies += 1;
        return;
      }
    }
    const hx = waterCover ? cover * 0.5 : Math.max(0.05, size.x * 0.5);
    const hy =
      o.userData.physLayer === 'Water' ? 0.25 : Math.max(0.05, size.y * 0.5);
    const hz = waterCover ? cover * 0.5 : Math.max(0.05, size.z * 0.5);
    desc.setTranslation(
      waterCover ? 0 : center.x,
      o.userData.physLayer === 'Water' ? WORLD_STACK.waterY : center.y,
      waterCover ? 0 : center.z
    );
    const body = world.createRigidBody(desc);
    const shape =
      shapeKind === 'capsule'
        ? RAPIER.ColliderDesc.capsule(
            Math.max(0.05, hy - Math.min(hx, hz)),
            Math.min(hx, hz)
          )
        : RAPIER.ColliderDesc.cuboid(hx, hy, hz);
    if (sensor) shape.setSensor?.(true);
    world.createCollider(shape, body);
    playBodies.push({ obj: o, kind: bodyType, body });
    bodies += 1;
  });
  rapierWorld = { world, bodies: playBodies, acc: 0 };
  return { bodies };
}

const _rapierP = new THREE.Vector3();
const _rapierQ = new THREE.Quaternion();

export function stepRapierPlay(dt: number) {
  if (!rapierWorld) return;
  rapierWorld.acc += Math.min(0.05, dt);
  const step = 1 / 60;
  while (rapierWorld.acc >= step) {
    for (const b of rapierWorld.bodies) {
      if (b.kind !== 'kinematicPosition' || !b.body.setNextKinematicTranslation)
        continue;
      b.obj.getWorldPosition(_rapierP);
      b.body.setNextKinematicTranslation({
        x: _rapierP.x,
        y: _rapierP.y,
        z: _rapierP.z,
      });
    }
    rapierWorld.world.step();
    rapierWorld.acc -= step;
  }
  const q = _rapierQ;
  const p = _rapierP;
  for (const b of rapierWorld.bodies) {
    if (b.kind !== 'dynamic') continue;
    const t = b.body.translation();
    const r = b.body.rotation();
    p.set(t.x, t.y, t.z);
    q.set(r.x, r.y, r.z, r.w);
    if (b.obj.parent) {
      b.obj.parent.worldToLocal(p);
    }
    b.obj.position.copy(p);
    b.obj.quaternion.copy(q);
  }
}

export function disposeRapier() {
  if (rapierWorld) {
    rapierWorld.world.free();
    rapierWorld = null;
  }
}

export async function previewBrain(
  scene: THREE.Scene,
  obj: THREE.Object3D,
  brain: BrainKind
): Promise<string> {
  yukaHandle?.stop();
  yukaHandle = null;
  if (brain === 'spawnpoint' || brain === 'player-deathmatch') {
    return `stamped ${brain} — no preview tick`;
  }
  if (brain === 'auto_harvest') {
    const { stampAutoHarvest } = await import('./npcHarvest');
    stampAutoHarvest(obj);
    return 'auto_harvest — gather 10 then carry bag/wood to camp';
  }
  const { previewGamesAi, stopGamesAiPreview } =
    await import('./gamesAiRuntime');
  const games = await previewGamesAi(scene, obj, brain);
  if (games) {
    yukaHandle = { stop: () => stopGamesAiPreview(scene) };
    return games;
  }
  const yuka = await import('yuka');
  const vehicle = new yuka.Vehicle();
  const wp = new THREE.Vector3();
  obj.getWorldPosition(wp);
  vehicle.position.set(wp.x, wp.y, wp.z);
  vehicle.maxSpeed = 2.4;
  if (brain === 'chase' || brain === 'attack' || brain === 'enemy-deathmatch') {
    const target = new yuka.Vector3(wp.x + 8, wp.y, wp.z + 8);
    vehicle.steering.add(new yuka.SeekBehavior(target));
  } else {
    vehicle.steering.add(new yuka.WanderBehavior(4, 6, 2));
  }
  const marker = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 10, 10),
    new THREE.MeshBasicMaterial({ color: 0xffc53d })
  );
  marker.name = HELPER_NAME;
  marker.position.copy(wp);
  scene.add(marker);
  let alive = true;
  let last = performance.now();
  const tick = () => {
    if (!alive) return;
    const now = performance.now();
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    vehicle.update(dt);
    marker.position.set(
      vehicle.position.x,
      vehicle.position.y,
      vehicle.position.z
    );
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  const timer = window.setTimeout(() => {
    alive = false;
    scene.remove(marker);
    marker.geometry.dispose();
    (marker.material as THREE.Material).dispose();
  }, 6000);
  yukaHandle = {
    stop: () => {
      alive = false;
      window.clearTimeout(timer);
      scene.remove(marker);
    },
  };
  return `preview ${brain} (6s)`;
}

export function clearSystemHelpers(scene: THREE.Scene) {
  yukaHandle?.stop();
  yukaHandle = null;
  nav = null;
  void import('./gamesAiRuntime').then((m) => m.stopGamesAiPreview(scene));
  clearNamed(scene, HELPER_NAME);
}

function clearNamed(scene: THREE.Scene, name: string) {
  const doomed: THREE.Object3D[] = [];
  scene.traverse((o) => {
    if (o.name === name) doomed.push(o);
  });
  for (const o of doomed) {
    o.parent?.remove(o);
  }
}

function hasPhysDescendant(root: THREE.Object3D): boolean {
  let hit = false;
  root.traverse((c) => {
    if (c !== root && c.userData?.physLayer) hit = true;
  });
  return hit;
}

const _hfRay = new THREE.Raycaster();
const _hfOrigin = new THREE.Vector3();
const _hfDown = new THREE.Vector3(0, -1, 0);

/** Same mesh the feet sample — one height field, not a second ground. */
function sampleHeightfield(
  root: THREE.Object3D,
  cells: number
): {
  nrows: number;
  ncols: number;
  heights: Float32Array;
  scale: { x: number; y: number; z: number };
  cx: number;
  cz: number;
} | null {
  const meshes: THREE.Object3D[] = [];
  root.traverse((o) => {
    const layer = String(o.userData?.contentLayer || '');
    if (
      o.userData?.harvestKind ||
      layer === 'harvestable' ||
      layer === 'npc' ||
      layer === 'animal' ||
      layer === 'monster'
    )
      return;
    if (o.userData?.grassField || o.name === '__grassField') return;
    const m = o as THREE.Mesh;
    if (m.isMesh && m.geometry) meshes.push(m);
  });
  if (!meshes.length) return null;
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  if (box.isEmpty()) return null;
  const sx = Math.max(box.max.x - box.min.x, 1);
  const sz = Math.max(box.max.z - box.min.z, 1);
  const ncols = cells;
  const nrows = cells;
  const heights = new Float32Array((nrows + 1) * (ncols + 1));
  const fallback = box.min.y;
  _hfRay.far = 4000;
  for (let row = 0; row <= nrows; row++) {
    const z = box.min.z + (row / nrows) * sz;
    for (let col = 0; col <= ncols; col++) {
      const x = box.min.x + (col / ncols) * sx;
      _hfOrigin.set(x, box.max.y + 80, z);
      _hfRay.set(_hfOrigin, _hfDown);
      const hits = _hfRay.intersectObjects(meshes, false);
      heights[row * (ncols + 1) + col] = hits.length
        ? hits[0].point.y
        : fallback;
    }
  }
  return {
    nrows,
    ncols,
    heights,
    scale: { x: sx, y: 1, z: sz },
    cx: (box.min.x + box.max.x) * 0.5,
    cz: (box.min.z + box.max.z) * 0.5,
  };
}

function collectWalkableGeometry(
  scene: THREE.Scene
): THREE.BufferGeometry | null {
  const roots = listTerrainRoots(scene);
  const parts: THREE.BufferGeometry[] = [];
  for (const root of roots) {
    root.updateMatrixWorld(true);
    root.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh || !mesh.geometry) return;
      const layer = String(o.userData?.contentLayer || '');
      if (
        o.userData?.harvestKind ||
        layer === 'harvestable' ||
        layer === 'npc' ||
        layer === 'animal' ||
        layer === 'monster' ||
        o.userData?.grassField ||
        o.name === '__grassField'
      )
        return;
      const cloned = mesh.geometry.clone();
      cloned.applyMatrix4(mesh.matrixWorld);
      parts.push(cloned);
    });
  }
  if (!parts.length) return null;
  const merged = mergeBufferGeometries(parts, false);
  for (const p of parts) p.dispose();
  return merged;
}

/** Local merge — editor bake only; production nav stays Forge recast. */
function mergeBufferGeometries(
  geos: THREE.BufferGeometry[],
  _useGroups: boolean
): THREE.BufferGeometry | null {
  const positions: number[] = [];
  const indices: number[] = [];
  let offset = 0;
  for (const g of geos) {
    const pos = g.getAttribute('position');
    if (!pos) continue;
    for (let i = 0; i < pos.count; i += 1) {
      positions.push(pos.getX(i), pos.getY(i), pos.getZ(i));
    }
    const idx = g.getIndex();
    if (idx) {
      for (let i = 0; i < idx.count; i += 1) indices.push(idx.getX(i) + offset);
    } else {
      for (let i = 0; i < pos.count; i += 1) indices.push(offset + i);
    }
    offset += pos.count;
  }
  if (!positions.length) return null;
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  out.setIndex(indices);
  return out;
}
