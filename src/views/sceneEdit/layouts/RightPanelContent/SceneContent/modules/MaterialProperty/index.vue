<template>
  <div class="material-content">
    <el-scrollbar max-height="calc(100vh - 420px)">
      <div class="material-item">
        <div class="material-item-label">Type</div>
        <div class="material-item-value">
          <el-select
            v-model="meshMaterial.type"
            style="width: 180px"
            @change="handleChangeMaterialType"
          >
            <el-option
              v-for="item in materialTypeList"
              :key="item.type"
              :label="item.name"
              :value="item.type"
            />
          </el-select>
        </div>
      </div>
      <!-- material property loop -->
      <div
        v-for="item in editablePropertiesList"
        :key="item.key"
        class="material-item"
      >
        <div class="material-item-label">{{ item.label }}</div>
        <div class="material-item-value">
          <template v-if="item.valueType === 'boolean'">
            <el-space :size="15">
              <el-switch
                v-model="item.value"
                @change="updateMeshMaterialProperty(item.key, $event)"
              />
              <template v-if="item.key === 'transparent'">
                <el-input-number
                  @change="updateMeshMaterialProperty('opacity', $event)"
                  style="width: 100px"
                  v-model="meshMaterial['opacity']"
                  :step="0.1"
                  :precision="2"
                  :max="1"
                  :min="0"
                />
              </template>
            </el-space>
          </template>
          <template
            v-else-if="['blending', 'combine', 'side'].includes(item.key)"
          >
            <el-select
              v-if="item.key === 'side'"
              v-model="item.value"
              style="width: 180px"
              placeholder="Select"
              @change="updateMeshMaterialProperty(item.key, $event)"
            >
              <el-option label="Front" :value="THREE.FrontSide" />
              <el-option label="Back" :value="THREE.BackSide" />
              <el-option label="Double" :value="THREE.DoubleSide" />
            </el-select>
            <el-select
              v-else-if="item.key === 'blending'"
              v-model="item.value"
              style="width: 180px"
              @change="updateMeshMaterialProperty(item.key, $event)"
            >
              <el-option label="NoBlending" :value="THREE.NoBlending" />
              <el-option label="NormalBlending" :value="THREE.NormalBlending" />
              <el-option
                label="AdditiveBlending"
                :value="THREE.AdditiveBlending"
              />
              <el-option
                label="MultiplyBlending"
                :value="THREE.MultiplyBlending"
              />
              <el-option label="CustomBlending" :value="THREE.CustomBlending" />
            </el-select>
            <el-select
              v-else-if="item.key === 'combine'"
              v-model="item.value"
              style="width: 180px"
              @change="updateMeshMaterialProperty(item.key, $event)"
            >
              <el-option
                label="MultiplyOperation"
                :value="THREE.MultiplyOperation"
              />
              <el-option label="MixOperation" :value="THREE.MixOperation" />
              <el-option label="AddOperation" :value="THREE.AddOperation" />
            </el-select>
          </template>
          <template v-else-if="verifyValueColor(item.key)">
            <el-space :size="15">
              <el-color-picker
                :predefine="PREDEFINE_COLORS"
                v-model="item.value"
                @change="updateMeshMaterialProperty(item.key, $event)"
              />
              <el-input-number
                :step="0.1"
                :precision="2"
                :max="10"
                :min="0"
                v-if="item.key === 'emissive'"
                style="width: 100px"
                v-model="meshMaterial.emissiveIntensity"
                @change="
                  updateMeshMaterialProperty('emissiveIntensity', $event)
                "
              />
            </el-space>
          </template>
          <template v-else-if="verifyValueMap(item.key)">
            <el-space :size="15">
              <el-switch
                v-model="item.customMapData.visible"
                @change="updateMeshMaterialMap(item.key, item)"
                :disabled="!item.customMapData.image"
              />

              <el-upload
                :show-file-list="false"
                :auto-upload="false"
                accept=".jpg,.png,.hdr"
                :on-change="
                  (file: UploadFile) => uploadMaterialMapFile(item, file)
                "
              >
                <el-image
                  class="el-image"
                  v-if="item.customMapData.image"
                  :src="item.customMapData.image"
                />
                <div class="el-upload-btn" v-else>
                  <el-icon>
                    <Plus />
                  </el-icon>
                </div>
              </el-upload>
              <template v-if="item.key === 'lightMap'">
                <el-input-number
                  style="width: 100px"
                  :min="0"
                  v-model="meshMaterial.lightMapIntensity"
                  @change="
                    updateMeshMaterialProperty('lightMapIntensity', $event)
                  "
                />
              </template>
            </el-space>
          </template>
          <template v-else-if="item.valueType === 'number'">
            <el-slider
              v-if="item.key === 'iridescence'"
              style="width: 200px"
              :step="0.1"
              :precision="2"
              show-input
              :min="0"
              :max="5"
              v-model="item.value"
              @change="updateMeshMaterialProperty('iridescence', $event)"
            />
            <el-slider
              v-else
              style="width: 200px"
              :step="0.1"
              :precision="2"
              show-input
              :min="0"
              :max="5"
              v-model="item.value"
              @change="updateMeshMaterialProperty(item.key, $event)"
            />
          </template>
        </div>
      </div>
    </el-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { materialTypeList, PREDEFINE_COLORS } from '@/config/propertyConfig';
import { MATERIAL_DATA_ENUM } from '@/enums/enum';
import type { EditableProperty, MaterialData, EditableValue } from '@/types/rightPanelTypes';
import { useSceneStore } from '@/store/sceneEditStore';
import * as THREE from 'three';
import {
  verifyValueColor,
  verifyValueMap,
  generateMaterialMaps,
  getFileType,
  updateMaterialMap,
  disposeMaterial,
} from '@/utils/utils';
import { type UploadFile } from 'element-plus';
import { cloneDeep } from 'lodash-es';

