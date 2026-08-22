<template>
  <div class="render-container" :class="{ 'is-play': store.playMode }">
    <SceneHeader />
    <div class="render-content">
      <div class="render-left-box">
        <LeftDragContent
          @drag-model-start="updateCurrentDragModel"
          @choose-outside-file="chooseOutsideFile"
          @place-model="placeFromLibrary"
        />
      </div>
      <div class="scene-stage">
        <div id="scene-render" @drop="dropModel" @dragover.prevent></div>
        <HudOverlay />
        <WorldMapOverlay />
      </div>
      <RightPanelContent :pageLoading="loadingInfo.pageLoading" />
    </div>
    <!-- loading state -->
    <Loading
      :percentage="loadingInfo.percentage"
      :loading="loadingInfo.loading"
      :loadingText="loadingInfo.text"
    />
  </div>
</template>
<script setup lang="ts">
import {
  onMounted,
  onUnmounted,
  shallowReactive,
  getCurrentInstance,
} from 'vue';
import { LeftDragContent, RightPanelContent, SceneHeader } from './layouts';
import HudOverlay from './layouts/HudOverlay/index.vue';
import WorldMapOverlay from './layouts/WorldMapOverlay/index.vue';
import { clampHudFrame, loadHud, saveHud, type HudFrame } from '@/config/hudKits';
import { clientToHudDesign, measureHudHost } from '@/utils/imageLoader';
import { Loading } from '@/components/index';
import type {
  DragModelType,
  CurrentDragModelData,
  ModelType,
} from '@/types/renderModelTypes';
import { useSceneStore } from '@/store/sceneEditStore';
import { useIndexDbStore } from '@/store/indexDbStore';
import renderScene from '@/utils/renderScene';
import { ElMessage, ElMessageBox, type UploadFile } from 'element-plus';
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
  text: 'First load can take a while. Please wait...',
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
  try {
    const { isVfxLabQuery } = await import('@/config/vfxLab');
    if (isVfxLabQuery()) {
      loadingInfo.text = 'VFX lab · HDR + loadRaceKit…';
      const { bootVfxLabScene } = await import('@/utils/vfxLabBoot');
      await bootVfxLabScene(renderSceneApi);
    }
  } catch (err) {
    console.warn('[vfx-lab] boot skipped', err);
  }
  Object.assign(loadingInfo, {
    pageLoading: false,
    loading: false,
  });
  await consumeDevToolAsset();
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

/** Filename for loader type: ?name= · loopback ?path= · else URL basename. */
function handoffAssetName(q: URLSearchParams, asset: string): string {
  const named = q.get('name');
  if (named) return named;
  try {
    const u = new URL(asset);
    const disk = u.searchParams.get('path');
    if (disk) {
      const base = disk.split(/[\\/]/).pop();
      if (base) return base;
    }
    const pathBase = decodeURIComponent(u.pathname.split('/').pop() || '');
    if (pathBase && pathBase !== 'local-file') return pathBase;
  } catch {
    /* fall through */
  }
  return decodeURIComponent(asset.split('?')[0].split('/').pop() || 'asset.glb');
}

/** Dev Tool / Casting handoff: ?asset= or ?mesh= CDN or local loopback. */
async function consumeDevToolAsset() {
  const q = new URLSearchParams(window.location.search);
  const asset = q.get('asset') || q.get('mesh');
  if (!asset || !/^https?:\/\//i.test(asset)) return;
  const name = handoffAssetName(q, asset);
  const fileType = getFileType(name);
  loadingInfo.loading = true;
  loadingInfo.text = `Open · ${name}`;
  try {
    await store.sceneApi?.loadModel(asset, fileType, 0, 0, name);
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : String(err));
  } finally {
    loadingInfo.loading = false;
  }
}

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

const placeFromLibrary = async (model: DragModelType | any) => {
  updateCurrentDragModel(model);
  await dropModel({ clientX: 0, clientY: 0 } as DragEvent);
};

