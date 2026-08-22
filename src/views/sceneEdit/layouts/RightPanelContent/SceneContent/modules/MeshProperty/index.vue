<template>
  <el-scrollbar max-height="calc(100vh - 420px)">
    <div class="property-content">
      <!-- base properties -->
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
      <div class="property-item" v-for="row in identityRows" :key="row.label">
        <div class="property-item-label">{{ row.label }}</div>
        <div class="property-item-value" :title="row.value">
          {{ row.value }}
        </div>
      </div>
      <!-- transform properties -->
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
      <div class="property-item">
        <div class="property-item-label">Layer</div>
        <div class="property-item-value">
          <el-select
            size="small"
            :model-value="contentLayerId"
            style="width: 140px"
            @change="assignContentLayer"
          >
            <el-option
              v-for="l in CONTENT_LAYERS"
              :key="l.id"
              :label="`${l.label} · ${l.phys}`"
              :value="l.id"
            />
          </el-select>
          <el-button
            v-if="contentLayerId === 'player'"
            size="small"
            type="primary"
            style="margin-left: 6px"
            @click="playAsThis"
          >
            Play as
          </el-button>
        </div>
      </div>
      <div class="property-item" v-if="isMapSurface">
        <div class="property-item-label">Map Y</div>
        <div class="property-item-value">
          <el-input-number
            size="small"
            :model-value="mapSurfaceY"
            :precision="2"
            :step="1"
            :controls="false"
            style="width: 80px"
            @change="setMapSurfaceY"
          />
          <span style="margin-left: 6px; font-size: 11px; opacity: 0.7">
            2000 m brick · stack more in Systems
          </span>
        </div>
      </div>
      <div class="property-item">
        <div class="property-item-label">Terrain</div>
        <div class="property-item-value">
          <el-button size="small" type="primary" @click="groundToTerrain">
            Asset to ground
          </el-button>
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
      <!-- camera properties -->
      <template v-if="meshProperty.type === 'PerspectiveCamera'">
        <div class="property-item">
          <div class="property-item-label">Fog</div>
          <div class="property-item-value">
            <el-switch :model-value="fogOn" @change="onFogToggle" />
          </div>
        </div>
        <div class="property-item">
          <div class="property-item-label">FOV</div>
          <div class="property-item-value">
            <el-input-number
              @change="updateCameraProperty('fov', $event)"
              v-model="meshProperty.fov"
              :precision="2"
            />
          </div>
        </div>
        <div class="property-item">
          <div class="property-item-label">Near</div>
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
          <div class="property-item-label">Far</div>
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
      <!-- LightsProperties -->
      <template v-if="meshProperty.isLight">
        <div class="property-item" v-if="lightHelper">
          <div class="property-item-label">Light helper</div>
          <div class="property-item-value">
            <el-switch
              v-model="lightHelper.visible"
              @change="updateLightHelper($event)"
            />
          </div>
        </div>
        <div class="property-item">
          <div class="property-item-label">Color</div>
          <div class="property-item-value">
            <el-color-picker
              v-model="lightColor.color"
              :predefine="PREDEFINE_COLORS"
              @change="updateLightProperty('color', $event)"
            />
          </div>
        </div>
        <div class="property-item" v-if="meshProperty.isHemisphereLight">
          <div class="property-item-label">Ground color</div>
          <div class="property-item-value">
            <el-color-picker
              v-model="lightColor.groundColor"
              :predefine="PREDEFINE_COLORS"
              @change="updateLightProperty('groundColor', $event)"
            />
          </div>
        </div>
        <div class="property-item">
          <div class="property-item-label">Intensity</div>
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
            <div class="property-item-label">Angle</div>
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
            <div class="property-item-label">Penumbra</div>
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
            <div class="property-item-label">Focus</div>
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
            <div class="property-item-label">Distance</div>
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
import { computed, onUnmounted, shallowRef, type PropType } from 'vue';
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
import { sceneFogOn, toggleSceneFog } from '@/utils/sceneModules';
import { PREDEFINE_COLORS } from '@/config/propertyConfig';
import { SCENE_OBJECT_NAME } from '@/enums/enum';
import { ElMessage } from 'element-plus';
import {
  CONTENT_LAYERS,
  isMapSurfaceLayer,
  type ContentLayerId,
} from '@/config/fleetSystems';
import {
  applyLayerRender,
  getPlayAs,
  loadLayerRender,
  setPlayAs,
  stampContentLayer,
} from '@/utils/contentLayers';
import { isMapSurfaceObject, stampMapSurface } from '@/utils/mapSurface';

const store = useSceneStore();

