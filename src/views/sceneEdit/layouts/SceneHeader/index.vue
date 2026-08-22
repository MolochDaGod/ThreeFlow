<template>
  <div class="render-header">
    <div class="render-header-left">
      <router-link to="/" class="header-hub-link">
        <img src="/icon.png" class="header-logo" alt="logo" />
      </router-link>
      <div class="left-title">
        Grudge Studio
        <span class="author">Warlords Engine · WCS</span>
      </div>
    </div>
    <div class="render-header-right">
      <div class="header-right-item">
        <router-link to="/">
          <el-button>Hub</el-button>
        </router-link>
      </div>
      <div class="header-right-item">
        <el-button type="primary" @click="playThisScene">Play</el-button>
      </div>
      <div class="header-right-item">
        <el-button @click="openWorldMap">Map</el-button>
      </div>
      <div class="header-right-item">
        <el-button @click="debounceSaveScene">Save</el-button>
      </div>
      <div class="header-right-item">
        <el-dropdown trigger="click">
          <el-button> Scene </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="addScene">
                <span class="iconfont icon-changjing1">&nbsp;Clear scene</span>
              </el-dropdown-item>
              <el-dropdown-item @click="openSceneFile">
                <span class="iconfont icon-daoru">&nbsp;Open scene…</span>
              </el-dropdown-item>
              <el-dropdown-item @click="debounceSaveScene">
                <span class="iconfont icon-baocun">&nbsp;Save scene</span>
              </el-dropdown-item>
              <el-dropdown-item @click="pushSceneAssets">
                <span class="iconfont icon-daochu">&nbsp;Push scene to assets</span>
              </el-dropdown-item>
              <el-dropdown-item @click="addScene">
                <span class="iconfont icon-changjing1">&nbsp;New scene</span>
              </el-dropdown-item>
              <el-dropdown-item @click="createHavenShore">
                <span class="iconfont icon-changjing1"
                  >&nbsp;New · Haven Shore</span
                >
              </el-dropdown-item>
              <el-dropdown-item @click="createPirateLobby">
                <span class="iconfont icon-changjing1"
                  >&nbsp;New · Pirate lobby</span
                >
              </el-dropdown-item>
              <el-dropdown-item @click="createEnemyCamp">
                <span class="iconfont icon-changjing1"
                  >&nbsp;New · Enemy camp</span
                >
              </el-dropdown-item>
              <el-dropdown-item @click="openSceneAi">
                <span class="iconfont icon-changjing1">&nbsp;Scene AI…</span>
              </el-dropdown-item>
              <el-dropdown-item @click="saveSceneSnapshot">
                <span class="iconfont icon-zhaoxiangji">
                  &nbsp;Scene snapshot (.png)
                </span>
              </el-dropdown-item>
              <el-dropdown-item @click="debounceExportScene">
                <span class="iconfont icon-daochu"
                  >&nbsp;Export scene (.json)</span
                >
              </el-dropdown-item>
              <el-dropdown-item @click="importScene">
                <span class="iconfont icon-daoru"
                  >&nbsp;Import scene (.json)</span
                >
              </el-dropdown-item>
              <el-dropdown-item @click="loadIslandRailway">
                <span class="iconfont icon-daoru"
                  >&nbsp;Load island (Railway)</span
                >
              </el-dropdown-item>
              <el-dropdown-item @click="saveIslandRailway">
                <span class="iconfont icon-baocun"
                  >&nbsp;Save island (Railway)</span
                >
              </el-dropdown-item>
              <el-dropdown-item @click="generateHdDeployPack">
                <span class="iconfont icon-daochu"
                  >&nbsp;HD terrain deploy pack…</span
                >
              </el-dropdown-item>
              <el-dropdown-item @click="exportExistingHdPack">
                <span class="iconfont icon-glb"
                  >&nbsp;Export scene HD terrains…</span
                >
              </el-dropdown-item>
              <el-dropdown-item @click="doFlyBy"> Fly-by </el-dropdown-item>
              <el-dropdown-item @click="doAtmosphere">
                Water · mist · clouds
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
      <div class="header-right-item">
        <el-dropdown trigger="click">
          <el-button> Export </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="debounceExportModel(EXPORT_TYPE.GLTF)">
                <span class="iconfont icon-glTF"
                  >&nbsp;Export model (.gltf)</span
                >
              </el-dropdown-item>
              <el-dropdown-item @click="debounceExportModel(EXPORT_TYPE.GLB)">
                <span class="iconfont icon-glb">&nbsp;Export model (.glb)</span>
              </el-dropdown-item>
              <el-dropdown-item @click="debounceExportModel(EXPORT_TYPE.USDZ)">
                <el-tooltip
                  content="Prefer a .gltf source when exporting"
                  placement="top"
                >
                  <span class="iconfont icon-filfvectorima"
                    >&nbsp;Export model (.usdz)</span
                  >
                </el-tooltip>
              </el-dropdown-item>
              <el-dropdown-item @click="debounceExportModel(EXPORT_TYPE.STL)">
                <span class="iconfont icon-STL">&nbsp;Export model (.stl)</span>
              </el-dropdown-item>
              <el-dropdown-item @click="debounceExportModel(EXPORT_TYPE.OBJ)">
                <span class="iconfont icon-obj">&nbsp;Export model (.obj)</span>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
      <div class="header-right-item">
        <el-dropdown trigger="click">
          <el-button> More </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="openSceneAi">Scene AI</el-dropdown-item>
              <el-dropdown-item @click="onOwnership"
                >Ownership</el-dropdown-item
              >
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
    <Loading :loading="loading" :loadingText="loadingText" />
  </div>
