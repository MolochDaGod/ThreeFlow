<template>
  <div class="material-content">
    <el-scrollbar max-height="calc(100vh - 420px)">
      <div class="material-item" v-if="meshChoices.length > 1">
        <div class="material-item-label">Mesh</div>
        <div class="material-item-value">
          <el-select
            v-model="editMeshUuid"
            style="width: 180px"
            @change="onPickMesh"
          >
            <el-option
              v-for="m in meshChoices"
              :key="m.uuid"
              :label="m.name || m.type || m.uuid.slice(0, 8)"
              :value="m.uuid"
            />
          </el-select>
        </div>
      </div>
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
import type {
  EditableProperty,
  MaterialData,
  EditableValue,
} from '@/types/rightPanelTypes';
import { useSceneStore } from '@/store/sceneEditStore';
import * as THREE from 'three';
import {
  verifyValueColor,
  verifyValueMap,
  generateMaterialMaps,
  getFileType,
  updateMaterialMap,
  collectEditableMeshes,
  firstEditableMesh,
  materialOf,
  prepareEditorTexture,
} from '@/utils/utils';
import { type UploadFile } from 'element-plus';
import { cloneDeep } from 'lodash-es';

const store = useSceneStore();
// current material
const { meshMaterial } = defineProps<{
  meshMaterial: MaterialData;
}>();

const emit = defineEmits(['updateMeshMaterial']);

const meshChoices = ref<{ uuid: string; name: string; type: string }[]>([]);
const editMeshUuid = ref<string>('');

const resolveRoot = () => {
  const uuid = store.currentTransformMaterialUuid;
  if (!uuid) return null;
  return (store.sceneApi?.scene?.getObjectByProperty('uuid', uuid) ||
    null) as THREE.Object3D | null;
};

const resolveEditMesh = (): THREE.Mesh | null => {
  const root = resolveRoot();
  if (editMeshUuid.value) {
    const hit = root
      ? (root.getObjectByProperty('uuid', editMeshUuid.value) as THREE.Mesh)
      : (store.sceneApi?.scene?.getObjectByProperty(
          'uuid',
          editMeshUuid.value
        ) as THREE.Mesh);
    if (hit?.isMesh) return hit;
  }
  return firstEditableMesh(root);
};

const refreshMeshChoices = () => {
  const meshes = collectEditableMeshes(resolveRoot());
  meshChoices.value = meshes.map((m) => ({
    uuid: m.uuid,
    name: m.name || 'mesh',
    type: materialOf(m)?.type || '',
  }));
  if (!editMeshUuid.value || !meshes.some((m) => m.uuid === editMeshUuid.value)) {
    editMeshUuid.value = meshes[0]?.uuid || '';
  }
};

onMounted(() => {
  refreshMeshChoices();
  getNewMaterialPropertyList();
});

// editable properties
const editablePropertiesList = ref<EditableProperty[]>([]);

// buildeditable properties
const generateEditablePropertiesList = (material: MaterialData) => {
  if (!material) return [];
  const propertyKey = Object.entries(material);
  const hidePropertyKey: (keyof MaterialData)[] = [
    'clearcoat',
    'iridescence',
    'sheen',
  ];

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
          image: texture ? cloneDeep(generateMaterialMaps(texture)) : null,
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

const onPickMesh = () => {
  getNewMaterialPropertyList();
  const mesh = resolveEditMesh();
  if (mesh) emit('updateMeshMaterial', mesh);
};

// change material type
const handleChangeMaterialType = (type: string) => {
  const mesh = store.sceneApi?.updateMaterialType(type, editMeshUuid.value);
  if (mesh) {
    emit('updateMeshMaterial', mesh);
    editablePropertiesList.value = generateEditablePropertiesList(
      materialOf(mesh) as MaterialData
    );
  }
};

// update materialProperties
const updateMeshMaterialProperty = <T,>(key: string, value: T) => {
  const mesh = resolveEditMesh();
  const mat = materialOf(mesh);
  if (!mat) return;
  const rec = mat as unknown as Record<string, unknown>;
  if (verifyValueColor(key)) {
    rec[key] = new THREE.Color(String(value) || 0xffffff);
  } else {
    rec[key] = value;
  }
  mat.needsUpdate = true;
};

// update map properties
const updateMeshMaterialMap = (key: string, value: EditableProperty) => {
  const mesh = resolveEditMesh();
  const mat = materialOf(mesh);
  if (!mesh || !mat) return;
  const { visible, texture } = value.customMapData;
  const rec = mat as unknown as Record<string, THREE.Texture | null>;
  rec[key] = visible && texture ? prepareEditorTexture(texture, key) : null;
  mat.needsUpdate = true;
};

// upload map
const uploadMaterialMapFile = async (
  item: EditableProperty,
  file: UploadFile
) => {
  const filePath = URL.createObjectURL(file?.raw as Blob);

  try {
    const mesh = resolveEditMesh();
    const mat = materialOf(mesh);
    if (!mesh || !mat) return;
    const textures = await updateMaterialMap(
      filePath,
      getFileType(file.name),
      item.key
    );
    if (item.customMapData.visible) {
      const rec = mat as unknown as Record<string, THREE.Texture>;
      rec[item.key] = textures;
      mat.needsUpdate = true;
    }
    if (item.customMapData.texture && item.customMapData.texture !== textures) {
      item.customMapData.texture.dispose();
    }
    item.customMapData.image = generateMaterialMaps(textures);
    item.customMapData.texture = textures;
  } finally {
    URL.revokeObjectURL(filePath);
  }
};

// rebuild material property list
const getNewMaterialPropertyList = () => {
  refreshMeshChoices();
  const mesh = resolveEditMesh();
  const mat = materialOf(mesh);
  if (!mat) return;
  editablePropertiesList.value = generateEditablePropertiesList(
    mat as unknown as MaterialData
  );
};
defineExpose({
  getNewMaterialPropertyList,
});
</script>

<style lang="scss" src="./index.scss" scoped></style>
