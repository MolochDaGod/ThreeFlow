<template>
  <div class="left-drag-content" :class="{ 'is-collapsed': isCollapsed }">
    <el-scrollbar max-height="calc(100vh - 32px)" height="100%">
      <div class="drag-tab-container">
        <div class="tab-items">
          <div
            class="tab-item"
            :class="{ 'is-active': leftTab === item.key }"
            v-for="item in LEFT_TAB_ITEMS"
            :key="item.key"
            :title="item.hint"
            @click="leftTab = item.key"
          >
            <span class="iconfont" :class="item.icon"></span>
            <span>{{ item.name }}</span>
          </div>
        </div>
        <div class="drag-tab-content">
          <el-scrollbar
            max-height="calc(100vh - 215px)"
            v-if="leftTab === 'world' || leftTab === 'assets' || leftTab === 'place'"
          >
            <div class="lib-search">
              <input
                v-model="libQuery"
                type="search"
                placeholder="Search…"
                class="lib-search-input"
              />
            </div>
            <p class="ui-hint">{{ tabHint }}</p>
            <div class="folder-chips" v-if="folderRows.length">
              <button
                type="button"
                class="folder-chip"
                :class="{ 'is-active': activeAssetGroup === 'all' }"
                @click="activeAssetGroup = 'all'"
              >
                All
                <em>{{ tabbedItems.length }}</em>
              </button>
              <button
                v-for="row in folderRows"
                :key="row.key"
                type="button"
                class="folder-chip"
                :class="{ 'is-active': activeAssetGroup === row.key }"
                @click="activeAssetGroup = row.key"
              >
                {{ row.label }}
                <em>{{ row.count }}</em>
              </button>
            </div>
            <div class="drag-list warlords-list" v-if="leftTab !== 'place' || showPrefabs">
              <div
                class="drag-item"
                v-for="item in visibleModels"
                :key="item.id"
                :draggable="item.placeable !== false"
                :class="{
                  'is-pending':
                    item.placeable === false && !item.playScript?.startsWith('anim:'),
                }"
                :title="itemTitle(item)"
                @click="onClickPlace(item)"
                @dragstart="() => item.placeable !== false && onDragModelStart(item)"
              >
                <img
                  :src="item.icon"
                  :alt="item.name"
                  referrerpolicy="no-referrer"
                  loading="lazy"
                  @error="onIconError"
                />
                <div class="item-name">{{ item.name }}</div>
                <div class="item-meta">
                  {{ siLabel(item) }}
                  ·
                  {{ shortPath(item) }}
                </div>
                <div class="animation-icon" v-if="item.isAnimation">
                  <span class="iconfont icon-donghua"></span>
                </div>
              </div>
            </div>
            <template v-if="leftTab === 'place'">
              <p class="ui-hint">Lights</p>
              <div class="drag-list">
                <div
                  class="drag-item"
                  v-for="item in defaultLightList"
                  :key="item.type"
                  draggable="true"
                  @dragstart="() => onDragModelStart(item)"
                >
                  <span class="iconfont" :class="item.iconClass"></span>
                  <div>{{ item.name }}</div>
                </div>
              </div>
              <p class="ui-hint">Primitives (SI metres) — not a tab</p>
              <div class="drag-list">
                <div
                  class="drag-item"
                  v-for="item in defaultGeometryList"
                  :key="item.type"
                  draggable="true"
                  @dragstart="() => onDragModelStart(item)"
                >
                  <div>{{ item.name }}</div>
                  <div class="item-meta">{{ item.type }}</div>
                </div>
              </div>
            </template>
          </el-scrollbar>
          <el-scrollbar max-height="calc(100vh - 215px)" v-if="leftTab === 'hud'">
            <div class="asset-filter">
              <select
                v-model="hudMode"
                class="asset-filter-select"
                @change="applyHudMode"
              >
                <option v-for="m in GAME_MODES" :key="m.id" :value="m.id">
                  {{ m.label }}
                </option>
              </select>
            </div>
            <p class="ui-hint">
              Drop onto the viewport. Frames land under scene <b>HUD</b> as
              parent/child assets (1920×1080).
            </p>
            <div class="drag-list">
              <div
                class="drag-item"
                v-for="f in HUD_FRAMES"
                :key="f.id"
                draggable="true"
                :title="`${f.type} · ${f.w}×${f.h} px`"
                @click="onClickHud(f)"
                @dragstart="() => onDragHud(f)"
              >
                <div>{{ f.label }}</div>
                <div class="item-meta">{{ f.type }} · {{ f.w }}×{{ f.h }}</div>
              </div>
            </div>
          </el-scrollbar>
          <el-scrollbar max-height="calc(100vh - 215px)" v-if="leftTab === 'game'">
            <p class="ui-hint">
              One Game Manager and one Network Manager per scene. Click to
              focus in the hierarchy — scripts, inspect, deploy live on the
              object.
            </p>
            <div class="drag-list">
              <div class="drag-item" @click="focusManager('GameManager')">
                <div>Game Manager</div>
                <div class="item-meta">era · play kit · HUD pack · scripts</div>
              </div>
              <div class="drag-item" @click="focusManager('NetworkManager')">
                <div>Network Manager</div>
                <div class="item-meta">Carrier · Railway rooms · tick</div>
              </div>
            </div>
          </el-scrollbar>
          <el-scrollbar max-height="calc(100vh - 215px)" v-if="leftTab === 'deploy'">
            <p class="ui-hint">Handoff — not a second deployer.</p>
            <div class="drag-list">
              <div class="drag-item" @click="openUrl(STUDIO_FORGE_EDITOR)">
                <div>Forge editor</div>
                <div class="item-meta">R3F + Rapier + .gfscene</div>
              </div>
              <div class="drag-item" @click="openUrl(STUDIO_PLAY)">
                <div>Warlords play</div>
                <div class="item-meta">grudgewarlords.com</div>
              </div>
              <div class="drag-item" @click="openUrl(STUDIO_FOUNDRY)">
                <div>Foundry create</div>
                <div class="item-meta">4-slot · era=warlords</div>
              </div>
              <div class="drag-item" @click="openUrl(STUDIO_OPEN)">
                <div>Open library</div>
                <div class="item-meta">open.grudge-studio.com</div>
              </div>
              <div class="drag-item" @click="pushSelected">
                <div>Push selected mesh</div>
                <div class="item-meta">GLB → assets CDN</div>
              </div>
              <div class="drag-item" @click="saveSelected">
                <div>Save selected GLB</div>
                <div class="item-meta">local download</div>
              </div>
            </div>
          </el-scrollbar>
        </div>
      </div>
      <div class="outside-file-content">
        <div class="drag-title">Import</div>
        <div class="outside-file-box" @click="changeFile">
          <div class="upload-tip">
            Drop file · glb obj gltf fbx · png jpg webp hdr
          </div>
          <el-upload
            style="height: 0"
            ref="uploadRef"
            accept=".glb,.obj,.gltf,.fbx,.stl,.usdz,.png,.jpg,.jpeg,.webp,.gif,.hdr"
            :show-file-list="false"
            :auto-upload="false"
            type="hidden"
            :on-change="chooseOutsideFile"
          ></el-upload>
          <div></div>
        </div>
      </div>
      <div class="bottom-spacer"></div>
    </el-scrollbar>
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
  defaultGeometryList,
  defaultLightList,
} from '@/config/defaultDragList';
import {
  defaultModelList,
  itemsInGroup,
  loadWarlordsLibrary,
  WARLORDS_GROUP_LABELS,
  type WarlordsAssetGroup,
  type WarlordsDragItem,
} from '@/config/warlordsCatalog';
import { shortUuid } from '@/config/assetId';
import {
  STUDIO_FOUNDRY,
  STUDIO_FORGE_EDITOR,
  STUDIO_OPEN,
  STUDIO_PLAY,
  popoutFleet,
} from '@/config/branding';
import * as THREE from 'three';
import { ElMessage, type ElUpload, type UploadFile } from 'element-plus';
import type { DragModelType } from '@/types/renderModelTypes';
import {
  ASSET_GROUPS,
  LEFT_TAB_ITEMS,
  PLACE_GROUPS,
  WORLD_GROUPS,
  type LeftTabKey,
} from './config';
import { computed, getCurrentInstance, onMounted, ref, watch } from 'vue';
import { DRAG_MODEL_TYPE, MITT_ON_KEY } from '@/enums/enum';
import {
  applyModeKit,
  GAME_MODES,
  HUD_FRAMES,
  loadHud,
  type GameModeId,
  type HudFrame,
} from '@/config/hudKits';
import { useSceneStore } from '@/store/sceneEditStore';
import { ensureSceneManagers } from '@/utils/sceneManagers';
import { exportObjectToGlbBlob } from '@/utils/sceneModules';
import { downloadBlob, pushGlbBlob } from '@/utils/assetPush';

