<template>
  <el-scrollbar max-height="calc(100vh - 120px)">
    <div class="systems-panel">
      <div class="block-title">Warlords dressing room</div>
      <p class="hint">
        Editor + play bake lives here. Character create is Foundry. Anim
        language + Showcase Anims stay on Casting. Same
        <code>anims/baked</code> JSON for Open / Multiverse / ThreeFlow. Play-as
        a captain, bind pack, then play library clips. Play mode seeds the MMO
        HUD (1920×1080).
      </p>
      <p class="hint">
        <a
          href="https://casting.grudge-studio.com"
          target="_blank"
          rel="noreferrer"
          >Casting lab</a
        >
        ·
        <a
          href="https://character.grudge-studio.com/foundry"
          target="_blank"
          rel="noreferrer"
          >Foundry</a
        >
        ·
        <a
          href="https://ui.grudge-studio.com/main-panel.html?era=warlords"
          target="_blank"
          rel="noreferrer"
          >Main panel HUD</a
        >
      </p>

      <div class="block-title">World</div>
      <div class="row wrap">
        <el-button size="small" @click="createEmpty">Empty</el-button>
        <el-button size="small" @click="createHaven">Haven Shore</el-button>
        <el-button size="small" @click="createPirate">Pirate lobby</el-button>
        <el-button size="small" type="primary" @click="createSeafloor">
          Seafloor 3×3 + islands
        </el-button>
      </div>
      <p class="hint">
        DS2 nine cells are the seafloor topology. Islands + biomes spawn on
        those cells. Water at 0. Header Play on open water sails with wind.
      </p>

      <div class="block-title">Aethermoor · 9 sectors</div>
      <p class="hint">
        Seed {{ worldSeed }} · cell {{ sectorM }} m · weld −10 / water 0. Pins
        are the hand-placed islands (generative spawn with the seafloor).
      </p>
      <div class="world-grid">
        <button
          v-for="cell in worldCells"
          :key="cell.sectorId"
          type="button"
          class="world-cell"
          :class="{ 'is-on': selectedSector === cell.sectorId }"
          @click="selectedSector = cell.sectorId"
        >
          <img :src="cell.thumb" alt="" />
          <span>{{ cell.label }}</span>
          <em>{{ cell.count }} isl</em>
        </button>
      </div>
      <ul class="island-list" v-if="selectedPack">
        <li v-for="isle in selectedPack.islands" :key="isle.id">
          <b>{{ isle.name }}</b>
          <span
            >{{ isle.radius }} m · {{ isle.elevation }} m ·
            {{ isle.islandKind }}</span
          >
        </li>
      </ul>
      <p class="hint" v-if="selectedKit">
        Kit {{ selectedKit.biome }} · DS2 {{ selectedKit.ds2Preset }} · trees
        {{ selectedKit.trees.length }} · rocks {{ selectedKit.rocks.length }} ·
        wildlife {{ selectedKit.wildlife.join(', ') || 'none' }}
      </p>
      <ul class="island-list" v-if="selectedKit">
        <li v-for="t in selectedKit.trees" :key="t">
          <b>tree</b>
          <span>{{ t.split('/').pop() }}</span>
        </li>
        <li v-for="t in selectedKit.rocks" :key="t">
          <b>rock</b>
          <span>{{ t.split('/').pop() }}</span>
        </li>
      </ul>

      <div class="block-title">Map-wide mesh layers</div>
      <p class="hint">
        Same 2000 m studio brick as y=0. Set the selected plane’s Layer in the
        inspector, or stack more: terrain · water · seafloor · lava · quicksand
        · void. Void is not walkable (fall forever). Water is Swim, not a foot
        floor.
      </p>
      <div class="row wrap">
        <el-button
          v-for="id in MAP_SURFACE_LAYERS"
          :key="id"
          size="small"
          @click="addMapSurface(id)"
        >
          + {{ id }}
        </el-button>
      </div>
      <ul class="island-list" v-if="mapSurfaces.length">
        <li v-for="s in mapSurfaces" :key="s.uuid">
          <b>{{ s.name }}</b>
          <span>{{ s.layer }} · y={{ s.y }}</span>
        </li>
      </ul>

      <div class="block-title">Content layers · size / scale / render</div>
      <p class="hint">
        Select a layer to pick those assets. Scale is SI multiplier (1 = author
        metres). Phys stays Forge: Terrain · Player · NPC · Item · Projectile ·
        Water.
      </p>
      <div class="layer-table">
        <div class="layer-head">
          <span>Layer</span><span>n</span><span>vis</span><span>scale</span
          ><span>shadow</span>
        </div>
        <div class="layer-row" v-for="l in CONTENT_LAYERS" :key="l.id">
          <button
            type="button"
            class="layer-name"
            :title="l.detail"
            @click="selectLayer(l.id)"
          >
            {{ l.label }}
            <em>{{ l.phys }} · {{ l.siHeightM }}m</em>
          </button>
          <span>{{ counts[l.id] || 0 }}</span>
          <el-switch
            size="small"
            :model-value="layerRender[l.id].visible"
            @change="(v: boolean) => setLayerField(l.id, 'visible', v)"
          />
          <el-input-number
            size="small"
            :model-value="layerRender[l.id].scale"
            :min="0.1"
            :max="10"
            :step="0.1"
            :controls="false"
            style="width: 52px"
            @change="(v: number) => setLayerField(l.id, 'scale', v || 1)"
          />
          <el-switch
            size="small"
            :model-value="layerRender[l.id].castShadow"
            @change="(v: boolean) => setLayerField(l.id, 'castShadow', v)"
          />
        </div>
      </div>
      <div class="row">
        <span class="lbl">Stamp</span>
        <el-select v-model="contentLayer" size="small" style="width: 140px">
          <el-option
            v-for="l in CONTENT_LAYERS"
            :key="l.id"
            :label="l.label"
            :value="l.id"
          />
        </el-select>
        <el-button size="small" type="primary" @click="doStampLayer">
          Assign layer
        </el-button>
      </div>
      <div class="row wrap">
        <span class="lbl">Prefab</span>
        <el-select v-model="prefabKind" size="small" style="width: 120px">
          <el-option label="structure" value="structure" />
          <el-option label="unit" value="unit" />
          <el-option label="vehicle" value="vehicle" />
          <el-option label="siege" value="siege" />
          <el-option label="mount" value="mount" />
        </el-select>
        <el-button size="small" type="primary" @click="saveAsPrefab">
          Save as prefab
        </el-button>
      </div>
      <p class="hint">
        Editor recipe only (this SPA). Drop again from Prefabs folder. Railway
        still owns bag / island.
      </p>

      <div class="block-title">Play as</div>
      <p class="hint">Pick the player-layer character, then header Play.</p>
      <div class="row">
        <el-select
          v-model="playAsUuid"
          size="small"
          style="width: 200px"
          placeholder="Player-layer character"
        >
          <el-option
            v-for="p in playables"
            :key="p.uuid"
            :label="p.playAs ? `${p.name} · playing` : p.name"
            :value="p.uuid"
          />
        </el-select>
      </div>
      <div class="row wrap">
        <el-button size="small" type="primary" @click="doPlayAs"
          >Play as</el-button
        >
      </div>
      <p class="log" v-if="playAsName">Playing as {{ playAsName }}</p>

      <div class="block-title">Terrain looks · nav · colliders</div>
      <p class="hint">
        Look tropical / mountain binds GrassField on the real mesh
        (area-weighted blades + shared dirt). Seafloor is look only — no grass.
        Harvest stays nodes. Nav / heightfield ignore blades.
      </p>
      <div class="row wrap">
        <el-button
          v-for="look in TERRAIN_LOOKS"
          :key="look"
          size="small"
          @click="doTerrainLook(look)"
        >
          Look {{ look }}
        </el-button>
      </div>
      <p class="hint">
        Cortiz demo seasons recolor the same GrassField + sky. Atmosphere
        (header World) adds sparkles / ripples / sky.
      </p>
      <div class="row wrap">
        <el-button
          v-for="season in GRASS_SEASONS"
          :key="season"
          size="small"
          @click="doSeason(season)"
        >
          {{ season }}
        </el-button>
      </div>
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
        threejs-games
        <a
          href="https://threejs-games.github.io/examples/70-ai/"
          target="_blank"
          >70-ai</a
        >
        idle / wander / patrol / follow / pursue. Yuka steers the root — one
        mixer on the kit.
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

      <div class="block-title">MMO · aggro / threat / cast</div>
      <p class="hint">
        Rings from Warlords <code>AGGRO_CONFIG</code> (25 / 15 / 30 / 50 m).
        Threat table + cast clock + telegraph (aoe / cone / incoming). Play
        authority stays GrudgeBuilder.
      </p>
      <div class="row">
        <span class="lbl">Warn</span>
        <el-select v-model="telegraph" size="small" style="width: 140px">
          <el-option label="cone" value="cone" />
          <el-option label="aoe" value="aoe" />
          <el-option label="incoming" value="incoming" />
        </el-select>
      </div>
      <div class="row wrap">
        <el-button size="small" type="primary" @click="doMmoStamp">
          Stamp MMO combat
        </el-button>
        <el-button size="small" @click="doAggroRings">Aggro rings</el-button>
        <el-button size="small" @click="doTelegraph">Cast telegraph</el-button>
        <el-button size="small" @click="doThreat">Threat preview</el-button>
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
import {
  AI_BRAINS,
  CONTENT_LAYERS,
  MAP_SURFACE_LAYERS,
  isMapSurfaceLayer,
  type MapSurfaceLayerId,
  PHYS_BODIES,
  PHYS_LAYERS,
  PHYS_SHAPES,
  PIRATE_LOBBY_URL,
  GRASS_SEASONS,
  TERRAIN_LOOKS,
  WORLD_STACK,
  type BrainKind,
  type GrassSeasonId,
  type TerrainLookId,
  type ContentLayerId,
  type PhysBody,
  type PhysLayer,
  type PhysShape,
} from '@/config/fleetSystems';
import {
  applyLayerRender,
  getPlayAs,
  layerCounts,
  listPlayables,
  loadLayerRender,
  objectsOnLayer,
  saveLayerRender,
  setPlayAs,
  stampContentLayer,
  type LayerRenderState,
} from '@/utils/contentLayers';
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
import { applyGrassPreset } from '@/utils/grassField';
import { applySkyMood } from '@/utils/worldAtmosphere';
import { applyTerrainLook, isHarvestNode } from '@/utils/terrainLook';
import {
  isMapSurfaceObject,
  listMapSurfaces,
  spawnMapSurface,
  stampMapSurface,
} from '@/utils/mapSurface';
import { stampWarlordsPrefab, type PrefabKind } from '@/utils/prefabStamp';
import { saveEditorPrefab, slugEditorPrefabId } from '@/utils/editorPrefabs';
import { assetUrl } from '@/config/assetApi';
import { HD_SECTOR_TARGETS, SEAFLOOR_GRID } from '@/config/hdTerrainDeploy';
import { packForSector } from '@/config/worldIslands';
import { kitForSector } from '@/config/sectorKits';
import { minimapUrl } from '@/config/sectorMinimaps';
import { MODEL_TYPE } from '@/enums/enum';
import { CAST_DEFAULTS, type TelegraphVariant } from '@/config/mmoCombat';
import {
  previewCast,
  previewThreat,
  showAggroRings,
  showTelegraph,
  stampMmoCombat,
} from '@/utils/mmoCombatRuntime';

