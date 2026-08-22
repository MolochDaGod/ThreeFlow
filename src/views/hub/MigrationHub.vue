<template>
  <div class="hub">
    <header class="hub-top">
      <img src="/icon.png" alt="" class="hub-logo" />
      <div>
        <h1>Grudge Studio · ThreeFlow</h1>
        <p>Migrations landing · asset organizer · one prefab / character SSOT</p>
      </div>
      <a class="hub-go ghost" href="/view">ThreePipe viewer</a>
      <router-link class="hub-go" to="/editor">Open scene editor</router-link>
    </header>

    <section class="hub-banner">
      <strong>True systems only.</strong>
      Binaries = assets.grudge-studio.com · Prefabs =
      warlords-entity-prefabs.json · Play characters = loadRaceKit · Player bag
      = Railway. This page does not invent a second catalog.
    </section>

    <section>
      <h2>Surfaces</h2>
      <div class="hub-grid">
        <a
          v-for="s in surfaces"
          :key="s.id"
          class="hub-card"
          :href="s.href"
          target="_blank"
          rel="noopener"
        >
          <div class="hub-card-kicker">{{ s.role }}</div>
          <div class="hub-card-title">{{ s.name }}</div>
          <div class="hub-card-owns">{{ s.owns }}</div>
        </a>
      </div>
    </section>

    <section>
      <h2>Migration lanes</h2>
      <table class="hub-table">
        <thead>
          <tr>
            <th>From</th>
            <th>To</th>
            <th>System</th>
            <th>Rule</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="lane in lanes" :key="lane.id">
            <td>{{ lane.from }}</td>
            <td>{{ lane.to }}</td>
            <td>{{ lane.system }}</td>
            <td>{{ lane.rule }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section>
      <h2>Catalogs (live index)</h2>
      <div class="hub-grid hub-grid-sm">
        <a
          v-for="c in catalogs"
          :key="c.id"
          class="hub-card"
          :href="c.url"
          target="_blank"
          rel="noopener"
        >
          <div class="hub-card-kicker">JSON</div>
          <div class="hub-card-title">{{ c.label }}</div>
          <div class="hub-card-owns">{{ c.note }}</div>
        </a>
      </div>
    </section>

    <section>
      <div class="hub-row">
        <h2>Prefab organizer</h2>
        <span class="hub-status">{{ status }}</span>
        <input
          v-model="q"
          class="hub-search"
          type="search"
          placeholder="Filter id / kind / name"
        />
      </div>
      <div class="hub-kinds">
        <button
          v-for="k in kinds"
          :key="k"
          type="button"
          :class="{ on: kind === k }"
          @click="kind = k"
        >
          {{ k }}
          <em>{{ counts[k] || 0 }}</em>
        </button>
      </div>
      <table class="hub-table">
        <thead>
          <tr>
            <th>Prefab</th>
            <th>Kind</th>
            <th>Mesh</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in shown" :key="row.id">
            <td>{{ prefabLabel(row) }}</td>
            <td>{{ row.kind || '—' }}</td>
            <td class="mono">
              {{ row.mesh?.status || '—' }}
              <span v-if="row.mesh?.r2Key"> · {{ row.mesh.r2Key }}</span>
            </td>
            <td>
              <template v-if="row.mesh?.cdnUrl">
                <a :href="viewAssetUrl(row.mesh.cdnUrl)">View</a>
                ·
                <router-link :to="editorAssetUrl(row.mesh.cdnUrl)">
                  Editor
                </router-link>
              </template>
              <span v-else class="dim">no GLB</span>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  HUB_CATALOGS,
  HUB_SURFACES,
  MIGRATION_LANES,
  editorAssetUrl,
  fetchPrefabIndex,
  prefabLabel,
  viewAssetUrl,
  type HubPrefabRow,
} from '@/config/migrationHub';

const router = useRouter();
const surfaces = HUB_SURFACES;
const lanes = MIGRATION_LANES;
const catalogs = HUB_CATALOGS;
const rows = ref<HubPrefabRow[]>([]);
const status = ref('loading prefab index…');
const q = ref('');
const kind = ref('all');

const kinds = computed(() => {
  const set = new Set<string>(['all']);
  for (const r of rows.value) set.add(r.kind || 'unknown');
  return [...set];
});

const counts = computed(() => {
  const c: Record<string, number> = { all: rows.value.length };
  for (const r of rows.value) {
    const k = r.kind || 'unknown';
    c[k] = (c[k] || 0) + 1;
  }
  return c;
});