const emit = defineEmits([
  'drag-model-start',
  'choose-outside-file',
  'place-model',
]);
const { $eventBus } = getCurrentInstance()?.proxy || {};
const hudMode = ref<GameModeId>(loadHud().mode);
const store = useSceneStore();

const vfxLab =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('scene') === 'vfx';
const leftTab = ref<LeftTabKey>(vfxLab ? 'assets' : 'world');
const activeAssetGroup = ref<WarlordsAssetGroup | 'all'>(
  vfxLab ? 'vfx' : 'sectors'
);
const libQuery = ref('');
const libraryItems = ref<WarlordsDragItem[]>([...defaultModelList]);

const tabGroups = computed(() => {
  if (leftTab.value === 'world') return WORLD_GROUPS as readonly string[];
  if (leftTab.value === 'place') return PLACE_GROUPS as readonly string[];
  if (leftTab.value === 'assets') return ASSET_GROUPS as readonly string[];
  return [];
});

const tabHint = computed(() => {
  const hit = LEFT_TAB_ITEMS.find((t) => t.key === leftTab.value);
  return hit?.hint || '';
});

const tabbedItems = computed(() => {
  const allow = new Set(tabGroups.value);
  if (!allow.size) return libraryItems.value;
  return libraryItems.value.filter((i) => allow.has(i.group));
});