const store = useSceneStore();
const indexDbStore = useIndexDbStore();
const layer = ref<PhysLayer>('Terrain');
const contentLayer = ref<ContentLayerId>('terrain');
const prefabKind = ref<PrefabKind>('structure');
const playAsUuid = ref('');
const playables = ref<{ uuid: string; name: string; playAs: boolean }[]>([]);
const playAsName = computed(
  () => playables.value.find((p) => p.playAs)?.name || ''
);
const layerRender = ref(loadLayerRender());
const counts = ref(layerCounts(new THREE.Scene()));
const body = ref<PhysBody>('fixed');
const shape = ref<PhysShape>('heightfield');
const brain = ref<BrainKind>('patrol');
const telegraph = ref<TelegraphVariant>('cone');
const log = ref('');
const worldSeed = WORLD_STACK.worldSeed;
const sectorM = WORLD_STACK.sectorTileM;
const selectedSector = ref('haven_shore');
const worldCells = computed(() =>
  SEAFLOOR_GRID.flat().map((id) => {
    const pack = packForSector(id);
    return {
      sectorId: id,
      label: pack?.name || id.replace(/_/g, ' '),
      thumb: minimapUrl(id),
      count: pack?.islands.length || 0,
    };
  })
);
const selectedPack = computed(() => packForSector(selectedSector.value));
const selectedKit = computed(() => kitForSector(selectedSector.value));
const stats = ref({ terrains: 0, colliders: 0, brains: 0, bvh: 0 });
const mapSurfaces = ref<
  { uuid: string; name: string; layer: string; y: string }[]
