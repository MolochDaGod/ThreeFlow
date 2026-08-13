<template>
  <div class="race-kit-panel" v-if="kit">
    <div class="hint">
      Hover armour on the captain, pick one material, then one weapon (skills pack).
      Warlords era play stays on Foundry / grudgewarlords — not this editor.
    </div>
    <div class="row-label">Armour (hover in view)</div>
    <div class="hover-name">{{ kit.hoverMesh || kit.selectedArmor || '—' }}</div>
    <div class="row-label">Material (select 1)</div>
    <div class="chip-row">
      <button
        v-for="m in materials"
        :key="m"
        class="chip"
        :class="{ active: kit.material === m }"
        @click="pickMaterial(m)"
      >
        {{ m }}
      </button>
    </div>
    <div class="row-label">Weapon → skill pack</div>
    <div class="weapon-list">
      <button
        v-for="w in weapons"
        :key="w.id"
        class="weapon"
        :class="{ active: kit.weaponId === w.id }"
        @click="pickWeapon(w.id)"
      >
        <span>{{ w.label }}</span>
        <em>{{ w.pack }}</em>
      </button>
    </div>
    <div class="links">
      <a :href="foundryUrl" target="_blank" rel="noreferrer">Warlords Foundry</a>
      <a :href="playUrl" target="_blank" rel="noreferrer">Play Warlords</a>
    </div>
  </div>
  <div class="race-kit-panel empty" v-else>
    Drop a captain / unit from the Warlords library.
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { useSceneStore } from '@/store/sceneEditStore';
import {
  ALL_KIT_WEAPONS,
  findRaceKitRoot,
  setKitMaterial,
  setKitWeapon,
  WARLORDS_FOUNDRY,
  WARLORDS_PLAY,
  type ArmorMaterial,
  type RaceKitState,
} from '@/utils/raceKit';
import * as THREE from 'three';

const store = useSceneStore();
const materials: ArmorMaterial[] = ['metal', 'cloth', 'leather'];
const weapons = ALL_KIT_WEAPONS;
const foundryUrl = WARLORDS_FOUNDRY;
const playUrl = WARLORDS_PLAY;

const kitRoot = computed(() => {
  const uuid = store.currentTransformMaterialUuid;
  const scene = store.sceneApi?.scene;
  if (!uuid || !scene) return null;
  const obj = scene.getObjectByProperty('uuid', uuid);
  return findRaceKitRoot(obj as THREE.Object3D | null);
});

const kit = computed<RaceKitState | null>(() => {
  void store.transformMaterialRandomId;
  return (kitRoot.value?.userData.raceKit as RaceKitState) || null;
});

const pickMaterial = (m: ArmorMaterial) => {
  if (kitRoot.value) setKitMaterial(kitRoot.value, m);
  store.setTransformMaterialRandomId();
};

const pickWeapon = (id: string) => {
  if (kitRoot.value) setKitWeapon(kitRoot.value, id);
  store.setTransformMaterialRandomId();
};
</script>
<style scoped>
.race-kit-panel {
  padding: 8px 10px 12px;
  color: #d7dde8;
  font-size: 12px;
}
.race-kit-panel.empty {
  color: #8a93a3;
}
.hint {
  font-size: 11px;
  line-height: 1.35;
  color: #9aa4b5;
  margin-bottom: 8px;
}
.row-label {
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-size: 10px;
  color: #7d8796;
  margin: 8px 0 4px;
}
.hover-name {
  font-family: ui-monospace, monospace;
  font-size: 11px;
  color: #f0c36a;
  word-break: break-all;
}
.chip-row,
.weapon-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.chip,
.weapon {
  border: 1px solid #3a4354;
  background: #1c2230;
  color: #d7dde8;
  border-radius: 6px;
  padding: 4px 8px;
  cursor: pointer;
}
.chip.active,
.weapon.active {
  border-color: #c9a227;
  background: #3a2e12;
  color: #f5d56a;
}
.weapon {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 96px;
}
.weapon em {
  font-style: normal;
  font-size: 10px;
  color: #8aa0c4;
}
.links {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}
.links a {
  color: #7eb6ff;
  font-size: 11px;
}
</style>
