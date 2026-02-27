<template>
  <div class="project-container">
    <div class="project-content">
      <!-- 渲染器 -->
      <div class="project-content-title">渲染器</div>
      <div class="project-content-item">
        <div class="item-label">色调映射</div>
        <div class="item-value">
          <el-select
            @change="updateRenderConfig"
            v-model="configData.toneMapping"
            placeholder="请选择"
          >
            <el-option
              v-for="item in toneMappingOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            ></el-option>
          </el-select>
        </div>
      </div>
      <div class="project-content-item">
        <div class="item-label">阴影</div>
        <div class="item-value">
          <el-select
            @change="updateRenderConfig"
            v-model="configData.shadowType"
            placeholder="请选择"
          >
            <el-option
              v-for="item in shadowTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            ></el-option>
          </el-select>
        </div>
      </div>
      <div
        class="project-content-item"
        v-if="configData.toneMapping != THREE.NoToneMapping"
      >
        <div class="item-label">曝光度</div>
        <div class="item-value">
          <el-slider
            @change="updateRenderConfig"
            v-model="configData.toneMappingExposure"
            :min="0"
            :max="5"
            show-input
            :step="0.1"
          />
        </div>
      </div>
      <!-- 场景 -->
      <div class="project-content-title">场景</div>
      <div class="project-content-item">
        <div class="item-label">背景</div>
        <div class="item-value">
          <el-select
            v-model="configData.background"
            style="width: 120px"
            placeholder="请选择"
            @change="updateSceneBackground"
          >
            <el-option
              v-for="item in backgroundOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            ></el-option>
          </el-select>
          <!-- 颜色 -->
          <el-color-picker
            :predefine="colorPickerOptions"
            @change="updateSceneBackgroundColor"
            v-if="configData.background === BACKGROUND_TYPE.Color"
            v-model="configData.backgroundColor"
          />
          <!-- 图片 -->
          <el-upload
            v-if="configData.background === BACKGROUND_TYPE.Texture"
            :show-file-list="false"
            :auto-upload="false"
            accept=".jpg,.png,.hdr"
            :on-change="
              (file: UploadFile) =>
                uploadBackgroundMapFile('backgroundMap', file)
            "
          >
            <el-tooltip
              class="item"
              effect="dark"
              content="支持.jpg,.png,.hdr格式"
              placement="top"
            >
              <el-image
                class="el-image"
                v-if="configData.backgroundMap"
                :src="configData.backgroundMap"
              />
              <div class="el-upload-btn" v-else>
                <el-icon>
                  <Plus />
                </el-icon>
              </div>
            </el-tooltip>
          </el-upload>
        </div>
      </div>
      <div
        class="project-content-item"
        v-if="configData.background === BACKGROUND_TYPE.Texture"
      >
        <div class="item-label">模糊度</div>
        <div class="item-value">
          <el-slider
            v-model="configData.backgroundBlurriness"
            @change="updateSceneBlurrinessAndIntensity"
            show-input
            :min="0"
            :max="1"
            :step="0.1"
          />
        </div>
      </div>
      <div
        class="project-content-item"
        v-if="configData.background === BACKGROUND_TYPE.Texture"
      >
        <div class="item-label">强度</div>
        <div class="item-value">
          <el-slider
            v-model="configData.backgroundIntensity"
            @change="updateSceneBlurrinessAndIntensity"
            show-input
            :min="0"
            :max="6"
            :step="0.1"
          />
        </div>
      </div>
      <div class="project-content-item">
        <div class="item-label">环境</div>
        <div class="item-value">
          <el-select
            v-model="configData.environment"
            style="width: 120px"
            placeholder="请选择"
            @change="updateSceneEnvironment"
          >
            <el-option
              v-for="item in environmentOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            ></el-option>
          </el-select>
          <!-- 图片 -->
          <el-upload
            v-if="configData.environment === ENVIRONMENT_TYPE.Environment"
            :show-file-list="false"
            :auto-upload="false"
            accept=".jpg,.png,.hdr"
            :on-change="
              (file: UploadFile) =>
                uploadBackgroundMapFile('environmentMap', file)
            "
          >
            <el-tooltip
              class="item"
              effect="dark"
              content="支持.jpg,.png,.hdr格式"
              placement="top"
            >
              <el-image
                class="el-image"
                v-if="configData.environmentMap"
                :src="configData.environmentMap"
              />
              <div class="el-upload-btn" v-else>
                <el-icon>
                  <Plus />
                </el-icon>
              </div>
            </el-tooltip>
          </el-upload>
        </div>
      </div>
      <div class="project-content-item">
        <div class="item-label">雾</div>
        <div class="item-value">
          <el-space>
            <el-select
              style="width: 120px"
              placeholder="请选择"
              @change="updateSceneFogInfo"
              v-model="configData.fog"
            >
              <el-option
                v-for="(item, index) in fogOptions"
                :key="index"
                :label="item.label"
                :value="item.value"
              ></el-option>
            </el-select>

            <el-color-picker
              v-if="configData.fog != FOG_TYPE.None"
              :predefine="colorPickerOptions"
              @change="updateSceneFogInfo"
              v-model="configData.fogColor"
            />
          </el-space>
        </div>
      </div>
      <div class="project-content-item" v-if="configData.fog != FOG_TYPE.None">
        <div class="item-label">雾浓度</div>
        <div class="item-value">
          <el-space v-if="configData.fog == FOG_TYPE.Fog">
            <el-input-number
              style="width: 120px"
              @change="updateSceneFogInfo"
              v-model="configData.fogNear"
              :min="0"
              :max="1000"
              :precision="2"
              :step="2"
            />
            <el-input-number
              style="width: 120px"
              @change="updateSceneFogInfo"
              v-model="configData.fogFar"
              :min="0"
              :max="1000"
              :precision="2"
              :step="2"
            />
          </el-space>
          <el-input-number
            style="width: 120px"
            v-if="configData.fog == FOG_TYPE.FogExp2"
            @change="updateSceneFogInfo"
            v-model="configData.fogDensity"
            :min="0"
            :max="5"
            :precision="3"
            :step="0.01"
          />
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import {
  toneMappingOptions,
  shadowTypeOptions,
  backgroundOptions,
  environmentOptions,
} from "@/config/propertyConfig";
import { FOG_NEAR_VALUE, FOG_FAR_VALUE, FOG_DENSITY_VALUE, FOG_COLOR_VALUE } from "@/config/constant";
import { onMounted, onUnmounted, reactive, getCurrentInstance } from "vue";
import * as THREE from "three";
import type { UploadFile } from "element-plus";
import {
  BACKGROUND_TYPE,
  ENVIRONMENT_TYPE,
  FOG_TYPE,
  MITT_ON_KEY,
} from "@/enums/enum";
import { PREDEFINE_COLORS, fogOptions } from "@/config/propertyConfig";
import type { ProjectConfigData } from "@/types/rightPanelTypes";
import { useSceneStore } from "@/store/sceneEditStore";
import { generateMaterialMaps, getFileType, updateMaterialMap } from "@/utils/utils";
import { getSceneConfig, updateSceneFog } from "@/utils/sceneModules";
import type { WeatherOptions } from "@/types/renderModelTypes";
const colorPickerOptions = PREDEFINE_COLORS;

