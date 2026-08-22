<template>
  <div class="scene-content">
    <!-- Scene -->
    <el-scrollbar
      max-height="420px"
      height="420px"
      class="scene-content-tree"
      ref="scrollbarRef"
    >
      <el-tree
        ref="treeRef"
        :data="formattedSceneData"
        :props="{
          label: 'name',
          children: 'children',
          key: 'uuid',
        }"
        draggable
        :allow-drop="allowDrop"
        :expand-on-click-node="false"
        node-key="uuid"
        empty-text="No data"
        :current-node-key="currentTransformMaterialUuid"
        @current-change="changeMaterialsNode"
        @node-expand="handleNodeExpand"
        @node-drop="onNodeDrop"
        :default-expanded-keys="expandedKeys"
      >
        <template #default="{ node, data }">
          <div
            class="custom-tree-node"
            :data-key="data.uuid"
            @click="onTreeSelect($event, data)"
            @dblclick="handleNodeDblClick(data)"
            @contextmenu.prevent="onNodeRmb($event, data)"
          >
            <div class="node-label">
              <span class="iconfont" :class="data.iconClass"></span>
              <span>{{ node.label }}</span>
            </div>
            <div class="node-actions" v-if="data.type !== 'PerspectiveCamera'">
              <el-space>
                <el-icon
                  class="icon-style"
                  title="Duplicate"
                  @click.stop="copyMaterial(data)"
                  ><DocumentCopy
                /></el-icon>
                <el-icon class="icon-style" @click="deleteMaterial(data)">
                  <Delete></Delete>
                </el-icon>
              </el-space>
            </div>
          </div>
        </template>
      </el-tree>
    </el-scrollbar>
    <div class="manager-inspect" v-if="managerInspect">
      <strong>{{ managerInspect.name }}</strong>
      <pre>{{ managerInspect.json }}</pre>
      <button type="button" v-if="managerInspect.play" @click="runManagerScript">
        Run script
      </button>
      <a
        v-for="(url, k) in managerInspect.links"
        :key="k"
        :href="url"
        target="_blank"
        rel="noreferrer"
        >{{ k }}</a
      >
    </div>
    <!-- SceneProperties-->
    <div class="scene-content-property" v-if="currentTransformMaterialUuid">
      <el-tabs type="border-card" v-model="currentTab">
        <el-tab-pane
          label="Properties"
          :name="TAB_TYPE.Property"
          v-if="meshProperty"
        >
          <MeshProperty :meshProperty="meshProperty" />
        </el-tab-pane>
        <el-tab-pane
          label="Material"
          :name="TAB_TYPE.Material"
          v-if="meshMaterial?.isMaterial || meshMaterial?.type"
        >
          <MaterialProperty
            ref="materialPropertyRef"
            :meshMaterial="meshMaterial"
            @updateMeshMaterial="updateMeshMaterial"
          />
        </el-tab-pane>
        <el-tab-pane
          label="Geometry"
          :name="TAB_TYPE.Geometry"
          v-if="geometryParameters?.parameters"
        >
          <GeometryProperty :geometryParameters="geometryParameters" />
        </el-tab-pane>
        <el-tab-pane
          label="Animation"
          :name="TAB_TYPE.Animation"
          v-if="animationsList.length"
        >
          <AnimationsProperty :animationsList="animationsList" />
        </el-tab-pane>
        <el-tab-pane label="Race kit" :name="TAB_TYPE.Race" v-if="hasRaceKit">
          <RaceKitPanel />
        </el-tab-pane>
      </el-tabs>
    </div>
    <div
      v-if="ctx.show"
      class="hier-ctx"
      :style="{ left: ctx.x + 'px', top: ctx.y + 'px' }"
      @click.stop
    >
      <button type="button" @click="ctxSaveMesh">Save mesh GLB</button>
      <button type="button" @click="ctxPushMesh">Push to assets</button>
      <button type="button" @click="ctxFocus">Focus</button>
      <button type="button" @click="ctxDelete">Delete</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSceneStore } from '@/store/sceneEditStore';
