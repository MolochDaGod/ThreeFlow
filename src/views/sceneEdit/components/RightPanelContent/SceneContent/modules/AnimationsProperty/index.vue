<template>
  <div class="animations-property">
    <el-scrollbar max-height="278px" height="278px">
      <div class="animations-list">
        <div
          class="animations-list-item"
          :class="currentAnimationUUids.includes(item.uuid) ? 'active' : ''"
          v-for="item in animationsList"
          :key="item.uuid"
          @click.prevent="chooseAnimation(item)"
        >
          <div class="animation-name">
            {{ item.name }}
          </div>
          <div
            class="animation-icon"
            v-if="currentAnimationUUids.includes(item.uuid)"
          >
            <span class="play-status"> 播放中 </span>
            <span class="iconfont icon-donghua"></span>
          </div>
        </div>
      </div>
    </el-scrollbar>
    <div class="animation-form">
      <div class="form-item">
        <div class="item-label">播放速度</div>
        <div class="item-value">
          <el-slider
            :min="0"
            :max="5"
            show-input
            :step="0.1"
            :precision="2"
            v-model="actionParams.timeScale"
            :show-input-controls="false"
            @change="updateActionParams"
          ></el-slider>
        </div>
      </div>
      <div class="form-item">
        <div class="item-label">动作幅度</div>
        <div class="item-value">
          <el-slider
            :min="0"
            :max="5"
            show-input
            :step="0.1"
            :precision="2"
            v-model="actionParams.weight"
            :show-input-controls="false"
            @change="updateActionParams"
          ></el-slider>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue';
import * as THREE from 'three';
import { useSceneStore } from '@/store/sceneEditStore';
import type { ActionParams } from '@/types/rightPanelTypes';

defineProps<{
  animationsList: THREE.AnimationClip[];
}>();

const store = useSceneStore();

const actionParams = reactive<ActionParams>({
  loop: THREE.LoopRepeat,
  paused: false,
  weight: 1,
  timeScale: 1,
});

//当前播放的动画uuid
const currentAnimationUUids = computed(() => {
  const actions = store.sceneApi?.animationModules?.currentActions.get(
    store.currentTransformMaterialUuid || ''
  ) as THREE.AnimationAction[] | undefined;

  const uuids =
    actions?.map((action: THREE.AnimationAction) => action.getClip()?.uuid) ||
    [];
  return uuids;
});

//当前模型
const currentModel = computed(() => {
  const uuid = store.currentTransformMaterialUuid;
  const model = store.sceneApi?.scene?.getObjectByProperty(
    'uuid',
    uuid
  ) as THREE.Group;

  if (model && model.isGroup) {
    return model;
  }
  return null;
});

onMounted(() => {
  if (currentAnimationUUids.value) {
    actionParams.paused = true;
  }
});

// 选择动画
const chooseAnimation = async (item: THREE.AnimationClip) => {
  if (currentAnimationUUids.value.includes(item.uuid)) {
    store.sceneApi?.animationModules?.updateActionAnimationMap(
      currentModel.value?.uuid || '',
      item.uuid
    );
    return;
  }
  if (currentModel.value) {
    actionParams.paused = true;
    store.sceneApi?.animationModules?.playAnimation(item, currentModel.value);
  }
};

const updateActionParams = () => {
  store.sceneApi?.animationModules?.updateAnimationParams(
    actionParams,
    currentModel.value?.uuid || ''
  );
};
</script>
<style lang="scss" scoped src="./index.scss"></style>