// drop to add models
const dropModel = async (e: DragEvent) => {
  const { clientX, clientY } = e;
  currentDrag.clientX = clientX;
  currentDrag.clientY = clientY;
  if (currentDrag.modelType === DRAG_MODEL_TYPE.Ui2d) {
    const f = (currentDrag.modelData as { hudFrame?: HudFrame })?.hudFrame;
    if (f) {
      const host = document.querySelector('#scene-render') as HTMLElement | null;
      const left = document.querySelector('.render-left-box') as HTMLElement | null;
      const gutter =
        left && getComputedStyle(left).display !== 'none'
          ? left.getBoundingClientRect().width
          : 0;
      const m = measureHudHost(host, gutter);
      let next: HudFrame = {
        ...f,
        id: `${f.id}-${Date.now().toString(36)}`,
      };
      if (host && clientX && clientY) {
        const p = clientToHudDesign(clientX, clientY, host, m.scale, gutter);
        next.x = p.x - next.w * 0.5;
        next.y = p.y - next.h * 0.5;
      }
      next = clampHudFrame(next);
      const hud = loadHud();
      hud.frames.push(next);
      hud.selectedId = next.id;
      saveHud(hud);
      const scene = store.sceneApi?.scene;
      if (scene) {
        const { syncHudToScene } = await import('@/utils/hudScene');
        syncHudToScene(scene, hud.frames);
        store.setTransformMaterialRandomId();
      }
      $eventBus?.emit(MITT_ON_KEY.HUD_CHANGED, true);
    }
    return;
  }
  if (currentDrag.modelType === DRAG_MODEL_TYPE.Geometry) {
    // geometry
    store.sceneApi?.loadGeometry(currentDrag);
  } else if (currentDrag.modelType === DRAG_MODEL_TYPE.Light) {
    // Lights
    store.sceneApi?.loadLight(currentDrag);
  } else {
    const modelData = currentDrag.modelData as ModelType & {
      terrainPreset?: 'mountains' | 'crags' | 'zone';
      sectorId?: string;
      terrainId?: string;
      isTerrain?: boolean;
      playUrl?: string;
      prefabId?: string;
      prefabKind?: 'unit' | 'structure' | 'vehicle' | 'siege' | 'mount';
      siHeightM?: number;
      assetUuid?: string;
      iconUuid?: string;
      r2Key?: string;
      placeable?: boolean;
      meshStatus?: string;
      icon?: string;
      contentLayer?: string;
      harvestKind?: string;
      harvestDrops?: string[];
      animalRole?: 'prey' | 'predator';
      air?: boolean;
      islandKind?: 'static' | 'faction' | 'prefab';
      meshName?: string;
      playScript?: string;
    };
    const { filePath, fileType, name, terrainPreset } = modelData;
    try {
      if (
        modelData.placeable === false ||
        modelData.meshStatus === 'icon_only'
      ) {
        ElMessage.warning(
          `${name} has icon + UUID but no unique GLB yet (${modelData.prefabId || modelData.assetUuid || 'pending'})`
        );
        return;
      }
      Object.assign(loadingInfo, {
        loading: true,
        percentage: 0,
      });
      if (
        String(filePath).startsWith('prefab://enemy-camp') &&
        store.sceneApi?.spawnEnemyCamp
      ) {
        loadingInfo.text = 'Spawning enemy camp…';
        await store.sceneApi.spawnEnemyCamp(clientX, clientY);
      } else if (
        String(filePath).startsWith('prefab://') &&
        store.sceneApi?.spawnLayerPrefab
      ) {
        loadingInfo.text = filePath.includes('seafloor')
          ? 'Tiling 9 sector seafloor…'
          : 'Placing layer prefab…';
        const spawned = await store.sceneApi.spawnLayerPrefab(
          filePath,
          clientX,
          clientY,
          (pct, msg) => {
            loadingInfo.percentage = Math.round(pct);
            loadingInfo.text = `Seafloor · ${msg}`;
          }
        );
        if (!spawned) ElMessage.warning(`Unknown prefab ${filePath}`);
      } else if (
        String(filePath).startsWith('hardroad://') &&
        terrainPreset &&
        store.sceneApi?.loadHdTerrain
      ) {
        loadingInfo.text = 'Load screen · generating HD terrain…';
        await store.sceneApi.loadHdTerrain(
          terrainPreset,
          clientX,
          clientY,
          name,
          (pct, msg) => {
            loadingInfo.percentage = Math.round(pct);
            loadingInfo.text = `Load screen · ${msg}`;
          },
          'edit',
          {
            sectorId: modelData.sectorId,
            terrainId: modelData.terrainId,
            playUrl: modelData.playUrl,
          }
        );
      } else {
        await store.sceneApi?.loadModel(
          filePath,
          fileType,
          clientX,
          clientY,
          name,
          {
            group: modelData.group,
            sectorId: modelData.sectorId,
            terrainId: modelData.terrainId,
            isTerrain: modelData.isTerrain,
            playUrl: modelData.playUrl,
            prefabId: modelData.prefabId,
            prefabKind: modelData.prefabKind,
            siHeightM: modelData.siHeightM,
            assetUuid: modelData.assetUuid,
            iconUuid: modelData.iconUuid,
            r2Key: modelData.r2Key,
            iconUrl: modelData.icon,
            contentLayer: modelData.contentLayer,
            harvestKind: modelData.harvestKind,
            harvestDrops: modelData.harvestDrops,
            animalRole: modelData.animalRole,
            air: modelData.air,
            islandKind: modelData.islandKind,
            meshName: modelData.meshName,
            playScript: modelData.playScript,
          }
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
