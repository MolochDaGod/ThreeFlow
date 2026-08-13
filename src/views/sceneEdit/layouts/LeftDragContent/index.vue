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
          <!-- Warlords / uMMORPG CDN library -->
          <el-scrollbar
            max-height="calc(100vh - 215px)"
            v-if="activeTabKey === DRAG_MODEL_TYPE.Model"
          >
            <div class="asset-filter">
              <select v-model="activeAssetGroup" class="asset-filter-select">
                <option value="all">All</option>
                <option
                  v-for="(label, key) in WARLORDS_GROUP_LABELS"
                  :key="key"
                  :value="key"
                >
                  {{ label }}
                </option>
              </select>
            </div>
            <div class="drag-list warlords-list">
              <div
                class="drag-item"
                v-for="item in visibleModels"
                :key="item.id"
                draggable="true"
                :title="item.name"
                @dragstart="() => onDragModelStart(item)"
              >
                <img :src="item.icon" :alt="item.name" />
                <div class="item-name">{{ item.name }}</div>
                <div class="animation-icon" v-if="item.isAnimation">
                  <span class="iconfont icon-donghua"></span>
                </div>
              </div>
            </div>
          </el-scrollbar>
        </div>
        <div class="drag-tab-content min-height">
          <!-- Geometry -->
          <el-scrollbar
            max-height="calc(100vh - 215px)"
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
          <!-- Lights -->
          <el-scrollbar
            max-height="calc(100vh - 215px)"
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
      <!-- Import model -->
      <div class="outside-file-content">
        <div class="drag-title">Import model</div>
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
          <div></div>
        </div>
      </div>
      <!-- spacer so the commercial banner does not cover items -->
      <div class="bottom-spacer"></div>
    </el-scrollbar>
    <div class="commercial-version" @click="openCommercialVersion">
        <span class="iconfont icon-hot"></span>
        <span>Pro: ThreeFlowX</span>
    </div>
    <!-- toggle -->
    <div class="collapse-button" @click="toggleCollapse">
      <el-icon :size="20">
        <ArrowRight v-if="isCollapsed" />
        <ArrowLeft v-else />
      </el-icon>
    </div>
  </div>
</template>
<script setup lang="ts">
import { defaultGeometryList, defaultLightList } from '@/config/defaultDragList';
import {
  defaultModelList,
  itemsInGroup,
  loadWarlordsLibrary,
  WARLORDS_GROUP_LABELS,
  type WarlordsAssetGroup,
  type WarlordsDragItem,
} from '@/config/warlordsCatalog';
import { type ElUpload, type UploadFile } from 'element-plus';
import type { DragModelType } from '@/types/renderModelTypes';
import { DRAG_TAB_ITEMS } from './config';
import { computed, onMounted, ref } from 'vue';
import { DRAG_MODEL_TYPE } from '@/enums/enum';

const emit = defineEmits(['drag-model-start', 'choose-outside-file']);

const activeTabKey = ref<DRAG_MODEL_TYPE>(DRAG_MODEL_TYPE.Model);
const activeAssetGroup = ref<WarlordsAssetGroup | 'all'>('captains');
const libraryItems = ref<WarlordsDragItem[]>([...defaultModelList]);
const visibleModels = computed(() =>
  itemsInGroup(libraryItems.value, activeAssetGroup.value)
);

onMounted(async () => {
  libraryItems.value = await loadWarlordsLibrary();
});

// collapse
const isCollapsed = ref<boolean>(false);
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
};

// drag model start
const onDragModelStart = (model: DragModelType) => {
  emit('drag-model-start', model);
};

// pick an external model
const chooseOutsideFile = async (file: UploadFile) => {
  emit('choose-outside-file', file);
};

// pick an external model
const uploadRef = ref<InstanceType<typeof ElUpload>>();
const changeFile = () => {
  const input = uploadRef?.value?.$el.querySelector('input');
  if (input instanceof HTMLInputElement) input.click();
};
// open commercial edition
const openCommercialVersion = () => {
  window.open('http://threeflowx.cn/edit/', '_blank');
};
</script>
<style lang="scss" scoped src="./index.scss"></style>