import { getSceneMaterialList, scrollToTreeNode } from '@/utils/utils';
import {
  computed,
  getCurrentInstance,
  onMounted,
  onUnmounted,
  reactive,
  ref,
  watch,
} from 'vue';
import type {
  GeometryParameters,
  MaterialNode,
  MaterialData,
  TransformMaterial,
} from '@/types/rightPanelTypes';
import { ElMessage } from 'element-plus';
import { exportObjectToGlbBlob } from '@/utils/sceneModules';
import { downloadBlob, pushGlbBlob } from '@/utils/assetPush';
import type { ElScrollbar, ElTree } from 'element-plus';
import * as THREE from 'three';
import MaterialProperty from './modules/MaterialProperty/index.vue';
import MeshProperty from './modules/MeshProperty/index.vue';
import GeometryProperty from './modules/GeometryProperty/index.vue';
import AnimationsProperty from './modules/AnimationsProperty/index.vue';
import RaceKitPanel from './modules/RaceKitPanel/index.vue';
import { findRaceKitRoot } from '@/utils/raceKit';
import { SCENE_OBJECT_NAME, TAB_TYPE, MITT_ON_KEY } from '@/enums/enum';
import { clipsOnObject, firstEditableMesh, materialOf } from '@/utils/utils';
import { ReparentCommand } from '@/utils/historyModules/reparentCommand';
import { isManager } from '@/utils/sceneManagers';
import { hudIdOf } from '@/utils/hudScene';
import { loadHud, saveHud } from '@/config/hudKits';
import { runSceneScript } from '@/utils/sceneScript';
import type { Node as ElTreeNode } from 'element-plus/es/components/tree/src/model/node';

const store = useSceneStore();
const { $eventBus } = getCurrentInstance()?.proxy || {};

const managerInspect = computed(() => {
  const uuid = store.currentTransformMaterialUuid;
  const scene = store.sceneApi?.scene;
  if (!uuid || !scene) return null;
  const obj = scene.getObjectByProperty('uuid', uuid);
  if (!isManager(obj)) return null;
  const deploy = (obj.userData.deploy || {}) as Record<string, string>;
  return {
    name: obj.name,
    json: JSON.stringify(
      {
        role: obj.userData.grudgeRole,
        inspect: obj.userData.inspect,
        deploy,
      },
      null,
      2
    ),
    play: String(obj.userData.playScript || ''),
    links: deploy,
  };
});

const runManagerScript = () => {
  const api = store.sceneApi;
  if (!api?.scene || !api.camera) return;
  const uuid = store.currentTransformMaterialUuid;
  const selected = uuid
    ? (api.scene.getObjectByProperty('uuid', uuid) as THREE.Object3D)
    : null;
  if (!selected?.userData?.playScript) return;
  try {
    const r = runSceneScript(String(selected.userData.playScript), {
      scene: api.scene,
      camera: api.camera,
      renderer: api.renderer,
      selected,
    });
    ElMessage.success(`Ran ${selected.name}`);
    console.info('[manager-script]', r);
  } catch (e: unknown) {
    ElMessage.error(e instanceof Error ? e.message : 'Script failed');
  }
};

type TreeN = { data: MaterialNode };
const allowDrop = (dragging: TreeN, drop: TreeN, type: 'prev' | 'inner' | 'next') => {
  const d = dragging.data;
  const t = drop.data;
  if (!d?.uuid || !t?.uuid || d.uuid === t.uuid) return false;
  if (d.kind === 'game-manager' || d.kind === 'network-manager' || d.kind === 'hud-root')
    return false;
  if (t.type === 'PerspectiveCamera') return false;
  if (d.kind === 'hud-frame') {
    return t.kind === 'hud-root' || t.kind === 'hud-frame';
  }
  if (type === 'inner' && t.kind === 'hud-frame') return d.kind === 'hud-frame';
  return true;
};

