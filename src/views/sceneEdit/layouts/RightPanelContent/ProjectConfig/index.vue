<template>
  <div class="project-container">
    <div class="project-content">
      <!-- Renderer -->
      <div class="project-content-title">Renderer</div>
      <div class="project-content-item">
        <div class="item-label">Tone mapping</div>
        <div class="item-value">
          <el-select
            @change="updateRenderConfig"
            v-model="configData.toneMapping"
            placeholder="Select"
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
        <div class="item-label">Shadows</div>
        <div class="item-value">
          <el-select
            @change="updateRenderConfig"
            v-model="configData.shadowType"
            placeholder="Select"
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
        <div class="item-label">Exposure</div>
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
      <!-- Scene -->
      <div class="project-content-title">Scene</div>
      <div class="project-content-item">
        <div class="item-label">Background</div>
        <div class="item-value">
          <el-select
            v-model="configData.background"
            style="width: 120px"
            placeholder="Select"
            @change="updateSceneBackground"
          >
            <el-option
              v-for="item in backgroundOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            ></el-option>
          </el-select>
          <!-- color -->
          <el-color-picker
            :predefine="colorPickerOptions"
            @change="updateSceneBackgroundColor"
            v-if="configData.background === BACKGROUND_TYPE.Color"
            v-model="configData.backgroundColor"
          />
          <!-- image -->
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
              content="Supports .jpg, .png, .hdr"
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
        <div class="item-label">Blur</div>
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
        <div class="item-label">Intensity</div>
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
        <div class="item-label">Environment</div>
        <div class="item-value">
          <el-select
            v-model="configData.environment"
            style="width: 120px"
            placeholder="Select"
            @change="updateSceneEnvironment"
          >
            <el-option
              v-for="item in environmentOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            ></el-option>
          </el-select>
          <!-- image -->
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
              content="Supports .jpg, .png, .hdr"
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
        <div class="item-label">Fog</div>
        <div class="item-value">
          <el-space>
            <el-select
              style="width: 120px"
              placeholder="Select"
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
        <div class="item-label">Fog density</div>
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
  normalizeShadowType,
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
    shadowType: normalizeShadowType(sceneConfig?.shadowType),
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
// update renderer config
const updateRenderConfig = () => {
  sceneApi!.renderer!.toneMapping = configData.toneMapping;
  sceneApi!.renderer!.toneMappingExposure = configData.toneMappingExposure;
  sceneApi!.renderer!.shadowMap.type = normalizeShadowType(configData.shadowType);
};
// update scene background
const updateSceneBackground = () => {
  if (configData.background === BACKGROUND_TYPE.Color) {
    sceneApi!.scene!.background = new THREE.Color(configData.backgroundColor as string);
  } else if (configData.background === BACKGROUND_TYPE.Texture) {
    sceneApi!.scene!.background = configData.backgroundTexture || null;
  } else if (configData.background === BACKGROUND_TYPE.NoBackground) {
    sceneApi!.scene!.background = new THREE.Color(0xa0a0a0);
  }
};
// update scene environment
const updateSceneEnvironment = () => {
  if (configData.environment === ENVIRONMENT_TYPE.Environment) {
    sceneApi!.scene!.environment = configData.environmentTexture;
  } else if (configData.environment === ENVIRONMENT_TYPE.NoEnvironment) {
    sceneApi!.scene!.environment = null;
  }
};
// update background color
const updateSceneBackgroundColor = () => {
  sceneApi!.scene!.background = new THREE.Color(configData.backgroundColor as string);
};
// update background blur
const updateSceneBlurrinessAndIntensity = () => {
  sceneApi!.scene!.backgroundBlurriness = configData.backgroundBlurriness;
  sceneApi!.scene!.backgroundIntensity = configData.backgroundIntensity;
};

// upload background image
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

// update scene fog
const updateSceneFogInfo = () => {
  const fogInfo = {
    fog: configData.fog,
    fogColor: configData.fogColor,
    fogNear: configData.fogNear,
    fogFar: configData.fogFar,
    fogDensity: configData.fogDensity,
  };
  updateSceneFog(fogInfo as Record<string, number | string>);
};
</script>
<style lang="scss" scoped src="./index.scss"></style>
