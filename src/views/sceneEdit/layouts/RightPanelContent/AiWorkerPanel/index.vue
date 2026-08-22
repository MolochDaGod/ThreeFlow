<template>
  <el-scrollbar max-height="calc(100vh - 120px)">
    <div class="ai-panel">
      <div class="block-title">AI worker · debug</div>
      <p class="hint">
        Live probe of <code>ai.grudge-studio.com</code>, CDN, ObjectStore, info.
        Same hosts as fleet — not a second worker.
      </p>
      <div class="row wrap">
        <el-button size="small" type="primary" @click="runProbes"
          >Probe hosts</el-button
        >
        <span
          class="probe-sum"
          :class="{ ok: probesOk, bad: probes.length && !probesOk }"
        >
          {{ probeLine }}
        </span>
      </div>
      <div class="probe" v-for="p in probes" :key="p.id">
        <b :class="p.ok ? 'ok' : 'bad'">{{ p.ok ? 'ok' : 'fail' }}</b>
        <strong>{{ p.name }}</strong>
        <span>{{ p.status || '—' }} · {{ p.ms }}ms · {{ p.detail }}</span>
        <em>{{ shortUrl(p.url) }}</em>
      </div>

      <div class="block-title">Scene AI · in editor</div>
      <p class="hint">
        No pop-out. Definitions from
        <code>info.grudge-studio.com</code>
        (home-island 1024 m · 5 craft / 6 harvest). Scan tags trees, rocks,
        water.
      </p>
      <div class="row wrap">
        <el-button size="small" type="primary" @click="runAudit"
          >Scan scene</el-button
        >
      </div>
      <p class="log" v-if="islandNote">{{ islandNote }}</p>
      <p class="hint" v-if="countsLine">{{ countsLine }}</p>

      <div class="block-title">Missing · solutions</div>
      <div class="gap" v-for="g in gaps" :key="g.id">
        <strong>{{ g.title }}</strong>
        <span>{{ g.detail }}</span>
        <el-button size="small" @click="applyGap(g)">Apply</el-button>
      </div>
      <p class="hint" v-if="!gaps.length && scanned">
        Nothing required — play-as when ready.
      </p>

      <div class="block-title">Selected · role</div>
      <div class="row">
        <span class="lbl">NPC</span>
        <el-select v-model="npcRole" size="small" style="width: 120px">
          <el-option label="vendor" value="vendor" />
          <el-option label="ally" value="ally" />
          <el-option label="enemy" value="enemy" />
        </el-select>
        <el-button size="small" @click="stampNpc">Set</el-button>
      </div>
      <div class="row">
        <span class="lbl">Animal</span>
        <el-select v-model="animalRole" size="small" style="width: 120px">
          <el-option label="aggro" value="aggro" />
          <el-option label="passive" value="passive" />
          <el-option label="pet" value="pet" />
        </el-select>
        <el-button size="small" @click="stampAnimal">Set</el-button>
      </div>
      <div class="row">
        <span class="lbl">Layer</span>
        <el-select v-model="layerId" size="small" style="width: 140px">
          <el-option
            v-for="l in CONTENT_LAYERS"
            :key="l.id"
            :label="l.label"
            :value="l.id"
          />
        </el-select>
        <el-button size="small" @click="stampLayer">Add to layer</el-button>
      </div>

      <div class="block-title">Agentic helpers · Legion</div>
      <p class="hint">
        Cloudflare worker <code>ai.grudge-studio.com</code> via Forge free-ai.
        Roles: director (three.js game), vibe3d (Spacetime prototype), dev.
        Not a second brain.
      </p>
      <div class="row wrap">
        <el-select v-model="agentRole" size="small" style="width: 140px">
          <el-option label="director" value="director" />
          <el-option label="vibe3d" value="vibe3d" />
          <el-option label="dev" value="dev" />
          <el-option label="general" value="general" />
        </el-select>
        <el-button size="small" @click="loadSkills">Load skills</el-button>
      </div>
      <p class="hint" v-if="skillsLine">{{ skillsLine }}</p>
      <textarea
        v-model="agentPrompt"
        class="agent-in"
        rows="3"
        placeholder="Ask about this scene, hierarchy, anims, or vibe MP…"
      />
      <div class="row wrap">
        <el-button size="small" type="primary" :loading="agentBusy" @click="runAgent"
          >Run helper</el-button
        >
      </div>
      <pre class="log agent-out" v-if="agentReply">{{ agentReply }}</pre>

      <div class="block-title">Identified parts</div>
      <div
        class="part"
        v-for="p in parts.slice(0, 40)"
        :key="p.uuid"
        @click="pick(p.uuid)"
      >
        <b>{{ p.kind }}</b>
        <span>{{ p.name }} · {{ p.siM }}m · {{ p.layer }}</span>
      </div>
    </div>
  </el-scrollbar>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { useSceneStore } from '@/store/sceneEditStore';
