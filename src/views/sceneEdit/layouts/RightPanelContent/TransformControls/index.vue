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
      <el-tooltip content="View: first person" placement="left">
        <span
          class="iconfont icon-shubiaozhizhen-diyirenchengmanyou-yidong"
        ></span>
      </el-tooltip>
    </div>
    <div class="transform-controls-item" @click="switchCurrentView" v-else>
      <el-tooltip content="View: third person" placement="left">
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
    tooltip: 'Move (W)',
  },
  {
    type: TRANSFORM_CONTROLS_TYPE.Rotate,
    icon: 'icon-xuanzhuan',
    tooltip: 'Rotate (E)',
  },
  {
    type: TRANSFORM_CONTROLS_TYPE.Scale,
    icon: 'icon-suofang',
    tooltip: 'Scale (R)',
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

// current view
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
  // Ctrl/Cmd + Z: Undo
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
    //Ctrl+Shift+Z Redo
    event.preventDefault();
    store.sceneApi?.historyModules.redo();
  } else if (event.key.toLowerCase() === 'f') {
    //F Focus
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
// switch transform mode
const handleTransformControlsType = (type: TRANSFORM_CONTROLS_TYPE) => {
  transformControlsType.value = type;
  store.sceneApi?.transformControlsModules.transformControls?.setMode(type);
};

const switchCurrentView = () => {
  store.sceneApi?.createPointerLockControls();
};
</script>
<style lang="scss" scoped src="./index.scss"></style>
