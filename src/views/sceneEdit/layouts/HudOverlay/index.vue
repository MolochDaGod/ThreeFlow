<template>
  <div
    class="hud-host"
    :class="{ 'is-play': store.playMode }"
    v-if="state.frames.length || inspect"
    :style="hostStyle"
  >
    <div class="hud-overlay" :style="scaleStyle">
      <div class="hud-scale-chip" v-if="!store.playMode">
        1920×1080 · ×{{ scale.toFixed(2) }} · in viewport
      </div>
      <div
        v-for="f in state.frames"
        :key="f.id"
        class="hud-frame"
        :class="{ 'is-on': state.selectedId === f.id }"
        :style="{
          left: f.x + 'px',
          top: f.y + 'px',
          width: f.w + 'px',
          height: f.h + 'px',
        }"
        @pointerdown.stop="onFramePointer($event, f)"
        @contextmenu.prevent.stop="onFrameRmb($event, f)"
      >
        <img
          v-if="f.type === 'minimap' && miniSrc"
          class="hud-mini"
          :src="miniSrc"
          alt=""
        />
        <div class="hud-slots" v-if="slotMap[f.id]?.length">
          <div
            v-for="cell in slotMap[f.id]"
            :key="cell.slot.id"
            class="hud-slot"
            :style="{
              left: cell.x + 'px',
              top: cell.y + 'px',
              width: cell.w + 'px',
              height: cell.h + 'px',
            }"
          >
            <button
              class="hud-slot-btn"
              type="button"
              :title="cell.slot.key"
              @pointerdown.stop
            >
              <img
                v-if="cell.slot.icon"
                class="hud-slot-icon"
                :src="cell.slot.icon"
                alt=""
                referrerpolicy="no-referrer"
                draggable="false"
              />
              <span class="hud-slot-key">{{ cell.slot.key }}</span>
            </button>
          </div>
        </div>
        <div class="hud-prompt" v-else-if="f.type === 'interaction-prompt'">
          <button class="hud-slot-btn" type="button">F</button>
          <span>Interact</span>
        </div>
        <div class="hud-chrome" v-else>
          <img
            v-if="frameIcon(f)"
            class="hud-chrome-icon"
            :src="frameIcon(f)"
            alt=""
            referrerpolicy="no-referrer"
          />
          <em>{{ f.label }}</em>
        </div>
        <span
          v-if="!store.playMode"
          class="hud-resize"
          title="Resize"
          @pointerdown.stop="onResizeDown($event, f)"
        />
      </div>
    </div>
    <div
      v-if="inspect && !store.playMode"
      class="hud-rmb"
      :style="{ left: inspect.px + 'px', top: inspect.py + 'px' }"
      @pointerdown.stop
      @contextmenu.prevent.stop
    >
      <div class="hud-rmb-title">{{ inspectFrame?.label || 'HUD' }}</div>
      <p class="hud-rmb-help">{{ inspectHelp }}</p>
      <label>
        Label
        <input
          :value="inspectFrame?.label"
          @change="patchInspect('label', ($event.target as HTMLInputElement).value)"
        />
      </label>
      <div class="hud-rmb-row">
        <label>
          X
          <input
            type="number"
            :value="inspectFrame?.x"
            @change="patchInspectNum('x', $event)"
          />
        </label>
        <label>
          Y
          <input
            type="number"
            :value="inspectFrame?.y"
            @change="patchInspectNum('y', $event)"
          />
        </label>
      </div>
      <div class="hud-rmb-row">
        <label>
          W
          <input
            type="number"
            :value="inspectFrame?.w"
            @change="patchInspectNum('w', $event)"
          />
        </label>
        <label>
          H
          <input
            type="number"
            :value="inspectFrame?.h"
            @change="patchInspectNum('h', $event)"
          />
        </label>
      </div>
      <p class="hud-rmb-meta">{{ inspectFrame?.type }} · stays in 1920×1080</p>
      <div class="hud-rmb-actions">
        <button type="button" @click="deleteInspect">Delete</button>
        <button type="button" class="ghost" @click="inspect = null">Close</button>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import {
  clampHudFrame,
  ensurePlayHud,
  hudTypeHelp,
  loadHud,
  saveHud,
  type HudFrame,
  type HudState,
} from '@/config/hudKits';
import {
  HUD_DESIGN_H,
  HUD_DESIGN_W,
  measureHudHost,
} from '@/utils/imageLoader';
import { minimapForScene } from '@/config/sectorMinimaps';
import { useSceneStore } from '@/store/sceneEditStore';
import { MITT_ON_KEY } from '@/enums/enum';
import { getCurrentInstance } from 'vue';
import { syncHudToScene } from '@/utils/hudScene';
import { layoutSlots } from '@/utils/hudGrid';
import { FRAME_ICONS } from '@/config/hudIcons';