import { CONTENT_LAYERS, type ContentLayerId } from '@/config/fleetSystems';
import { stampContentLayer, setPlayAs } from '@/utils/contentLayers';
import {
  applyAnimalRole,
  applyNpcRole,
  auditScene,
  type AnimalRole,
  type NpcRole,
  type SceneGap,
  type ScenePart,
} from '@/utils/sceneAudit';
import { selectedObject } from '@/utils/systemsRuntime';
import { probeFleetHosts, type HostProbe } from '@/utils/fleetProbe';
import { STUDIO_AI, STUDIO_FORGE } from '@/config/branding';

const store = useSceneStore();
const parts = ref<ScenePart[]>([]);
const gaps = ref<SceneGap[]>([]);
const islandNote = ref<string | null>(null);
const scanned = ref(false);
const npcRole = ref<NpcRole>('ally');
const animalRole = ref<AnimalRole>('passive');
const layerId = ref<ContentLayerId>('harvestable');
const probes = ref<HostProbe[]>([]);
const probing = ref(false);
const probesOk = computed(
  () => probes.value.length > 0 && probes.value.every((p) => p.ok)
);
const probeLine = computed(() => {
  if (probing.value) return 'probing…';
  if (!probes.value.length) return 'not probed';
  const ok = probes.value.filter((p) => p.ok).length;
  return `${ok}/${probes.value.length} live`;
});
const shortUrl = (u: string) => u.replace(/^https:\/\//, '').slice(0, 56);

const agentRole = ref('director');
const agentPrompt = ref('');
const agentReply = ref('');
const agentBusy = ref(false);
const skillsLine = ref('');

const fleetJwt = () => {
  for (const k of [
    'grudge_auth_token',
    'grudge_session_token',
    'grudge.token',
    'sso_token',
  ]) {
    try {
      const v = localStorage.getItem(k);
      if (v) return v;
    } catch {
      /* ignore */
    }
  }
  return '';
};

const sceneDigest = () => {
  const scene = store.sceneApi?.scene;
  const sel = needObj();
  const kids = scene?.children?.length || 0;
  return [
    `ThreeFlow scene. children=${kids}.`,
    sel
      ? `selected=${sel.name || sel.type} uuid=${sel.uuid} type=${sel.type} clips=${(sel as { animations?: unknown[] }).animations?.length || 0}`
      : 'nothing selected',
    'Play = loadRaceKit. Vibe MP = F:/GitHub/vibe-coding-starter-pack-3d-multiplayer prototype only.',
    'Anims: one mixer, Bip001, rotation-only packs.',
  ].join('\n');
};

const loadSkills = async () => {
  try {
    const r = await fetch(`${STUDIO_AI}/v1/skills`);
    const j = await r.json();
    const roles = (j.skills || [])
      .map((s: { role?: string }) => s.role)
      .filter(Boolean)
      .slice(0, 16);
    skillsLine.value = `${j.count || roles.length} roles · ${roles.join(', ')}`;
  } catch (e) {
    skillsLine.value = e instanceof Error ? e.message : 'skills failed';
  }
};

const runAgent = async () => {
  const text = agentPrompt.value.trim();
  if (!text) return ElMessage.warning('Write a prompt');
  agentBusy.value = true;
  agentReply.value = '';
  try {
    const jwt = fleetJwt();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (jwt) headers.Authorization = `Bearer ${jwt}`;
    const res = await fetch(
      `${STUDIO_FORGE}/api/free-ai/chat?provider=grudge-ai`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          role: agentRole.value,
          messages: [
            { role: 'system', content: sceneDigest() },
            { role: 'user', content: text },
          ],
        }),
      }
    );
    const j = await res.json();
    if (!res.ok) {
      agentReply.value = j.error || JSON.stringify(j).slice(0, 800);
      return;
    }
    agentReply.value =
      j.choices?.[0]?.message?.content ||
      j.response ||
      j.content ||
      JSON.stringify(j).slice(0, 1200);
  } catch (e) {
    agentReply.value = e instanceof Error ? e.message : String(e);
  } finally {
    agentBusy.value = false;
  }
};

