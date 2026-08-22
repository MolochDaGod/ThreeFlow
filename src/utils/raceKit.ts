/**
 * Toon RTS / grudge6 race kit on a dropped captain.
 * Equipment = child-mesh visibility (grudge6-modular-characters).
 * Hover armour → pick metal|cloth|leather (one) → pick one weapon for skills.
 */
import * as THREE from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { centerRootBetweenFeet, placeAssetSi } from './siPlace';
import { bindCharacterDebug } from './characterIntegrity';
import { getProductionGltfLoader } from './gltfProdLoader';

export type ArmorMaterial = 'metal' | 'cloth' | 'leather';
export type ArmorSlot = 'body' | 'arms' | 'legs' | 'head' | 'shoulders';
export type WeaponSkillPack =
  'sword_shield' | '2h_melee' | 'longbow' | 'magic' | 'spear_melee' | 'unarmed';

export interface KitWeaponChoice {
  id: string;
  label: string;
  pack: WeaponSkillPack;
  /** Kit mesh name, or CDN url for an external GLB. */
  meshName?: string;
  cdnUrl?: string;
}

export interface RaceKitState {
  raceId: string;
  armor: Record<ArmorSlot, string | null>;
  material: ArmorMaterial;
  weaponId: string | null;
  animPack: WeaponSkillPack;
  hoverMesh: string | null;
  selectedArmor: string | null;
}

const ARMOR_SLOTS: ArmorSlot[] = ['body', 'arms', 'legs', 'head', 'shoulders'];
const WEAPON_SLOTS = [
  'sword',
  'axe',
  'hammer',
  'mace',
  'spear',
  'dagger',
  'pick',
  'bow',
  'staff',
  'shield',
];

const MATERIAL_PROFILE: Record<
  ArmorMaterial,
  { metalness: number; roughness: number }
> = {
  metal: { metalness: 0.82, roughness: 0.28 },
  leather: { metalness: 0.08, roughness: 0.72 },
  cloth: { metalness: 0.0, roughness: 0.92 },
};

const DEFAULT_LOADOUT: Record<ArmorSlot, string> = {
  body: 'c',
  arms: 'c',
  legs: 'c',
  head: 'd',
  shoulders: 'b',
};

const KIT_WEAPONS: KitWeaponChoice[] = [
  { id: 'sword', label: 'Sword', pack: 'sword_shield', meshName: 'sword' },
  { id: 'axe', label: 'Axe', pack: '2h_melee', meshName: 'axe' },
  { id: 'hammer', label: 'Hammer', pack: '2h_melee', meshName: 'hammer' },
  { id: 'spear', label: 'Spear', pack: 'spear_melee', meshName: 'spear' },
  { id: 'bow', label: 'Bow', pack: 'longbow', meshName: 'bow' },
  { id: 'staff', label: 'Staff', pack: 'magic', meshName: 'staff' },
  { id: 'dagger', label: 'Dagger', pack: 'sword_shield', meshName: 'dagger' },
];

const CDN_WEAPONS: KitWeaponChoice[] = [
  {
    id: 'hand-axe',
    label: 'Hand axe (CDN)',
    pack: '2h_melee',
    cdnUrl: 'https://assets.grudge-studio.com/models/weapons/axe/HandAxe.glb',
  },
  {
    id: 'greatsword',
    label: 'Greatsword (CDN)',
    pack: '2h_melee',
    cdnUrl:
      'https://assets.grudge-studio.com/models/weapons/greatsword/Greatsword.glb',
  },
  {
    id: 'cdn-bow',
    label: 'Bow (CDN)',
    pack: 'longbow',
    cdnUrl: 'https://assets.grudge-studio.com/models/weapons/bow/Bow.glb',
  },
];

export const ALL_KIT_WEAPONS: KitWeaponChoice[] = [
  ...KIT_WEAPONS,
  ...CDN_WEAPONS,
];

export const WARLORDS_FOUNDRY =
  'https://character.grudge-studio.com/foundry?era=warlords&mode=create';