</template>
<script setup lang="ts">
import { useSceneStore } from '@/store/sceneEditStore';
import { useIndexDbStore } from '@/store/indexDbStore';
import { IndexDbStoreName, IndexDbStoreKeyPath } from '@/enums/indexDb';
import { debounce, cloneDeep } from 'lodash-es';
import { disposeScene } from '@/utils/utils';
import { ref, onUnmounted, toRaw, toValue, getCurrentInstance } from 'vue';
import Loading from '@/components/Loading/index.vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import * as THREE from 'three';
import type { ExportType } from '@/types/rightPanelTypes';
import { exportObjectToGlbBlob, exportSceneModel } from '@/utils/sceneModules';
import { pushGlbBlob } from '@/utils/assetPush';
import { EXPORT_TYPE } from '@/enums/enum';
import { HD_DEPLOY_TARGETS, HD_SECTOR_TARGETS } from '@/config/hdTerrainDeploy';
import { MITT_ON_KEY } from '@/enums/enum';
import { getPlayAs, setPlayAs } from '@/utils/contentLayers';
import { PIRATE_LOBBY_URL } from '@/config/fleetSystems';
import {
  fleetLoginUrl,
  getHomeIsland,
  ownershipSnapshot,
  readFleetToken,
  saveHomeIslandState,
} from '@/config/fleetAuth';
import {
  applyThreeflowStamp,
  extractThreeflowIslandStamp,
  mergeIslandStateForPatch,
  readThreeflowStamp,
} from '@/utils/islandState';
import { runAttachedPlayScripts } from '@/utils/sceneScript';
import { ASSETS_CDN } from '@/config/assetApi';
import { MAP_DESTINATIONS, destWorldPos } from '@/config/worldMap';
import { MODEL_TYPE } from '@/enums/enum';
import {
  collectHdTerrainRoots,
  exportHdTerrainPack,
} from '@/utils/sceneModules/hdTerrainExport';
import type { Ds2PresetId } from '@/utils/sceneModules/ds2Terrain';

const store = useSceneStore();
const indexDbStore = useIndexDbStore();
const { $eventBus } = getCurrentInstance()?.proxy || {};
const openSceneAi = () => $eventBus?.emit(MITT_ON_KEY.OPEN_AI_TAB, true);
const openWorldMap = () => $eventBus?.emit(MITT_ON_KEY.OPEN_WORLD_MAP, true);
const playThisScene = () => {
  const scene = store.sceneApi?.scene;
  if (!scene) return;
  let body = getPlayAs(scene);
  if (!body && store.currentTransformMaterialUuid) {
    const o = scene.getObjectByProperty(
      'uuid',
      store.currentTransformMaterialUuid
    );
    if (o) {
      setPlayAs(scene, o);
      body = o;
    }
  }
  if (!body) {
    ElMessage.warning('Select a Player-layer character first');
    $eventBus?.emit(MITT_ON_KEY.OPEN_AI_TAB, true);
    return;
  }
  const api = store.sceneApi;
  if (api?.scene && api.camera) {
    const ran = runAttachedPlayScripts({
      scene: api.scene,
      camera: api.camera,
      renderer: api.renderer,
      selected: body,
    });
    if (ran.errors.length) ElMessage.warning(ran.errors[0]);
    else if (ran.ran) ElMessage.success(`Play scripts ${ran.ran}`);
  }
  store.sceneApi?.createPointerLockControls();
};

