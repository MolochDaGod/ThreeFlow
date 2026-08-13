<template>
  <div class="render-header">
    <div class="render-header-left">
      <img src="/icon.png" class="header-logo" alt="logo" />
      <div class="left-title">
        Grudge Studio
        <span class="author">Warlords Engine · WCS</span>
      </div>
    </div>
    <div class="render-header-right">
      <div class="header-right-item">
        <el-dropdown trigger="click">
          <el-button type="primary">
            <span class="iconfont icon-hot">&nbsp;AI</span>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="openAiHub">
                Pop AI hub (ai.*)
              </el-dropdown-item>
              <el-dropdown-item @click="openForgeEditor">
                Pop Forge editor
              </el-dropdown-item>
              <el-dropdown-item @click="openCoder">
                Pop Coder source
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
      <div class="header-right-item">
        <el-dropdown trigger="click">
          <el-button type="primary">
            <span class="iconfont icon-changjing2">&nbsp;Play</span>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                v-for="sec in playSectors"
                :key="sec.id"
                @click="openPlay(sec.playUrl)"
              >
                {{ sec.label }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
      <div class="header-right-item">
        <el-button type="primary" @click="debounceSaveScene">
          <span class="iconfont icon-baocun">&nbsp;Save scene</span>
        </el-button>
      </div>
      <div class="header-right-item">
        <el-dropdown trigger="click">
          <el-button type="primary">
            <span class="iconfont icon-changjing2">&nbsp;Scene</span>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="addScene">
                <span class="iconfont icon-changjing1">&nbsp;New scene</span>
              </el-dropdown-item>
              <el-dropdown-item @click="createHavenShore">
                <span class="iconfont icon-changjing1">&nbsp;New · Haven Shore</span>
              </el-dropdown-item>
              <el-dropdown-item @click="createPirateLobby">
                <span class="iconfont icon-changjing1">&nbsp;New · Pirate lobby</span>
              </el-dropdown-item>
              <el-dropdown-item @click="openForgeEditor">
                <span class="iconfont icon-changjing1">&nbsp;Open in Forge…</span>
              </el-dropdown-item>
              <el-dropdown-item @click="saveSceneSnapshot">
                <span class="iconfont icon-zhaoxiangji"> &nbsp;Scene snapshot (.png) </span>
              </el-dropdown-item>
              <el-dropdown-item @click="debounceExportScene">
                <span class="iconfont icon-daochu">&nbsp;Export scene (.json)</span>
              </el-dropdown-item>
              <el-dropdown-item @click="importScene">
                <span class="iconfont icon-daoru">&nbsp;Import scene (.json)</span>
              </el-dropdown-item>
              <el-dropdown-item @click="generateHdDeployPack">
                <span class="iconfont icon-daochu">&nbsp;HD terrain deploy pack…</span>
              </el-dropdown-item>
              <el-dropdown-item @click="exportExistingHdPack">
                <span class="iconfont icon-glb">&nbsp;Export scene HD terrains…</span>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
      <div class="header-right-item">
        <el-dropdown trigger="click">
          <el-button type="primary">
            <span class="iconfont icon-moxing">&nbsp;Model</span>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="debounceExportModel(EXPORT_TYPE.GLTF)">
                <span class="iconfont icon-glTF">&nbsp;Export model (.gltf)</span>
              </el-dropdown-item>
              <el-dropdown-item @click="debounceExportModel(EXPORT_TYPE.GLB)">
                <span class="iconfont icon-glb">&nbsp;Export model (.glb)</span>
              </el-dropdown-item>
              <el-dropdown-item @click="debounceExportModel(EXPORT_TYPE.USDZ)">
                <el-tooltip content="Prefer a .gltf source when exporting" placement="top">
                  <span class="iconfont icon-filfvectorima">&nbsp;Export model (.usdz)</span>
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
    </div>
    <Loading :loading="loading" :loadingText="loadingText" />
  </div>
</template>
<script setup lang="ts">
import { useSceneStore } from "@/store/sceneEditStore";
import { useIndexDbStore } from "@/store/indexDbStore";
import { IndexDbStoreName, IndexDbStoreKeyPath } from "@/enums/indexDb";
import { debounce, cloneDeep } from "lodash-es";
import { disposeScene } from "@/utils/utils";
import { ref, onUnmounted, toRaw ,toValue} from "vue";
import Loading from "@/components/Loading/index.vue";
import { ElMessage, ElMessageBox } from "element-plus";
import * as THREE from "three";
import type { ExportType } from "@/types/rightPanelTypes";
import { exportSceneModel } from "@/utils/sceneModules";
import { EXPORT_TYPE } from "@/enums/enum";
import { HD_DEPLOY_TARGETS, HD_SECTOR_TARGETS } from "@/config/hdTerrainDeploy";
import {
  popoutFleet,
  STUDIO_AI,
  STUDIO_CODER,
  STUDIO_FORGE_EDITOR,
  STUDIO_PLAY,
} from "@/config/branding";
import { PIRATE_LOBBY_URL } from "@/config/fleetSystems";
import { MODEL_TYPE } from "@/enums/enum";
import {
  collectHdTerrainRoots,
  exportHdTerrainPack,
} from "@/utils/sceneModules/hdTerrainExport";
import type { Ds2PresetId } from "@/utils/sceneModules/ds2Terrain";

const store = useSceneStore();
const indexDbStore = useIndexDbStore();
const playSectors = HD_SECTOR_TARGETS;
const openPlay = (url: string) => {
  window.open(url || STUDIO_PLAY, "_blank");
};
const openAiHub = () => popoutFleet(STUDIO_AI, "grudge-ai-worker");
const openForgeEditor = () => popoutFleet(STUDIO_FORGE_EDITOR, "grudge-forge");
const openCoder = () => popoutFleet(STUDIO_CODER, "grudge-coder");

const createHavenShore = async () => {
  const api = store.sceneApi;
  if (!api?.loadHdTerrain) return;
  const target = HD_SECTOR_TARGETS.find((s) => s.id === "haven_shore");
  loading.value = true;
  loadingText.value = "Creating Haven Shore…";
  try {
    await api.loadHdTerrain(
      "zone",
      window.innerWidth * 0.5,
      window.innerHeight * 0.5,
      "haven_shore",
      undefined,
      "edit",
      {
        sectorId: "haven_shore",
        terrainId: "haven_shore",
        playUrl: target?.playUrl,
      }
    );
    ElMessage.success("Haven Shore stamped");
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : "Create failed");
  } finally {
    loading.value = false;
  }
};

