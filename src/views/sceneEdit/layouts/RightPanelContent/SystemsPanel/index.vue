<template>
  <el-scrollbar max-height="calc(100vh - 120px)">
    <div class="systems-panel">
      <div class="block-title">Scene create</div>
      <div class="row wrap">
        <el-button size="small" @click="createEmpty">Empty</el-button>
        <el-button size="small" @click="createHaven">Haven Shore</el-button>
        <el-button size="small" @click="createPirate">Pirate lobby</el-button>
        <el-button size="small" type="primary" @click="openForge">
          Open in Forge
        </el-button>
      </div>
      <p class="hint">
        Empty / HD / pirate stay in this editor. Full .gfscene physics + scripts
        open on forge.grudge-studio.com — not a second Forge.
      </p>

      <div class="block-title">Terrain · colliders · nav</div>
      <div class="stats">
        terrain {{ stats.terrains }} · collider {{ stats.colliders }} · BVH
        {{ stats.bvh }} · brain {{ stats.brains }}
      </div>
      <div class="row wrap">
        <el-button size="small" @click="doSnap">Asset to ground</el-button>
        <el-button size="small" @click="doBvh">Bake BVH</el-button>
        <el-button size="small" @click="doNav">Bake nav zone</el-button>
        <el-button size="small" @click="doPath">Preview path</el-button>
        <el-button size="small" @click="doClear">Clear helpers</el-button>
      </div>

      <div class="row">
        <span class="lbl">Layer</span>
        <el-select v-model="layer" size="small" style="width: 140px">
          <el-option v-for="l in PHYS_LAYERS" :key="l" :label="l" :value="l" />
        </el-select>
      </div>
      <div class="row">
        <span class="lbl">Body</span>
        <el-select v-model="body" size="small" style="width: 140px">
          <el-option v-for="b in PHYS_BODIES" :key="b" :label="b" :value="b" />
        </el-select>
      </div>
      <div class="row">
        <span class="lbl">Shape</span>
        <el-select v-model="shape" size="small" style="width: 140px">
          <el-option v-for="s in PHYS_SHAPES" :key="s" :label="s" :value="s" />
        </el-select>
      </div>
      <div class="row wrap">
        <el-button size="small" type="primary" @click="doCollider">
          Stamp collider
        </el-button>
        <el-button size="small" @click="doRapier">Rapier preview</el-button>
      </div>

      <div class="block-title">AI brains</div>
      <p class="hint">
        Same Forge <code>behavior</code> ids. Preview uses Yuka on the root —
        one mixer stays on the kit.
      </p>
      <div class="row">
        <el-select v-model="brain" size="small" style="width: 200px">
          <el-option
            v-for="b in AI_BRAINS"
            :key="b.id"
            :label="b.label"
            :value="b.id"
          />
        </el-select>
      </div>
      <p class="hint">{{ brainDetail }}</p>
      <div class="row wrap">
        <el-button size="small" type="primary" @click="doBrain">
          Stamp brain
        </el-button>
        <el-button size="small" @click="doBrainPreview">Preview 6s</el-button>
      </div>

      <div class="block-title">Best practices</div>
      <div class="row">
        <el-select v-model="practiceCtx" size="small" style="width: 160px">
          <el-option
            v-for="c in practiceKeys"
            :key="c"
            :label="c"
            :value="c"
          />
        </el-select>
      </div>
      <div class="practice" v-for="p in practices" :key="p.title">
        <strong>{{ p.title }}</strong>
        <span>{{ p.detail }}</span>
      </div>

      <div class="block-title">Fleet deps</div>
      <div class="practice" v-for="d in FLEET_DEPS" :key="d.name">
        <strong>{{ d.name }} {{ d.pin }}</strong>
        <span>{{ d.role }}</span>
      </div>
      <p class="log" v-if="log">{{ log }}</p>
    </div>
  </el-scrollbar>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import * as THREE from 'three';
import { useSceneStore } from '@/store/sceneEditStore';
import { useIndexDbStore } from '@/store/indexDbStore';
import { IndexDbStoreName } from '@/enums/indexDb';
import { popoutFleet, STUDIO_FORGE_EDITOR } from '@/config/branding';
import {
  AI_BRAINS,
  BEST_PRACTICES,
  FLEET_DEPS,
  PHYS_BODIES,
  PHYS_LAYERS,
  PHYS_SHAPES,
  PIRATE_LOBBY_URL,
  type BrainKind,
  type PhysBody,
  type PhysLayer,
  type PhysShape,
  type PracticeContext,
} from '@/config/fleetSystems';
import {
  bakeNavFromTerrain,
  bakeRapierPreview,
  bakeTerrainBvh,
  clearSystemHelpers,
  listStamped,
  previewBrain,
  previewNavPath,
  selectedObject,
  stampBrain,
  stampCollider,
} from '@/utils/systemsRuntime';
import { HD_SECTOR_TARGETS } from '@/config/hdTerrainDeploy';
import { MODEL_TYPE } from '@/enums/enum';

const store = useSceneStore();
const indexDbStore = useIndexDbStore();
const layer = ref<PhysLayer>('Terrain');
const body = ref<PhysBody>('fixed');
const shape = ref<PhysShape>('trimesh');
const brain = ref<BrainKind>('patrol');
const practiceCtx = ref<PracticeContext>('physics');
const log = ref('');
const stats = ref({ terrains: 0, colliders: 0, brains: 0, bvh: 0 });

