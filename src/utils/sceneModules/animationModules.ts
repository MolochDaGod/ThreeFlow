import * as THREE from 'three';
import { Timer } from 'three';
import { toRaw } from 'vue';
import type { ActionParams } from '@/types/rightPanelTypes';
import { useSceneStore } from '@/store/sceneEditStore';
import { FootGrounder } from '@/utils/legIk';
import { sampleTerrainAt } from '@/utils/terrainGround';
import { stripRootMotion } from '@/utils/kitAnim';

const store = useSceneStore();
const OVERLAY_GAIT_WEIGHT = 0.4;
const OVERLAY_WEIGHT = 0.85;

/**
 * @description Animationmodule
 */
class animationModules {
  // Animationmixer
  animationMixers: Map<string, THREE.AnimationMixer>;
  // currentAnimation
  currentActions: Map<string, THREE.AnimationAction[]>;
  // animation timer (replaces deprecated Clock)
  animationTimer: Timer;
  // AnimationrafID
  animationFrame: number | null;
  gaitActions: Map<string, THREE.AnimationAction>;
  overlayActions: Map<string, THREE.AnimationAction>;
  overlayDone: Map<string, () => void>;
  footers: Map<string, FootGrounder>;
  constructor() {
    this.animationMixers = new Map();
    this.currentActions = new Map();
    this.gaitActions = new Map();
    this.overlayActions = new Map();
    this.overlayDone = new Map();
    this.footers = new Map();
    this.animationTimer = new Timer();
    this.animationTimer.connect(document);
    this.animationFrame = null;
  }

  /**
   * Play stored clips on every scene object that has them.
   * @param scene scene
   */
  initializeAnimations() {
    const scene = store.sceneApi?.scene;
    // objects that already list clips to resume
    const animationModelList = scene?.children.filter((item) => {
      return (
        item.userData.playAnimationList &&
        item.userData.playAnimationList.length > 0
      );
    });

    animationModelList?.forEach((model: THREE.Object3D) => {
      const animations = model.animations;
      if (!animations || animations.length === 0) return;
      animations.forEach((animation) => {
        const playAnimationList: string[] =
          (model.userData.playAnimationList as unknown as string[]) || [];

        const findPlay = playAnimationList.find(
          (item: string) => item === animation.name
        );
        if (findPlay) {
          this.playAnimation(animation, model);
        }
      });
    });
  }

  /**
   * playAnimation
   * @param animationClip Animationclip
   * @param model Models
   */
  ensureMixer(model: THREE.Object3D): THREE.AnimationMixer {
    let mixer = this.animationMixers.get(model.uuid);
    if (!mixer) {
      mixer = new THREE.AnimationMixer(toRaw(model));
      this.animationMixers.set(model.uuid, toRaw(mixer));
    }
    if (!this.footers.has(model.uuid)) {
      const fg = new FootGrounder();
      fg.bind(model);
      fg.setEnabled(true);
      fg.setGroundSampler((x, z) => {
        const scene = store.sceneApi?.scene;
        return scene ? sampleTerrainAt(scene, x, z) : { y: 0, normal: null };
      });
      this.footers.set(model.uuid, fg);
    }
    return mixer;
  }

  playAnimation(animationClip: THREE.AnimationClip, model: THREE.Object3D) {
    const clip = stripRootMotion(toRaw(animationClip));
    const name = (clip.name || '').toLowerCase();
    if (
      /attack|harvest|hoe|gather|jump|dodge|chop|till|slash|punch/.test(name)
    ) {
      this.playOverlay(clip, model);
      return;
    }
    this.crossFadeGait(clip, model, 0.16);
  }

  /** Gait crossfade — idle/walk/run/climb/swim. Does not stop overlay one-shots. */
  crossFadeGait(clip: THREE.AnimationClip, model: THREE.Object3D, fade = 0.18) {
    const mixer = this.ensureMixer(model);
    const safe = stripRootMotion(toRaw(clip));
    const next = mixer.clipAction(safe);
    next.enabled = true;
    next.setLoop(THREE.LoopRepeat, Infinity);
    next.setEffectiveTimeScale(1);
    const overlayOn = this.overlayActions.has(model.uuid);
    const gaitW = overlayOn ? OVERLAY_GAIT_WEIGHT : 1;
    const prev = this.gaitActions.get(model.uuid);
    if (prev && prev !== next) {
      next.reset().setEffectiveWeight(gaitW).play();
      prev.crossFadeTo(next, fade, false);
    } else {
      next.reset().fadeIn(fade).setEffectiveWeight(gaitW).play();
    }
    this.gaitActions.set(model.uuid, next);
    this.syncActionList(model);
    if (!this.animationFrame) this.animationFrameFun();
  }