const createPirateLobby = async () => {
  const api = store.sceneApi;
  if (!api?.loadModel) return;
  loading.value = true;
  loadingText.value = "Loading pirate lobby…";
  try {
    await api.loadModel(
      PIRATE_LOBBY_URL,
      MODEL_TYPE.GLB,
      window.innerWidth * 0.5,
      window.innerHeight * 0.5,
      "pirate-islands",
      {
        group: "scenes",
        sectorId: "pirate-islands",
        terrainId: "chicken_gun_pirate_lobby",
        isTerrain: true,
        playUrl:
          "https://grudgewarlords.com/island-3d?mode=lobby&map=pirate-islands",
      }
    );
    ElMessage.success("Pirate lobby stamped");
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : "Create failed");
  } finally {
    loading.value = false;
  }
};

const loading = ref(false);
const loadingText = ref("Saving scene...");
const loadingTimeout = ref<NodeJS.Timeout>();

onUnmounted(() => {
  clearTimeout(toValue(loadingTimeout));
});

// new scene
const addScene = () => {
  ElMessageBox.confirm("The current scene will be cleared. Continue?", "Notice", {
    confirmButtonText: "OK",
    cancelButtonText: "Cancel",
    type: "warning",
  })
    .then(() => {
      store.sceneApi?.renderDestroy();
      indexDbStore.indexDbUtil?.clear(IndexDbStoreName.scene);
      window.location.reload();
    })
    .catch(() => {});
};

// save scene
const debounceSaveScene = debounce(async () => {
  loadingText.value = "Saving scene. The page may hitch — please wait...";
  loading.value = true;
  loadingTimeout.value = setTimeout(async () => {
    try {
      clearTimeout(toValue(loadingTimeout));
      await saveSceneIndexDb();
      loading.value = false;
      ElMessage.success("Scene saved");
    } catch {
      loading.value = false;
      clearTimeout(toValue(loadingTimeout));
      ElMessage.error("Failed to save scene");
    }
  }, 1000);
}, 1500);

// save scene to IndexedDB
const saveSceneIndexDb = async () => {
  try {
    const sceneApi = store.sceneApi;
    if (!sceneApi) {
      throw new Error("Scene is not initialized");
    }
    let newScene = cloneDeep(sceneApi?.scene);

    const transformControlsRoot = newScene?.getObjectByProperty(
      "isTransformControlsRoot",
      true
    );
    const boxHelper = newScene?.getObjectByProperty("type", "BoxHelper");
    const particles = newScene?.getObjectByProperty("type", "Points");
    newScene?.remove(transformControlsRoot as THREE.Object3D);
    newScene?.remove(boxHelper as THREE.BoxHelper);
    newScene?.remove(particles as THREE.Points);

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
    console.error("Failed to save scene:", error);
    return Promise.reject(error);
  }
};