const practiceKeys = Object.keys(BEST_PRACTICES) as PracticeContext[];
const practices = computed(() => BEST_PRACTICES[practiceCtx.value]);
const brainDetail = computed(
  () => AI_BRAINS.find((b) => b.id === brain.value)?.detail || ''
);

const refresh = () => {
  const scene = store.sceneApi?.scene;
  if (scene) stats.value = listStamped(scene);
};

const needScene = () => {
  const scene = store.sceneApi?.scene;
  if (!scene) {
    ElMessage.warning('Scene not ready');
    return null;
  }
  return scene;
};

const needSelected = () => {
  const scene = needScene();
  if (!scene) return null;
  const obj = selectedObject(scene, store.currentTransformMaterialUuid);
  if (!obj) {
    ElMessage.warning('Select a mesh first');
    return null;
  }
  return { scene, obj };
};

const createEmpty = () => {
  ElMessageBox.confirm('Clear the current scene?', 'New scene', {
    type: 'warning',
  })
    .then(() => {
      store.sceneApi?.renderDestroy();
      indexDbStore.indexDbUtil?.clear(IndexDbStoreName.scene);
      window.location.reload();
    })
    .catch(() => {});
};

const createHaven = async () => {
  const api = store.sceneApi;
  if (!api?.loadHdTerrain) return;
  const target = HD_SECTOR_TARGETS.find((s) => s.id === 'haven_shore');
  try {
    await api.loadHdTerrain(
      'zone',
      window.innerWidth * 0.5,
      window.innerHeight * 0.5,
      'haven_shore',
      undefined,
      'edit',
      {
        sectorId: 'haven_shore',
        terrainId: 'haven_shore',
        playUrl: target?.playUrl,
      }
    );
    refresh();
    ElMessage.success('Haven Shore HD terrain stamped');
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : 'Terrain failed');
  }
};

const createPirate = async () => {
  const api = store.sceneApi;
  if (!api?.loadModel) return;
  try {
    await api.loadModel(
      PIRATE_LOBBY_URL,
      MODEL_TYPE.GLB,
      window.innerWidth * 0.5,
      window.innerHeight * 0.5,
      'pirate-islands',
      {
        group: 'scenes',
        sectorId: 'pirate-islands',
        terrainId: 'chicken_gun_pirate_lobby',
        isTerrain: true,
        playUrl:
          'https://grudgewarlords.com/island-3d?mode=lobby&map=pirate-islands',
      }
    );
    refresh();
    ElMessage.success('Pirate lobby loaded as terrain');
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : 'Lobby failed');
  }
};

const openForge = () => popoutFleet(STUDIO_FORGE_EDITOR, 'grudge-forge');

const doSnap = () => {
  const r = store.sceneApi?.snapSelectedToGround();
  log.value = r?.ok ? `ground ${r.terrainId}` : 'no selection / no snap';
  if (r?.ok) ElMessage.success(`Grounded on ${r.terrainId}`);
};

const doBvh = async () => {
  const scene = needScene();
  if (!scene) return;
  const n = await bakeTerrainBvh(scene);
  refresh();
  log.value = `BVH on ${n} terrain meshes`;
  ElMessage.success(log.value);
};

const doNav = async () => {
  const scene = needScene();
  if (!scene) return;
  const r = await bakeNavFromTerrain(scene);
  log.value = r.ok ? `nav zone ${r.verts} verts` : r.reason || 'nav failed';
  if (r.ok) ElMessage.success(log.value);
  else ElMessage.warning(log.value);
};

const doPath = () => {
  const picked = needSelected();
  if (!picked) return;
  const end = new THREE.Vector3();
  picked.obj.getWorldPosition(end);
  end.x += 12;
  end.z += 8;
  const n = previewNavPath(picked.scene, picked.obj, end);
  log.value = n ? `path ${n} pts` : 'no path — bake nav first';
  ElMessage.info(log.value);
};

const doCollider = () => {
  const picked = needSelected();
  if (!picked) return;
  stampCollider(picked.obj, layer.value, body.value, shape.value);
  refresh();
  log.value = `${picked.obj.name} ${layer.value}/${body.value}/${shape.value}`;
  ElMessage.success('Collider stamped');
};

const doRapier = async () => {
  const scene = needScene();
  if (!scene) return;
  try {
    const r = await bakeRapierPreview(scene);
    log.value = `Rapier world ${r.bodies} bodies`;
    ElMessage.success(log.value);
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : 'Rapier init failed');
  }
};

const doBrain = () => {
  const picked = needSelected();
  if (!picked) return;
  stampBrain(picked.obj, brain.value);
  refresh();
  log.value = `${picked.obj.name} behavior=${brain.value}`;
  ElMessage.success('Brain stamped');
};

const doBrainPreview = async () => {
  const picked = needSelected();
  if (!picked) return;
  stampBrain(picked.obj, brain.value);
  const msg = await previewBrain(picked.scene, picked.obj, brain.value);
  log.value = msg;
  ElMessage.info(msg);
};

const doClear = () => {
  const scene = needScene();
  if (!scene) return;
  clearSystemHelpers(scene);
  log.value = 'helpers cleared';
};

refresh();
</script>
<style lang="scss" scoped src="./index.scss"></style>