const folderRows = computed(() =>
  tabGroups.value
    .map((key) => ({
      key: key as WarlordsAssetGroup,
      label: WARLORDS_GROUP_LABELS[key as WarlordsAssetGroup] || key,
      count: itemsInGroup(tabbedItems.value, key as WarlordsAssetGroup).length,
    }))
    .filter((row) => row.count > 0)
);

const showPrefabs = computed(
  () =>
    leftTab.value === 'place' &&
    (activeAssetGroup.value === 'prefabs' ||
      activeAssetGroup.value === 'all' ||
      libQuery.value.trim().length > 0)
);

const groupedModels = computed(() =>
  itemsInGroup(tabbedItems.value, activeAssetGroup.value)
);

const visibleModels = computed(() => {
  const q = libQuery.value.trim().toLowerCase();
  const pool = q
    ? tabbedItems.value.filter((item) =>
        `${item.name} ${item.r2Key || ''} ${item.group} ${item.filePath} ${item.contentLayer || ''}`
          .toLowerCase()
          .includes(q)
      )
    : groupedModels.value;
  return q && activeAssetGroup.value !== 'all'
    ? itemsInGroup(pool, activeAssetGroup.value)
    : pool;
});

const siLabel = (item: WarlordsDragItem) => {
  if (item.group === 'sectors') return 'DS2 · 10 km cell · 420 m bake';
  if (item.group === 'zones') return 'Live Hard Road DS2';
  const m = item.siHeightM;
  if (!m) return '—';
  if (item.group === 'islands') return `${Math.round(m)} m island`;
  return `${m} m · ${(m / 1.8).toFixed(2)}× human`;
};

const shortPath = (item: WarlordsDragItem) => {
  if (item.group === 'sectors')
    return `sectors/${item.sectorId || item.terrainId}/ds2-terrain.glb`;
  const key = item.r2Key || item.filePath || '';
  if (key.startsWith('prefab://') || key.startsWith('hardroad://')) return key;
  const parts = key
    .replace(/^https?:\/\/assets\.grudge-studio\.com\//, '')
    .split('/');
  return (
    parts.slice(-2).join('/') || shortUuid(item.prefabId || item.assetUuid)
  );
};

const itemTitle = (item: WarlordsDragItem) =>
  [
    item.name,
    item.prefabId && `prefab ${item.prefabId}`,
    item.assetUuid && `uuid ${item.assetUuid}`,
    item.siHeightM && `SI ${item.siHeightM}m`,
    item.r2Key,
    item.placeable === false ? 'icon only — no unique GLB' : '',
  ]
    .filter(Boolean)
    .join('\n');

const onIconError = (e: Event) => {
  const img = e.target as HTMLImageElement;
  if (!img || img.src.startsWith('data:')) return;
  const label = img.alt || 'asset';
  img.src =
    'data:image/svg+xml;charset=utf-8,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" fill="#3d4e69"/><text x="64" y="72" text-anchor="middle" fill="#f3ece0" font-size="16" font-family="sans-serif">${label.slice(0, 12)}</text></svg>`
    );
};