const onNodeDrop = (
  dragging: ElTreeNode,
  drop: ElTreeNode,
  type: 'before' | 'after' | 'inner'
) => {
  const scene = store.sceneApi?.scene;
  if (!scene) return;
  const obj = scene.getObjectByProperty('uuid', (dragging.data as MaterialNode).uuid) as
    | THREE.Object3D
    | undefined;
  const target = scene.getObjectByProperty('uuid', (drop.data as MaterialNode).uuid) as
    | THREE.Object3D
    | undefined;
  if (!obj || !target) return;
  let parent: THREE.Object3D = target;
  let index = -1;
  if (type === 'inner') parent = target;
  else {
    parent = target.parent || scene;
    index = parent.children.indexOf(target) + (type === 'after' ? 1 : 0);
  }
  if (obj.userData?.lockedRoot) return;
  store.sceneApi?.historyModules.execute(new ReparentCommand(obj, parent, index));
};

const selectHudIfAny = (obj: THREE.Object3D | null) => {
  const id = hudIdOf(obj);
  if (!id) return;
  const hud = loadHud();
  hud.selectedId = id;
  saveHud(hud);
  $eventBus?.emit(MITT_ON_KEY.HUD_CHANGED, true);
};
const hasRaceKit = computed(() => {
  const uuid = store.currentTransformMaterialUuid;
  const scene = store.sceneApi?.scene;
  if (!uuid || !scene) return false;
  const obj = scene.getObjectByProperty('uuid', uuid);
  return Boolean(findRaceKitRoot(obj as THREE.Object3D | null));
});

// format scene data
const formattedSceneData = computed(() => {
  const scene = store.sceneApi?.scene;
  if (!scene) return [];
  void store.transformMaterialRandomId;
  return getSceneMaterialList(scene);
});

watch(
  formattedSceneData,
  (list) => {
    const want = new Set(['GameManager', 'NetworkManager', 'HUD', 'Camera']);
    const extra: string[] = [];
    const walk = (nodes: MaterialNode[]) => {
      for (const n of nodes) {
        if (n.name && want.has(n.name)) extra.push(n.uuid);
        if (n.children) walk(n.children);
      }
    };
    walk(list);
    if (extra.length) {
      expandedKeys.value = Array.from(new Set([...expandedKeys.value, ...extra]));
    }
  },
  { immediate: true }
);
// material refresh id
const transformMaterialRandomId = computed(
  () => store.transformMaterialRandomId
);
// selected object uuid
const currentTransformMaterialUuid = computed(
  () => store.currentTransformMaterialUuid
);
// MaterialProperties
const meshProperty = ref<TransformMaterial | null>(null);
// scrollbar
const scrollbarRef = ref<typeof ElScrollbar | null>(null);
// tree
const treeRef = ref<typeof ElTree | null>(null);
// MaterialProperties
const materialPropertyRef = ref<typeof MaterialProperty | null>(null);
// clicked selection
const isClickChoose = ref(false);
// current tab
const currentTab = ref(TAB_TYPE.Material);
// Geometry
const geometryParameters = reactive<GeometryParameters>({
  type: '',
  uuid: '',
  parameters: null,
});
// Material
const meshMaterial = ref<MaterialData>({ type: '' });
//Animation
const animationsList = ref<THREE.AnimationClip[]>([]);
// control listeners
const controlsEventListener = ref();
// expanded
const expandedKeys = ref<string[]>([]);
const ctx = reactive({
  show: false,
  x: 0,
  y: 0,
  node: null as MaterialNode | null,
});

const closeCtx = () => {
  ctx.show = false;
  ctx.node = null;
};

const onNodeRmb = (ev: MouseEvent, data: MaterialNode) => {
  isClickChoose.value = true;
  store.setCurrentTransformMaterialUuid(data.uuid);
  store.sceneApi?.chooseMaterial(data);
  ctx.show = true;
  ctx.x = ev.clientX;
  ctx.y = ev.clientY;
  ctx.node = data;
};

const ctxObject = (): THREE.Object3D | null => {
  const uuid = ctx.node?.uuid;
  if (!uuid) return null;
  return (
    (store.sceneApi?.scene?.getObjectByProperty('uuid', uuid) as THREE.Object3D) ||
    null
  );
};

