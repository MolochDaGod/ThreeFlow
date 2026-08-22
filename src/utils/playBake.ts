/**
 * Play-mode bake of the current scene — not a second play engine.
 * Hides editor gizmos, arms one mixer per kit root, bakes Rapier + BVH.
 */
import * as THREE from 'three';
import {
  bakeRapierPreview,
  bakeTerrainBvh,
  stepRapierPlay,
} from './systemsRuntime';
import {
  applyLayerRender,
  disposePlayQuery,
  getPlayQuery,
  loadLayerRender,
  peekPlayQuery,
  refreshPlayQuery,
} from './contentLayers';
import { PLAY_PERF } from '@/config/fleetSystems';
import { findRaceKitRoot } from './raceKit';
import { bindKitAnims, getKitAnimBind } from './kitAnim';
import type { WeaponSkillPack } from './raceKit';

const HIDDEN = '__playHidden';

function isEditorGizmo(o: THREE.Object3D): boolean {
  if (
    o instanceof THREE.BoxHelper ||
    o instanceof THREE.AxesHelper ||
    o instanceof THREE.GridHelper ||
    o instanceof THREE.CameraHelper ||
    o instanceof THREE.DirectionalLightHelper ||
    o instanceof THREE.PointLightHelper ||
    o instanceof THREE.SpotLightHelper ||
    o instanceof THREE.HemisphereLightHelper ||
    o instanceof THREE.SkeletonHelper
  )
    return true;
  const n = o.name || '';
  if (n === '__fleetSystemsHelper' || n.startsWith('__tfHelper')) return true;
  if (o.userData?.isHelper || o.userData?.editorGizmo) return true;
  return /helper|gizmo|axeshelper|boxhelper/i.test(n);
}

export function hideEditorGizmos(scene: THREE.Scene) {
  scene.traverse((o) => {
    if (o === scene || !isEditorGizmo(o)) return;
    if (o.userData[HIDDEN] == null) o.userData[HIDDEN] = o.visible;
    o.visible = false;
  });
}

export function restoreEditorGizmos(scene: THREE.Scene) {
  scene.traverse((o) => {
    if (o.userData[HIDDEN] == null) return;
    o.visible = Boolean(o.userData[HIDDEN]);
    delete o.userData[HIDDEN];
  });
}

function isCharacterRoot(o: THREE.Object3D): boolean {
  if (o.userData?.playAs || o.userData?.player || o.userData?.raceKit)
    return true;
  const layer = String(o.userData?.contentLayer || '');
  return (
    layer === 'player' ||
    layer === 'npc' ||
    layer === 'monster' ||
    layer === 'animal'
  );
}

function packOf(o: THREE.Object3D): WeaponSkillPack {
  const p = o.userData?.animPack || o.userData?.raceKit?.animPack;
  if (
    p === 'sword_shield' ||
    p === '2h_melee' ||
    p === 'longbow' ||
    p === 'magic' ||
    p === 'spear_melee' ||
    p === 'unarmed'
  )
    return p;
  return 'sword_shield';
}

export function armPlaySkeletons(
  scene: THREE.Scene,
  animationModules: {
    playExclusive: (clip: THREE.AnimationClip, model: THREE.Object3D) => void;
    playAnimation: (clip: THREE.AnimationClip, model: THREE.Object3D) => void;
    initializeAnimations: () => void;
    ensureMixer?: (model: THREE.Object3D) => THREE.AnimationMixer;
  }
): number {
  animationModules.initializeAnimations();
  const seen = new Set<string>();
  let n = 0;
  scene.traverse((o) => {
    if (o === scene || !isCharacterRoot(o)) return;
    const root = findRaceKitRoot(o) || o;
    if (seen.has(root.uuid)) return;
    seen.add(root.uuid);
    n += 1;
    animationModules.ensureMixer?.(root);
    const bind = getKitAnimBind(root);
    if (bind?.roles.idle) {
      animationModules.playExclusive(bind.roles.idle, root);
      root.userData.kitGait = 'idle';
      return;
    }
    if (root.userData?.raceKit || root.userData?.player) {
      void bindKitAnims(root, packOf(root)).then((b) => {
        if (b.roles.idle) {
          animationModules.playExclusive(b.roles.idle, root);
          root.userData.kitGait = 'idle';
        }
      });
      return;
    }
    const clips = root.animations || [];
    const idle = clips.find((c) => /idle|stand|wait/i.test(c.name)) || clips[0];
    if (idle) animationModules.playExclusive(idle, root);
  });
  return n;
}

