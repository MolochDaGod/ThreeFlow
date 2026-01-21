<template>
  <div class="render-container">
    <SceneHeader />
    <div class="render-content">
      <div class="render-left-box">
        <LeftDragContent
          @drag-model-start="updateCurrentDragModel"
          @choose-outside-file="chooseOutsideFile"
        />
      </div>
      <div id="scene-render" @drop="dropModel" @dragover.prevent></div>

      <RightPanelContent :pageLoading="loadingInfo.pageLoading" />
    </div>
    <!-- 加载状态 -->
    <Loading
      :percentage="loadingInfo.percentage"
      :loading="loadingInfo.loading"
    />
  </div>
</template>
<script setup lang="ts">
import { onMounted, onUnmounted, reactive, getCurrentInstance } from 'vue';
import { LeftDragContent, RightPanelContent, SceneHeader } from './layouts';
import { Loading } from '@/components/index';
import type {
  DragModelType,
  CurrentDragModelData,
  ModelType,
} from '@/types/renderModelTypes';
import { useSceneStore } from '@/store/sceneEditStore';
import renderScene from '@/utils/renderScene';
import { ElMessageBox, type UploadFile } from 'element-plus';
import { getFileType } from '@/utils/utils';
import { DRAG_MODEL_TYPE, MITT_ON_KEY } from '@/enums/enum';
const store = useSceneStore();
const { $eventBus } = getCurrentInstance()?.proxy || {};

// 当前拖拽模型
const currentDrag = reactive<CurrentDragModelData>({
  clientX: 0,
  clientY: 0,
  modelData: null,
  modelType: '',
});

const loadingInfo = reactive({
  percentage: 0,
  loading: false,
  pageLoading: false,
});

onMounted(async () => {
  const renderSceneApi = new renderScene('#scene-render');
  store.setSceneApi(renderSceneApi);
  // 初始化模型渲染器
  Object.assign(loadingInfo, {
    pageLoading: true,
    loading: true,
  });
  await renderSceneApi.init();
  Object.assign(loadingInfo, {
    pageLoading: false,
    loading: false,
  });
  // 模型加载进度条
  renderSceneApi.onProgress((progressNum: number, totalSize: number) => {
    loadingInfo.percentage = Number(
      ((progressNum / totalSize) * 100).toFixed(0)
    );
  });
  // 监听页面加载状态
  $eventBus?.on(MITT_ON_KEY.PAGE_LOADING, (value) => {
    loadingInfo.loading = value;
    loadingInfo.percentage = 0;
  });
  $eventBus?.emit(MITT_ON_KEY.SCENE_LOADING, true);
});

onUnmounted(() => {
  // 清理特效
  // removeSmoke()
  store.sceneApi?.renderDestroy();
  $eventBus?.off(MITT_ON_KEY.PAGE_LOADING);
  store.setSceneApi(null);
});

// 更新拖拽模型
const updateCurrentDragModel = (model: DragModelType | any) => {
  currentDrag.modelData = model;
  currentDrag.modelType = model.modelType;
};

// 拖拽添加各类模型
const dropModel = async (e: DragEvent) => {
  const { clientX, clientY } = e;
  currentDrag.clientX = clientX;
  currentDrag.clientY = clientY;
  if (currentDrag.modelType === DRAG_MODEL_TYPE.Geometry) {
    // 几何模型
    store.sceneApi?.loadGeometry(currentDrag);
  } else if (currentDrag.modelType === DRAG_MODEL_TYPE.Light) {
    // 灯光
    store.sceneApi?.loadLight(currentDrag);
  } else {
    const { filePath, fileType, name } = currentDrag.modelData as ModelType;
    try {
      loadingInfo.loading = true;
      loadingInfo.percentage = 0;
      await store.sceneApi?.loadModel(
        filePath,
        fileType,
        clientX,
        clientY,
        name
      );
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

// 选择外部模型
const chooseOutsideFile = async (file: UploadFile) => {
  const size = file?.size || 0;
  const raw: File = file.raw as File;
  const filePath = URL.createObjectURL(raw);
  const fileType = getFileType(raw.name);

  // 提取加载模型的公共方法
  const loadModelFile = async () => {
    try {
      loadingInfo.loading = true;
      loadingInfo.percentage = 0;
      await store.sceneApi?.loadModel(filePath, fileType, 0, 0, raw.name);
    } finally {
      loadingInfo.loading = false;
      URL.revokeObjectURL(filePath); // 释放创建的URL
    }
  };

  const FILE_SIZE_LIMIT = 50 * 1024 * 1024; // 50MB
  if (size > FILE_SIZE_LIMIT) {
    await ElMessageBox.confirm(
      '当前文件大小超过50MB，页面可能会有卡顿',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    ).then(loadModelFile);
    return;
  }

  await loadModelFile();
};
</script>
<style lang="scss" scoped src="./index.scss"></style>