const doFlyBy = () => {
  const api = store.sceneApi as { startFlyBy?: () => string } | null;
  ElMessage.info(api?.startFlyBy?.() || 'No fly-by');
};

const doAtmosphere = () => {
  const api = store.sceneApi as { mountWorldAtmosphere?: () => string } | null;
  ElMessage.success(api?.mountWorldAtmosphere?.() || 'No scene');
};

const onOwnership = async () => {
  if (!readFleetToken()) {
    window.location.href = fleetLoginUrl();
    return;
  }
  try {
    const snap = await ownershipSnapshot();
    if (!snap.signedIn) {
      ElMessage.warning('Session expired — sign in with Grudge ID');
      window.location.href = fleetLoginUrl();
      return;
    }
    ElMessage.success(
      `Account ${snap.grudgeId || 'ok'} · ${snap.characters.length} hero(s) · ${snap.nfts.length} cNFT · scene still IndexedDB (Railway owns roster/bag)`
    );
  } catch (err) {
    ElMessage.error(
      err instanceof Error ? err.message : 'Ownership check failed'
    );
  }
};

const createHavenShore = async () => {
  const api = store.sceneApi;
  if (!api?.loadHdTerrain) return;
  const target = HD_SECTOR_TARGETS.find((s) => s.id === 'haven_shore');
  loading.value = true;
  loadingText.value = 'Creating Haven Shore…';
  try {
    await api.loadHdTerrain(
      'zone',
      window.innerWidth * 0.5,
      window.innerHeight * 0.5,
      'haven_shore',
      undefined,
      'edit',
      {
        sectorId: 'haven_shore',
        terrainId: 'haven_shore',
        playUrl: target?.playUrl,
      }
    );
    ElMessage.success('Haven Shore stamped');
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : 'Create failed');
  } finally {
    loading.value = false;
  }
};

const createEnemyCamp = async () => {
  const api = store.sceneApi;
  if (!api?.spawnEnemyCamp) return;
  loading.value = true;
  loadingText.value = 'Spawning enemy camp…';
  try {
    await api.spawnEnemyCamp(window.innerWidth * 0.5, window.innerHeight * 0.5);
    ElMessage.success('Enemy camp · 1 lookout + 3 harvesters');
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : 'Camp spawn failed');
  } finally {
    loading.value = false;
  }
};

const createPirateLobby = async () => {
  const api = store.sceneApi;
  if (!api?.loadModel) return;
  loading.value = true;
  loadingText.value = 'Loading pirate lobby…';
  try {
    await api.loadModel(
      PIRATE_LOBBY_URL,
      MODEL_TYPE.GLB,
      window.innerWidth * 0.5,
      window.innerHeight * 0.5,
      'pirate-islands',
      {
        group: 'scenes',
        sectorId: 'pirate-islands',
        terrainId: 'chicken_gun_pirate_lobby',
        isTerrain: true,
        playUrl:
          'https://grudgewarlords.com/island-3d?mode=lobby&map=pirate-islands',
      }
    );
    ElMessage.success('Pirate lobby stamped');
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : 'Create failed');
  } finally {
    loading.value = false;
  }
};

const loading = ref(false);
const loadingText = ref('Saving scene...');
const loadingTimeout = ref<NodeJS.Timeout>();

onUnmounted(() => {
  clearTimeout(toValue(loadingTimeout));
});

// new scene
const addScene = () => {
  ElMessageBox.confirm(
    'The current scene will be cleared. Continue?',
    'Notice',
    {
      confirmButtonText: 'OK',
      cancelButtonText: 'Cancel',
      type: 'warning',
    }
  )
    .then(() => {
      store.sceneApi?.renderDestroy();
      indexDbStore.indexDbUtil?.clear(IndexDbStoreName.scene);
      window.location.reload();
    })
    .catch(() => {});
};

// save scene
const debounceSaveScene = debounce(async () => {
  loadingText.value = 'Saving scene. The page may hitch — please wait...';
  loading.value = true;
  loadingTimeout.value = setTimeout(async () => {
    try {
      clearTimeout(toValue(loadingTimeout));
      await saveSceneIndexDb();
      loading.value = false;
      ElMessage.success('Scene saved');
    } catch {
      loading.value = false;
      clearTimeout(toValue(loadingTimeout));
      ElMessage.error('Failed to save scene');
    }
  }, 1000);
}, 1500);