const shown = computed(() => {
  const needle = q.value.trim().toLowerCase();
  return rows.value.filter((r) => {
    if (kind.value !== 'all' && (r.kind || 'unknown') !== kind.value)
      return false;
    if (!needle) return true;
    const blob = `${prefabLabel(r)} ${r.id} ${r.prefabId || ''} ${r.kind || ''} ${r.mesh?.r2Key || ''}`.toLowerCase();
    return blob.includes(needle);
  });
});

onMounted(async () => {
  const params = new URLSearchParams(window.location.search);
  const asset = params.get('asset') || params.get('mesh');
  const wantView =
    params.get('intent') === 'view' ||
    params.get('view') === '1' ||
    params.get('view') === 'true';
  if (asset && /^https?:\/\//i.test(asset)) {
    if (wantView) {
      window.location.replace(`/view?${params.toString()}`);
      return;
    }
    await router.replace({ path: '/editor', query: Object.fromEntries(params) });
    return;
  }
  try {
    rows.value = await fetchPrefabIndex();
    status.value = `${rows.value.length} prefab rows · ${PREFABS_HOST}`;
  } catch (e) {
    status.value = e instanceof Error ? e.message : 'prefab fetch failed';
  }
});

const PREFABS_HOST = 'client.grudge-studio.com/api/v1/warlords-entity-prefabs.json';
</script>

<style scoped lang="scss">
.hub {
  min-height: 100vh;
  padding: 28px 32px 64px;
  color: #e8dcc4;
  background: linear-gradient(160deg, #16110a 0%, #0b1016 55%, #0a1210 100%);
  font-family: 'Segoe UI', system-ui, sans-serif;
}
.hub-top {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 22px;
  h1 {
    margin: 0;
    font-size: 22px;
    letter-spacing: 0.04em;
    color: #f0d48a;
  }
  p {
    margin: 2px 0 0;
    font-size: 13px;
    color: #9a8b70;
  }
}
.hub-logo {
  width: 48px;
  height: 48px;
}
.hub-go {
  margin-left: auto;
  padding: 10px 16px;
  border: 1px solid #c9a227;
  color: #1a1408;
  background: #c9a227;
  text-decoration: none;
  font-weight: 600;
}
.hub-go.ghost {
  margin-left: 0;
  color: #f0d48a;
  background: transparent;
}
.hub-banner {
  margin-bottom: 28px;
  padding: 12px 14px;
  border: 1px solid #3a3224;
  background: #18140e;
  font-size: 13px;
  line-height: 1.45;
  color: #cfc3aa;
}
h2 {
  margin: 0 0 10px;
  font-size: 14px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #c9a227;
}
section {
  margin-bottom: 32px;
}
.hub-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 10px;
}
.hub-grid-sm {
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
}
.hub-card {
  display: block;
  padding: 12px;
  border: 1px solid #3a3224;
  background: #14110c;
  color: inherit;
  text-decoration: none;
  &:hover {
    border-color: #c9a227;
  }
}
.hub-card-kicker {
  font-size: 11px;
  color: #8a7a58;
  margin-bottom: 4px;
}
.hub-card-title {
  font-size: 15px;
  color: #f3e6c4;
}
.hub-card-owns {
  margin-top: 6px;
  font-size: 12px;
  color: #9a8b70;
}
.hub-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  th,
  td {
    padding: 8px 8px;
    border-bottom: 1px solid #2a241c;
    text-align: left;
    vertical-align: top;
  }
  th {
    color: #8a7a58;
    font-weight: 600;
  }
  a {
    color: #e0c060;
  }
}
.hub-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
  h2 {
    margin: 0;
  }
}
.hub-status {
  font-size: 12px;
  color: #8a7a58;
}
.hub-search {
  margin-left: auto;
  min-width: 220px;
  padding: 6px 8px;
  border: 1px solid #3a3224;
  background: #0d0b08;
  color: #e8dcc4;
}
.hub-kinds {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
  button {
    border: 1px solid #3a3224;
    background: #14110c;
    color: #cfc3aa;
    padding: 4px 8px;
    cursor: pointer;
    em {
      font-style: normal;
      color: #c9a227;
      margin-left: 4px;
    }
    &.on {
      border-color: #c9a227;
      color: #f0d48a;
    }
  }
}
.mono {
  font-family: ui-monospace, Consolas, monospace;
  font-size: 11px;
}
.dim {
  color: #6a6050;
}
</style>
