<template>
  <el-scrollbar max-height="calc(100vh - 420px)">
    <div class="property-content">
      <!-- 基础属性 -->
      <div class="property-item" v-for="item in baseProperties" :key="item.key">
        <div class="property-item-label">{{ item.label }}</div>
        <div class="property-item-value" v-if="item.key === 'name'">
          <el-input
            v-model="meshProperty[item.key]"
            @change="updateMaterialProperty(item.key, $event)"
          />
        </div>
        <div class="property-item-value" v-else>
          {{ meshProperty[item.key] }}
        </div>
      </div>
      <!-- 变换属性 -->
      <div
        class="property-item"
        v-for="transform in transformProperties"
        :key="transform.key"
      >
        <div class="property-item-label">{{ transform.label }}</div>
        <div class="property-item-value">
          <div
            class="input-content"
            v-for="axis in ['x', 'y', 'z']"
            :key="axis"
          >
            <span>{{ axis.toUpperCase() }} </span>
            <el-input-number
              :style="{ width: '60px' }"
              :precision="3"
              :controls="false"
              @change="updateTransformProperties(transform.key, axis, $event)"
              v-model="
                (meshProperty[transform.key] as THREE.Vector3)[
                  axis as unknown as keyof THREE.Vector3
                ]
              "
            />
          </div>
        </div>
      </div>
      <div
        class="property-item"
        v-for="item in shadowProperties"
        :key="item.key"
      >
        <div class="property-item-label">{{ item.label }}</div>
        <div class="property-item-value">
          <el-switch
            @change="updateMaterialProperty(item.key, $event)"
            v-model="meshProperty[item.key]"
          />
        </div>
      </div>
      <!-- 相机属性 -->
      <template v-if="meshProperty.type === 'PerspectiveCamera'">
        <div class="property-item">
          <div class="property-item-label">视角(fov)</div>
          <div class="property-item-value">
            <el-input-number
              @change="updateCameraProperty('fov', $event)"
              v-model="meshProperty.fov"
              :precision="2"
            />
          </div>
        </div>
        <div class="property-item">
          <div class="property-item-label">近点(near)</div>
          <div class="property-item-value">
            <el-input-number
              @change="updateCameraProperty('near', $event)"
              v-model="meshProperty.near"
              :precision="2"
              :step="0.01"
              :max="2"
            />
          </div>
        </div>
        <div class="property-item">
          <div class="property-item-label">远点(far)</div>
          <div class="property-item-value">
            <el-input-number
              @change="updateCameraProperty('far', $event)"
              v-model="meshProperty.far"
              :precision="2"
              :step="100"
              :max="300000"
            />
          </div>
        </div>
      </template>
      <!-- 灯光属性 -->
      <template v-if="meshProperty.isLight">
        <div class="property-item" v-if="lightHelper">
          <div class="property-item-label">灯光辅助线</div>
          <div class="property-item-value">
            <el-switch
              v-model="lightHelper.visible"
              @change="updateLightHelper($event)"
            />
          </div>
        </div>
        <div class="property-item">
          <div class="property-item-label">颜色</div>
          <div class="property-item-value">
            <el-color-picker
              v-model="lightColor.color"
              :predefine="PREDEFINE_COLORS"
              @change="updateLightProperty('color', $event)"
            />
          </div>
        </div>
        <div class="property-item" v-if="meshProperty.isHemisphereLight">
          <div class="property-item-label">地面颜色</div>
          <div class="property-item-value">
            <el-color-picker
              v-model="lightColor.groundColor"
              :predefine="PREDEFINE_COLORS"
              @change="updateLightProperty('groundColor', $event)"
            />
          </div>
        </div>
        <div class="property-item">
          <div class="property-item-label">强度</div>
          <div class="property-item-value">
            <el-slider
              :step="0.1"
              v-model="meshProperty.intensity"
              show-input
              :precision="2"
              :min="0"
              :max="lightIntensityRange"
              @change="updateLightProperty('intensity', $event)"
            />
          </div>
        </div>
        <template v-if="meshProperty.isSpotLight">
          <div class="property-item">
            <div class="property-item-label">范围</div>
            <div class="property-item-value">
              <el-slider
                @input="updateLightProperty('angle', $event)"
                v-model="meshProperty.angle"
                show-input
                :min="0"
                :precision="0.01"
                :step="0.01"
                :max="2"
              />
            </div>
          </div>
          <div class="property-item">
            <div class="property-item-label">半影</div>
            <div class="property-item-value">
              <el-slider
                @input="updateLightProperty('penumbra', $event)"
                v-model="meshProperty.penumbra"
                show-input
                :min="0"
                :precision="0.01"
                :step="0.01"
                :max="5"
              />
            </div>
          </div>
          <div class="property-item" v-if="meshProperty.shadow">
            <div class="property-item-label">焦距</div>
            <div class="property-item-value">
              <el-slider
                @input="updateLightProperty('focus', $event)"
                v-model="meshProperty.shadow.focus"
                show-input
                :min="0"
                :precision="0.01"
                :step="0.01"
                :max="5"
              />
            </div>
          </div>
          <div class="property-item">
            <div class="property-item-label">距离</div>
            <div class="property-item-value">
              <el-slider
                @input="updateLightProperty('distance', $event)"
                v-model="meshProperty.distance"
                show-input
                :min="1"
                :precision="1"
                :step="1"
                :max="700"
              />
            </div>
          </div>
        </template>
      </template>
    </div>
  </el-scrollbar>