const requireIslandAuth = () => {
  if (readFleetToken()) return true;
  ElMessage.warning('Sign in with Grudge ID for Railway island');
  window.location.href = fleetLoginUrl();
  return false;
};

const loadHomeIslandMesh = async () => {
  const api = store.sceneApi;
  if (!api?.loadModel) return;
  const dest = MAP_DESTINATIONS.find((d) => d.id === 'home-island');
  const model = dest?.model;
  if (!model) return;
  await api.loadModel(
    `${ASSETS_CDN}/${model}`,
    MODEL_TYPE.GLB,
    window.innerWidth * 0.5,
    window.innerHeight * 0.5,
    'home-island',
    {
      group: 'islands',
      terrainId: 'home-island',
      isTerrain: true,
      islandKind: 'static',
      contentLayer: 'terrain',
    }
  );
};

const loadIslandRailway = async () => {
  const api = store.sceneApi;
  if (!api?.scene) {
    ElMessage.warning('Scene is not initialized');
    return;
  }
  if (!requireIslandAuth()) return;
  loadingText.value = 'Loading island from Railway…';
  loading.value = true;
  try {
    const cur = await getHomeIsland();
    if (!cur.ok || !cur.island) {
      ElMessage.error(`GET /api/island ${cur.status}`);
      return;
    }
    const stamp = readThreeflowStamp(cur.island.state);
    const nodes = Array.isArray(cur.island.state?.nodes)
      ? cur.island.state.nodes.length
      : 0;
    await loadHomeIslandMesh();
    const sea = api as {
      openSeaPlay?: (look?: {
        x: number;
        y: number;
        z: number;
      }) => Promise<string>;
      mountWorldAtmosphere?: () => string;
    };
    await applyThreeflowStamp(api.scene, stamp, {
      openSea: () => sea.openSeaPlay?.(destWorldPos('haven_shore')) || Promise.resolve(),
      mountAtmosphere: () => sea.mountWorldAtmosphere?.(),
    });
    ElMessage.success(
      `Loaded ${cur.island.name || 'Home Island'} · seed ${String(
        cur.island.seed || ''
      ).slice(0, 8)} · Railway harvest ${nodes} (0–100, kept) · ${
        stamp
          ? `threeflow v${stamp.version}`
          : 'no threeflow stamp yet — Save island to write one'
      }`
    );
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : 'Island load failed');
  } finally {
    loading.value = false;
  }
};

const saveIslandRailway = async () => {
  const scene = store.sceneApi?.scene;
  if (!scene) {
    ElMessage.warning('Scene is not initialized');
    return;
  }
  if (!requireIslandAuth()) return;
  loadingText.value = 'Saving island to Railway…';
  loading.value = true;
  try {
    const cur = await getHomeIsland();
    if (!cur.ok || !cur.island) {
      ElMessage.error(`GET /api/island ${cur.status} — cannot merge`);
      return;
    }
    const prev = (
      cur.island.state && typeof cur.island.state === 'object'
        ? cur.island.state
        : {}
    ) as Record<string, unknown>;
    const stamp = extractThreeflowIslandStamp(scene);
    const patched = await saveHomeIslandState(
      mergeIslandStateForPatch(prev, stamp)
    );
    if (!patched.ok) {
      ElMessage.error(`PATCH /api/island/state ${patched.status}`);
      return;
    }
    ElMessage.success(
      `Island saved · ${cur.island.name || 'home'} · harvest ${
        stamp.harvest.length
      } editor · Railway nodes kept · terrains ${stamp.terrains.length}`
    );
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : 'Island save failed');
  } finally {
    loading.value = false;
  }
};