const ctxSaveMesh = async () => {
  const obj = ctxObject();
  closeCtx();
  if (!obj) return;
  try {
    const { blob, filename } = await exportObjectToGlbBlob(
      obj,
      obj.name || 'mesh'
    );
    downloadBlob(blob, filename);
    ElMessage.success(`Saved ${filename}`);
  } catch (e: unknown) {
    ElMessage.error(e instanceof Error ? e.message : 'Save failed');
  }
};

const ctxPushMesh = async () => {
  const obj = ctxObject();
  closeCtx();
  if (!obj) return;
  try {
    const { blob, filename } = await exportObjectToGlbBlob(
      obj,
      obj.name || 'mesh'
    );
    await pushGlbBlob(blob, filename);
  } catch (e: unknown) {
    ElMessage.error(e instanceof Error ? e.message : 'Push failed');
  }
};

const ctxFocus = () => {
  const node = ctx.node;
  closeCtx();
  if (node) handleNodeDblClick(node);
};

const ctxDelete = () => {
  const node = ctx.node;
  closeCtx();
  if (node) void deleteMaterial(node);
};

// latest material data
watch(hasRaceKit, (on) => {
  if (on) currentTab.value = TAB_TYPE.Race;
});

watch(currentTransformMaterialUuid, async () => {
  const key = currentTransformMaterialUuid.value;
  if (key && treeRef.value && typeof (treeRef.value as { setCurrentKey?: (k: string) => void }).setCurrentKey === 'function') {
    (treeRef.value as { setCurrentKey: (k: string) => void }).setCurrentKey(key);
  }
  const material = store.sceneApi?.scene?.getObjectByProperty(
    'uuid',
    key
  ) as THREE.Mesh;
  await updateCurrentMaterial(material);
  // scroll to selected node if not clicked
  if (!isClickChoose.value) {
    scrollToTreeNode(
      treeRef.value,
      scrollbarRef.value,
      { behavior: 'smooth' },
      currentTransformMaterialUuid.value
    );
  }
  isClickChoose.value = false;
});
// listen to transform changes
watch(transformMaterialRandomId, () => {
  const material = store.sceneApi?.scene?.getObjectByProperty(
    'uuid',
    currentTransformMaterialUuid.value
  ) as THREE.Mesh;

  updateCurrentMaterial(material);
});

// set current tab
const availableTabs = computed(() => {
  const tabs = [];
  if (meshProperty.value) tabs.push(TAB_TYPE.Property);
  if (meshMaterial.value?.isMaterial || meshMaterial.value?.type)
    tabs.push(TAB_TYPE.Material);
  if (geometryParameters?.parameters) tabs.push(TAB_TYPE.Geometry);
  if (animationsList.value.length > 0) tabs.push(TAB_TYPE.Animation);
  return tabs;
});

// watch available tabs
watch([availableTabs, currentTab], ([tabs, tab]) => {
  if (!tabs.includes(tab) && tabs.length > 0) {
    currentTab.value = tabs[0];
  }
});

onMounted(() => {
  window.addEventListener('click', closeCtx);
  //camera parameters
  controlsEventListener.value = store.sceneApi?.controls?.addEventListener(
    'change',
    () => {
      if (meshProperty.value?.type === SCENE_OBJECT_NAME.PerspectiveCamera) {
        const camera = store.sceneApi?.camera;
        updateCurrentMaterial(camera as unknown as THREE.Mesh);
      }
    }
  );
});

onUnmounted(() => {
  store.sceneApi?.controls?.removeEventListener(
    'change',
    controlsEventListener.value
  );
  window.removeEventListener('click', closeCtx);
});

