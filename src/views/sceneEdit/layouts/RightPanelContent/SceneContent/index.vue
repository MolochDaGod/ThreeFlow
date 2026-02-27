<template>
  <div class="scene-content">
    <!-- 场景内容 -->
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
        empty-text="暂无数据"
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
    <!-- 场景内容属性-->
    <div class="scene-content-property" v-if="currentTransformMaterialUuid">
      <el-tabs type="border-card" v-model="currentTab">
        <el-tab-pane label="属性" :name="TAB_TYPE.Property" v-if="meshProperty">
          <MeshProperty :meshProperty="meshProperty" />
        </el-tab-pane>
        <el-tab-pane
          label="材质"
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
          label="几何体参数"
          :name="TAB_TYPE.Geometry"
          v-if="geometryParameters?.parameters"
        >
          <GeometryProperty :geometryParameters="geometryParameters" />
        </el-tab-pane>
        <el-tab-pane label="动画" :name="TAB_TYPE.Animation" v-if="animationsList.length">
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

// 格式化场景数据
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
// 变换材质随机id
const transformMaterialRandomId = computed(() => store.transformMaterialRandomId);
// 当前变换材质uuid
const currentTransformMaterialUuid = computed(() => store.currentTransformMaterialUuid);
// 材质属性
const meshProperty = ref<TransformMaterial | null>(null);
// 滚动条
const scrollbarRef = ref<typeof ElScrollbar | null>(null);
// 树形结构
const treeRef = ref<typeof ElTree | null>(null);
// 材质属性
const materialPropertyRef = ref<typeof MaterialProperty | null>(null);
// 是否点击选择
const isClickChoose = ref(false);
// 当前选中的标签
const currentTab = ref(TAB_TYPE.Material);
// 几何体参数
const geometryParameters = reactive<GeometryParameters>({
  type: "",
  uuid: "",
  parameters: null,
});
// 材质
const meshMaterial = ref<MaterialData>({ type: "" });
//动画
const animationsList = ref<THREE.AnimationClip[]>([]);
// 控制器事件监听器
const controlsEventListener = ref();
// 是否展开
const expandedKeys = ref<string[]>([]);

// 获取当前材质最新的数据
watch(currentTransformMaterialUuid, async () => {
  const material = store.sceneApi?.scene?.getObjectByProperty(
    "uuid",
    currentTransformMaterialUuid.value
  ) as THREE.Mesh;
  await updateCurrentMaterial(material);
  // 如果未点击选择，则滚动到当前选中节点
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
// 监听变化控制器操作
watch(transformMaterialRandomId, () => {
  const material = store.sceneApi?.scene?.getObjectByProperty(
    "uuid",
    currentTransformMaterialUuid.value
  ) as THREE.Mesh;

  updateCurrentMaterial(material);
});

// 动态设置当前tab
const availableTabs = computed(() => {
  const tabs = [];
  if (meshProperty.value) tabs.push(TAB_TYPE.Property);
  if (meshMaterial?.value.isMaterial) tabs.push(TAB_TYPE.Material);
  if (geometryParameters?.parameters) tabs.push(TAB_TYPE.Geometry);
  if (animationsList.value.length > 0) tabs.push(TAB_TYPE.Animation);
  return tabs;
});

// 监听availableTabs变化
watch([availableTabs, currentTab], ([tabs, tab]) => {
  if (!tabs.includes(tab) && tabs.length > 0) {
    currentTab.value = tabs[0];
  }
});

onMounted(() => {
  //动态相机相关参数
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

// 更新当前材质
const updateCurrentMaterial = async (mesh: THREE.Mesh) => {
  if (!mesh) return;
  // .stl模型特殊处理
  if (mesh.userData.isSTLModel) {
    meshProperty.value = null;
    meshMaterial.value = { type: "" };
    geometryParameters.parameters = null;
    animationsList.value = [];
    // 材质
    meshMaterial.value = { ...(mesh.material as MaterialData) };
    await materialPropertyRef.value?.getNewMaterialPropertyList();
    return;
  }
  // 材质属性
  meshProperty.value = (mesh.clone() as unknown) as TransformMaterial;
  // 几何体
  const geometry = mesh.geometry as THREE.BoxGeometry;
  Object.assign(geometryParameters, {
    parameters: geometry?.parameters || null,
    type: mesh.geometry?.type || "",
    uuid: mesh.uuid,
  });

  // 材质
  meshMaterial.value = { ...((mesh.material as unknown) as MaterialData) };
  await materialPropertyRef.value?.getNewMaterialPropertyList();
  //动画
  animationsList.value = mesh?.animations || [];
};
// 更新材质
const updateMeshMaterial = (mesh: THREE.Mesh) => {
  meshMaterial.value = { ...((mesh.material as unknown) as MaterialData) };
};
// 选择材质
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

// 删除材质
const deleteMaterial = async (node: MaterialNode) => {
  expandedKeys.value = expandedKeys.value.filter((key) => key !== node.uuid);
  try {
    await store.sceneApi?.deleteSceneMaterial(node);
    ElMessage.success("删除材质成功");
    if (node.uuid === currentTransformMaterialUuid.value) {
      geometryParameters.parameters = null;
      meshMaterial.value = { type: "" };
      meshProperty.value = null;
      animationsList.value = [];
    }
  } catch (error) {
    console.error("删除材质失败:", error);
  }
};
// 复制材质
const copyMaterial = (node: MaterialNode) => {
  store.sceneApi?.copySceneMaterial(node.uuid);
};

// 双击材质
const handleNodeDblClick = (data: MaterialNode) => {
  isClickChoose.value = false;
  const material = store.sceneApi?.scene?.getObjectByProperty("uuid", data.uuid);
  if (material) {
    store.sceneApi?.transformControlsModules?.focusOnObject(material);
  }
};
// 展开节点
const handleNodeExpand = (node: MaterialNode) => {
  expandedKeys.value = Array.from(new Set([...expandedKeys.value, node.uuid]));
};
</script>
<style lang="scss" scoped src="./index.scss"></style>
