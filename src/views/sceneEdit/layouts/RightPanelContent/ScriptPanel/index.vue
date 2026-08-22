<template>
  <el-scrollbar max-height="calc(100vh - 120px)">
    <div class="script-panel">
      <div class="block-title">Game flows · info SSOT</div>
      <p class="hint">
        Designed on
        <code>info.grudge-studio.com</code>
        — not a second system. Scripts run here (three.js editor surface).
      </p>
      <div class="flow" v-for="f in GAME_FLOWS" :key="f.id">
        <strong>{{ f.label }}</strong>
        <span v-for="(s, i) in f.steps" :key="i">{{ i + 1 }}. {{ s }}</span>
      </div>

      <div class="block-title">three.js script</div>
      <div class="row">
        <el-select
          v-model="preset"
          size="small"
          style="width: 220px"
          @change="applyPreset"
        >
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
        <el-button size="small" @click="attachToSelected"
          >Attach to selected</el-button
        >
        <el-button size="small" @click="probeInfo">Probe info JSON</el-button>
      </div>
      <pre class="out">{{ out }}</pre>
    </div>
  </el-scrollbar>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { useSceneStore } from '@/store/sceneEditStore';
import { SCRIPT_PRESETS } from '@/config/fleetSystems';
import { GAME_FLOWS, INFO_JSON, fetchInfoJson } from '@/config/objectStoreSsot';
import { getHomeIsland } from '@/config/fleetAuth';
import { readThreeflowStamp } from '@/utils/islandState';
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

const attachToSelected = () => {
  const api = store.sceneApi;
  if (!api?.scene) {
    ElMessage.warning('Scene not ready');
    return;
  }
  const obj = selectedObject(api.scene, store.currentTransformMaterialUuid);
  if (!obj) {
    ElMessage.warning('Select a mesh first');
    return;
  }
  obj.userData.playScript = source.value;
  ElMessage.success(`Script on ${obj.name} — runs on Play`);
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

const probeInfo = async () => {
  try {
    const [home, studio, island] = await Promise.all([
      fetchInfoJson<{
        version?: string;
        scale?: { warlords3dWorldSizeM?: number };
      }>(INFO_JSON.homeIsland),
      fetchInfoJson<{ version?: string }>(INFO_JSON.studio),
      getHomeIsland(),
    ]);
    out.value = JSON.stringify(
      {
        ssot: 'info.grudge-studio.com/api/v1',
        homeIsland: home.version,
        worldSizeM: home.scale?.warlords3dWorldSizeM,
        studio: studio.version,
        railwayIsland: {
          status: island.status,
          name: island.island?.name || null,
          seed: island.island?.seed || null,
          nodes: Array.isArray(island.island?.state?.nodes)
            ? island.island.state.nodes.length
            : 0,
          camp:
            (island.island?.state as { campPosition?: unknown } | null)
              ?.campPosition || null,
          threeflow: (() => {
            const stamp = readThreeflowStamp(island.island?.state);
            return stamp
              ? {
                  version: stamp.version,
                  seafloor: stamp.seafloor,
                  islands: stamp.islands,
                  water: stamp.water,
                }
              : null;
          })(),
        },
      },
      null,
      2
    );
    ElMessage.success('info contract reachable');
  } catch (err) {
    out.value = err instanceof Error ? err.message : String(err);
    ElMessage.error('info probe failed');
  }
};
</script>
<style lang="scss" scoped src="./index.scss"></style>