>([]);

const brainDetail = computed(
  () => AI_BRAINS.find((b) => b.id === brain.value)?.detail || ''
);

const refresh = () => {
  const scene = store.sceneApi?.scene;
  if (scene) {
    stats.value = listStamped(scene);
    counts.value = layerCounts(scene);
    mapSurfaces.value = listMapSurfaces(scene).map((o) => ({
      uuid: o.uuid,
      name: o.name || 'map',
      layer: String(o.userData.contentLayer || 'terrain'),
      y: o.position.y.toFixed(2),
    }));
    playables.value = listPlayables(scene).map((o) => ({
      uuid: o.uuid,
      name: o.name || o.uuid.slice(0, 8),
      playAs: o.userData.playAs === true,
    }));
    const active = getPlayAs(scene);
    if (active) playAsUuid.value = active.uuid;
  }
};

const pushLayers = () => {
  saveLayerRender(layerRender.value);
  const scene = store.sceneApi?.scene;
  if (scene) applyLayerRender(scene, layerRender.value);
};

const setLayerField = (
  id: ContentLayerId,
  key: keyof LayerRenderState,
  value: boolean | number
) => {
  layerRender.value[id] = { ...layerRender.value[id], [key]: value };
  pushLayers();
};

const addMapSurface = async (id: MapSurfaceLayerId) => {
  const scene = store.sceneApi?.scene;
  if (!scene) {
    ElMessage.warning('Scene not ready');
    return;
  }
  const mesh = await spawnMapSurface(scene, id);
  applyLayerRender(scene, loadLayerRender());
  store.sceneApi?.setObjectHighlight?.(mesh);
  refresh();
  log.value = `map surface ${mesh.name} · ${id} · y=${mesh.position.y}`;
  ElMessage.success(`${id} plane · y=${mesh.position.y}`);
};

