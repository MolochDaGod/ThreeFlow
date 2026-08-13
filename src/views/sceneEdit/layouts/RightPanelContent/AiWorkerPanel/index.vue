<template>
  <el-scrollbar max-height="calc(100vh - 120px)">
    <div class="ai-panel">
      <div class="block-title">Agentic AI worker</div>
      <p class="hint">
        Live worker is <code>ai.grudge-studio.com</code>. Scene tools +
        <code>list_forge_best_practices</code> live on Forge. This panel pops
        those products — it does not copy 70 tools into Vue.
      </p>
      <div class="row wrap">
        <el-button size="small" type="primary" @click="popAi">
          Pop AI hub
        </el-button>
        <el-button size="small" @click="popForge">Pop Forge worker</el-button>
        <el-button size="small" @click="popCoder">Pop Coder</el-button>
        <el-button size="small" @click="probe">Probe health</el-button>
      </div>
      <p class="log">{{ status }}</p>
      <div class="block-title">Hosts</div>
      <a
        class="host"
        v-for="h in FLEET_HOSTS"
        :key="h.id"
        href="javascript:void(0)"
        @click="popoutFleet(h.url, 'grudge-' + h.id)"
      >
        <strong>{{ h.name }}</strong>
        <span>{{ h.detail }}</span>
      </a>
      <div class="embed-wrap" v-if="embed">
        <iframe :src="embed" title="Grudge AI" />
      </div>
    </div>
  </el-scrollbar>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import {
  popoutFleet,
  STUDIO_AI,
  STUDIO_AI_HEALTH,
  STUDIO_CODER,
  STUDIO_FORGE_EDITOR,
} from '@/config/branding';
import { FLEET_HOSTS } from '@/config/fleetSystems';

const status = ref('Worker is hosted — pop out to talk to it.');
const embed = ref('');

const popAi = () => {
  popoutFleet(STUDIO_AI, 'grudge-ai-worker');
  embed.value = STUDIO_AI;
  status.value = 'Popped AI hub. Iframe may be blocked by X-Frame-Options.';
};
const popForge = () => {
  popoutFleet(STUDIO_FORGE_EDITOR, 'grudge-forge');
  status.value = 'Popped Forge editor (AI Worker panel lives there).';
};
const popCoder = () => popoutFleet(STUDIO_CODER, 'grudge-coder');

const probe = async () => {
  status.value = 'Probing…';
  try {
    const res = await fetch(STUDIO_AI_HEALTH, { mode: 'cors' });
    status.value = `ai.grudge-studio.com/health ${res.status}`;
  } catch (err) {
    status.value =
      'Health probe blocked or down — open the popout. ' +
      (err instanceof Error ? err.message : '');
  }
};
</script>
<style lang="scss" scoped src="./index.scss"></style>