export const WARLORDS_PLAY = 'https://grudgewarlords.com';

export function meshKey(name: string): string {
  return String(name || '')
    .toLowerCase()
    .replace(/^wk_|^brb_|^orc_|^elf_|^ud_|^dwf_/, '')
    .replace(/units_/g, '')
    .replace(/xtra_/g, '')
    .replace(/weapon_/g, 'weapon')
    .replace(/[^a-z0-9]/g, '');
}

function slotOf(name: string): ArmorSlot | 'weapon' | 'shield' | null {
  const k = meshKey(name);
  if (/shoulder/.test(k)) return 'shoulders';
  if (/head|helmet|hat/.test(k)) return 'head';
  if (/arm|hand|glove/.test(k) && !/weapon/.test(k)) return 'arms';
  if (/leg|boot|pant/.test(k)) return 'legs';
  if (/body|torso|chest|armor/.test(k)) return 'body';
  if (/shield/.test(k)) return 'shield';
  if (WEAPON_SLOTS.some((s) => k.includes(s)) || /weapon/.test(k))
    return 'weapon';
  return null;
}

function variantOf(name: string): string {
  const m = name.match(/_([A-Za-z])(?:_|\.|$)/);
  return (m?.[1] || '').toLowerCase();
}

function isEquippable(mesh: THREE.Object3D): boolean {
  return slotOf(mesh.name) != null;
}

/**
 * RTS worker carry — Xtra_bag / Xtra_wood / lumber (grudge6-modular-characters).
 * Never visible unless setCarryVisuals (NPC auto-harvest return).
 */
export function isCarryMesh(name: string): boolean {
  const k = meshKey(name);
  if (!k || k.includes('quiver')) return false;
  if (k === 'bag' || k === 'wood' || k === 'lumber') return true;
  if (k.includes('lumber') || k.includes('carrybag') || k.includes('carrywood'))
    return true;
  if (k.includes('orebag') || k.includes('stonebag') || k.includes('bonebag'))
    return true;
  if (k.includes('bonewood')) return true;
  return false;
}

export function hideCarryVisuals(root: THREE.Object3D) {
  setCarryVisuals(root, { bag: false, wood: false });
}

/** First visible Xtra_bag / Xtra_wood mesh on a worker. */
export function findVisibleCarryMesh(root: THREE.Object3D): THREE.Mesh | null {
  let found: THREE.Mesh | null = null;
  root.traverse((o) => {
    if (found) return;
    const m = o as THREE.Mesh;
    if (m.isMesh && isCarryMesh(m.name) && m.visible) found = m;
  });
  return found;
}

export function setCarryVisuals(
  root: THREE.Object3D,
  opts: { bag?: boolean; wood?: boolean } = {}
) {
  const bag = !!opts.bag;
  const wood = !!opts.wood;
  root.userData.carryMode = bag || wood;
  root.userData.carryBag = bag;
  root.userData.carryWood = wood;
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || !isCarryMesh(m.name)) return;
    const k = meshKey(m.name);
    const isWood = k === 'wood' || k.includes('wood') || k.includes('lumber');
    const isBag =
      k === 'bag' ||
      k.includes('bag') ||
      k.includes('ore') ||
      k.includes('stone');
    if (isWood) m.visible = wood;
    else if (isBag) m.visible = bag;
    else m.visible = false;
  });
}

export function findRaceKitRoot(
  obj: THREE.Object3D | null
): THREE.Object3D | null {
  let p: THREE.Object3D | null = obj;
  while (p) {
    if (p.userData?.raceKit || p.userData?.warlordsPlayContract) return p;
    p = p.parent;
  }
  return null;
}

/** Play-as only on a stamped Toon RTS kit — not a cone, Meshy, or raw drop. */
export function isPlayBody(obj: THREE.Object3D | null): boolean {
  const root = findRaceKitRoot(obj);
  if (!root) return false;
  const c = root.userData?.warlordsPlayContract as
    | { loader?: string; playMesh?: string }
    | undefined;
  if (c?.loader === 'loadRaceKit' || c?.playMesh === 'toon-rts') return true;
  return Boolean(root.userData?.raceKit);
}