</template>
<script setup lang="ts">
import { computed, onUnmounted, ref, type PropType } from 'vue';
import * as THREE from 'three';
import {
  baseProperties,
  transformProperties,
  shadowProperties,
} from './config';
import { useSceneStore } from '@/store/sceneEditStore';
import type {
  AxisType,
  TransformMaterial,
  TransformType,
} from '@/types/rightPanelTypes';
import { disposeMaterial } from '@/utils/utils';
import { PREDEFINE_COLORS } from '@/config/propertyConfig';
import { SCENE_OBJECT_NAME } from '@/enums/enum';

const store = useSceneStore();

const { meshProperty } = defineProps({
  meshProperty: {
    type: Object as PropType<TransformMaterial>,
    default: () => ({}),
  },
});


// 当前选中的材质
const currentTransformMaterialUuid = computed(() =>store.currentTransformMaterialUuid);

// 当前灯光
const currentLight = computed(() => {
  const light = store.sceneApi?.scene?.getObjectByProperty(
    'uuid',
    currentTransformMaterialUuid.value
  );
  const helper = store.sceneApi?.scene?.getObjectByProperty(
    'uuid',
    light?.userData.helperUuid
  );
  lightColor.value.color = new THREE.Color(meshProperty.color).getStyle();
  lightColor.value.groundColor = new THREE.Color(
    meshProperty.groundColor
  ).getStyle();

  return { light, helper };
});

const lightColor = ref({
  color: new THREE.Color(meshProperty.color).getStyle(),
  groundColor: new THREE.Color(meshProperty.groundColor).getStyle(),
});

// 灯光辅助线
const lightHelper = computed(() => {
  const { helper } = currentLight.value;
  return helper;
});

// 灯光强度范围
const lightIntensityRange = computed(() => {
  if (meshProperty.isSpotLight) {
    return 20000;
  }
  if (meshProperty.isDirectionalLight) {
    return 5;
  }
  if (meshProperty.isPointLight) {
    return 1000;
  }
  return 30;
});

// 更新变换属性(位置、旋转、缩放)
const updateTransformProperties = (
  propertyKey: string,
  axis: string,
  value: string | boolean
) => {
  // 相机单独处理
  if (meshProperty.type === SCENE_OBJECT_NAME.PerspectiveCamera) {
    const camera = store.sceneApi?.camera;
    if (camera) {
      camera[propertyKey as TransformType][axis as AxisType] = Number(value);
    }
    return;
  }
  const material = store.sceneApi?.scene?.getObjectByProperty(
    'uuid',
    currentTransformMaterialUuid.value
  );
  if (!material) return;
  material[propertyKey as TransformType][axis as AxisType] = Number(value);

  if ((material as THREE.Light).isLight) {
    const helperUuid = (material as THREE.Light).userData.helperUuid;
    const helper = store.sceneApi?.scene?.getObjectByProperty(
      'uuid',
      helperUuid
    );
    if (helper) {
      (helper as THREE.DirectionalLightHelper).update();
    }
  }
  disposeMaterial(material as THREE.Mesh);
};

// 更新材质属性
const updateMaterialProperty = (
  propertyKey: string,
  value: string | boolean | number
) => {
  if (meshProperty.type === 'PerspectiveCamera') {
    const camera = store.sceneApi?.camera;
    if (camera) {
      (camera as unknown as Record<string, string | number | boolean>)[
        propertyKey
      ] = value;
    }
    return;
  }

  const material = store.sceneApi?.scene?.getObjectByProperty(
    'uuid',
    currentTransformMaterialUuid.value
  );
  if (material) {
    (material as unknown as Record<string, string | boolean | number>)[
      propertyKey
    ] = value;
  }
};

// 更新灯光属性
const updateLightProperty = (propertyKey: string, value: string | boolean) => {
  const { light, helper } = currentLight.value;
  if (light) {
    if (propertyKey === 'color') {
      lightColor.value.color = value as string;
      (light as unknown as THREE.Light).color = new THREE.Color(
        value as string
      );
    } else if (propertyKey === 'groundColor') {
      lightColor.value.groundColor = value as string;
      (light as unknown as THREE.HemisphereLight).groundColor = new THREE.Color(
        value as string
      );
    } else {
      (light as unknown as Record<string, string | boolean>)[propertyKey] =
        value;
    }

    if (
      helper instanceof THREE.DirectionalLightHelper ||
      helper instanceof THREE.SpotLightHelper ||
      helper instanceof THREE.PointLightHelper ||
      helper instanceof THREE.HemisphereLightHelper
    ) {
      helper.update();
    }
  }
};

// 更新灯光辅助线
const updateLightHelper = (value: boolean) => {
  const { light } = currentLight.value;
  if (light) {
    light.userData.helperVisible = value;
  }
};

// 更新相机属性
const updateCameraProperty = (propertyKey: string, value: number) => {
  const camera = store.sceneApi?.camera;
  if (camera) {
    (camera as unknown as Record<string, number>)[propertyKey] = value;
    camera.updateProjectionMatrix();
  }
};

onUnmounted(() => {
  disposeMaterial(currentLight.value.light as THREE.Mesh);
  disposeMaterial(currentLight.value.helper as THREE.Mesh);
});
</script>
<style lang="scss" scoped src="./index.scss"></style>
