<template>
  <div class="render-header">
    <div class="render-header-left">
      <div class="render-header-left-title">ThreeFlowX(个人版)</div>
    </div>
    <div class="render-header-right">
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
import { debounce } from "lodash-es";
import { checkPageUsageTime } from "@/utils/utils";
import { ref, onUnmounted } from "vue";
import Loading from "@/components/Loading/index.vue";
import { ElMessage } from "element-plus";
import type { ExportType } from "@/types/rightPanelTypes";
import { exportSceneModel } from "@/utils/sceneModules/sceneModules";
import { EXPORT_TYPE } from "@/enums/enum";

const store = useSceneStore();

const loading = ref(false);
const loadingText = ref("保存场景中...");
const loadingTimeout = ref<NodeJS.Timeout>();

onUnmounted(() => {
  clearTimeout(loadingTimeout.value);
});

// 导出模型
const debounceExportModel = debounce(async (type: ExportType) => {
  if (checkPageUsageTime(3)) {
    return false;
  }
  loading.value = true;
  loadingText.value = "导出模型中,页面可能会有卡顿请耐心等待...";
  loadingTimeout.value = setTimeout(() => {
    try {
      if (!store.sceneApi?.scene) return;
      exportSceneModel(type, store.sceneApi?.scene);
      loading.value = false;
      clearTimeout(loadingTimeout.value);
      ElMessage.success("导出模型成功");
    } catch (error) {
      ElMessage.error("导出模型失败");
      loading.value = false;
      clearTimeout(loadingTimeout.value);
    }
  }, 1000);
}, 1000);
</script>

<style lang="scss" scoped src="./index.scss"></style>