// save scene to IndexedDB
const saveSceneIndexDb = async () => {
  try {
    const sceneApi = store.sceneApi;
    if (!sceneApi) {
      throw new Error('Scene is not initialized');
    }
    let newScene = cloneDeep(sceneApi?.scene);

    const transformControlsRoot = newScene?.getObjectByProperty(
      'isTransformControlsRoot',
      true
    );
    const boxHelper = newScene?.getObjectByProperty('type', 'BoxHelper');
    const particles = newScene?.getObjectByProperty('type', 'Points');
    newScene?.remove(transformControlsRoot as THREE.Object3D);
    newScene?.remove(boxHelper as THREE.BoxHelper);
    newScene?.remove(particles as THREE.Points);
    if (newScene) {
      for (const child of [...newScene.children]) {
        if ((child as THREE.Camera).isCamera) newScene.remove(child);
      }
    }

    let jsonData = {
      scene: newScene?.toJSON(),
      camera: sceneApi.camera?.toJSON(),
      controls: toRaw(sceneApi.controls?.target),
    };

    let sceneInfo = {
      sceneBlobDataFlow: IndexDbStoreKeyPath.sceneBlobData,
      ...jsonData,
    };

    const oldData = await indexDbStore.indexDbUtil?.get(
      IndexDbStoreName.scene,
      IndexDbStoreKeyPath.sceneBlobData
    );

    if (oldData) {
      await indexDbStore.indexDbUtil?.update(IndexDbStoreName.scene, {
        ...oldData,
        ...jsonData,
      });
    } else {
      await indexDbStore.indexDbUtil?.add(IndexDbStoreName.scene, sceneInfo);
    }
    disposeScene(newScene as THREE.Scene);
    return Promise.resolve();
  } catch (error: unknown) {
    console.error('Failed to save scene:', error);
    return Promise.reject(error);
  }
};

