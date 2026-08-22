<template>
  <div v-if="open" class="world-map" @keydown.esc="close">
    <header class="wm-head">
      <div>
        <h2>{{ meta.name }}</h2>
        <p>
          seed {{ meta.seed }} · {{ meta.cellM }} m cells · seafloor
          {{ meta.seafloorY }} · weld {{ meta.weldY }} · water {{ meta.waterY }}
        </p>
      </div>
      <button type="button" class="wm-x" @click="close">Close</button>
    </header>

    <div class="wm-body">
      <aside class="wm-rail">
        <h3>Play</h3>
        <button
          v-for="d in dests"
          :key="d.id"
          type="button"
          class="wm-dest"
          :class="{ 'is-on': selected === d.id }"
          @click="pickDest(d)"
        >
          <img :src="d.thumb" alt="" />
          <div>
            <b>{{ d.label }}</b>
            <span>{{ d.detail }}</span>
          </div>
        </button>
        <h3>Events</h3>
        <button
          v-for="e in events"
          :key="e.id"
          type="button"
          class="wm-evt"
          @click="sailEvent(e)"
        >
          <b>{{ e.name }}</b>
          <span>{{ e.sectorId.replace(/_/g, ' ') }} · {{ e.schedule }}</span>
        </button>
      </aside>

      <div class="wm-grid">
        <button
          v-for="cell in cells"
          :key="cell.sectorId"
          type="button"
          class="wm-cell"
          :class="{ 'is-on': selected === cell.sectorId }"
          @click="sailSector(cell.sectorId)"
        >
          <img :src="cell.thumb" alt="" />
          <div class="wm-cell-cap">
            <strong>{{ cell.name }}</strong>
            <em
              >{{ cell.biome }} · {{ cell.islands.length }} islands ·
              {{ cell.events.length }} evt</em
            >
          </div>
          <i
            v-for="isle in cell.islands"
            :key="isle.id"
            class="wm-pin"
            :class="'k-' + isle.islandKind"
            :style="pinStyle(isle.localPos)"
            :title="isle.name"
          />
          <i
            v-for="ev in cell.events"
            :key="ev.id"
            class="wm-pin ev"
            :style="pinStyle([5000, 4200])"
            :title="ev.name"
          />
        </button>
      </div>
    </div>

    <footer class="wm-foot">
      Sector plates sail open water (wind). Pins are islands on that DS2 cell.
      Home / Pirate still load their island GLBs.
    </footer>
  </div>
</template>
<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { MITT_ON_KEY } from '@/enums/enum';
import { getCurrentInstance } from 'vue';
import { useSceneStore } from '@/store/sceneEditStore';
import {
  fetchLiveEvents,
  MAP_DESTINATIONS,
  WORLD_MAP_META,
  destWorldPos,
  worldMapCells,
  type MapDestination,
  type WorldEventPin,
} from '@/config/worldMap';
import { MODEL_TYPE } from '@/enums/enum';
import { ASSETS_CDN } from '@/config/assetApi';

const open = ref(false);
const selected = ref('open-sea');
const dests = MAP_DESTINATIONS;
const cells = worldMapCells();
const events = ref<WorldEventPin[]>([]);
const meta = WORLD_MAP_META;
const store = useSceneStore();
const { $eventBus } = getCurrentInstance()?.proxy || {};

const pinStyle = (local: [number, number]) => ({
  left: `${(local[0] / meta.cellM) * 100}%`,
  top: `${(local[1] / meta.cellM) * 100}%`,
});

const close = () => {
  open.value = false;
};

const ensureSea = async (look?: { x: number; y: number; z: number }) => {
  const api = store.sceneApi as {
    openSeaPlay?: (look?: {
      x: number;
      y: number;
      z: number;
    }) => Promise<string>;
  } | null;
  if (!api?.openSeaPlay) {
    ElMessage.warning('Scene not ready');
    return;
  }
  const msg = await api.openSeaPlay(look);
  ElMessage.success(msg);
};

const sailSector = async (sectorId: string) => {
  selected.value = sectorId;
  await ensureSea(destWorldPos(sectorId));
  close();
};

const sailEvent = async (e: WorldEventPin) => {
  selected.value = e.id;
  await ensureSea(destWorldPos(e.sectorId, [5000, 4200]));
  close();
};

