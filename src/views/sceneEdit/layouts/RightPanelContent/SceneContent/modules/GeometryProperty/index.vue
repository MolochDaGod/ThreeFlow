<template>
  <div class="property-content" v-if="geometryParameters.parameters">
    <div class="property-item">
      <div class="property-item-label">类型</div>
      <div class="property-item-value">
        {{ geometryParameters.type }}
      </div>
    </div>
    <div
      class="property-item"
      v-for="item in geometryParametersList"
      :key="item.labelKey"
    >
      <div class="property-item-label">{{ item.label }}</div>
      <div
        class="property-item-value"
        v-if="
          geometryParameters.parameters &&
          typeof geometryParameters.parameters[item.labelKey] === 'number'
        "
      >
        <el-slider
          :min="item.limits.min"
          :max="item.limits.max"
          show-input
          :show-input-controls="false"
          :step="item.labelKey === 'detail' ? 1 : 0.5"
          v-model="
            (geometryParameters.parameters as Record<string, number>)[
              item.labelKey
            ]
          "
          @change="updateGeometryParameter(item, $event)"
        />
      </div>
      <div class="property-item-value" v-else>
        <el-switch
          @change="updateGeometryParameter(item, $event)"
          v-model="geometryParameters.parameters[item.labelKey]"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GeometryParameters } from '@/types/rightPanelTypes';
import { GEOMETRY_PARAMETERS } from '@/enums/enum';
import { GEOMETRY_PARAMETER_LIMITS } from '@/config/propertyConfig';
import { useSceneStore } from '@/store/sceneEditStore';
import { computed } from 'vue';
const store = useSceneStore();

const { geometryParameters } = defineProps<{
  geometryParameters: GeometryParameters;
}>();

// 几何体参数列表
const geometryParametersList = computed(() => {
  const params = geometryParameters.parameters;
  if (!params) return [];

  return Object.keys(params)
    .filter((key) => key !== 'path')
    .map((key) => {
      const value = params[key];
      return {
        type: geometryParameters.type,
        label: GEOMETRY_PARAMETERS[key as keyof typeof GEOMETRY_PARAMETERS],
        labelKey: key,
        value,
        limits: GEOMETRY_PARAMETER_LIMITS[
          key as keyof typeof GEOMETRY_PARAMETER_LIMITS
        ] || { min: 0, max: 100 },
      };
    });
});

// 更新几何体参数
const updateGeometryParameter = (
  item: { labelKey: string },
  value: number | boolean
) => {
  store.sceneApi?.updateGeometryParameter(
    item.labelKey,
    value,
    geometryParameters.uuid
  );
};

</script>

<style lang="scss" scoped src="./index.scss"></style>