const store = useSceneStore();
const state = ref<HudState>(loadHud());
const miniSrc = computed(() => {
  const sc = store.sceneApi?.scene;
  return sc ? minimapForScene(sc) : '/minimap/haven_shore.jpg';
});
const { $eventBus } = getCurrentInstance()?.proxy || {};

const scale = ref(1);
const gutter = ref(0);
const hostStyle = computed(() => ({
  left: `${gutter.value}px`,
}));
const scaleStyle = computed(() => ({
  transform: `scale(${scale.value})`,
  width: `${HUD_DESIGN_W}px`,
  height: `${HUD_DESIGN_H}px`,
}));

type Inspect = { id: string; px: number; py: number };
const inspect = ref<Inspect | null>(null);
const inspectFrame = computed(
  () => state.value.frames.find((x) => x.id === inspect.value?.id) || null
);
const inspectHelp = computed(() =>
  inspectFrame.value ? hudTypeHelp(inspectFrame.value.type) : ''
);

const slotMap = computed(() => {
  const m: Record<string, ReturnType<typeof layoutSlots>> = {};
  for (const f of state.value.frames) m[f.id] = layoutSlots(f);
  return m;
});

const frameIcon = (f: HudFrame) => f.icon || FRAME_ICONS[f.type] || '';

const persist = () => {
  state.value.frames = state.value.frames.map(clampHudFrame);
  saveHud(state.value);
  const scene = store.sceneApi?.scene;
  if (scene) {
    syncHudToScene(scene, state.value.frames);
    store.setTransformMaterialRandomId();
  }
};

const layoutHud = () => {
  const host = document.querySelector('#scene-render') as HTMLElement | null;
  const left = document.querySelector('.render-left-box') as HTMLElement | null;
  const play = store.playMode;
  const leftW =
    !play && left && getComputedStyle(left).display !== 'none'
      ? left.getBoundingClientRect().width
      : 0;
  gutter.value = leftW;
  const m = measureHudHost(host, leftW);
  scale.value = m.scale;
};

const reload = () => {
  state.value = store.playMode ? ensurePlayHud() : loadHud();
  if (store.playMode) {
    void import('@/config/harvestBag').then((m) => m.hydrateHarvestBag());
  }
  const scene = store.sceneApi?.scene;
  if (scene) {
    syncHudToScene(scene, state.value.frames);
    store.setTransformMaterialRandomId();
  }
  layoutHud();
};

const select = (id: string) => {
  state.value.selectedId = id;
  persist();
};

type Drag = {
  id: string;
  mode: 'move' | 'resize';
  sx: number;
  sy: number;
  ox: number;
  oy: number;
  ow: number;
  oh: number;
};
let drag: Drag | null = null;