const pickDest = async (d: MapDestination) => {
  selected.value = d.id;
  const api = store.sceneApi;
  if (!api) return;
  if (d.kind === 'sea') {
    await ensureSea(destWorldPos('convergence_nexus'));
    close();
    return;
  }
  if (d.kind === 'home' && d.model && api.loadModel) {
    await api.loadModel(
      `${ASSETS_CDN}/${d.model}`,
      MODEL_TYPE.GLB,
      window.innerWidth * 0.5,
      window.innerHeight * 0.5,
      'home-island',
      {
        group: 'islands',
        terrainId: 'home-island',
        isTerrain: true,
        islandKind: 'static',
        contentLayer: 'terrain',
      }
    );
    ElMessage.success('Home island stamped · 1024 m');
    close();
    return;
  }
  if (d.kind === 'lobby' && d.model && api.loadModel) {
    await api.loadModel(
      `${ASSETS_CDN}/${d.model}`,
      MODEL_TYPE.GLB,
      window.innerWidth * 0.5,
      window.innerHeight * 0.5,
      'pirate-islands',
      {
        group: 'scenes',
        sectorId: 'convergence_nexus',
        terrainId: 'chicken_gun_pirate_lobby',
        isTerrain: true,
        islandKind: 'static',
        playUrl: d.playUrl,
      }
    );
    ElMessage.success('Pirate lobby stamped');
    close();
  }
};

const onKey = (ev: KeyboardEvent) => {
  const t = ev.target as HTMLElement | null;
  if (t && /input|textarea|select/i.test(t.tagName)) return;
  if (ev.key === 'Escape' && open.value) close();
  if ((ev.key === 'm' || ev.key === 'M') && !ev.ctrlKey && !ev.metaKey) {
    open.value = !open.value;
  }
};

onMounted(async () => {
  $eventBus?.on(MITT_ON_KEY.OPEN_WORLD_MAP, () => {
    open.value = true;
  });
  events.value = await fetchLiveEvents();
  window.addEventListener('keydown', onKey);
});
onUnmounted(() => {
  $eventBus?.off?.(MITT_ON_KEY.OPEN_WORLD_MAP);
  window.removeEventListener('keydown', onKey);
});
</script>
<style scoped>
.world-map {
  position: absolute;
  inset: 48px 12px 12px;
  z-index: 30;
  display: flex;
  flex-direction: column;
  color: #e4dcc8;
  background: rgb(10 12 18 / 94%);
  border: 1px solid rgb(212 196 160 / 35%);
  border-radius: 8px;
}
.wm-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 12px 16px;
  border-bottom: 1px solid #2a3040;
}
.wm-head h2 {
  margin: 0;
  font-size: 22px;
  letter-spacing: 0.04em;
}
.wm-head p {
  margin: 4px 0 0;
  font-size: 11px;
  color: #9aa3c2;
}
.wm-x {
  color: #d4c4a0;
  cursor: pointer;
  background: #1a1e2c;
  border: 1px solid #445;
  border-radius: 4px;
  padding: 4px 10px;
}
.wm-body {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 10px;
  flex: 1;
  min-height: 0;
  padding: 10px;
}
.wm-rail {
  overflow: auto;
}
.wm-rail h3 {
  margin: 10px 0 6px;
  font-size: 11px;
  text-transform: uppercase;
  color: #8a8070;
}
.wm-dest,
.wm-evt {
  display: flex;
  gap: 8px;
  width: 100%;
  margin-bottom: 6px;
  padding: 6px;
  color: inherit;
  text-align: left;
  cursor: pointer;
  background: #161a24;
  border: 1px solid #33384a;
  border-radius: 6px;
}
.wm-dest.is-on,
.wm-cell.is-on {
  border-color: #e8c56b;
}
.wm-dest img {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 4px;
}
.wm-dest b,
.wm-evt b {
  display: block;
  font-size: 12px;
}
.wm-dest span,
.wm-evt span {
  display: block;
  font-size: 10px;
  color: #8b93b7;
}
.wm-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: 1fr 1fr 1fr;
  gap: 8px;
  min-height: 420px;
}
.wm-cell {
  position: relative;
  overflow: hidden;
  padding: 0;
  cursor: pointer;
  background: #111;
  border: 1px solid #334;
  border-radius: 8px;
}
.wm-cell img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.9;
}
.wm-cell-cap {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  padding: 6px 8px;
  text-align: left;
  background: linear-gradient(transparent, rgb(8 10 16 / 88%));
}
.wm-cell-cap strong {
  display: block;
  font-size: 13px;
}
.wm-cell-cap em {
  font-size: 10px;
  font-style: normal;
  color: #c4b896;
}
.wm-pin {
  position: absolute;
  width: 8px;
  height: 8px;
  margin: -4px 0 0 -4px;
  background: #e8c56b;
  border-radius: 50%;
  box-shadow: 0 0 0 1px #0008;
}
.wm-pin.k-faction {
  background: #d24a3a;
}
.wm-pin.k-prefab {
  background: #7aa2f7;
}
.wm-pin.ev {
  border-radius: 1px;
  background: #c56be8;
  transform: rotate(45deg);
}
.wm-foot {
  padding: 8px 16px;
  font-size: 11px;
  color: #8a8070;
  border-top: 1px solid #2a3040;
}
</style>
