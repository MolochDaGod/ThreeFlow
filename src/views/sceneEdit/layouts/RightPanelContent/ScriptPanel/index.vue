<template>
  <el-scrollbar max-height="calc(100vh - 120px)">
    <div class="script-panel">
      <div class="block-title">three.js script</div>
      <p class="hint">
        Same surface as the three.js editor: <code>THREE</code>,
        <code>scene</code>, <code>camera</code>, <code>renderer</code>,
        <code>selected</code>. Play scripts stay on Forge.
      </p>
      <div class="row">
        <el-select v-model="preset" size="small" style="width: 220px" @change="applyPreset">
          <el-option label="(scratch)" value="" />
          <el-option
            v-for="p in SCRIPT_PRESETS"
            :key="p.name"
            :label="p.name"
            :value="p.name"
          />
        </el-select>
      </div>
      <textarea v-model="source" class="src" spellcheck="false" />
      <div class="row wrap">
        <el-button size="small" type="primary" @click="run">Run</el-button>
        <el-button size="small" @click="openCoder">Coder popout</el-button>
        <el-button size="small" @click="openForge">Forge scripts</el-button>
      </div>
      <pre class="out">{{ out }}</pre>
    </div>
  </el-scrollbar>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { useSceneStore } from '@/store/sceneEditStore';
import { popoutFleet, STUDIO_CODER, STUDIO_FORGE_EDITOR } from '@/config/branding';
import { SCRIPT_PRESETS } from '@/config/fleetSystems';
import { runSceneScript } from '@/utils/sceneScript';
import { selectedObject } from '@/utils/systemsRuntime';

const store = useSceneStore();
const preset = ref('');
const source = ref(SCRIPT_PRESETS[0]?.source || '');
const out = ref('');

const applyPreset = () => {
  const hit = SCRIPT_PRESETS.find((p) => p.name === preset.value);
  if (hit) source.value = hit.source;
};

const run = () => {
  const api = store.sceneApi;
  if (!api?.scene || !api.camera) {
    ElMessage.warning('Scene not ready');
    return;
  }
  try {
    const result = runSceneScript(source.value, {
      scene: api.scene,
      camera: api.camera,
      renderer: api.renderer,
      selected: selectedObject(api.scene, store.currentTransformMaterialUuid),
    });
    out.value = JSON.stringify(result, null, 2);
  } catch (err) {
    out.value = err instanceof Error ? err.message : String(err);
    ElMessage.error('Script failed');
  }
};

const openCoder = () => popoutFleet(STUDIO_CODER, 'grudge-coder');
const openForge = () => popoutFleet(STUDIO_FORGE_EDITOR, 'grudge-forge');
</script>
<style lang="scss" scoped src="./index.scss"></style>