const onFramePointer = (e: PointerEvent, f: HudFrame) => {
  if (store.playMode) {
    if (f.type === 'minimap') $eventBus?.emit(MITT_ON_KEY.OPEN_WORLD_MAP, true);
    return;
  }
  if (e.button === 2) return;
  if (e.button !== 0) return;
  e.preventDefault();
  select(f.id);
  inspect.value = null;
  if (f.type === 'minimap' && e.detail === 2) {
    $eventBus?.emit(MITT_ON_KEY.OPEN_WORLD_MAP, true);
  }
  const el = e.currentTarget as HTMLElement;
  el.setPointerCapture(e.pointerId);
  drag = {
    id: f.id,
    mode: 'move',
    sx: e.clientX,
    sy: e.clientY,
    ox: f.x,
    oy: f.y,
    ow: f.w,
    oh: f.h,
  };
};

const onResizeDown = (e: PointerEvent, f: HudFrame) => {
  if (store.playMode || e.button !== 0) return;
  e.preventDefault();
  select(f.id);
  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  drag = {
    id: f.id,
    mode: 'resize',
    sx: e.clientX,
    sy: e.clientY,
    ox: f.x,
    oy: f.y,
    ow: f.w,
    oh: f.h,
  };
};

const onMove = (e: PointerEvent) => {
  if (!drag) return;
  const f = state.value.frames.find((x) => x.id === drag!.id);
  if (!f) return;
  const dx = (e.clientX - drag.sx) / scale.value;
  const dy = (e.clientY - drag.sy) / scale.value;
  if (drag.mode === 'move') {
    Object.assign(f, clampHudFrame({ ...f, x: drag.ox + dx, y: drag.oy + dy }));
  } else {
    Object.assign(
      f,
      clampHudFrame({ ...f, w: drag.ow + dx, h: drag.oh + dy })
    );
  }
};

const onUp = () => {
  if (drag) {
    persist();
    drag = null;
  }
};

const onFrameRmb = (e: MouseEvent, f: HudFrame) => {
  if (store.playMode) return;
  select(f.id);
  const host = document.querySelector('.hud-host') as HTMLElement | null;
  const r = host?.getBoundingClientRect();
  inspect.value = {
    id: f.id,
    px: Math.min(Math.max(8, e.clientX - (r?.left || 0)), (r?.width || 320) - 260),
    py: Math.min(Math.max(8, e.clientY - (r?.top || 0)), (r?.height || 240) - 220),
  };
};

const patchInspect = (key: 'label', value: string) => {
  const f = inspectFrame.value;
  if (!f) return;
  f[key] = value;
  persist();
};

const patchInspectNum = (key: 'x' | 'y' | 'w' | 'h', e: Event) => {
  const f = inspectFrame.value;
  if (!f) return;
  const n = Number((e.target as HTMLInputElement).value);
  if (!Number.isFinite(n)) return;
  Object.assign(f, clampHudFrame({ ...f, [key]: n }));
  persist();
};

const deleteInspect = () => {
  const id = inspect.value?.id;
  if (!id) return;
  state.value.frames = state.value.frames.filter((x) => x.id !== id);
  if (state.value.selectedId === id) state.value.selectedId = null;
  inspect.value = null;
  persist();
  $eventBus?.emit(MITT_ON_KEY.HUD_CHANGED, true);
};

watch(
  () => store.playMode,
  (on) => {
    inspect.value = null;
    if (on) state.value = ensurePlayHud();
    layoutHud();
  }
);