const groundToTerrain = () => {
  const api = store.sceneApi as {
    snapSelectedToGround?: () => { ok: boolean; terrainId: string };
  } | null;
  const result = api?.snapSelectedToGround?.();
  if (result?.ok) ElMessage.success(`Grounded on ${result.terrainId}`);
  else ElMessage.warning('Drop a sector first, then select the asset');
};

const { meshProperty } = defineProps({
  meshProperty: {
    type: Object as PropType<TransformMaterial>,
    default: () => ({}),
  },
});

const identityRows = computed(() => {
  const obj = store.sceneApi?.scene?.getObjectByProperty(
    'uuid',
    store.currentTransformMaterialUuid
  );
  const ud = (obj?.userData || {}) as Record<string, unknown>;
  const rows: { label: string; value: string }[] = [];
  if (ud.prefabId) rows.push({ label: 'Prefab', value: String(ud.prefabId) });
  if (ud.assetUuid)
    rows.push({ label: 'Asset UUID', value: String(ud.assetUuid) });
  if (ud.iconUuid)
    rows.push({ label: 'Icon UUID', value: String(ud.iconUuid) });
  if (ud.r2Key) rows.push({ label: 'R2', value: String(ud.r2Key) });
  if (ud.siHeightM) rows.push({ label: 'SI m', value: String(ud.siHeightM) });
  if (ud.contentLayer)
    rows.push({ label: 'Layer', value: String(ud.contentLayer) });
  if (ud.physLayer) rows.push({ label: 'Phys', value: String(ud.physLayer) });
  if (ud.surface) rows.push({ label: 'Surface', value: String(ud.surface) });
  if (ud.sectorId) rows.push({ label: 'Sector', value: String(ud.sectorId) });
  if (obj?.parent) {
    const scene = store.sceneApi?.scene;
    const parentName =
      obj.parent === scene
        ? 'Scene'
        : obj.parent.name || obj.parent.type || 'node';
    rows.unshift({ label: 'Parent', value: parentName });
  }
  return rows;
});

const selectedMesh = () =>
  store.sceneApi?.scene?.getObjectByProperty(
    'uuid',
    store.currentTransformMaterialUuid
  ) || null;

const contentLayerId = computed(() => {
  return (
    (selectedMesh()?.userData?.contentLayer as ContentLayerId) || 'terrain'
  );
});

const isMapSurface = computed(() => isMapSurfaceObject(selectedMesh()));

const mapSurfaceY = computed(() => selectedMesh()?.position.y ?? 0);

const setMapSurfaceY = (y: number | undefined) => {
  const obj = selectedMesh();
  if (!obj || y == null || !Number.isFinite(y)) return;
  obj.position.y = y;
};

const assignContentLayer = (id: ContentLayerId) => {
  const obj = store.sceneApi?.scene?.getObjectByProperty(
    'uuid',
    store.currentTransformMaterialUuid
  );
  if (!obj || !store.sceneApi?.scene) return;
  if (isMapSurfaceObject(obj) && isMapSurfaceLayer(id)) {
    stampMapSurface(obj, id);
  } else {
    stampContentLayer(obj, id);
  }
  if (id === 'player' && !getPlayAs(store.sceneApi.scene)) {
    setPlayAs(store.sceneApi.scene, obj);
  }
  applyLayerRender(store.sceneApi.scene, loadLayerRender());
  ElMessage.success(`${obj.name} → ${id}`);
};

const playAsThis = () => {
  const api = store.sceneApi as {
    playAsSelected?: (id?: string | null) => { ok: boolean; name: string };
  } | null;
  const r = api?.playAsSelected?.(store.currentTransformMaterialUuid);
  if (r?.ok) ElMessage.success(`Play as ${r.name}`);
  else
    ElMessage.warning(
      'Play as a Toon RTS captain (loadRaceKit). Foundry creates the play body.'
    );
};

// selected object
const currentTransformMaterialUuid = computed(
  () => store.currentTransformMaterialUuid
);

// current light
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

const lightColor = shallowRef({
  color: new THREE.Color(meshProperty.color).getStyle(),
  groundColor: new THREE.Color(meshProperty.groundColor).getStyle(),
});

// light helper
const lightHelper = computed(() => {
  const { helper } = currentLight.value;
  return helper;
});

// light intensity range
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

// update transform
const updateTransformProperties = (
  propertyKey: string,
  axis: string,
  value: string | boolean
) => {
  // camera handled separately
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

// update materialProperties
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

// update light properties
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

// updatelight helper
const updateLightHelper = (value: boolean) => {
  const { light } = currentLight.value;
  if (light) {
    light.userData.helperVisible = value;
  }
};

const fogOn = computed(() => {
  void store.transformMaterialRandomId;
  return sceneFogOn();
});

const onFogToggle = (on: boolean) => {
  toggleSceneFog(on);
};

// update camera properties
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
