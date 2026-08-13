<template>
  <div class="scene-content">
    <!-- Scene -->
    <el-scrollbar
      max-height="300px"
      height="300px"
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
        :expand-on-click-node="false"
        node-key="uuid"
        empty-text="No data"
        :current-node-key="currentTransformMaterialUuid"
        @current-change="changeMaterialsNode"
        @node-expand="handleNodeExpand"
        :default-expanded-keys="expandedKeys"
      >
        <template #default="{ node, data }">
          <div
            class="custom-tree-node"
            :data-key="data.uuid"
            @dblclick="handleNodeDblClick(data)"
          >
            <div class="node-label">
              <span class="iconfont" :class="data.iconClass"></span>
              <span>{{ node.label }}</span>
            </div>
            <div class="node-actions" v-if="data.type !== 'PerspectiveCamera'">
              <el-space>
                <el-icon
                  v-show="data.type === 'Group'"
                  class="icon-style"
                  @click="copyMaterial(data)"
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
    <!-- SceneProperties-->
    <div class="scene-content-property" v-if="currentTransformMaterialUuid">
      <el-tabs type="border-card" v-model="currentTab">
        <el-tab-pane label="Properties" :name="TAB_TYPE.Property" v-if="meshProperty">
          <MeshProperty :meshProperty="meshProperty" />
        </el-tab-pane>
        <el-tab-pane
          label="Material"
          :name="TAB_TYPE.Material"
          v-if="meshMaterial?.isMaterial"
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
        <el-tab-pane label="Animation" :name="TAB_TYPE.Animation" v-if="animationsList.length">
          <AnimationsProperty :animationsList="animationsList" />
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSceneStore } from "@/store/sceneEditStore";
import { getSceneMaterialList, scrollToTreeNode } from "@/utils/utils";
import { computed, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import type { GeometryParameters, MaterialNode, MaterialData ,TransformMaterial} from "@/types/rightPanelTypes";
import { ElMessage } from "element-plus";
import type { ElScrollbar, ElTree } from "element-plus";
import * as THREE from "three";
import MaterialProperty from "./modules/MaterialProperty/index.vue";
import MeshProperty from "./modules/MeshProperty/index.vue";
import GeometryProperty from "./modules/GeometryProperty/index.vue";
import AnimationsProperty from "./modules/AnimationsProperty/index.vue";
import { SCENE_OBJECT_NAME, TAB_TYPE } from "@/enums/enum";

const store = useSceneStore();

// format scene data
const formattedSceneData = computed(() => {
  if (store.sceneApi?.scene) {
    const camera = store.sceneApi?.camera;
    const newCamera = {
      uuid: camera?.uuid,
      name: camera?.name || "Camera",
      iconClass: "icon-24gf-camera2",
      type: "PerspectiveCamera",
    };
    if (camera) {
      store.sceneApi?.scene?.remove(camera);
    }
    return [newCamera, ...getSceneMaterialList(store.sceneApi?.scene)];
  }
  return [];
});
// material refresh id
const transformMaterialRandomId = computed(() => store.transformMaterialRandomId);
// selected object uuid
const currentTransformMaterialUuid = computed(() => store.currentTransformMaterialUuid);
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
  type: "",
  uuid: "",
  parameters: null,
});
// Material
const meshMaterial = ref<MaterialData>({ type: "" });
//Animation
const animationsList = ref<THREE.AnimationClip[]>([]);
// control listeners
const controlsEventListener = ref();
// expanded
const expandedKeys = ref<string[]>([]);

// latest material data
watch(currentTransformMaterialUuid, async () => {
  const material = store.sceneApi?.scene?.getObjectByProperty(
    "uuid",
    currentTransformMaterialUuid.value
  ) as THREE.Mesh;
  await updateCurrentMaterial(material);
  // scroll to selected node if not clicked
  if (!isClickChoose.value) {
    scrollToTreeNode(
      treeRef.value,
      scrollbarRef.value,
      { behavior: "smooth" },
      currentTransformMaterialUuid.value
    );
  }
  isClickChoose.value = false;
});
// listen to transform changes
watch(transformMaterialRandomId, () => {
  const material = store.sceneApi?.scene?.getObjectByProperty(
    "uuid",
    currentTransformMaterialUuid.value
  ) as THREE.Mesh;

  updateCurrentMaterial(material);
});

// set current tab
const availableTabs = computed(() => {
  const tabs = [];
  if (meshProperty.value) tabs.push(TAB_TYPE.Property);
  if (meshMaterial?.value.isMaterial) tabs.push(TAB_TYPE.Material);
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
  //camera parameters
  controlsEventListener.value = store.sceneApi?.controls?.addEventListener(
    "change",
    () => {
      if (meshProperty.value?.type === SCENE_OBJECT_NAME.PerspectiveCamera) {
        const camera = store.sceneApi?.camera;
        updateCurrentMaterial((camera as unknown) as THREE.Mesh);
      }
    }
  );
});

onUnmounted(() => {
  store.sceneApi?.controls?.removeEventListener("change", controlsEventListener.value);
});

// update current material
const updateCurrentMaterial = async (mesh: THREE.Mesh) => {
  if (!mesh) return;
  // STL special case
  if (mesh.userData.isSTLModel) {
    meshProperty.value = null;
    meshMaterial.value = { type: "" };
    geometryParameters.parameters = null;
    animationsList.value = [];
    // Material
    meshMaterial.value = { ...(mesh.material as MaterialData) };
    await materialPropertyRef.value?.getNewMaterialPropertyList();
    return;
  }
  // MaterialProperties
  meshProperty.value = (mesh.clone() as unknown) as TransformMaterial;
  // Geometry
  const geometry = mesh.geometry as THREE.BoxGeometry;
  Object.assign(geometryParameters, {
    parameters: geometry?.parameters || null,
    type: mesh.geometry?.type || "",
    uuid: mesh.uuid,
  });

  // Material
  meshMaterial.value = { ...((mesh.material as unknown) as MaterialData) };
  await materialPropertyRef.value?.getNewMaterialPropertyList();
  //Animation
  animationsList.value = mesh?.animations || [];
};
// update material
const updateMeshMaterial = (mesh: THREE.Mesh) => {
  meshMaterial.value = { ...((mesh.material as unknown) as MaterialData) };
};
// select object
const changeMaterialsNode = (node: MaterialNode) => {
  isClickChoose.value = true;
  store.setCurrentTransformMaterialUuid(node.uuid);
  if (node.type === SCENE_OBJECT_NAME.PerspectiveCamera) {
    const camera = store.sceneApi?.camera;
    if (camera) {
      camera.name = "Camera";

      updateCurrentMaterial((camera as unknown) as THREE.Mesh);
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
    ElMessage.success("Deleted");
    if (node.uuid === currentTransformMaterialUuid.value) {
      geometryParameters.parameters = null;
      meshMaterial.value = { type: "" };
      meshProperty.value = null;
      animationsList.value = [];
    }
  } catch (error) {
    console.error("delete failed:", error);
  }
};
// copy object
const copyMaterial = (node: MaterialNode) => {
  store.sceneApi?.copySceneMaterial(node.uuid);
};

// double-click object
const handleNodeDblClick = (data: MaterialNode) => {
  isClickChoose.value = false;
  const material = store.sceneApi?.scene?.getObjectByProperty("uuid", data.uuid);
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