const saveAsPrefab = () => {
  const picked = needSelected();
  if (!picked) return;
  const obj = picked.obj;
  const filePath = String(
    obj.userData.r2Key ? assetUrl(obj.userData.r2Key) : ''
  );
  if (!filePath || filePath.includes('undefined')) {
    ElMessage.warning(
      'Selected mesh has no CDN r2Key — drop a library asset first'
    );
    return;
  }
  const id = slugEditorPrefabId(obj.name);
  stampWarlordsPrefab(obj, {
    prefabId: id,
    prefabKind: prefabKind.value,
    siHeightM: Number(obj.userData.siHeightM) || undefined,
  });
  saveEditorPrefab({
    id,
    name: obj.name || id,
    prefabKind: prefabKind.value,
    filePath,
    r2Key: obj.userData.r2Key,
    siHeightM: Number(obj.userData.siHeightM) || 1.8,
    contentLayer: String(obj.userData.contentLayer || contentLayer.value),
    harvestKind: obj.userData.harvestKind,
    playScript: obj.userData.playScript,
    meshName: obj.userData.meshName,
  });
  ElMessage.success(`Prefab ${id} — refresh library / Prefabs folder`);
  log.value = `saved prefab ${id}`;
};

const doStampLayer = () => {
  const picked = needSelected();
  if (!picked) return;
  if (isMapSurfaceObject(picked.obj) && isMapSurfaceLayer(contentLayer.value)) {
    stampMapSurface(picked.obj, contentLayer.value);
  } else {
    stampContentLayer(picked.obj, contentLayer.value);
  }
  if (contentLayer.value === 'player' && !getPlayAs(picked.scene)) {
    setPlayAs(picked.scene, picked.obj);
  }
  pushLayers();
  refresh();
  log.value = `${picked.obj.name} → ${contentLayer.value}`;
};

const doPlayAs = () => {
  const scene = needScene();
  if (!scene) return;
  const api = store.sceneApi as {
    playAsSelected?: (id?: string) => { ok: boolean; name: string };
  };
  const playId = playAsUuid.value || store.currentTransformMaterialUuid || null;
  const r = api.playAsSelected?.(playId ?? undefined);
  if (!r?.ok) {
    ElMessage.warning(
      'Select a Player-layer character (or stamp Player first)'
    );
    return;
  }
  store.setCurrentTransformMaterialUuid(playId);
  store.setTransformMaterialRandomId();
  refresh();
  ElMessage.success(`Play as ${r.name}`);
};

