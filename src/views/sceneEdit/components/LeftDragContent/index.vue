<template>
  <div class="left-drag-content" :class="{ 'is-collapsed': isCollapsed }">
    <el-scrollbar max-height="calc(100vh - 32px)" height="100%">
      <div class="drag-tab-container">
        <div class="tab-items">
          <div
            class="tab-item"
            :class="{ 'is-active': activeTabKey === item.key }"
            v-for="item in DRAG_TAB_ITEMS"
            :key="item.icon"
            @click="activeTabKey = item.key"
          >
            <span class="iconfont" :class="item.icon"></span>
            <span>{{ item.name }}</span>
          </div>
        </div>
        <div class="drag-tab-content">
          <!-- 模型 -->
          <el-scrollbar
            max-height="calc(100vh - 200px)"
            v-if="activeTabKey === DRAG_MODEL_TYPE.Model"
          >
            <div class="drag-list">
              <div
                class="drag-item"
                v-for="item in defaultModelList"
                :key="item.id"
                draggable="true"
                @dragstart="() => onDragModelStart(item)"
              >
                <img :src="item.icon" alt="" />
                <div class="animation-icon" v-if="item.isAnimation">
                  <span class="iconfont icon-donghua"></span>
                </div>
              </div>
            </div>
          </el-scrollbar>
        </div>
        <div class="drag-tab-content min-height">
          <!-- 几何体 -->
          <el-scrollbar
            max-height="calc(100vh - 200px)"
            v-if="activeTabKey === DRAG_MODEL_TYPE.Geometry"
          >
            <div class="drag-list">
              <div
                class="drag-item"
                v-for="item in defaultGeometryList"
                :key="item.type"
                draggable="true"
                @dragstart="() => onDragModelStart(item)"
              >
                <div>
                  {{ item.name }}
                </div>
              </div>
            </div>
          </el-scrollbar>

          <!-- 灯光 -->
          <el-scrollbar
            max-height="calc(100vh - 200px)"
            v-if="activeTabKey === DRAG_MODEL_TYPE.Light"
          >
            <div class="drag-list">
              <div
                class="drag-item"
                v-for="item in defaultLightList"
                :key="item.type"
                draggable="true"
                @dragstart="() => onDragModelStart(item)"
              >
                <span class="iconfont" :class="item.iconClass"></span>
                <div>
                  {{ item.name }}
                </div>
              </div>
            </div>
          </el-scrollbar>
        </div>
      </div>
      <!-- 导入模型 -->
      <div class="outside-file-content">
        <div class="drag-title">导入模型</div>
        <div class="outside-file-box" @click="changeFile">
          <div class="file-icon">
            <span class="iconfont icon-shangchuan"></span>
          </div>
          <div class="upload-tip">.glb,.obj,gltf,.fbx,.stl,.usdz</div>
          <el-upload
            style="height: 0"
            ref="uploadRef"
            accept=".glb,.obj,.gltf,.fbx,.stl,.usdz"
            :show-file-list="false"
            :auto-upload="false"
            type="hidden"
            :on-change="chooseOutsideFile"
          ></el-upload>
        </div>
      </div>
    </el-scrollbar>
    <!-- 开关 -->
    <div class="collapse-button" @click="toggleCollapse">
      <el-icon :size="20">
        <ArrowRight v-if="isCollapsed" />
        <ArrowLeft v-else />
      </el-icon>
    </div>
  </div>
</template>
<script setup lang="ts">
import {
  defaultModelList,
  defaultGeometryList,
  defaultLightList,
} from '@/config/defaultDragList';
import { type ElUpload, type UploadFile } from 'element-plus';
import type { DragModelType } from '@/types/renderModelTypes';
import { DRAG_TAB_ITEMS } from './config';
import { ref } from 'vue';
import { DRAG_MODEL_TYPE } from '@/enums/enum';

const emit = defineEmits(['drag-model-start', 'choose-outside-file']);

const uploadRef = ref<InstanceType<typeof ElUpload>>();
const isCollapsed = ref<boolean>(false);

const activeTabKey = ref<DRAG_MODEL_TYPE>(DRAG_MODEL_TYPE.Model);

// 折叠
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
};

// 拖拽模型开始
const onDragModelStart = (model: DragModelType) => {
  emit('drag-model-start', model);
};

// 选择外部模型
const chooseOutsideFile = async (file: UploadFile) => {
  emit('choose-outside-file', file);
};
// 选择外部模型
const changeFile = () => {
  const input = uploadRef?.value?.$el.querySelector('input');
  if (input instanceof HTMLInputElement) input.click();
};
</script>
<style lang="scss" scoped src="./index.scss"></style>