watch(leftTab, (t) => {
  libQuery.value = '';
  if (t === 'world') activeAssetGroup.value = 'sectors';
  else if (t === 'assets') activeAssetGroup.value = 'captains';
  else if (t === 'place') activeAssetGroup.value = 'prefabs';
});

onMounted(async () => {
  libraryItems.value = await loadWarlordsLibrary();
});

const isCollapsed = ref<boolean>(false);
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
};

const onDragModelStart = (model: DragModelType) => {
  emit('drag-model-start', model);
};

const onClickPlace = async (item: WarlordsDragItem) => {
  const animRel = item.playScript?.startsWith('anim:')
    ? item.playScript.slice(5)
    : item.group === 'animations'
      ? String(item.r2Key || '')
          .replace(/^anims\/baked\//, '')
          .replace(/\.json$/i, '')
      : '';
  if (animRel) {
    const { findRaceKitRoot } = await import('@/utils/raceKit');
    const { playBakeRel } = await import('@/utils/kitAnim');
    const scene = store.sceneApi?.scene;
    const uuid = store.currentTransformMaterialUuid;
    const obj = uuid && scene ? scene.getObjectByProperty('uuid', uuid) : null;
    const root = findRaceKitRoot(obj);
    if (!root) {
      ElMessage.warning('Select a Toon RTS captain, then click a clip');
      return;
    }
    const ok = await playBakeRel(root, animRel, store.sceneApi?.animationModules);
    if (ok) ElMessage.success(animRel);
    else ElMessage.warning(`Could not play ${animRel}`);
    return;
  }
  if (item.placeable === false) return;
  emit('place-model', item);
};

const applyHudMode = () => {
  applyModeKit(hudMode.value);
  $eventBus?.emit(MITT_ON_KEY.HUD_CHANGED, true);
};

const onDragHud = (f: HudFrame) => {
  emit('drag-model-start', {
    modelType: DRAG_MODEL_TYPE.Ui2d,
    name: f.label,
    id: f.id,
    type: f.type,
    hudFrame: f,
  } as unknown as DragModelType);
};

const onClickHud = (f: HudFrame) => {
  onDragHud(f);
  emit('place-model', {
    modelType: DRAG_MODEL_TYPE.Ui2d,
    name: f.label,
    id: f.id,
    type: f.type,
    hudFrame: f,
  } as unknown as DragModelType);
};

const focusManager = (name: string) => {
  const scene = store.sceneApi?.scene;
  if (!scene) return;
  const { gm, nm } = ensureSceneManagers(scene);
  const obj = name === 'NetworkManager' ? nm : gm;
  store.setCurrentTransformMaterialUuid(obj.uuid);
  store.setTransformMaterialRandomId();
  store.sceneApi?.chooseMaterial({ uuid: obj.uuid, type: obj.type, name: obj.name });
  ElMessage.success(`${name} selected`);
};

const openUrl = (url: string) => popoutFleet(url, 'grudge-fleet');

const selectedObj = () => {
  const scene = store.sceneApi?.scene;
  const uuid = store.currentTransformMaterialUuid;
  if (!scene || !uuid) return null;
  return scene.getObjectByProperty('uuid', uuid) as THREE.Object3D | undefined;
};

const saveSelected = async () => {
  const obj = selectedObj();
  if (!obj) {
    ElMessage.warning('Select a hierarchy node');
    return;
  }
  try {
    const { blob, filename } = await exportObjectToGlbBlob(obj, obj.name || 'mesh');
    downloadBlob(blob, filename);
    ElMessage.success(filename);
  } catch (e: unknown) {
    ElMessage.error(e instanceof Error ? e.message : 'Save failed');
  }
};

const pushSelected = async () => {
  const obj = selectedObj();
  if (!obj) {
    ElMessage.warning('Select a hierarchy node');
    return;
  }
  try {
    const { blob, filename } = await exportObjectToGlbBlob(obj, obj.name || 'mesh');
    await pushGlbBlob(blob, filename);
  } catch (e: unknown) {
    ElMessage.error(e instanceof Error ? e.message : 'Push failed');
  }
};

const chooseOutsideFile = async (file: UploadFile) => {
  emit('choose-outside-file', file);
};

const uploadRef = ref<InstanceType<typeof ElUpload>>();
const changeFile = () => {
  const input = uploadRef?.value?.$el.querySelector('input');
  if (input instanceof HTMLInputElement) input.click();
};
</script>
<style lang="scss" scoped src="./index.scss"></style>
