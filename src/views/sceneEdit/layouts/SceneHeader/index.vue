<template>
  <div class="render-header">
    <div class="render-header-left">
      <img src="/icon.png" class="header-logo" alt="logo" />
      <div class="left-title">
        ThreeFlow
        <span class="author">作者:answer</span>
      </div>
    </div>
    <div class="render-header-right">
      <div class="header-right-item">
        <el-button type="primary" @click="debounceSaveScene">
          <span class="iconfont icon-baocun">&nbsp;保存场景</span>
        </el-button>
      </div>
      <div class="header-right-item">
        <el-dropdown trigger="click">
          <el-button type="primary">
            <span class="iconfont icon-changjing2">&nbsp;场景</span>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="addScene">
                <span class="iconfont icon-changjing1">&nbsp;新增场景</span>
              </el-dropdown-item>
              <el-dropdown-item @click="saveSceneSnapshot">
                <span class="iconfont icon-zhaoxiangji"> &nbsp;场景快照(.png) </span>
              </el-dropdown-item>
              <el-dropdown-item @click="debounceExportScene">
                <span class="iconfont icon-daochu">&nbsp;导出场景(.json)</span>
              </el-dropdown-item>
              <el-dropdown-item @click="importScene">
                <span class="iconfont icon-daoru">&nbsp;导入场景(.json)</span>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
      <div class="header-right-item">
        <el-dropdown trigger="click">
          <el-button type="primary">
            <span class="iconfont icon-moxing">&nbsp;模型</span>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="debounceExportModel(EXPORT_TYPE.GLTF)">
                <span class="iconfont icon-glTF">&nbsp;导出模型(.gltf)</span>
              </el-dropdown-item>
              <el-dropdown-item @click="debounceExportModel(EXPORT_TYPE.GLB)">
                <span class="iconfont icon-glb">&nbsp;导出模型(.glb)</span>
              </el-dropdown-item>
              <el-dropdown-item @click="debounceExportModel(EXPORT_TYPE.USDZ)">
                <el-tooltip content="建议使用.gltf格式源,导出模型" placement="top">
                  <span class="iconfont icon-filfvectorima">&nbsp;导出模型(.usdz)</span>
                </el-tooltip>
              </el-dropdown-item>
              <el-dropdown-item @click="debounceExportModel(EXPORT_TYPE.STL)">
                <span class="iconfont icon-STL">&nbsp;导出模型(.stl)</span>
              </el-dropdown-item>
              <el-dropdown-item @click="debounceExportModel(EXPORT_TYPE.OBJ)">
                <span class="iconfont icon-obj">&nbsp;导出模型(.obj)</span>
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
import { exportSceneModel } from "@/utils/sceneModules/sceneModules";
import { EXPORT_TYPE } from "@/enums/enum";

const store = useSceneStore();
const indexDbStore = useIndexDbStore();

const loading = ref(false);
const loadingText = ref("保存场景中...");
const loadingTimeout = ref<NodeJS.Timeout>();

onUnmounted(() => {
  clearTimeout(toValue(loadingTimeout));
});

// 新增场景
const addScene = () => {
  ElMessageBox.confirm("当前场景将被清空,是否继续?", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(() => {
      store.sceneApi?.renderDestroy();
      indexDbStore.indexDbUtil?.clear(IndexDbStoreName.scene);
      window.location.reload();
    })
    .catch(() => {});
};

// 保存场景
const debounceSaveScene = debounce(async () => {
  loadingText.value = "保存场景中,页面可能会有卡顿请耐心等待...";
  loading.value = true;
  loadingTimeout.value = setTimeout(async () => {
    try {
      clearTimeout(toValue(loadingTimeout));
      await saveSceneIndexDb();
      loading.value = false;
      ElMessage.success("保存场景成功");
    } catch {
      loading.value = false;
      clearTimeout(toValue(loadingTimeout));
      ElMessage.error("保存场景失败");
    }
  }, 1000);
}, 1500);

// 保存场景到indexDb
const saveSceneIndexDb = async () => {
  try {
    const sceneApi = store.sceneApi;
    if (!sceneApi) {
      throw new Error("场景未初始化");
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
    console.error("保存场景失败:", error);
    return Promise.reject(error);
  }
};

// 保存场景快照
const saveSceneSnapshot = async () => {
  const canvas = store.sceneApi?.renderer?.domElement;
  if (!canvas) return;
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = `${new Date().toLocaleString()}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  ElMessage.success("下载成功");
};

// 导出场景
const debounceExportScene = debounce(async () => {
  loading.value = true;
  loadingText.value = "导出场景中,页面可能会有卡顿请耐心等待...";
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
      ElMessage.success("导出场景成功");
    } catch {
      ElMessage.error("导出场景失败");
      loading.value = false;
      clearTimeout(toValue(loadingTimeout));
    }
  }, 1000);
}, 1000);

// 导入场景
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

// 选择场景json
const chooseSceneJson = async (file: File) => {
  try {
    loading.value = true;
    loadingText.value = "导入场景中...";
    const reader = new FileReader();
    const fileContent = await new Promise<string>((resolve, reject) => {
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string);
        } else {
          reject(new Error("文件读取失败"));
        }
      };
      reader.onerror = () => reject(new Error("文件读取失败"));
      reader.readAsText(file);
    });

    const sceneData = JSON.parse(fileContent);
    if (!sceneData.scene || !sceneData.camera) {
      throw new Error("无效的场景文件格式");
    }

    if (store.sceneApi) {
      await store.sceneApi.loadIndexDbSceneData(sceneData);
      ElMessage.success("场景导入成功");
    }
  } catch {
    ElMessage.error("导入场景失败");
  } finally {
    loading.value = false;
  }
};

// 导出模型
const debounceExportModel = debounce(async (type: ExportType) => {

  loading.value = true;
  loadingText.value = "导出模型中,页面可能会有卡顿请耐心等待...";
  loadingTimeout.value = setTimeout(() => {
    try {
      if (!store.sceneApi?.scene) return;
      exportSceneModel(type, store.sceneApi?.scene);
      loading.value = false;
      clearTimeout(toValue(loadingTimeout));
      ElMessage.success("导出模型成功");
    } catch (error) {
      ElMessage.error("导出模型失败");
      loading.value = false;
      clearTimeout(toValue(loadingTimeout));
    }
  }, 1000);
}, 1000);
</script>

<style lang="scss" scoped src="./index.scss"></style>