const { $eventBus } = getCurrentInstance()?.proxy || {};
const { sceneApi } = useSceneStore();

const configData = reactive<ProjectConfigData>({
  toneMapping: THREE.NoToneMapping,
  toneMappingExposure: 1,
  shadowType: THREE.BasicShadowMap,
  background: null,
  backgroundColor: null,
  backgroundMap: null,
  backgroundTexture: null,
  backgroundBlurriness: 1,
  backgroundIntensity: 1,
  environment: null,
  environmentMap: null,
  environmentTexture: null,
  fog: FOG_TYPE.None,
  fogColor: FOG_COLOR_VALUE,
  fogNear: FOG_NEAR_VALUE,
  fogFar: FOG_FAR_VALUE,
  fogDensity: FOG_DENSITY_VALUE,
});


onMounted(() => {
  initConfigData();
  $eventBus?.on(MITT_ON_KEY.SCENE_LOADING, () => {
    initConfigData();
  });
});

onUnmounted(() => {
  $eventBus?.off(MITT_ON_KEY.SCENE_LOADING);
});
const initConfigData = () => {
  if (!sceneApi) return;

  const sceneConfig = getSceneConfig() as ProjectConfigData;
  Object.assign(configData, {
    toneMapping: sceneConfig?.toneMapping,
    toneMappingExposure: sceneConfig?.toneMappingExposure,
    shadowType: sceneConfig?.shadowType,
    background: sceneConfig?.background,
    backgroundColor: new THREE.Color(
      sceneConfig?.backgroundColor as string
    ).getStyle(),
    backgroundMap: generateMaterialMaps(
      (sceneConfig?.backgroundMap as unknown) as THREE.Texture
    ),
    backgroundTexture: sceneConfig?.backgroundTexture,
    backgroundBlurriness: sceneConfig?.backgroundBlurriness,
    backgroundIntensity: sceneConfig?.backgroundIntensity,
    environment: sceneConfig?.environment,
    environmentMap: generateMaterialMaps(
      (sceneConfig?.environmentMap as unknown) as THREE.Texture
    ),
    fog: sceneConfig?.fog,
    fogColor: sceneConfig?.fogColor,
    fogNear: sceneConfig?.fogNear,
    fogFar: sceneConfig?.fogFar,
    fogDensity: sceneConfig?.fogDensity,
    environmentTexture: sceneConfig?.environmentTexture,
  });
};
// 更新渲染配置
const updateRenderConfig = () => {
  sceneApi!.renderer!.toneMapping = configData.toneMapping;
  sceneApi!.renderer!.toneMappingExposure = configData.toneMappingExposure;
  sceneApi!.renderer!.shadowMap.type = configData.shadowType;
};
// 更新场景背景
const updateSceneBackground = () => {
  if (configData.background === BACKGROUND_TYPE.Color) {
    sceneApi!.scene!.background = new THREE.Color(configData.backgroundColor as string);
  } else if (configData.background === BACKGROUND_TYPE.Texture) {
    sceneApi!.scene!.background = configData.backgroundTexture || null;
  } else if (configData.background === BACKGROUND_TYPE.NoBackground) {
    sceneApi!.scene!.background = new THREE.Color(0xa0a0a0);
  }
};
// 更新场景环境
const updateSceneEnvironment = () => {
  if (configData.environment === ENVIRONMENT_TYPE.Environment) {
    sceneApi!.scene!.environment = configData.environmentTexture;
  } else if (configData.environment === ENVIRONMENT_TYPE.NoEnvironment) {
    sceneApi!.scene!.environment = null;
  }
};
// 更新场景背景颜色
const updateSceneBackgroundColor = () => {
  sceneApi!.scene!.background = new THREE.Color(configData.backgroundColor as string);
};
// 更新场景背景模糊度
const updateSceneBlurrinessAndIntensity = () => {
  sceneApi!.scene!.backgroundBlurriness = configData.backgroundBlurriness;
  sceneApi!.scene!.backgroundIntensity = configData.backgroundIntensity;
};

