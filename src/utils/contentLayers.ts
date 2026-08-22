/**
 * World content layers — size / scale / render.
 * Maps onto Forge PHYS_LAYERS + SurfaceKind. Does not add collision groups.
 */
import * as THREE from 'three';
import {
  CONTENT_LAYERS,
  PLAY_PERF,
  contentLayerDef,
  type ContentLayerId,
  type SurfaceKind,
} from '@/config/fleetSystems';

export type LayerRenderState = {
  visible: boolean;
  scale: number;
  castShadow: boolean;
  receiveShadow: boolean;
};

const LS = 'threeflow.contentLayers.v1';

export const DEFAULT_LAYER_RENDER: LayerRenderState = {
  visible: true,
  scale: 1,
  castShadow: true,
  receiveShadow: true,
};

export function emptyLayerRender(): Record<ContentLayerId, LayerRenderState> {
  const out = {} as Record<ContentLayerId, LayerRenderState>;
  for (const l of CONTENT_LAYERS) {
    out[l.id] = { ...DEFAULT_LAYER_RENDER };
    if (l.id === 'weather' || l.id === 'projectile')
      out[l.id].receiveShadow = false;
    if (l.id === 'trigger') {
      out[l.id].castShadow = false;
      out[l.id].receiveShadow = false;
    }
  }
  return out;
}

export function loadLayerRender(): Record<ContentLayerId, LayerRenderState> {
  const base = emptyLayerRender();
  try {
    const raw = JSON.parse(localStorage.getItem(LS) || 'null');
    if (!raw || typeof raw !== 'object') return base;
    for (const l of CONTENT_LAYERS) {
      const s = raw[l.id];
      if (!s) continue;
      base[l.id] = {
        visible: s.visible !== false,
        scale: Number.isFinite(s.scale)
          ? Math.max(0.05, Math.min(20, s.scale))
          : 1,
        castShadow: s.castShadow !== false,
        receiveShadow: s.receiveShadow !== false,
      };
    }
  } catch {
    /* defaults */
  }
  return base;
}

export function saveLayerRender(map: Record<ContentLayerId, LayerRenderState>) {
  localStorage.setItem(LS, JSON.stringify(map));
}

export function inferContentLayer(hints: {
  name?: string;
  group?: string;
  prefabKind?: string;
  harvestKind?: string;
  isTerrain?: boolean;
  player?: boolean;
  lootable?: boolean;
  campRole?: string;
}): ContentLayerId {
  const s =
    `${hints.name || ''} ${hints.group || ''} ${hints.prefabKind || ''} ${hints.harvestKind || ''} ${hints.campRole || ''}`.toLowerCase();
  if (hints.player) return 'player';
  if (hints.lootable) return 'item';
  if (
    hints.isTerrain ||
    /sector|island|zone|ds2|hard road|customplane|mapsurface/.test(s)
  )
    return /seafloor|seabed|ocean.?floor/.test(s) ? 'seafloor' : 'terrain';
  if (
    hints.harvestKind ||
    /harvest|lumber_tree|ore_rock|scrap_wreck|herb_flower|hide_carcass|fish_shore/.test(
      s
    )
  )
    return 'harvestable';
  if (/seafloor|seabed|ocean.?floor/.test(s)) return 'seafloor';
  if (/\bvoid\b|fall.?forever|abyss/.test(s)) return 'void';
  if (/\blava\b|magma/.test(s)) return 'lava';
  if (/quicksand|sinksand/.test(s)) return 'quicksand';
  if (/\bwater\b|ocean|lake|river|pool/.test(s)) return 'water';
  if (/rain|snow|storm|fog|weather|dust/.test(s)) return 'weather';
  if (/projectile|arrow|bolt|slash|missile|bullet/.test(s)) return 'projectile';
  if (/trigger|volume|sensor/.test(s)) return 'trigger';
  if (/animal|wildlife|creature|deer|beast|fish(?!_shore)/.test(s))
    return 'animal';
  if (
    hints.campRole === 'lookout' ||
    hints.group === 'enemies' ||
    /monster|enemy|hostile|lookout/.test(s)
  )
    return 'monster';
  if (hints.group === 'captains') return 'player';
  if (
    hints.group === 'units' ||
    hints.prefabKind === 'unit' ||
    /npc|worker|ally/.test(s)
  )
    return 'npc';
  if (hints.group === 'weapons' || hints.prefabKind === 'siege') return 'item';
  if (hints.group === 'vfx') return 'projectile';
  if (hints.group === 'textures') return 'weather';
  return 'terrain';
}

