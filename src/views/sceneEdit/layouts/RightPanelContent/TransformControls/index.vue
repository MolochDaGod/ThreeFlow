<template>
  <div class="transform-controls">
    <div
      v-for="item in transformTypeList"
      :key="item.type"
      class="transform-controls-item"
      :class="{
        active: transformControlsType === item.type,
      }"
      @click="handleTransformControlsType(item.type)"
    >
      <el-tooltip :content="item.tooltip" placement="left">
        <span :class="item.icon" class="iconfont"></span>
      </el-tooltip>
    </div>
    <div class="transform-controls-item" v-if="currentView">
      <el-tooltip content="当前视角：第一人称" placement="left">
        <span
          class="iconfont icon-shubiaozhizhen-diyirenchengmanyou-yidong"
        ></span>
      </el-tooltip>
    </div>
    <div class="transform-controls-item" @click="switchCurrentView" v-else>
      <el-tooltip content="当前视角：第三人称" placement="left">
        <span class="iconfont icon-a-disanrencheng1x"></span>
      </el-tooltip>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useSceneStore } from '@/store/sceneEditStore';
import { TRANSFORM_CONTROLS_TYPE } from '@/enums/enum';

const transformTypeList = [
  {
    type: TRANSFORM_CONTROLS_TYPE.Translate,
    icon: 'icon-tuozhuai',
    tooltip: '拖拽（快捷键：W）',
  },
  {
    type: TRANSFORM_CONTROLS_TYPE.Rotate,
    icon: 'icon-xuanzhuan',
    tooltip: '旋转（快捷键：E）',
  },
  {
    type: TRANSFORM_CONTROLS_TYPE.Scale,
    icon: 'icon-suofang',
    tooltip: '缩放（快捷键：R）',
  },
];

const transformKeyMap = {
  w: TRANSFORM_CONTROLS_TYPE.Translate,
  e: TRANSFORM_CONTROLS_TYPE.Rotate,
  r: TRANSFORM_CONTROLS_TYPE.Scale,
  W: TRANSFORM_CONTROLS_TYPE.Translate,
  E: TRANSFORM_CONTROLS_TYPE.Rotate,
  R: TRANSFORM_CONTROLS_TYPE.Scale,
};
const store = useSceneStore();

// 当前视角
const currentView = computed(() => {
  return store.sceneApi?.pointerLockControls ? true : false;
});

const transformControlsType = ref<TRANSFORM_CONTROLS_TYPE>(
  TRANSFORM_CONTROLS_TYPE.Translate
);

onMounted(() => {
  window.addEventListener('keydown', keyDownEventListener);
});
onUnmounted(() => {
  window.removeEventListener('keydown', keyDownEventListener);
});

const keyDownEventListener = (event: KeyboardEvent) => {
  if (currentView.value) return;
  const type = transformKeyMap[event.key as keyof typeof transformKeyMap];
  if (type) {
    transformControlsType.value = type;
    store.sceneApi?.transformControlsModules.transformControls?.setMode(type);
  }
  // Ctrl/Cmd + Z: 撤销
  if (
    (event.ctrlKey || event.metaKey) &&
    !event.shiftKey &&
    event.key.toLowerCase() === 'z'
  ) {
    event.preventDefault();
    store.sceneApi?.historyModules.undo();
  } else if (
    (event.ctrlKey || event.metaKey) &&
    event.shiftKey &&
    event.key.toLowerCase() === 'z'
  ) {
    //Ctrl+Shift+Z 重做
    event.preventDefault();
    store.sceneApi?.historyModules.redo();
  } else if (event.key.toLowerCase() === 'f') {
    //F 聚焦
    event.preventDefault();
    const mesh = store.sceneApi?.scene?.getObjectByProperty(
      'uuid',
      store.currentTransformMaterialUuid
    );
    if (mesh) {
      store.sceneApi?.transformControlsModules.focusOnObject(mesh);
    }
  }
};
// 变换控制器类型切换
const handleTransformControlsType = (type: TRANSFORM_CONTROLS_TYPE) => {
  transformControlsType.value = type;
  store.sceneApi?.transformControlsModules.transformControls?.setMode(type);
};

const switchCurrentView = () => {
  store.sceneApi?.createPointerLockControls();
};
</script>
<style lang="scss" scoped src="./index.scss"></style>