export function listArmorMeshes(
  root: THREE.Object3D,
  slot: ArmorSlot
): THREE.Mesh[] {
  const out: THREE.Mesh[] = [];
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    if (slotOf(m.name) === slot) out.push(m);
  });
  return out;
}

function hideEquippable(root: THREE.Object3D) {
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    if (isEquippable(m)) m.visible = false;
  });
}

function showSlotVariant(
  root: THREE.Object3D,
  slot: ArmorSlot,
  variant: string | null
) {
  const meshes = listArmorMeshes(root, slot);
  if (!meshes.length) return;
  let shown = false;
  for (const m of meshes) {
    const v = variantOf(m.name);
    const on = variant
      ? v === variant || meshKey(m.name).endsWith(variant)
      : false;
    m.visible = on;
    if (on) shown = true;
  }
  if (!shown && variant) {
    // fallback: first mesh in slot
    meshes[0].visible = true;
  }
}

function showKitWeapon(root: THREE.Object3D, needle: string | null) {
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const slot = slotOf(m.name);
    if (slot !== 'weapon' && slot !== 'shield') return;
    if (!needle) {
      m.visible = false;
      return;
    }
    const k = meshKey(m.name);
    m.visible = k.includes(needle) || k.includes(`weapon${needle}`);
  });
}

const ARMOR_MAT_TAG = '__raceKitArmorMat';

export function applyArmorMaterial(root: THREE.Object3D, kind: ArmorMaterial) {
  const profile = MATERIAL_PROFILE[kind];
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || !m.visible) return;
    const slot = slotOf(m.name);
    if (!slot || slot === 'weapon' || slot === 'shield') return;
    const mats = Array.isArray(m.material) ? m.material : [m.material];
    for (const mat of mats) {
      const std = mat as THREE.MeshStandardMaterial;
      if (!std || !('metalness' in std)) continue;
      std.metalness = profile.metalness;
      std.roughness = profile.roughness;
      std.userData[ARMOR_MAT_TAG] = kind;
    }
  });
}

function clearCdnWeapon(root: THREE.Object3D) {
  const old = root.getObjectByName('__cdnWeapon');
  if (old) {
    old.removeFromParent();
  }
}

function gltfLoader() {
  return getProductionGltfLoader();
}

function handBone(root: THREE.Object3D): THREE.Object3D | null {
  let found: THREE.Object3D | null = null;
  root.traverse((o) => {
    if (found) return;
    const n = o.name;
    if (
      n === 'R_hand_container' ||
      n === 'Bip001 R Hand' ||
      n === 'Bip001_R_Hand' ||
      /r.?hand/i.test(n)
    ) {
      found = o;
    }
  });
  return found;
}

async function attachCdnWeapon(root: THREE.Object3D, url: string) {
  clearCdnWeapon(root);
  const gltf = await gltfLoader().loadAsync(url);
  const inst = clone(gltf.scene);
  inst.name = '__cdnWeapon';
  placeAssetSi(inst, 'weapon', new THREE.Vector3(0, 0, 0));
  inst.position.set(0, 0, 0);
  const hand = handBone(root);
  (hand || root).add(inst);
}

export function applyRaceKit(root: THREE.Object3D, state: RaceKitState) {
  hideEquippable(root);
  for (const slot of ARMOR_SLOTS) {
    showSlotVariant(root, slot, state.armor[slot]);
  }
  const w = ALL_KIT_WEAPONS.find((x) => x.id === state.weaponId);
  if (w?.cdnUrl) {
    showKitWeapon(root, null);
    void attachCdnWeapon(root, w.cdnUrl);
  } else {
    clearCdnWeapon(root);
    showKitWeapon(root, w?.meshName || state.weaponId);
  }
  applyArmorMaterial(root, state.material);
  root.userData.raceKit = { ...state };
  root.userData.weaponId = state.weaponId;
  root.userData.animPack = state.animPack;
  root.userData.warlordsPlayContract = {
    loader: 'loadRaceKit',
    playMesh: 'toon-rts',
    raceId: state.raceId,
    animPack: state.animPack,
  };
  setCarryVisuals(root, {
    bag: !!root.userData.carryBag,
    wood: !!root.userData.carryWood,
  });
}

