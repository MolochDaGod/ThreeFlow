<template>
  <div class="race-kit-panel" v-if="kit">
    <div class="hint">
      Hover armour, pick one material, then one weapon (skills pack). Core pack
      is idle/walk/run/attack; harvest/hoe/gather overlays on the same mixer.
      Traversal loads on click. One mixer, crossfade gait, foot IK on the same
      terrain ray as snap. Show rig draws skeleton, CCT capsule, laterality
      boxes, and bone sockets.
    </div>
    <div class="row-label">Armour (hover in view)</div>
    <div class="hover-name">
      {{ kit.hoverMesh || kit.selectedArmor || '—' }}
    </div>
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
    <div class="row-label">Skeleton · capsule · laterality</div>
    <div class="hover-name">
      pelvis {{ integrity.pelvis ? 'ok' : 'no' }} · spine
      {{ integrity.spine ? 'ok' : 'no' }} · feet
      {{ integrity.leftFoot && integrity.rightFoot ? 'ok' : 'no' }} · L/R
      {{ integrity.leftHand && integrity.rightHand ? 'ok' : 'no' }} · box
      {{ integrity.laterality }} · h
      {{ integrity.heightM.toFixed(2) }}m · root
      {{ integrity.rootBetweenFeet ? 'between feet' : 'offset' }}
    </div>
    <div class="chip-row">
      <button class="chip" @click="toggleDebug">
        {{ debugOn ? 'Hide rig' : 'Show rig + laterality' }}
      </button>
    </div>
    <div class="row-label">Mixer (one on kit root)</div>
    <div class="hover-name">
      {{ mixerOn ? 'bound' : 'not bound' }} · pack {{ kit.animPack }}
    </div>
    <div class="chip-row">
      <button class="chip" :disabled="binding" @click="bindPack">
        {{ binding ? 'loading…' : 'Bind baked pack' }}
      </button>
    </div>
    <div class="weapon-list" v-if="bind">
      <button
        v-for="role in roleKeys"
        :key="role"
        class="weapon"
        :class="{ active: playingRole === role, missing: !bind.roles[role] }"
        :disabled="!bind.roles[role]"
        @click="playRole(role)"
      >
        <span>{{ role }}</span>
        <em>{{ bind.sources[role] || 'missing' }}</em>
      </button>
    </div>
    <div class="row-label">
      Disk packs · D:\Games\Models\_anim_packs
    </div>
    <div class="chip-row">
      <button
        v-for="b in diskFamilies"
        :key="b"
        class="chip"
        :class="{ active: diskFamily === b }"
        @click="diskFamily = b"
      >
        {{ b }}
      </button>
    </div>
    <input
      v-model="diskQuery"
      class="disk-search"
      type="search"
      placeholder="Filter clip name…"
    />
    <div class="weapon-list disk-list" v-if="visibleDisk.length">
      <button
        v-for="c in visibleDisk"
        :key="c.bakeRel"
        class="weapon"
        :class="{ active: playingRel === c.bakeRel }"
        @click="playLibrary(c.bakeRel)"
      >
        <span>{{ c.name }}</span>
        <em>{{ c.bucket }}</em>
      </button>
    </div>
    <p class="hint" v-else-if="diskClips.length === 0">
      Local index missing — using baked /anims/baked. Run Vite on this machine
      to expose the disk pack.
    </p>
    <div class="row-label" v-if="libraryClips.length">
      Pack library (showcase)
    </div>
    <div class="weapon-list" v-if="libraryClips.length">
      <button
        v-for="c in libraryClips"
        :key="c.bakeRel"
        class="weapon"
        :class="{ active: playingRel === c.bakeRel }"
        @click="playLibrary(c.bakeRel)"
      >
        <span>{{ c.label }}</span>
        <em>{{ c.bakeRel }}</em>
      </button>
    </div>
    <p class="hint" v-if="bind?.errors?.length">
      {{ bind.errors.join(' · ') }}
    </p>
    <div class="links">
      <a :href="foundryUrl" target="_blank" rel="noreferrer"
        >Warlords Foundry</a
      >
      <a :href="playUrl" target="_blank" rel="noreferrer">Play Warlords</a>
      <a :href="CASTING_HOST" target="_blank" rel="noreferrer">Casting lab</a>
    </div>
  </div>
  <div class="race-kit-panel empty" v-else>
    Drop a captain / unit from the Warlords library.
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
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
import {
  bindKitAnims,
  ensureKitRole,
  getKitAnimBind,
  playBakeRel,
  playKitRole,
  type KitAnimRole,
} from '@/utils/kitAnim';
import { CASTING_HOST, clipsForPack } from '@/config/warlordsAnimLibrary';
import { loadDiskAnimIndex, type DiskClip } from '@/utils/animPackDisk';
import {
  diagnoseCharacterIntegrity,
  toggleCharacterDebug,
  type CharIntegrity,
} from '@/utils/characterIntegrity';
import { centerRootBetweenFeet } from '@/utils/siPlace';
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