export function applyPlayGpuLaw(
  scene: THREE.Scene,
  camera?: THREE.PerspectiveCamera,
  renderer?: THREE.WebGLRenderer
) {
  const q = refreshPlayQuery(scene);
  if (q.sun) {
    q.sun.castShadow = true;
    q.sun.shadow.mapSize.set(PLAY_PERF.shadowMap, PLAY_PERF.shadowMap);
    q.sun.shadow.bias = -0.0004;
    q.sun.shadow.normalBias = 0.04;
    const sc = q.sun.shadow.camera as THREE.OrthographicCamera;
    const h = PLAY_PERF.shadowHalfM;
    sc.left = -h;
    sc.right = h;
    sc.top = h;
    sc.bottom = -h;
    sc.near = 1;
    sc.far = PLAY_PERF.shadowFarM;
    sc.updateProjectionMatrix();
    q.sun.shadow.needsUpdate = true;
  }
  if (camera) {
    camera.userData.editNear = camera.near;
    camera.userData.editFar = camera.far;
    camera.near = PLAY_PERF.cameraNear;
    camera.far = PLAY_PERF.cameraFarPlay;
    camera.updateProjectionMatrix();
  }
  if (renderer) {
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, PLAY_PERF.pixelRatioMax)
    );
  }
  scene.traverse((o) => {
    const sm = o as THREE.SkinnedMesh;
    if (sm.isSkinnedMesh) sm.frustumCulled = false;
  });
}

const _sunPos = new THREE.Vector3();
const _sunTgt = new THREE.Vector3();
const _sunDir = new THREE.Vector3();

export function followPlayShadow(scene: THREE.Scene, player: THREE.Object3D) {
  const sun = peekPlayQuery()?.sun ?? getPlayQuery(scene).sun;
  if (!sun) return;
  sun.getWorldPosition(_sunPos);
  sun.target.getWorldPosition(_sunTgt);
  _sunDir.subVectors(_sunPos, _sunTgt);
  if (_sunDir.lengthSq() < 1e-4) _sunDir.set(36, 72, 28);
  else _sunDir.setLength(90);
  const px = player.position.x;
  const py = player.position.y;
  const pz = player.position.z;
  sun.position.set(px + _sunDir.x, py + _sunDir.y, pz + _sunDir.z);
  sun.target.position.set(px, py, pz);
  sun.target.updateMatrixWorld();
  sun.updateMatrixWorld();
}

export function restorePlayGpuLaw(camera?: THREE.PerspectiveCamera) {
  if (camera) {
    camera.near = Number(camera.userData.editNear) || 0.05;
    camera.far = Number(camera.userData.editFar) || PLAY_PERF.cameraFarEdit;
    camera.updateProjectionMatrix();
  }
  disposePlayQuery();
}

export async function enterPlayBake(
  scene: THREE.Scene,
  animationModules: {
    playExclusive: (clip: THREE.AnimationClip, model: THREE.Object3D) => void;
    playAnimation: (clip: THREE.AnimationClip, model: THREE.Object3D) => void;
    initializeAnimations: () => void;
  }
): Promise<{ bodies: number; skeletons: number; bvh: number }> {
  hideEditorGizmos(scene);
  applyLayerRender(scene, loadLayerRender());
  refreshPlayQuery(scene);
  scene.traverse((o) => {
    if (o === scene || !isCharacterRoot(o)) return;
    if (o.userData.physLayer) return;
    o.userData.physLayer =
      o.userData.playAs || o.userData.player ? 'Player' : 'NPC';
    o.userData.physBody = 'kinematicPosition';
    o.userData.physShape = 'capsule';
  });
  const bvh = await bakeTerrainBvh(scene);
  const { bodies } = await bakeRapierPreview(scene);
  const skeletons = armPlaySkeletons(scene, animationModules);
  return { bodies, skeletons, bvh };
}

export function tickPlayBake(dt: number, scene?: THREE.Scene) {
  if (scene) getPlayQuery(scene);
  stepRapierPlay(dt);
}

export function exitPlayBake(
  scene: THREE.Scene,
  camera?: THREE.PerspectiveCamera
) {
  restoreEditorGizmos(scene);
  restorePlayGpuLaw(camera);
}
