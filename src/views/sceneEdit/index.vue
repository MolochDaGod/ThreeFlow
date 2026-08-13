<template>
  <div class="render-container">
    <SceneHeader />
    <div class="render-content">
      <div class="render-left-box">
        <LeftDragContent @drag-model-start="updateCurrentDragModel" @choose-outside-file="chooseOutsideFile" />
      </div>
      <div id="scene-render" @drop="dropModel" @dragover.prevent></div>
      <RightPanelContent :pageLoading="loadingInfo.pageLoading" />
    </div>
    <!-- loading state -->
    <Loading :percentage="loadingInfo.percentage" :loading="loadingInfo.loading" />
  </div>
</template>
<script setup lang="ts">
import { onMounted, onUnmounted, shallowReactive, getCurrentInstance } from 'vue';
import { LeftDragContent, RightPanelContent, SceneHeader } from './layouts';
import { Loading } from '@/components/index';
import type {
  DragModelType,
  CurrentDragModelData,
  ModelType
} from '@/types/renderModelTypes';
import { useSceneStore } from '@/store/sceneEditStore';
import { useIndexDbStore } from '@/store/indexDbStore';
import renderScene from '@/utils/renderScene';
import { ElMessageBox, type UploadFile } from 'element-plus';
import { getFileType } from '@/utils/utils';
import { DRAG_MODEL_TYPE, MITT_ON_KEY } from '@/enums/enum';

const store = useSceneStore();
const indexDbStore = useIndexDbStore();
const { $eventBus } = getCurrentInstance()?.proxy || {};

// current drag model
const currentDrag = shallowReactive<CurrentDragModelData>({
  clientX: 0,
  clientY: 0,
  modelData: null,
  modelType: '',
});

const loadingInfo = shallowReactive({
  percentage: 0,
  loading: false,
  pageLoading: false,
});

onMounted(async () => {
  await indexDbStore.initIndexDb();
  const renderSceneApi = new renderScene('#scene-render');
  store.setSceneApi(renderSceneApi);
  // init model renderer
  Object.assign(loadingInfo, {
    pageLoading: true,
    loading: true,
  });
  await renderSceneApi.init();
  Object.assign(loadingInfo, {
    pageLoading: false,
    loading: false,
  });
  // model load progress
  renderSceneApi.onProgress((progressNum: number, totalSize: number) => {
    loadingInfo.percentage = Number(
      ((progressNum / totalSize) * 100).toFixed(0)
    );
  });
  // listen for page loading
  $eventBus?.on(MITT_ON_KEY.PAGE_LOADING, (value) => {
    loadingInfo.loading = value;
    loadingInfo.percentage = 0;
    
  });
  $eventBus?.emit(MITT_ON_KEY.SCENE_LOADING, true);
});

onUnmounted(() => {
  store.sceneApi?.renderDestroy();
  $eventBus?.off(MITT_ON_KEY.PAGE_LOADING);
  store.setSceneApi(null);
});

// update drag model
const updateCurrentDragModel = (model: DragModelType | any) => {
  currentDrag.modelData = model;
  currentDrag.modelType = model.modelType;
};

// drop to add models
const dropModel = async (e: DragEvent) => {
  const { clientX, clientY } = e;
  currentDrag.clientX = clientX;
  currentDrag.clientY = clientY;
  if (currentDrag.modelType === DRAG_MODEL_TYPE.Geometry) {
    // geometry
    store.sceneApi?.loadGeometry(currentDrag);
  } else if (currentDrag.modelType === DRAG_MODEL_TYPE.Light) {
    // Lights
    store.sceneApi?.loadLight(currentDrag);
  } else {
    const modelData = currentDrag.modelData as ModelType & {
      terrainPreset?: 'mountains' | 'crags' | 'zone';
    };
    const { filePath, fileType, name, terrainPreset } = modelData;
    try {
      Object.assign(loadingInfo, {
        loading: true,
        percentage: 0,
      });
      if (terrainPreset && store.sceneApi?.loadHdTerrain) {
        await store.sceneApi.loadHdTerrain(
          terrainPreset,
          clientX,
          clientY,
          name,
          (pct) => {
            loadingInfo.percentage = Math.round(pct);
          }
        );
      } else {
        await store.sceneApi?.loadModel(
          filePath,
          fileType,
          clientX,
          clientY,
          name
        );
      }
    } finally {
      loadingInfo.loading = false;
      Object.assign(currentDrag, {
        clientX: 0,
        clientY: 0,
        modelData: null,
        modelType: '',
      });
    }
  }
};

// pick an external model
const chooseOutsideFile = async (file: UploadFile) => {
  const size = file?.size || 0;
  const raw: File = file.raw as File;
  const filePath = URL.createObjectURL(raw);
  const fileType = getFileType(raw.name);

  // shared model load helper
  const loadModelFile = async () => {
    try {
      loadingInfo.loading = true;
      loadingInfo.percentage = 0;
      await store.sceneApi?.loadModel(filePath, fileType, 0, 0, raw.name);
    } finally {
      loadingInfo.loading = false;
      URL.revokeObjectURL(filePath); // revoke object URL
    }
  };

  const FILE_SIZE_LIMIT = 50 * 1024 * 1024; // 50MB
  if (size > FILE_SIZE_LIMIT) {
    await ElMessageBox.confirm(
      'This file is over 50MB. The page may hitch.',
      'Notice',
      {
        confirmButtonText: 'OK',
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
    ).then(loadModelFile);
    return;
  }

  await loadModelFile();
};
</script>
<style lang="scss" scoped src="./index.scss"></style>