onMounted(() => {
  $eventBus?.on(MITT_ON_KEY.HUD_CHANGED, reload);
  window.addEventListener('resize', layoutHud);
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  layoutHud();
  if (store.playMode) state.value = ensurePlayHud();
});
onUnmounted(() => {
  $eventBus?.off?.(MITT_ON_KEY.HUD_CHANGED, reload);
  window.removeEventListener('resize', layoutHud);
  window.removeEventListener('pointermove', onMove);
  window.removeEventListener('pointerup', onUp);
});
</script>
<style scoped>
.hud-host {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 8;
}
.hud-overlay {
  position: absolute;
  left: 50%;
  top: 50%;
  transform-origin: center center;
  translate: -50% -50%;
  pointer-events: none;
  overflow: hidden;
}
.hud-mini {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.88;
}
.hud-frame {
  position: absolute;
  box-sizing: border-box;
  pointer-events: auto;
  border: 1px solid rgb(212 196 160 / 55%);
  background: rgb(18 20 32 / 62%);
  color: #d4c4a0;
  overflow: hidden;
  font-size: 11px;
  cursor: grab;
}
.hud-frame.is-on {
  border-color: #d4af37;
}
.hud-resize {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 12px;
  height: 12px;
  cursor: nwse-resize;
  background: linear-gradient(135deg, transparent 50%, #d4af37 50%);
}
.hud-scale-chip {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 2;
  padding: 2px 8px;
  font-size: 11px;
  color: #d4c4a0;
  pointer-events: none;
  background: rgb(18 20 32 / 72%);
  border: 1px solid rgb(212 196 160 / 40%);
}
.hud-frame em {
  display: block;
  padding: 4px 6px;
  font-style: normal;
}
.hud-slots {
  position: absolute;
  inset: 0;
  pointer-events: auto;
}
.hud-slot {
  position: absolute;
}
.hud-slot-btn {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  padding: 0;
  margin: 0;
  border: 1px solid rgb(212 196 160 / 55%);
  border-radius: 6px;
  background: rgb(12 10 8 / 72%);
  cursor: pointer;
}
.hud-slot-icon {
  position: absolute;
  inset: 15%;
  width: 70%;
  height: 70%;
  object-fit: contain;
  pointer-events: none;
  image-rendering: auto;
}
.hud-slot-key {
  position: absolute;
  right: 3px;
  bottom: 1px;
  font-size: 9px;
  color: #f3ece0;
  text-shadow: 0 1px 2px #000;
  pointer-events: none;
}
.hud-prompt {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 100%;
  padding: 4px 8px;
  box-sizing: border-box;
  .hud-slot-btn {
    position: relative;
    width: 28px;
    height: 28px;
    flex: 0 0 28px;
    color: #f3ece0;
    font-weight: 700;
  }
}
.hud-chrome {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 100%;
  padding: 4px 6px;
  box-sizing: border-box;
}
.hud-chrome-icon {
  width: 28px;
  height: 28px;
  object-fit: contain;
  flex: 0 0 28px;
}
.hud-host.is-play {
  pointer-events: none;
  z-index: 20;
  .hud-frame {
    pointer-events: none;
    cursor: default;
    border-color: rgb(212 196 160 / 35%);
    background: rgb(12 14 22 / 55%);
  }
}
.hud-rmb {
  position: absolute;
  z-index: 12;
  width: 248px;
  padding: 10px 12px;
  pointer-events: auto;
  color: #e8d5a3;
  background: #12141a;
  border: 1px solid rgb(212 175 55 / 45%);
  box-shadow: 0 8px 24px rgb(0 0 0 / 55%);
  font-size: 11px;
}
.hud-rmb-title {
  margin-bottom: 6px;
  font-weight: 600;
  color: #d4af37;
}
.hud-rmb-help {
  margin: 0 0 8px;
  line-height: 1.35;
  color: #c5cceb;
}
.hud-rmb-meta {
  margin: 6px 0;
  color: #8b93b7;
}
.hud-rmb label {
  display: block;
  margin-bottom: 6px;
  color: #8b93b7;
}
.hud-rmb input {
  display: block;
  width: 100%;
  margin-top: 2px;
  color: #fff;
  background: #1c1f28;
  border: 1px solid #3a3f4e;
}
.hud-rmb-row {
  display: flex;
  gap: 8px;
}
.hud-rmb-row label {
  flex: 1;
}
.hud-rmb-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}
.hud-rmb-actions button {
  flex: 1;
  padding: 4px 8px;
  color: #14161c;
  cursor: pointer;
  background: #d4af37;
  border: 0;
}
.hud-rmb-actions button.ghost {
  color: #e8d5a3;
  background: transparent;
  border: 1px solid #445;
}
</style>