const selectLayer = (id: ContentLayerId) => {
  const scene = needScene();
  if (!scene) return;
  if (id === 'player') {
    const active = getPlayAs(scene);
    const list = listPlayables(scene);
    const pick = active || list[0];
    if (!pick) {
      ElMessage.info('Player layer empty — drop a captain or stamp Player');
      return;
    }
    store.setCurrentTransformMaterialUuid(pick.uuid);
    store.setTransformMaterialRandomId();
    playAsUuid.value = pick.uuid;
    log.value = `Player roster ${list.length} · play as ${pick.name}`;
    return;
  }
  const list = objectsOnLayer(scene, id);
  if (!list.length) {
    ElMessage.info(`${id} — empty`);
    return;
  }
  store.setCurrentTransformMaterialUuid(list[0].uuid);
  store.setTransformMaterialRandomId();
  log.value = `${id} · ${list.length} selected (first ${list[0].name})`;
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

const createSeafloor = async () => {
  const api = store.sceneApi as {
    spawnLayerPrefab?: (
      s: string,
      x: number,
      y: number,
      cb?: (p: number, m: string) => void
    ) => Promise<unknown>;
  } | null;
  if (!api?.spawnLayerPrefab) return;
  try {
    await api.spawnLayerPrefab(
      'prefab://seafloor-grid',
      window.innerWidth * 0.5,
      window.innerHeight * 0.5,
      (pct, msg) => {
        log.value = `${Math.round(pct)}% ${msg}`;
      }
    );
    refresh();
    ElMessage.success(
      'DS2 seafloor 3×3 + biome islands · water 0 · wind sail in Play'
    );
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : 'Seafloor failed');
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
        islandKind: 'static',
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

const doTerrainLook = (look: TerrainLookId) => {
  const picked = needSelected();
  if (!picked) return;
  if (isHarvestNode(picked.obj) && !picked.obj.userData.isTerrain) {
    ElMessage.warning(
      'Pick seafloor / mountain / tropical terrain — not a harvest node'
    );
    return;
  }
  applyTerrainLook(picked.obj, look);
  refresh();
  log.value = `${picked.obj.name} → ${look} look / heightfield / nav`;
  ElMessage.success(log.value);
};

const doSeason = (season: GrassSeasonId) => {
  applyGrassPreset(season);
  applySkyMood(season);
  log.value = `GrassField + sky → ${season}`;
  ElMessage.success(log.value);
};

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

const doMmoStamp = () => {
  const picked = needSelected();
  if (!picked) return;
  const castTime =
    telegraph.value === 'incoming'
      ? CAST_DEFAULTS.spellCastSec
      : CAST_DEFAULTS.meleeTelegraphSec;
  stampMmoCombat(picked.obj, {
    telegraph: telegraph.value,
    telegraphSec: castTime,
    castTimeSec: castTime,
    range:
      telegraph.value === 'incoming' ? 14 : telegraph.value === 'aoe' ? 5 : 6,
    skillId: telegraph.value === 'incoming' ? 'bolt' : 'basic_swing',
  });
  log.value = previewCast(picked.obj);
  ElMessage.success('MMO combat stamped');
};

const doAggroRings = () => {
  const picked = needSelected();
  if (!picked) return;
  stampMmoCombat(picked.obj, { telegraph: telegraph.value });
  log.value = showAggroRings(picked.scene, picked.obj);
  ElMessage.info(log.value);
};

const doTelegraph = () => {
  const picked = needSelected();
  if (!picked) return;
  stampMmoCombat(picked.obj, { telegraph: telegraph.value });
  const r = showTelegraph(picked.scene, picked.obj);
  log.value = r.label;
  ElMessage.info(r.label);
};

const doThreat = () => {
  const picked = needSelected();
  if (!picked) return;
  stampMmoCombat(picked.obj, { telegraph: telegraph.value });
  const others: THREE.Object3D[] = [];
  picked.scene.traverse((o) => {
    if (o !== picked.obj && (o.userData?.aiBrain || o.userData?.behavior)) {
      others.push(o);
    }
  });
  const r = previewThreat(picked.obj, others);
  log.value = `top ${r.top} · ${r.rows.join(' | ') || 'seeded player 80'}`;
  ElMessage.info(log.value);
};

refresh();
</script>
<style lang="scss" scoped src="./index.scss"></style>