export function stampContentLayer(
  obj: THREE.Object3D,
  id: ContentLayerId,
  extra?: { harvestKind?: string; siHeightM?: number }
) {
  const def = contentLayerDef(id);
  obj.userData.contentLayer = def.id;
  obj.userData.surface = def.surface as SurfaceKind;
  obj.userData.worldKind = def.id;
  if (extra?.harvestKind) obj.userData.harvestKind = extra.harvestKind;
  if (extra?.siHeightM) obj.userData.siHeightM = extra.siHeightM;
  else if (obj.userData.siHeightM == null)
    obj.userData.siHeightM = def.siHeightM;
  if (obj.userData.baseUniform == null) {
    const u =
      Math.abs(obj.scale.x - obj.scale.y) < 1e-6
        ? obj.scale.x
        : (Math.abs(obj.scale.x) +
            Math.abs(obj.scale.y) +
            Math.abs(obj.scale.z)) /
          3;
    obj.userData.baseUniform = u;
    obj.userData.baseScale = { x: u, y: u, z: u };
  }
  const body =
    def.phys === 'NPC' || def.phys === 'Player'
      ? 'kinematicPosition'
      : def.phys === 'Projectile'
        ? 'dynamic'
        : 'fixed';
  const shape =
    def.phys === 'Terrain'
      ? 'heightfield'
      : def.phys === 'NPC' || def.phys === 'Player'
        ? 'capsule'
        : def.phys === 'Water' || def.phys === 'Trigger'
          ? 'cuboid'
          : 'cuboid';
  obj.userData.physLayer = def.phys;
  obj.userData.physBody = body;
  obj.userData.physShape = shape;
  obj.userData.physSensor = def.phys === 'Water' || def.phys === 'Trigger';
  if (def.id === 'player') {
    obj.userData.player = true;
  } else if (obj.userData.player) {
    obj.userData.player = false;
    obj.userData.playAs = false;
  }
}

export function listPlayables(scene: THREE.Scene): THREE.Object3D[] {
  const out: THREE.Object3D[] = [];
  scene.traverse((o) => {
    if (o === scene) return;
    if (o.userData?.contentLayer === 'player' || o.userData?.player === true) {
      out.push(o);
    }
  });
  return out;
}

export function getPlayAs(scene: THREE.Scene): THREE.Object3D | null {
  let fallback: THREE.Object3D | null = null;
  let found: THREE.Object3D | null = null;
  scene.traverse((o) => {
    if (o === scene) return;
    if (o.userData?.playAs === true) found = o;
    else if (
      !fallback &&
      (o.userData?.contentLayer === 'player' || o.userData?.player)
    ) {
      fallback = o;
    }
  });
  return found || fallback;
}

/** One play-as. Player layer = roster. Clears harvest/lookout on that body. */
export function setPlayAs(
  scene: THREE.Scene,
  obj: THREE.Object3D
): THREE.Object3D {
  scene.traverse((o) => {
    if (o.userData?.playAs) o.userData.playAs = false;
  });
  stampContentLayer(obj, 'player');
  obj.userData.player = true;
  obj.userData.playAs = true;
  obj.userData.aiBrain = 'player-deathmatch';
  obj.userData.behavior = 'player-deathmatch';
  obj.userData.campRole = undefined;
  return obj;
}

export function objectsOnLayer(
  scene: THREE.Scene,
  id: ContentLayerId
): THREE.Object3D[] {
  const out: THREE.Object3D[] = [];
  scene.traverse((o) => {
    if (o === scene) return;
    if (o.userData?.contentLayer === id) out.push(o);
  });
  return out;
}

export function layerCounts(
  scene: THREE.Scene
): Record<ContentLayerId, number> {
  const counts = {} as Record<ContentLayerId, number>;
  for (const l of CONTENT_LAYERS) counts[l.id] = 0;
  scene.traverse((o) => {
    const id = o.userData?.contentLayer as ContentLayerId | undefined;
    if (id && counts[id] != null) counts[id] += 1;
  });
  return counts;
}

export function applyLayerRender(
  scene: THREE.Scene,
  map: Record<ContentLayerId, LayerRenderState>
) {
  scene.traverse((o) => {
    const id = o.userData?.contentLayer as ContentLayerId | undefined;
    if (!id || !map[id]) return;
    const s = map[id];
    o.visible = s.visible;
    const baseU = Number(o.userData.baseUniform);
    if (Number.isFinite(baseU) && baseU > 0) {
      o.scale.setScalar(baseU * s.scale);
    }
    o.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = s.castShadow;
      mesh.receiveShadow = s.receiveShadow;
    });
  });
}

export function layerSizeM(obj: THREE.Object3D, scaleMul = 1): number {
  const si = Number(obj.userData.siHeightM);
  if (Number.isFinite(si) && si > 0) return si * scaleMul;
  const box = new THREE.Box3().setFromObject(obj);
  return box.isEmpty() ? 0 : box.getSize(new THREE.Vector3()).y;
}

export function retargetLayer(obj: THREE.Object3D, id: ContentLayerId) {
  stampContentLayer(obj, id);
}

/** Fill missing stamps after ObjectLoader restore. */
export function hydrateContentLayers(scene: THREE.Scene) {
  scene.traverse((o) => {
    if (o === scene || o.userData?.contentLayer) return;
    if (
      !o.userData?.isTransformControls &&
      !o.userData?.isTerrain &&
      o.name !== 'customPlane'
    )
      return;
    stampContentLayer(
      o,
      inferContentLayer({
        name: o.name,
        prefabKind: o.userData.prefabKind,
        harvestKind: o.userData.harvestKind,
        isTerrain: Boolean(o.userData.isTerrain),
        player: o.userData.player === true,
        lootable: Boolean(o.userData.lootable),
        campRole: o.userData.campRole,
      })
    );
  });
  applyLayerRender(scene, loadLayerRender());
}

