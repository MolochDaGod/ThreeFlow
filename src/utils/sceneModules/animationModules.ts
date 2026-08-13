import * as THREE from 'three';
import { Timer } from 'three';
import { toRaw } from 'vue';
import type { ActionParams } from '@/types/rightPanelTypes';
import { useSceneStore } from '@/store/sceneEditStore';

const store = useSceneStore();

/**
 * @description Animation模块
 */
class animationModules {
  // Animation混合器
  animationMixers: Map<string, THREE.AnimationMixer>;
  // 当前Animation
  currentActions: Map<string, THREE.AnimationAction[]>;
  // Animation计时器（替代已弃用的 Clock）
  animationTimer: Timer;
  // Animation帧请求ID
  animationFrame: number | null;
  constructor() {
    this.animationMixers = new Map();
    this.currentActions = new Map();
    this.animationTimer = new Timer();
    this.animationTimer.connect(document);
    this.animationFrame = null;
  }

  /**
   * 初始化Scene中所有带Animation的Models
   * @param scene Scene对象
   */
  initializeAnimations() {
    const scene = store.sceneApi?.scene;
    // 找到需要播放Animation的Models
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
   * 播放Animation
   * @param animationClip Animation片段
   * @param model Models
   */
  playAnimation(animationClip: THREE.AnimationClip, model: THREE.Object3D) {
    let currentMixer = this.animationMixers.get(model.uuid);
    if (!currentMixer) {
      currentMixer = new THREE.AnimationMixer(toRaw(model));
      this.animationMixers.set(model.uuid, toRaw(currentMixer));
    }
    const newAction = currentMixer.clipAction(toRaw(animationClip));
    const currentActions = this.currentActions.get(model.uuid) || [];

    // 同时播放新Animation（不停止旧Animation）
    newAction.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).play();

    this.currentActions.set(model.uuid, [...currentActions, toRaw(newAction)]); // 存储所有动作

    // 更新ModelsuserData中的Animation名称列表
    if (!model.userData.playAnimationList) {
      model.userData.playAnimationList = [];
    }

    // 注意 ⚠️ 将current model已播放的Animation名称，存储下来 页面初始化加载时，需要用到
    if (!model.userData.playAnimationList.includes(animationClip.name)) {
      model.userData.playAnimationList.push(animationClip.name);
    }

    if (!this.animationFrame) {
      this.animationFrameFun();
    }
  }
  /**
   * Animation帧请求
   */
  private animationFrameFun() {
    this.animationFrame = requestAnimationFrame((timestamp) => {
      this.animationTimer.update(timestamp);
      const delta = this.animationTimer.getDelta();

      // 更新所有Models的Animation
      this.animationMixers.forEach((mixer, modelId) => {
        const actions = this.currentActions.get(modelId) || [];
        actions.forEach((action) => {
          if (!action.paused) mixer.update(delta);
        });
      });

      this.animationFrameFun();
    });
  }
  /**
   * update animation params
   * @param params animation params
   * @param mapId Animation映射 ID
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
   * 更新Animation暂停状态
   * @param mapId Animation映射 ID
   * @param uuid AnimationUUID
   */
  updateActionAnimationMap(mapId: string, uuid: string) {
    const actionList = this.currentActions.get(mapId);
    if (!actionList) return;

    // 查找要停止的Animation名称
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

    // 从ModelsuserData中移除Animation名称
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
   * 清除Animation
   */
  clear() {
    this.animationMixers.forEach((mixer) => {
      // 清空ModelsuserData中的Animation列表
      const root = mixer.getRoot();
      if (root && 'userData' in root && root.userData) {
        root.userData.playAnimationList = [];
      }
      mixer.stopAllAction();
      mixer.update(0);
    });

    this.animationMixers.clear();
    this.currentActions.clear();

    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }
}

export default animationModules;