const store = useSceneStore();
// current material
const { meshMaterial } = defineProps<{
  meshMaterial: MaterialData;
}>();

const emit = defineEmits(['updateMeshMaterial']);

onMounted(() => {
  getNewMaterialPropertyList();
});

// editable properties
const editablePropertiesList = ref<EditableProperty[]>([]);

// 生成editable properties
const generateEditablePropertiesList = (material: MaterialData) => {
  if (!material) return [];
  const propertyKey = Object.entries(material);
  const hidePropertyKey: (keyof MaterialData)[] = ['clearcoat', 'iridescence', 'sheen'];

  const result = propertyKey
    .filter(([key]) => key in MATERIAL_DATA_ENUM)
    .map(([key, value]) => {
      let generateValue: EditableValue = value;
      // convert colors to hex
      if (verifyValueColor(key)) {
        if (value instanceof THREE.Color) {
           generateValue = value.getStyle();
        } else if (typeof value === 'number') {
           generateValue = new THREE.Color(value).getStyle();
        } else if (typeof value === 'string') {
           generateValue = value;
        }
      }
      let customMapData = {};
      // if map data
      if (verifyValueMap(key)) {
        const texture = generateValue as THREE.Texture | null;
        customMapData = {
          visible: !!texture,
          texture: texture,
          image: texture ? cloneDeep(
            generateMaterialMaps(texture)
          ) : null,
        };
      }
      return {
        label: MATERIAL_DATA_ENUM[key as keyof typeof MATERIAL_DATA_ENUM],
        key,
        value: generateValue,
        valueType: typeof value,
        customMapData,
      };
    });
  // add implicit properties
  const additionalProperties = hidePropertyKey.map((key) => {
    return {
      label: MATERIAL_DATA_ENUM[key as keyof typeof MATERIAL_DATA_ENUM],
      key: `_${key}`, // underscore prefix
      value: (material[key] as number) || 0,
      valueType: 'number',
      customMapData: {},
    };
  });

  return [...result, ...additionalProperties];
};

// change material type
const handleChangeMaterialType = (type: string) => {
  const mesh = store.sceneApi?.updateMaterialType(type);
  if (mesh) {
    emit('updateMeshMaterial', mesh);
    editablePropertiesList.value = generateEditablePropertiesList(
      mesh.material as MaterialData
    );
  }
};

// update materialProperties
const updateMeshMaterialProperty = <T,>(key: string, value: T) => {
  const { sceneApi } = store;
  const uuid = store.currentTransformMaterialUuid;
  const mesh = sceneApi?.scene?.getObjectByProperty('uuid', uuid) as THREE.Mesh;

  if (mesh && mesh.material) {
    if (verifyValueColor(key)) {
      const generateValue = new THREE.Color(
        String(value) || 0xffffff
      ) as unknown as T;

      (mesh.material as unknown as Record<string, T>)[key] = generateValue;
    } else {
      (mesh.material as unknown as Record<string, T>)[key] = value;
    }
  }
};

// update map properties
const updateMeshMaterialMap = (key: string, value: EditableProperty) => {
  const { sceneApi } = store;
  const uuid = store.currentTransformMaterialUuid;
  const mesh = sceneApi?.scene?.getObjectByProperty('uuid', uuid) as THREE.Mesh;
  if (mesh && mesh.material) {
    const { visible, texture } = value.customMapData;
    const oldMaterial = mesh.material;
    const newMaterial = (oldMaterial as THREE.Material).clone();

    (newMaterial as unknown as Record<string, THREE.Texture | null>)[key] =
      visible ? (texture ?? null) : null;
    mesh.material = newMaterial;
    // mark material dirty
    (mesh.material as THREE.Material).needsUpdate = true;
  }
};

// upload map
const uploadMaterialMapFile = async (
  item: EditableProperty,
  file: UploadFile
) => {
  const filePath = URL.createObjectURL(file?.raw as Blob);

  try {
    const uuid = store.currentTransformMaterialUuid;
    const mesh = store.sceneApi?.scene?.getObjectByProperty(
      'uuid',
      uuid
    ) as THREE.Mesh;

    if (mesh && mesh.material) {
      // get map
      const textures = await updateMaterialMap(
        filePath,
        getFileType(file.name)
      );

      // update map if visible
      if (item.customMapData.visible) {
        const oldMaterial = mesh.material;
        const newMaterial = (oldMaterial as unknown as THREE.Material).clone();
        // update map
        (newMaterial as unknown as Record<string, THREE.Texture>)[item.key] =
          textures;
        // update material
        mesh.material = newMaterial;
        // dispose old material
        disposeMaterial(oldMaterial);
      }
      // dispose previous map
      if (item.customMapData.texture) {
        item.customMapData.texture.dispose();
      }
      // update map data
      item.customMapData.image = generateMaterialMaps(textures);
      item.customMapData.texture = textures;
    }
  } finally {
    // always revoke URL
    URL.revokeObjectURL(filePath);
  }
};

// rebuild material property list
const getNewMaterialPropertyList = () => {
  const mesh = store.sceneApi?.scene?.getObjectByProperty(
    'uuid',
    store.currentTransformMaterialUuid
  ) as THREE.Mesh;

  if (!mesh) return;
  editablePropertiesList.value = generateEditablePropertiesList(
    mesh.material as unknown as MaterialData
  );
};
defineExpose({
  getNewMaterialPropertyList,
});
</script>

<style lang="scss" src="./index.scss" scoped></style>
