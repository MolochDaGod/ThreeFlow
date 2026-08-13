<template>
  <div class="right-panel-container">
    <el-tabs
      v-model="activeTabs"
      type="border-card"
      v-if="!props.pageLoading && store.sceneApi"
    >
      <el-tab-pane
        v-for="item in tabList"
        :key="item.key"
        :label="item.name"
        :name="item.key"
      >
        <component :is="item.component" />
      </el-tab-pane>
    </el-tabs>
    <!-- transform mode switch -->
    <TransformControls />
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import TransformControls from './TransformControls/index.vue';
import SceneContent from './SceneContent/index.vue';
import ProjectConfig from './ProjectConfig/index.vue';
import HelpDescribe from './HelpDescribe/index.vue';
import { useSceneStore } from '@/store/sceneEditStore';
const store = useSceneStore();
const tabList = [
  {
    name: 'Scene',
    key: 'scene',
    component: SceneContent,
  },
  {
    name: 'Project',
    key: 'projectConfig',
    component: ProjectConfig,
  },
  {
    name: 'About',
    key: 'help',
    component: HelpDescribe,
  },
];
const props = defineProps<{
  pageLoading: boolean;
}>();

const activeTabs = ref('scene');
</script>
<style lang="scss" scoped src="./index.scss"></style>