// update current material
const updateCurrentMaterial = async (mesh: THREE.Mesh) => {
  if (!mesh) return;
  const editMesh = firstEditableMesh(mesh);
  const mat = materialOf(editMesh);
  // STL special case
  if (mesh.userData.isSTLModel) {
    meshProperty.value = null;
    geometryParameters.parameters = null;
    animationsList.value = [];
    meshMaterial.value = { ...(mat as MaterialData) };
    await materialPropertyRef.value?.getNewMaterialPropertyList();
    return;
  }
  // Transform on the selected node (group or mesh)
  meshProperty.value = mesh.clone() as unknown as TransformMaterial;
  const geometry = editMesh?.geometry as THREE.BoxGeometry | undefined;
  Object.assign(geometryParameters, {
    parameters: geometry?.parameters || null,
    type: editMesh?.geometry?.type || '',
    uuid: editMesh?.uuid || mesh.uuid,
  });

  meshMaterial.value = mat
    ? ({ ...(mat as unknown as MaterialData), isMaterial: true } as MaterialData)
    : ({ type: '' } as MaterialData);
  await materialPropertyRef.value?.getNewMaterialPropertyList();
  animationsList.value = clipsOnObject(mesh);
};
// update material
const updateMeshMaterial = (mesh: THREE.Mesh) => {
  meshMaterial.value = { ...(mesh.material as unknown as MaterialData) };
};
const selectHierarchyNode = (data: MaterialNode) => {
  isClickChoose.value = true;
  store.setCurrentTransformMaterialUuid(data.uuid);
  const obj = store.sceneApi?.scene?.getObjectByProperty('uuid', data.uuid) as
    | THREE.Object3D
    | undefined;
  if (obj) selectHudIfAny(obj);
  if (data.type === SCENE_OBJECT_NAME.PerspectiveCamera) {
    const camera = store.sceneApi?.camera;
    if (camera) {
      camera.name = camera.name || 'Camera';
      updateCurrentMaterial(camera as unknown as THREE.Mesh);
    }
    return;
  }
  store.sceneApi?.chooseMaterial(data);
};

const onTreeSelect = (ev: MouseEvent, data: MaterialNode) => {
  selectHierarchyNode(data);
  if (!ev.ctrlKey || !ev.altKey || ev.button !== 0) return;
  ev.preventDefault();
  ev.stopPropagation();
  if (data.type === SCENE_OBJECT_NAME.PerspectiveCamera) {
    ElMessage.warning('Camera stays the view — pick an asset');
    return;
  }
  const api = store.sceneApi as {
    placeSelectedInFrontOfCamera?: () => { ok: boolean };
  } | null;
  const r = api?.placeSelectedInFrontOfCamera?.();
  if (r?.ok) ElMessage.success('Placed in front of camera');
  else ElMessage.warning('Could not place that node');
};

// select object
const changeMaterialsNode = (node: MaterialNode) => {
  isClickChoose.value = true;
  store.setCurrentTransformMaterialUuid(node.uuid);
  if (node.type === SCENE_OBJECT_NAME.PerspectiveCamera) {
    const camera = store.sceneApi?.camera;
    if (camera) {
      camera.name = 'Camera';

      updateCurrentMaterial(camera as unknown as THREE.Mesh);
    }
    return;
  }
  store.sceneApi?.chooseMaterial(node);
};

// delete object
const deleteMaterial = async (node: MaterialNode) => {
  expandedKeys.value = expandedKeys.value.filter((key) => key !== node.uuid);
  try {
    await store.sceneApi?.deleteSceneMaterial(node);
    ElMessage.success('Deleted');
    if (node.uuid === currentTransformMaterialUuid.value) {
      geometryParameters.parameters = null;
      meshMaterial.value = { type: '' };
      meshProperty.value = null;
      animationsList.value = [];
    }
  } catch (error) {
    console.error('delete failed:', error);
  }
};
// copy object
const copyMaterial = (node: MaterialNode) => {
  store.sceneApi?.copySceneMaterial(node.uuid);
};

// double-click object
const handleNodeDblClick = (data: MaterialNode) => {
  isClickChoose.value = false;
  const material = store.sceneApi?.scene?.getObjectByProperty(
    'uuid',
    data.uuid
  );
  if (material) {
    store.sceneApi?.transformControlsModules?.focusOnObject(material);
  }
};
// expand node
const handleNodeExpand = (node: MaterialNode) => {
  expandedKeys.value = Array.from(new Set([...expandedKeys.value, node.uuid]));
};
</script>
<style lang="scss" scoped src="./index.scss"></style>