  /** Attack / harvest / jump overlay — loco stays at OVERLAY_GAIT_WEIGHT. */
  playOverlay(
    clip: THREE.AnimationClip,
    model: THREE.Object3D,
    opts?: { fade?: number }
  ) {
    const mixer = this.ensureMixer(model);
    const fade = opts?.fade ?? 0.1;
    const prev = this.overlayActions.get(model.uuid);
    if (prev) prev.fadeOut(fade);
    const prevDone = this.overlayDone.get(model.uuid);
    if (prevDone) mixer.removeEventListener('finished', prevDone);

    const safe = stripRootMotion(toRaw(clip));
    const action = mixer.clipAction(safe);
    action.reset();
    action.setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = true;
    action.setEffectiveWeight(OVERLAY_WEIGHT);
    action.fadeIn(fade).play();
    this.overlayActions.set(model.uuid, action);
    const gait = this.gaitActions.get(model.uuid);
    if (gait) gait.setEffectiveWeight(OVERLAY_GAIT_WEIGHT);
    const onDone = () => {
      mixer.removeEventListener('finished', onDone);
      if (this.overlayDone.get(model.uuid) === onDone) {
        this.overlayDone.delete(model.uuid);
      }
      if (this.overlayActions.get(model.uuid) === action) {
        action.fadeOut(fade);
        this.overlayActions.delete(model.uuid);
        gait?.setEffectiveWeight(1);
      }
    };
    this.overlayDone.set(model.uuid, onDone);
    mixer.addEventListener('finished', onDone);
    this.syncActionList(model);
    if (!this.animationFrame) this.animationFrameFun();
  }

  /** Inspector / fallback: gait replace with fade. One-shots use overlay. */
  playExclusive(
    animationClip: THREE.AnimationClip,
    model: THREE.Object3D,
    opts?: { loopOnce?: boolean }
  ) {
    if (opts?.loopOnce) {
      this.playOverlay(animationClip, model);
      return;
    }
    this.crossFadeGait(animationClip, model, 0.16);
  }

  private syncActionList(model: THREE.Object3D) {
    const list = [
      this.gaitActions.get(model.uuid),
      this.overlayActions.get(model.uuid),
    ].filter(Boolean) as THREE.AnimationAction[];
    this.currentActions.set(model.uuid, list);
  }
  /**
   * Animationraf
   */
  private animationFrameFun() {
    this.animationFrame = requestAnimationFrame((timestamp) => {
      this.animationTimer.update(timestamp);
      const delta = this.animationTimer.getDelta();

      this.animationMixers.forEach((mixer, modelId) => {
        this.footers.get(modelId)?.beginFrame();
        mixer.update(delta);
        this.footers.get(modelId)?.apply(delta);
      });

      this.animationFrameFun();
    });
  }
  /**
   * update animation params
   * @param params animation params
   * @param mapId Animationmap ID
   */
  updateAnimationParams(params: ActionParams, mapId: string) {
    const actionList = this.currentActions.get(mapId);
    if (!actionList) return false;
    actionList.forEach((action) => {
      Object.assign(action, {
        weight: params?.weight,
        timeScale: params?.timeScale,
      });
    });
  }
  /**
   * updateAnimationpaused state
   * @param mapId Animationmap ID
   * @param uuid AnimationUUID
   */
  updateActionAnimationMap(mapId: string, uuid: string) {
    const actionList = this.currentActions.get(mapId);
    if (!actionList) return;

    // find clip to stopAnimationname
    let clipNameToRemove: string | undefined;

    const newActionList = actionList.filter((action) => {
      const clip = action.getClip();
      if (clip?.uuid === uuid) {
        action.paused = true;
        action.stop();
        clipNameToRemove = clip.name;
      }
      return clip?.uuid !== uuid;
    });

    // drop the clip name from model.userData
    if (clipNameToRemove) {
      const mixer = this.animationMixers.get(mapId);
      if (mixer) {
        const root = mixer.getRoot();
        if (
          root &&
          'userData' in root &&
          root.userData &&
          Array.isArray(root.userData.playAnimationList)
        ) {
          const index =
            root.userData.playAnimationList.indexOf(clipNameToRemove);
          if (index !== -1) {
            root.userData.playAnimationList.splice(index, 1);
          }
        }
      }
    }
    this.currentActions.set(mapId, newActionList);
  }
  /**
   * clearAnimation
   */
  clear() {
    this.animationMixers.forEach((mixer) => {
      // clearModelsuserDataAnimationlist
      const root = mixer.getRoot();
      if (root && 'userData' in root && root.userData) {
        root.userData.playAnimationList = [];
      }
      mixer.stopAllAction();
      mixer.update(0);
    });

    this.animationMixers.clear();
    this.currentActions.clear();
    this.gaitActions.clear();
    this.overlayActions.clear();
    this.overlayDone.clear();
    this.footers.forEach((fg) => fg.setEnabled(false));
    this.footers.clear();

    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }
}

export default animationModules;
