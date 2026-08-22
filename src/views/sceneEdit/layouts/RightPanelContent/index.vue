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
import { onMounted, onUnmounted, getCurrentInstance, ref } from 'vue';
import { MITT_ON_KEY } from '@/enums/enum';
import TransformControls from './TransformControls/index.vue';
import SceneContent from './SceneContent/index.vue';
import ProjectConfig from './ProjectConfig/index.vue';
import HelpDescribe from './HelpDescribe/index.vue';
import SystemsPanel from './SystemsPanel/index.vue';
import ScriptPanel from './ScriptPanel/index.vue';
import AiWorkerPanel from './AiWorkerPanel/index.vue';
import { useSceneStore } from '@/store/sceneEditStore';
const store = useSceneStore();
const tabList = [
  {
    name: 'Scene',
    key: 'scene',
    component: SceneContent,
  },
  {
    name: 'Systems',
    key: 'systems',
    component: SystemsPanel,
  },
  {
    name: 'Script',
    key: 'script',
    component: ScriptPanel,
  },
  {
    name: 'AI',
    key: 'ai',
    component: AiWorkerPanel,
  },
  {
    name: 'Setup',
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
const { $eventBus } = getCurrentInstance()?.proxy || {};
const openAi = () => {
  activeTabs.value = 'ai';
};
onMounted(() => $eventBus?.on(MITT_ON_KEY.OPEN_AI_TAB, openAi));
onUnmounted(() => $eventBus?.off(MITT_ON_KEY.OPEN_AI_TAB, openAi));
</script>
<style lang="scss" scoped src="./index.scss"></style>