// save scene snapshot
const saveSceneSnapshot = async () => {
  const canvas = store.sceneApi?.renderer?.domElement;
  if (!canvas) return;
  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = `${new Date().toLocaleString()}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  ElMessage.success('Download complete');
};

// export scene
const debounceExportScene = debounce(async () => {
  loading.value = true;
  loadingText.value = 'Exporting scene. The page may hitch — please wait...';
  loadingTimeout.value = setTimeout(() => {
    try {
      const sceneApi = store.sceneApi;
      const newScene = cloneDeep(sceneApi?.scene);
      const transformControlsRoot = newScene?.getObjectByProperty(
        'isTransformControlsRoot',
        true
      );
      const boxHelper = newScene?.getObjectByProperty('isBoxHelper', true);
      newScene?.remove(transformControlsRoot as THREE.Object3D);
      if (boxHelper) newScene?.remove(boxHelper as THREE.BoxHelper);

      const jsonData = {
        scene: newScene?.toJSON(),
        camera: sceneApi?.camera?.toJSON(),
        controls: toRaw(sceneApi?.controls?.target),
      };

      const blob = new Blob([JSON.stringify(jsonData)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      document.body.appendChild(link);
      link.href = url;
      link.download = `${new Date().toLocaleString()}.json`;
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      loading.value = false;
      clearTimeout(toValue(loadingTimeout));
      ElMessage.success('Scene exported');
    } catch {
      ElMessage.error('Failed to export scene');
      loading.value = false;
      clearTimeout(toValue(loadingTimeout));
    }
  }, 1000);
}, 1000);

// import scene
const importScene = () => openSceneFile();

const openSceneFile = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,.glb,.gltf';
  input.style.display = 'none';
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      if (/\.json$/i.test(file.name)) void chooseSceneJson(file);
      else void openSceneMesh(file);
    }
    input.remove();
  };
  input.click();
};

const openSceneMesh = async (file: File) => {
  const api = store.sceneApi;
  if (!api?.loadModel) {
    ElMessage.warning('Scene is not initialized');
    return;
  }
  loading.value = true;
  loadingText.value = `Opening ${file.name}…`;
  const url = URL.createObjectURL(file);
  try {
    const type = /\.gltf$/i.test(file.name) ? MODEL_TYPE.GLTF : MODEL_TYPE.GLB;
    await api.loadModel(
      url,
      type,
      window.innerWidth * 0.5,
      window.innerHeight * 0.5,
      file.name.replace(/\.[^.]+$/, '')
    );
    ElMessage.success(`Opened ${file.name}`);
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : 'Open failed');
  } finally {
    URL.revokeObjectURL(url);
    loading.value = false;
  }
};

const pushSceneAssets = async () => {
  const scene = store.sceneApi?.scene;
  if (!scene) {
    ElMessage.warning('Scene is not initialized');
    return;
  }
  const uuid = store.currentTransformMaterialUuid;
  const obj = uuid ? scene.getObjectByProperty('uuid', uuid) : null;
  const target = obj || scene;
  loading.value = true;
  loadingText.value = 'Pushing GLB…';
  try {
    const { blob, filename } = await exportObjectToGlbBlob(
      target,
      target.name || 'scene'
    );
    await pushGlbBlob(blob, filename);
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : 'Push failed');
  } finally {
    loading.value = false;
  }
};

// choose scene JSON
const chooseSceneJson = async (file: File) => {
  try {
    loading.value = true;
    loadingText.value = 'Importing scene...';
    const reader = new FileReader();
    const fileContent = await new Promise<string>((resolve, reject) => {
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });

    const sceneData = JSON.parse(fileContent);
    if (!sceneData.scene || !sceneData.camera) {
      throw new Error('Invalid scene file format');
    }

    if (store.sceneApi) {
      await store.sceneApi.loadIndexDbSceneData(sceneData);
      ElMessage.success('Scene imported');
    }
  } catch {
    ElMessage.error('Failed to import scene');
  } finally {
    loading.value = false;
  }
};

const pickHdTarget = async () => {
  const { value } = await ElMessageBox.prompt(
    HD_DEPLOY_TARGETS.map((t) => `${t.id} — ${t.label}`).join('\n'),
    'Sector / map target',
    {
      confirmButtonText: 'Use target',
      inputPlaceholder: 'haven_shore',
      inputValue: 'haven_shore',
    }
  );
  const target = HD_DEPLOY_TARGETS.find((t) => t.id === String(value).trim());
  if (!target) throw new Error('Unknown sector/map id');
  return target;
};

const generateHdDeployPack = async () => {
  if (!store.sceneApi?.scene) return;
  try {
    const { value: presetRaw } = await ElMessageBox.prompt(
      'Preset: mountains | crags | zone',
      'Generate HD terrain',
      { inputValue: 'mountains', confirmButtonText: 'Next' }
    );
    const preset = String(presetRaw).trim() as Ds2PresetId;
    if (!['mountains', 'crags', 'zone'].includes(preset)) {
      throw new Error('Preset must be mountains, crags, or zone');
    }
    const target = await pickHdTarget();
    loading.value = true;
    loadingText.value = 'Load screen · generating deploy mesh…';
    const box = store.sceneApi.container?.getBoundingClientRect();
    const cx = box ? box.left + box.width / 2 : 0;
    const cy = box ? box.top + box.height / 2 : 0;
    await store.sceneApi.loadHdTerrain(
      preset,
      cx,
      cy,
      `HD ${preset} · ${target.id}`,
      (pct, msg) => {
        loadingText.value = `Load screen · ${msg}`;
      },
      'deploy',
      {
        sectorId: target.kind === 'sector' ? target.id : undefined,
        terrainId: target.id,
        playUrl: target.playUrl,
      }
    );
    loadingText.value = 'Load screen · exporting GLB + deploy.json…';
    const roots = collectHdTerrainRoots(store.sceneApi.scene);
    const files = await exportHdTerrainPack(roots.slice(-1), target);
    ElMessage.success(
      `Downloaded ${files.rawName} + ${files.jsonName}. Put them in deploys/hd-terrain/in then run pnpm bake:hd-terrain`
    );
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error(err instanceof Error ? err.message : 'HD pack failed');
    }
  } finally {
    loading.value = false;
  }
};

const exportExistingHdPack = async () => {
  if (!store.sceneApi?.scene) return;
  try {
    const roots = collectHdTerrainRoots(store.sceneApi.scene);
    if (!roots.length) {
      ElMessage.warning(
        'No HD terrain in the scene — generate or drop one first'
      );
      return;
    }
    const target = await pickHdTarget();
    loading.value = true;
    loadingText.value = 'Load screen · exporting GLB + deploy.json…';
    const files = await exportHdTerrainPack(roots, target);
    ElMessage.success(
      `Downloaded ${files.rawName} + ${files.jsonName}. Move into deploys/hd-terrain/in then pnpm bake:hd-terrain`
    );
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error(err instanceof Error ? err.message : 'Export failed');
    }
  } finally {
    loading.value = false;
  }
};

// export model
const debounceExportModel = debounce(async (type: ExportType) => {
  loading.value = true;
  loadingText.value = 'Exporting model. The page may hitch — please wait...';
  loadingTimeout.value = setTimeout(() => {
    try {
      if (!store.sceneApi?.scene) return;
      exportSceneModel(type, store.sceneApi?.scene);
      loading.value = false;
      clearTimeout(toValue(loadingTimeout));
      ElMessage.success('Model exported');
    } catch (error) {
      ElMessage.error('Failed to export model');
      loading.value = false;
      clearTimeout(toValue(loadingTimeout));
    }
  }, 1000);
}, 1000);
</script>

<style lang="scss" scoped src="./index.scss"></style>