export function bootstrapWorkerKit(
  root: THREE.Object3D,
  raceId: string
): RaceKitState {
  const state: RaceKitState = {
    raceId,
    armor: { body: 'a', arms: 'a', legs: 'a', head: 'a', shoulders: null },
    material: 'leather',
    weaponId: null,
    animPack: 'unarmed',
    hoverMesh: null,
    selectedArmor: null,
  };
  root.userData.worker = true;
  applyRaceKit(root, state);
  hideCarryVisuals(root);
  return state;
}

export function bootstrapRaceKit(
  root: THREE.Object3D,
  raceId: string
): RaceKitState {
  const state: RaceKitState = {
    raceId,
    armor: { ...DEFAULT_LOADOUT },
    material: 'metal',
    weaponId: 'sword',
    animPack: 'sword_shield',
    hoverMesh: null,
    selectedArmor: null,
  };
  applyRaceKit(root, state);
  hideCarryVisuals(root);
  centerRootBetweenFeet(root);
  bindCharacterDebug(root);
  return state;
}

export function setKitMaterial(
  root: THREE.Object3D,
  kind: ArmorMaterial
): RaceKitState {
  const prev = (root.userData.raceKit ||
    bootstrapRaceKit(root, 'human')) as RaceKitState;
  const next = { ...prev, material: kind };
  applyRaceKit(root, next);
  return next;
}

export function setKitWeapon(
  root: THREE.Object3D,
  weaponId: string
): RaceKitState {
  const prev = (root.userData.raceKit ||
    bootstrapRaceKit(root, 'human')) as RaceKitState;
  const w = ALL_KIT_WEAPONS.find((x) => x.id === weaponId);
  const next: RaceKitState = {
    ...prev,
    weaponId,
    animPack: w?.pack || 'unarmed',
  };
  applyRaceKit(root, next);
  return next;
}

export function setKitArmor(
  root: THREE.Object3D,
  slot: ArmorSlot,
  variant: string
): RaceKitState {
  const prev = (root.userData.raceKit ||
    bootstrapRaceKit(root, 'human')) as RaceKitState;
  const next: RaceKitState = {
    ...prev,
    armor: { ...prev.armor, [slot]: variant },
    selectedArmor: `${slot}:${variant}`,
  };
  applyRaceKit(root, next);
  return next;
}

export function setHoverMesh(root: THREE.Object3D, meshName: string | null) {
  const kit = root.userData.raceKit as RaceKitState | undefined;
  if (kit) kit.hoverMesh = meshName;
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const mats = Array.isArray(m.material) ? m.material : [m.material];
    for (const mat of mats) {
      const std = mat as THREE.MeshStandardMaterial;
      if (!std || !('emissive' in std)) continue;
      if (!std.userData.__hoverEmissive) {
        std.userData.__hoverEmissive = std.emissive.clone();
      }
      if (meshName && m.name === meshName) {
        std.emissive.setHex(0x335577);
        std.emissiveIntensity = 0.55;
      } else if (std.userData.__hoverEmissive) {
        std.emissive.copy(std.userData.__hoverEmissive);
        std.emissiveIntensity = 1;
      }
    }
  });
}

export function raceIdFromName(name: string, filePath?: string): string {
  const s = `${name} ${filePath || ''}`.toLowerCase();
  if (s.includes('barbarian') || s.includes('barb')) return 'barbarian';
  if (s.includes('elf')) return 'elf';
  if (s.includes('dwarf')) return 'dwarf';
  if (s.includes('orc')) return 'orc';
  if (s.includes('undead')) return 'undead';
  return 'human';
}
