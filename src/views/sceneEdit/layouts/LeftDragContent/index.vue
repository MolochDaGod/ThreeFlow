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
            v-if="isAssetLibraryTab"
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
    <div class="commercial-version" @click="openStudio">
        <span class="iconfont icon-hot"></span>
        <span>WCS · Grudge Studio</span>
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
  itemsForTab,
  itemsInGroup,
  loadWarlordsLibrary,
  WARLORDS_GROUP_LABELS,
  type WarlordsAssetGroup,
  type WarlordsDragItem,
} from '@/config/warlordsCatalog';
import { type ElUpload, type UploadFile } from 'element-plus';
import type { DragModelType } from '@/types/renderModelTypes';
import { DRAG_TAB_ITEMS } from './config';
import { computed, onMounted, ref, watch } from 'vue';
import { DRAG_MODEL_TYPE } from '@/enums/enum';

const emit = defineEmits(['drag-model-start', 'choose-outside-file']);

const activeTabKey = ref<DRAG_MODEL_TYPE>(DRAG_MODEL_TYPE.Model);
const activeAssetGroup = ref<WarlordsAssetGroup | 'all'>('sectors');
const libraryItems = ref<WarlordsDragItem[]>([...defaultModelList]);
const isAssetLibraryTab = computed(() =>
  [
    DRAG_MODEL_TYPE.Model,
    DRAG_MODEL_TYPE.D1,
    DRAG_MODEL_TYPE.R2,
    DRAG_MODEL_TYPE.Vfx,
  ].includes(activeTabKey.value)
);

const libraryTab = computed<'warlords' | 'd1' | 'r2' | 'vfx'>(() => {
  if (activeTabKey.value === DRAG_MODEL_TYPE.D1) return 'd1';
  if (activeTabKey.value === DRAG_MODEL_TYPE.R2) return 'r2';
  if (activeTabKey.value === DRAG_MODEL_TYPE.Vfx) return 'vfx';
  return 'warlords';
});

const visibleModels = computed(() => {
  const tabbed = itemsForTab(libraryItems.value, libraryTab.value);
  return itemsInGroup(tabbed, activeAssetGroup.value);
});

watch(activeTabKey, (key) => {
  if (key === DRAG_MODEL_TYPE.Vfx) activeAssetGroup.value = 'vfx';
  else if (key === DRAG_MODEL_TYPE.R2) activeAssetGroup.value = 'all';
  else if (key === DRAG_MODEL_TYPE.D1) activeAssetGroup.value = 'all';
  else if (key === DRAG_MODEL_TYPE.Model) activeAssetGroup.value = 'sectors';
});

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
const openStudio = () => {
  window.open('https://wcs.grudge-studio.com/', '_blank');
};
</script>
<style lang="scss" scoped src="./index.scss"></style>
