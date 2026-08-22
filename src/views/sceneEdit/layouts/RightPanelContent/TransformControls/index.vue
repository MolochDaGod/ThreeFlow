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
      <el-tooltip content="Guest fly (no Play-as) — Esc exits" placement="left">
        <span
          class="iconfont icon-shubiaozhizhen-diyirenchengmanyou-yidong"
        ></span>
      </el-tooltip>
    </div>
    <div class="transform-controls-item" @click="switchCurrentView" v-else>
      <el-tooltip content="Play TPS (needs Play-as body)" placement="left">
        <span class="iconfont icon-a-disanrencheng1x"></span>
      </el-tooltip>
    </div>
    <div class="transform-controls-item" @click="groundSelected">
      <el-tooltip content="Place on terrain (G / Ctrl+Shift)" placement="left">
        <span class="iconfont icon-moxing"></span>
      </el-tooltip>
    </div>
    <div class="transform-controls-item" @click="frameSelected">
      <el-tooltip content="Frame selected (F)" placement="left">
        <span class="iconfont icon-xiangji"></span>
      </el-tooltip>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useSceneStore } from '@/store/sceneEditStore';
import { TRANSFORM_CONTROLS_TYPE } from '@/enums/enum';
import { ElMessage } from 'element-plus';

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
  if (currentView.value || store.playMode) return;
  const typing = (event.target as HTMLElement | null)?.closest(
    'input, textarea, [contenteditable="true"]'
  );
  if (typing) return;
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
  } else if (
    (event.ctrlKey || event.metaKey) &&
    event.shiftKey &&
    !event.altKey &&
    (event.key === 'Shift' || event.key === 'Control' || event.key === 'Meta')
  ) {
    event.preventDefault();
    groundSelected();
  } else if (event.key.toLowerCase() === 'g') {
    event.preventDefault();
    groundSelected();
  } else if (event.key.toLowerCase() === 'f' && !event.ctrlKey && !event.altKey) {
    event.preventDefault();
    frameSelected();
  } else if (
    (event.ctrlKey || event.metaKey) &&
    event.key.toLowerCase() === 'd'
  ) {
    event.preventDefault();
    const uuid = store.currentTransformMaterialUuid;
    if (uuid) store.sceneApi?.copySceneMaterial(uuid);
  } else if (event.key === 'Delete' || event.key === 'Backspace') {
    const uuid = store.currentTransformMaterialUuid;
    if (!uuid) return;
    event.preventDefault();
    void store.sceneApi?.deleteSceneMaterial({ uuid });
  }
};
const frameSelected = () => {
  store.sceneApi?.transformControlsModules?.frameSelection?.();
};
const groundSelected = () => {
  const api = store.sceneApi as {
    snapSelectedToGround?: () => { ok: boolean; terrainId: string };
  } | null;
  const result = api?.snapSelectedToGround?.();
  if (result?.ok) ElMessage.success(`Grounded on ${result.terrainId}`);
  else ElMessage.warning('Select an asset first (drop a sector for terrain)');
};

// switch transform mode
const handleTransformControlsType = (type: TRANSFORM_CONTROLS_TYPE) => {
  transformControlsType.value = type;
  store.sceneApi?.transformControlsModules.transformControls?.setMode(type);
};

const switchCurrentView = () => {
  const api = store.sceneApi as {
    playAsSelected?: (id?: string | null) => { ok: boolean; name: string };
    createPointerLockControls?: () => void;
  } | null;
  const r = api?.playAsSelected?.(store.currentTransformMaterialUuid);
  if (!r?.ok) {
    ElMessage.warning('Stamp Play as on a character first');
    return;
  }
  api?.createPointerLockControls?.();
};
</script>
<style lang="scss" scoped src="./index.scss"></style>