// save scene snapshot
const saveSceneSnapshot = async () => {
  const canvas = store.sceneApi?.renderer?.domElement;
  if (!canvas) return;
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = `${new Date().toLocaleString()}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  ElMessage.success("Download complete");
};

// export scene
const debounceExportScene = debounce(async () => {
  loading.value = true;
  loadingText.value = "Exporting scene. The page may hitch — please wait...";
  loadingTimeout.value = setTimeout(() => {
    try {
      const sceneApi = store.sceneApi;
      const newScene = cloneDeep(sceneApi?.scene);
      const transformControlsRoot = newScene?.getObjectByProperty(
        "isTransformControlsRoot",
        true
      );
      const boxHelper = newScene?.getObjectByProperty("isBoxHelper", true);
      const planeGeometry = newScene?.getObjectByName("customPlane");
      newScene?.remove(transformControlsRoot as THREE.Object3D);
      if (boxHelper) newScene?.remove(boxHelper as THREE.BoxHelper);
      if (planeGeometry) newScene?.remove(planeGeometry as THREE.Mesh);

      const jsonData = {
        scene: newScene?.toJSON(),
        camera: sceneApi?.camera?.toJSON(),
        controls: toRaw(sceneApi?.controls?.target),
      };

      const blob = new Blob([JSON.stringify(jsonData)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      document.body.appendChild(link);
      link.href = url;
      link.download = `${new Date().toLocaleString()}.json`;
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      loading.value = false;
      clearTimeout(toValue(loadingTimeout));
      ElMessage.success("Scene exported");
    } catch {
      ElMessage.error("Failed to export scene");
      loading.value = false;
      clearTimeout(toValue(loadingTimeout));
    }
  }, 1000);
}, 1000);

// import scene
const importScene = () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.style.display = "none";

  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) chooseSceneJson(file);
    input.remove();
  };
  input.click();
};

// choose scene JSON
const chooseSceneJson = async (file: File) => {
  try {
    loading.value = true;
    loadingText.value = "Importing scene...";
    const reader = new FileReader();
    const fileContent = await new Promise<string>((resolve, reject) => {
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string);
        } else {
          reject(new Error("Failed to read file"));
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });

    const sceneData = JSON.parse(fileContent);
    if (!sceneData.scene || !sceneData.camera) {
      throw new Error("Invalid scene file format");
    }

    if (store.sceneApi) {
      await store.sceneApi.loadIndexDbSceneData(sceneData);
      ElMessage.success("Scene imported");
    }
  } catch {
    ElMessage.error("Failed to import scene");
  } finally {
    loading.value = false;
  }
};

const pickHdTarget = async () => {
  const { value } = await ElMessageBox.prompt(
    HD_DEPLOY_TARGETS.map((t) => `${t.id} — ${t.label}`).join("\n"),
    "Sector / map target",
    {
      confirmButtonText: "Use target",
      inputPlaceholder: "haven_shore",
      inputValue: "haven_shore",
    }
  );
  const target = HD_DEPLOY_TARGETS.find((t) => t.id === String(value).trim());
  if (!target) throw new Error("Unknown sector/map id");
  return target;
};

const generateHdDeployPack = async () => {
  if (!store.sceneApi?.scene) return;
  try {
    const { value: presetRaw } = await ElMessageBox.prompt(
      "Preset: mountains | crags | zone",
      "Generate HD terrain",
      { inputValue: "mountains", confirmButtonText: "Next" }
    );
    const preset = String(presetRaw).trim() as Ds2PresetId;
    if (!["mountains", "crags", "zone"].includes(preset)) {
      throw new Error("Preset must be mountains, crags, or zone");
    }
    const target = await pickHdTarget();
    loading.value = true;
    loadingText.value = "Load screen · generating deploy mesh…";
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
      "deploy"
    );
    loadingText.value = "Load screen · exporting GLB + deploy.json…";
    const roots = collectHdTerrainRoots(store.sceneApi.scene);
    const files = await exportHdTerrainPack(roots.slice(-1), target);
    ElMessage.success(
      `Downloaded ${files.rawName} + ${files.jsonName}. Put them in deploys/hd-terrain/in then run pnpm bake:hd-terrain`
    );
  } catch (err) {
    if (err !== "cancel") {
      ElMessage.error(err instanceof Error ? err.message : "HD pack failed");
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
      ElMessage.warning("No HD terrain in the scene — generate or drop one first");
      return;
    }
    const target = await pickHdTarget();
    loading.value = true;
    loadingText.value = "Load screen · exporting GLB + deploy.json…";
    const files = await exportHdTerrainPack(roots, target);
    ElMessage.success(
      `Downloaded ${files.rawName} + ${files.jsonName}. Move into deploys/hd-terrain/in then pnpm bake:hd-terrain`
    );
  } catch (err) {
    if (err !== "cancel") {
      ElMessage.error(err instanceof Error ? err.message : "Export failed");
    }
  } finally {
    loading.value = false;
  }
};

// export model
const debounceExportModel = debounce(async (type: ExportType) => {

  loading.value = true;
  loadingText.value = "Exporting model. The page may hitch — please wait...";
  loadingTimeout.value = setTimeout(() => {
    try {
      if (!store.sceneApi?.scene) return;
      exportSceneModel(type, store.sceneApi?.scene);
      loading.value = false;
      clearTimeout(toValue(loadingTimeout));
      ElMessage.success("Model exported");
    } catch (error) {
      ElMessage.error("Failed to export model");
      loading.value = false;
      clearTimeout(toValue(loadingTimeout));
    }
  }, 1000);
}, 1000);
</script>

<style lang="scss" scoped src="./index.scss"></style>