// 上传背景图片
const uploadBackgroundMapFile = async (valueKey: string, file: UploadFile) => {
  try {
    const filePath = URL.createObjectURL(file?.raw as Blob);
    const textures = await updateMaterialMap(filePath, getFileType(file.name));
    textures.mapping = THREE.EquirectangularReflectionMapping;

    if (valueKey === "backgroundMap") {
      configData.backgroundTexture = textures;
      configData.backgroundMap = generateMaterialMaps(textures);
      sceneApi!.scene!.background = configData.backgroundTexture;
      textures.dispose();
    }
    if (valueKey === "environmentMap") {
      configData.environmentTexture = textures;
      configData.environmentMap = generateMaterialMaps(textures);

      sceneApi!.scene!.environment = configData.environmentTexture;
      textures.dispose();
    }
  } catch (error) {
    console.error(error);
  }
};

// 更新场景雾
const updateSceneFogInfo = () => {
  const fogInfo = {
    fog: configData.fog,
    fogColor: configData.fogColor,
    fogNear: configData.fogNear,
    fogFar: configData.fogFar,
    fogDensity: configData.fogDensity,
  };
  updateSceneFog(fogInfo as Record<string, boolean | number | string>);
};
</script>
<style lang="scss" scoped src="./index.scss"></style>