const runProbes = async () => {
  probing.value = true;
  try {
    probes.value = await probeFleetHosts();
  } finally {
    probing.value = false;
  }
};

const countsLine = computed(() => {
  const c: Record<string, number> = {};
  for (const p of parts.value) c[p.kind] = (c[p.kind] || 0) + 1;
  return Object.entries(c)
    .map(([k, n]) => `${k} ${n}`)
    .join(' · ');
});

const runAudit = () => {
  const scene = store.sceneApi?.scene;
  if (!scene) {
    ElMessage.warning('Scene not ready');
    return;
  }
  const r = auditScene(scene);
  parts.value = r.parts;
  gaps.value = r.gaps;
  islandNote.value = r.islandNote;
  scanned.value = true;
};

const pick = (uuid: string) => {
  store.setCurrentTransformMaterialUuid(uuid);
  store.sceneApi?.chooseMaterial({ uuid } as { uuid: string });
  store.setTransformMaterialRandomId();
};

const needObj = () => {
  const scene = store.sceneApi?.scene;
  if (!scene) return null;
  return selectedObject(scene, store.currentTransformMaterialUuid);
};

const stampNpc = () => {
  const o = needObj();
  if (!o) return ElMessage.warning('Select a unit');
  applyNpcRole(o, npcRole.value);
  runAudit();
  ElMessage.success(`${o.name} → ${npcRole.value}`);
};

const stampAnimal = () => {
  const o = needObj();
  if (!o) return ElMessage.warning('Select a creature');
  applyAnimalRole(o, animalRole.value);
  runAudit();
  ElMessage.success(`${o.name} → ${animalRole.value}`);
};

const stampLayer = () => {
  const o = needObj();
  if (!o) return ElMessage.warning('Select a mesh');
  stampContentLayer(o, layerId.value);
  if (layerId.value === 'harvestable') {
    if (/tree|pine|oak|lumber/i.test(o.name)) o.userData.harvestKind = 'wood';
    else if (/ore|vein|crystal/i.test(o.name)) o.userData.harvestKind = 'ore';
    else if (/rock|stone|boulder/i.test(o.name))
      o.userData.harvestKind = 'stone';
  }
  runAudit();
};

const applyGap = (g: SceneGap) => {
  const scene = store.sceneApi?.scene;
  if (!scene) return;
  if (g.fix === 'stamp-player') {
    const o = needObj();
    if (!o) return ElMessage.warning('Select the character to play as');
    setPlayAs(scene, o);
    ElMessage.success(`Play as ${o.name}`);
  } else if (g.fix === 'stamp-water') {
    const o = needObj();
    if (!o) return ElMessage.warning('Select the water mesh');
    stampContentLayer(o, 'water');
  } else if (g.fix === 'stamp-harvest') {
    layerId.value = 'harvestable';
    stampLayer();
    return;
  } else if (g.fix === 'add-npc') {
    ElMessage.info('Drop a unit or Enemy camp, then set vendor / ally / enemy');
  } else if (g.fix === 'add-hud') {
    ElMessage.info('Open left tab 2D/UI and apply an RPG/MMO kit');
  }
  runAudit();
};

runAudit();
</script>
<style lang="scss" scoped src="./index.scss"></style>