const binding = ref(false);
const playingRole = ref<KitAnimRole | null>(null);
const playingRel = ref<string | null>(null);
const libraryClips = computed(() => {
  const pack = String(kit.value?.animPack || '');
  const core = clipsForPack(pack);
  const extra = [
    ...clipsForPack('male_injured'),
    ...clipsForPack('harvest'),
    ...clipsForPack('locomotion'),
    ...clipsForPack('work-roles'),
  ];
  const seen = new Set(core.map((c) => c.bakeRel));
  return [...core, ...extra.filter((c) => !seen.has(c.bakeRel))];
});

const diskClips = ref<DiskClip[]>([]);
const diskFamily = ref<DiskClip['family'] | 'all'>('weapons');
const diskQuery = ref('');
const diskFamilies = ['all', 'weapons', 'mobility', 'locomotion', 'special'] as const;
const visibleDisk = computed(() => {
  const q = diskQuery.value.trim().toLowerCase();
  return diskClips.value
    .filter((c) => diskFamily.value === 'all' || c.family === diskFamily.value)
    .filter(
      (c) =>
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.bucket.toLowerCase().includes(q) ||
        c.pack.toLowerCase().includes(q)
    )
    .slice(0, 160);
});
onMounted(async () => {
  diskClips.value = await loadDiskAnimIndex();
});
const integrity = computed<CharIntegrity>(() => {
  void store.transformMaterialRandomId;
  const root = kitRoot.value;
  if (!root) {
    return {
      pelvis: false,
      spine: false,
      leftFoot: false,
      rightFoot: false,
      leftHand: false,
      rightHand: false,
      heightM: 0,
      feetSpanM: 0,
      rootBetweenFeet: false,
      laterality: 'missing',
      lateralityLx: 0,
      lateralityRx: 0,
      method: 'world',
    };
  }
  return diagnoseCharacterIntegrity(root);
});
const debugOn = computed(() => Boolean(kitRoot.value?.userData.charDebug));

const toggleDebug = () => {
  const root = kitRoot.value;
  if (!root) return;
  centerRootBetweenFeet(root);
  toggleCharacterDebug(root);
  store.setTransformMaterialRandomId();
};
const roleKeys: KitAnimRole[] = [
  'idle',
  'walk',
  'run',
  'attack',
  'harvest',
  'hoe',
  'gather',
  'jump',
  'dodge',
  'hang',
  'climb',
  'climbUp',
  'climbDown',
  'mantle',
  'swim',
];

const bind = computed(() => {
  void store.transformMaterialRandomId;
  return getKitAnimBind(kitRoot.value);
});

const mixerOn = computed(() => {
  const id = kitRoot.value?.uuid;
  if (!id) return false;
  return Boolean(store.sceneApi?.animationModules?.animationMixers.get(id));
});

const bindPack = async () => {
  const root = kitRoot.value;
  const pack = kit.value?.animPack;
  if (!root || !pack) return;
  binding.value = true;
  try {
    await bindKitAnims(root, pack);
    const idle = getKitAnimBind(root)?.roles.idle;
    if (idle) {
      store.sceneApi?.animationModules?.playExclusive(idle, root);
      playingRole.value = 'idle';
    }
  } finally {
    binding.value = false;
    store.setTransformMaterialRandomId();
  }
};

const playRole = async (role: KitAnimRole) => {
  const root = kitRoot.value;
  if (!root) return;
  await ensureKitRole(root, role);
  playKitRole(root, role, store.sceneApi?.animationModules);
  playingRole.value = role;
  playingRel.value = null;
  store.setTransformMaterialRandomId();
};

const playLibrary = async (rel: string) => {
  const root = kitRoot.value;
  if (!root) return;
  const ok = await playBakeRel(root, rel, store.sceneApi?.animationModules);
  if (ok) playingRel.value = rel;
};

const pickMaterial = (m: ArmorMaterial) => {
  if (kitRoot.value) setKitMaterial(kitRoot.value, m);
  store.setTransformMaterialRandomId();
};

const pickWeapon = async (id: string) => {
  if (kitRoot.value) setKitWeapon(kitRoot.value, id);
  store.setTransformMaterialRandomId();
  await bindPack();
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
.weapon.missing {
  opacity: 0.45;
  cursor: not-allowed;
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
.disk-search {
  width: 100%;
  margin: 4px 0 6px;
  padding: 4px 8px;
  border: 1px solid #3a4354;
  border-radius: 4px;
  background: #141820;
  color: #d7dde8;
  font-size: 11px;
}
.disk-list {
  max-height: 220px;
  overflow: auto;
}
</style>