/** One scene walk for play ticks — rebuilt every PLAY_PERF.queryRebuildFrames. */
export type PlayQuery = {
  scene: THREE.Scene;
  age: number;
  playAs: THREE.Object3D | null;
  sun: THREE.DirectionalLight | null;
  grounds: THREE.Object3D[];
  occluders: THREE.Object3D[];
  hostiles: THREE.Object3D[];
  lookouts: THREE.Object3D[];
  harvestNpcs: THREE.Object3D[];
  friendlies: THREE.Object3D[];
  loot: THREE.Object3D[];
  carcass: THREE.Object3D[];
  harvestNodes: THREE.Object3D[];
  aimRoots: THREE.Object3D[];
};

let playQuery: PlayQuery | null = null;

function isWalkableGround(o: THREE.Object3D): boolean {
  const layer = String(o.userData?.contentLayer || '');
  if (layer === 'void' || layer === 'water') return false;
  if (o.userData?.isTerrain) return true;
  return (
    o.userData?.mapSurface === true ||
    o.name === 'customPlane' ||
    Boolean(o.userData?.planeGeometry)
  );
}

export function peekPlayQuery(): PlayQuery | null {
  return playQuery;
}

export function disposePlayQuery() {
  playQuery = null;
}

export function refreshPlayQuery(scene: THREE.Scene): PlayQuery {
  const next: PlayQuery = {
    scene,
    age: 0,
    playAs: null,
    sun: null,
    grounds: [],
    occluders: [],
    hostiles: [],
    lookouts: [],
    harvestNpcs: [],
    friendlies: [],
    loot: [],
    carcass: [],
    harvestNodes: [],
    aimRoots: [],
  };
  let playFallback: THREE.Object3D | null = null;
  scene.traverse((o) => {
    if (o === scene) return;
    const d = o as THREE.DirectionalLight;
    if (!next.sun && d.isDirectionalLight) next.sun = d;
    if (o.userData?.playAs === true) next.playAs = o;
    else if (
      !playFallback &&
      (o.userData?.contentLayer === 'player' || o.userData?.player)
    ) {
      playFallback = o;
    }
    if (isWalkableGround(o)) next.grounds.push(o);
    const mesh = o as THREE.Mesh;
    if (
      mesh.isMesh &&
      (o.userData?.isTerrainMesh ||
        o.userData?.isTerrain ||
        o.userData?.contentLayer === 'terrain' ||
        o.userData?.contentLayer === 'seafloor')
    ) {
      next.occluders.push(o);
    }
    const layer = o.userData?.contentLayer;
    if (
      !o.userData?.player &&
      !o.userData?.playAs &&
      !o.userData?.carcass &&
      !o.userData?.lootable &&
      (layer === 'monster' ||
        layer === 'npc' ||
        layer === 'animal' ||
        o.userData?.enemyCampMember)
    ) {
      next.hostiles.push(o);
    }
    if (o.userData?.campRole === 'lookout') next.lookouts.push(o);
    const brain = String(o.userData?.aiBrain || o.userData?.behavior || '');
    if (
      !o.userData?.player &&
      o.userData?.campRole !== 'lookout' &&
      (brain === 'auto_harvest' || brain === 'harvest' || o.userData?.worker)
    ) {
      next.harvestNpcs.push(o);
    }
    if (
      (o.userData?.raceKit || o.userData?.prefabKind === 'unit') &&
      !o.userData?.enemyCampMember
    ) {
      next.friendlies.push(o);
    }
    if (o.userData?.lootable && o.userData?.fallVel !== undefined)
      next.loot.push(o);
    if (o.userData?.carcass && o.userData?.lootable) next.carcass.push(o);
    if (
      o.userData?.harvestKind &&
      !o.userData?.isTerrain &&
      !o.userData?.raceKit &&
      o.userData?.prefabKind !== 'unit'
    ) {
      next.harvestNodes.push(o);
    }
  });
  if (!next.playAs) next.playAs = playFallback;
  const islands = scene.getObjectByName('__worldIslands');
  next.aimRoots = [...next.grounds];
  if (islands) next.aimRoots.push(islands);
  if (next.playAs) next.aimRoots.push(next.playAs);
  for (const h of next.hostiles) next.aimRoots.push(h);
  playQuery = next;
  return next;
}

export function getPlayQuery(scene: THREE.Scene): PlayQuery {
  if (
    !playQuery ||
    playQuery.scene !== scene ||
    playQuery.age >= PLAY_PERF.queryRebuildFrames
  ) {
    return refreshPlayQuery(scene);
  }
  playQuery.age += 1;
  return playQuery;
}

export function getPlayAsCached(scene: THREE.Scene): THREE.Object3D | null {
  if (playQuery && playQuery.scene === scene) return playQuery.playAs;
  return getPlayAs(scene);
}
