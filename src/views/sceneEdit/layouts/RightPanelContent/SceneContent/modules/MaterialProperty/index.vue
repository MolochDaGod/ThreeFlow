<template>
  <div class="material-content">
    <el-scrollbar max-height="calc(100vh - 420px)">
      <div class="material-item">
        <div class="material-item-label">类型</div>
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
      <!-- 添加材质属性循环 -->
      <div v-for="item in editablePropertiesList" :key="item.key" class="material-item">
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
          <template v-else-if="['blending', 'combine', 'side'].includes(item.key)">
            <el-select
              v-if="item.key === 'side'"
              v-model="item.value"
              style="width: 180px"
              placeholder="请选择"
              @change="updateMeshMaterialProperty(item.key, $event)"
            >
              <el-option label="正面" :value="THREE.FrontSide" />
              <el-option label="背面" :value="THREE.BackSide" />
              <el-option label="双面" :value="THREE.DoubleSide" />
            </el-select>
            <el-select
              v-else-if="item.key === 'blending'"
              v-model="item.value"
              style="width: 180px"
              @change="updateMeshMaterialProperty(item.key, $event)"
            >
              <el-option label="NoBlending" :value="THREE.NoBlending" />
              <el-option label="NormalBlending" :value="THREE.NormalBlending" />
              <el-option label="AdditiveBlending" :value="THREE.AdditiveBlending" />
              <el-option label="MultiplyBlending" :value="THREE.MultiplyBlending" />
              <el-option label="CustomBlending" :value="THREE.CustomBlending" />
            </el-select>
            <el-select
              v-else-if="item.key === 'combine'"
              v-model="item.value"
              style="width: 180px"
              @change="updateMeshMaterialProperty(item.key, $event)"
            >
              <el-option label="MultiplyOperation" :value="THREE.MultiplyOperation" />
              <el-option label="MixOperation" :value="THREE.MixOperation" />
              <el-option label="AddOperation" :value="THREE.AddOperation" />
            </el-select>
          </template>
          <template v-else-if="verifyValueColor(item.key)">
            <el-space :size="15">
              <el-color-picker
                :predefine="colorPickerOptions"
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
                @change="updateMeshMaterialProperty('emissiveIntensity', $event)"
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
                  @change="updateMeshMaterialProperty('lightMapIntensity', $event)"
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
import type { EditableProperty, MaterialData } from '@/types/rightPanelTypes';
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
// 获取当前材质
const { meshMaterial } = defineProps<{
  meshMaterial: MaterialData;
}>();

const emit = defineEmits(['updateMeshMaterial']);

onMounted(() => {
  getNewMaterialPropertyList();
});

// 可编辑的属性列表
const editablePropertiesList = ref<EditableProperty[]>([]);
// 颜色选择器配置
const colorPickerOptions = PREDEFINE_COLORS;
// 生成可编辑的属性列表
const generateEditablePropertiesList = (material: MaterialData) => {
  if (!material) return [];
  const newMaterial = (material as unknown as THREE.Material).clone();
  const propertyKey = Object.entries(newMaterial);
  const hidePropertyKey = ['clearcoat', 'iridescence', 'sheen'];

  const result = propertyKey
    .filter(([key]) => key in MATERIAL_DATA_ENUM)
    .map(([key, value]) => {
      let generateValue = value;
      // 颜色和发光颜色需要转换为十六进制
      if (verifyValueColor(key)) {
        generateValue = new THREE.Color(value as unknown as number).getStyle();
      }
      let customMapData = {};
      // 如果是贴图数据
      if (verifyValueMap(key)) {
        customMapData = {
          visible: generateValue ? true : false,
          texture: generateValue,
          image: cloneDeep(
            generateMaterialMaps(generateValue as unknown as THREE.Texture)
          ),
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
  // 添加隐式属性
  const additionalProperties = hidePropertyKey.map((key) => {
    return {
      label: MATERIAL_DATA_ENUM[key as keyof typeof MATERIAL_DATA_ENUM],
      key: `_${key}`, // 添加下划线前缀以区分
      value: (newMaterial as unknown as Record<string, number>)[key] || 0,
      valueType: 'number',
      customMapData: {},
    };
  });

  return [...result, ...additionalProperties];
};

// 改变材质类型
const handleChangeMaterialType = (type: string) => {
  const mesh = store.sceneApi?.updateMaterialType(type);
  if (mesh) {
    emit('updateMeshMaterial', mesh);
    editablePropertiesList.value = generateEditablePropertiesList(
      mesh.material as unknown as MaterialData
    );
  }
};

// 更新材质属性
const updateMeshMaterialProperty = <T,>(key: string, value: T) => {
  const { sceneApi } = store;
  const uuid = store.currentTransformMaterialUuid;
  const mesh = sceneApi?.scene?.getObjectByProperty(
    'uuid',
    uuid
  ) as THREE.Mesh;

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

// 更新贴图属性
const updateMeshMaterialMap = (key: string, value: EditableProperty) => {
  const { sceneApi } = store;
  const uuid = store.currentTransformMaterialUuid;
  const mesh = sceneApi?.scene?.getObjectByProperty(
    'uuid',
    uuid
  ) as THREE.Mesh;
  if (mesh && mesh.material) {
    const { visible, texture } = value.customMapData;
    const oldMaterial = mesh.material;
    const newMaterial = (oldMaterial as unknown as THREE.Material).clone();

    (newMaterial as unknown as Record<string, THREE.Texture | null>)[key] =
      visible ? texture : null;
    mesh.material = newMaterial;
    // 标记材质需要更新
    (mesh.material as THREE.Material).needsUpdate = true;

    // 释放材质资源
    disposeMaterial(mesh);
  }
};

// 上传贴图
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
      // 获取贴图
      const textures = await updateMaterialMap(
        filePath,
        getFileType(file.name)
      );

      // 如果贴图可见，则更新贴图
      if (item.customMapData.visible) {
        const oldMaterial = mesh.material;
        const newMaterial = (oldMaterial as unknown as THREE.Material).clone();
        // 更新贴图
        (newMaterial as unknown as Record<string, THREE.Texture>)[item.key] =
          textures;
        // 更新材质
        mesh.material = newMaterial;
        // 释放旧材质
        disposeMaterial(oldMaterial);
      }
      // 如果存在旧的贴图，释放它
      if (item.customMapData.texture) {
        (item.customMapData.texture as THREE.Texture).dispose();
      }
      // 更新贴图数据
      item.customMapData.image = generateMaterialMaps(textures);
      item.customMapData.texture = textures;
      // 释放材质资源
      disposeMaterial(mesh);
    }
  } finally {
    // 确保在任何情况下都释放 URL 对象
    URL.revokeObjectURL(filePath);
  }
};

// 获取新的材质属性列表
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
