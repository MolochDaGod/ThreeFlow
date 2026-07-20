import * as THREE from 'three';
import { Timer } from 'three';
import { toRaw } from 'vue';
import type { ActionParams } from '@/types/rightPanelTypes';
import { useSceneStore } from '@/store/sceneEditStore';

const store = useSceneStore();

/**
 * @description 动画模块
 */
class animationModules {
  // 动画混合器
  animationMixers: Map<string, THREE.AnimationMixer>;
  // 当前动画
  currentActions: Map<string, THREE.AnimationAction[]>;
  // 动画计时器（替代已弃用的 Clock）
  animationTimer: Timer;
  // 动画帧请求ID
  animationFrame: number | null;
  constructor() {
    this.animationMixers = new Map();
    this.currentActions = new Map();
    this.animationTimer = new Timer();
    this.animationTimer.connect(document);
    this.animationFrame = null;
  }

  /**
   * 初始化场景中所有带动画的模型
   * @param scene 场景对象
   */
  initializeAnimations() {
    const scene = store.sceneApi?.scene;
    // 找到需要播放动画的模型
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
   * 播放动画
   * @param animationClip 动画片段
   * @param model 模型
   */
  playAnimation(animationClip: THREE.AnimationClip, model: THREE.Object3D) {
    let currentMixer = this.animationMixers.get(model.uuid);
    if (!currentMixer) {
      currentMixer = new THREE.AnimationMixer(toRaw(model));
      this.animationMixers.set(model.uuid, toRaw(currentMixer));
    }
    const newAction = currentMixer.clipAction(toRaw(animationClip));
    const currentActions = this.currentActions.get(model.uuid) || [];

    // 同时播放新动画（不停止旧动画）
    newAction.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).play();

    this.currentActions.set(model.uuid, [...currentActions, toRaw(newAction)]); // 存储所有动作

    // 更新模型userData中的动画名称列表
    if (!model.userData.playAnimationList) {
      model.userData.playAnimationList = [];
    }

    // 注意 ⚠️ 将当前模型已播放的动画名称，存储下来 页面初始化加载时，需要用到
    if (!model.userData.playAnimationList.includes(animationClip.name)) {
      model.userData.playAnimationList.push(animationClip.name);
    }

    if (!this.animationFrame) {
      this.animationFrameFun();
    }
  }
  /**
   * 动画帧请求
   */
  private animationFrameFun() {
    this.animationFrame = requestAnimationFrame((timestamp) => {
      this.animationTimer.update(timestamp);
      const delta = this.animationTimer.getDelta();

      // 更新所有模型的动画
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
   * 更新动画参数
   * @param params 动画参数
   * @param mapId 动画映射 ID
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
   * 更新动画暂停状态
   * @param mapId 动画映射 ID
   * @param uuid 动画UUID
   */
  updateActionAnimationMap(mapId: string, uuid: string) {
    const actionList = this.currentActions.get(mapId);
    if (!actionList) return;

    // 查找要停止的动画名称
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

    // 从模型userData中移除动画名称
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
   * 清除动画
   */
  clear() {
    this.animationMixers.forEach((mixer) => {
      // 清空模型userData中的动画列表
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
