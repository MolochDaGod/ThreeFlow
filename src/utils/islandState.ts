/**
 * Compact Railway island.state.threeflow stamp.
 * Does not replace harvest `nodes` (those are RTS/account coords on home_islands).
 * Railway PATCH schema (GrudgeBuilder islandStateSchema) is .passthrough() — extra
 * `threeflow` is allowed, but required RTS fields must be sent on every write.
 */
import * as THREE from 'three';
import { WORLD_STACK } from '@/config/fleetSystems';

export type ThreeflowIslandStamp = {
  version: number;
  source: string;
  worldStack: typeof WORLD_STACK;
  seafloor: boolean;
  water: boolean;
  islands: boolean;
  terrains: Record<string, unknown>[];
  harvest: Record<string, unknown>[];
};

export function extractThreeflowIslandStamp(
  scene: THREE.Scene
): ThreeflowIslandStamp {
  const terrains: Record<string, unknown>[] = [];
  const harvest: Record<string, unknown>[] = [];
  scene.traverse((o) => {
    if (o.userData?.isTerrain || o.userData?.mapSurface) {
      terrains.push({
        name: o.name,
        terrainId: o.userData.terrainId || null,
        sectorId: o.userData.sectorId || null,
        kind: o.userData.terrainKind || o.userData.contentLayer || null,
        islandKind: o.userData.islandKind || null,
        r2Key: o.userData.r2Key || null,
        mapSurface: Boolean(o.userData.mapSurface),
        contentLayer: o.userData.contentLayer || null,
        y: +o.position.y.toFixed(2),
      });
    }
    if (o.userData?.harvestKind || o.userData?.contentLayer === 'harvestable') {
      const p = new THREE.Vector3();
      o.getWorldPosition(p);
      harvest.push({
        name: o.name,
        harvestKind: o.userData.harvestKind || null,
        x: +p.x.toFixed(2),
        y: +p.y.toFixed(2),
        z: +p.z.toFixed(2),
      });
    }
  });
  return {
    version: 1,
    source: 'threeflow',
    worldStack: { ...WORLD_STACK },
    seafloor: Boolean(scene.getObjectByName('__seafloorGrid')),
    water: Boolean(
      scene.getObjectByName('worldWater') ||
      scene.getObjectByName('__worldAtmosphere')
    ),
    islands: Boolean(scene.getObjectByName('__worldIslands')),
    terrains,
    harvest,
  };
}

export function readThreeflowStamp(
  state: unknown
): ThreeflowIslandStamp | null {
  if (!state || typeof state !== 'object') return null;
  const raw = (state as { threeflow?: unknown }).threeflow;
  if (!raw || typeof raw !== 'object') return null;
  const t = raw as Partial<ThreeflowIslandStamp>;
  return {
    version: Number(t.version) || 1,
    source: String(t.source || 'threeflow'),
    worldStack: { ...WORLD_STACK, ...(t.worldStack || {}) },
    seafloor: Boolean(t.seafloor),
    water: Boolean(t.water),
    islands: Boolean(t.islands),
    terrains: Array.isArray(t.terrains) ? t.terrains : [],
    harvest: Array.isArray(t.harvest) ? t.harvest : [],
  };
}

function asNum(v: unknown, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/** Apply a saved stamp onto the live scene without touching Railway RTS nodes. */
export async function applyThreeflowStamp(
  scene: THREE.Scene,
  stamp: ThreeflowIslandStamp | null,
  ops: {
    openSea?: () => Promise<unknown>;
    mountAtmosphere?: () => unknown;
  } = {}
): Promise<void> {
  if (!stamp) return;
  if (stamp.seafloor || stamp.islands) {
    await ops.openSea?.();
  } else if (stamp.water) {
    ops.mountAtmosphere?.();
  }
  for (const t of stamp.terrains) {
    const name = typeof t.name === 'string' ? t.name : '';
    const terrainId =
      typeof t.terrainId === 'string' ? t.terrainId : '';
    const y = Number(t.y);
    if (!Number.isFinite(y)) continue;
    let obj: THREE.Object3D | undefined;
    if (name) obj = scene.getObjectByName(name);
    if (!obj && terrainId) {
      obj = scene.getObjectByProperty('terrainId', terrainId);
    }
    if (obj) obj.position.y = y;
  }
}

/** Merge stamp into GET state without dropping Railway harvest nodes. */
export function mergeIslandStateForPatch(
  prev: Record<string, unknown>,
  stamp: ThreeflowIslandStamp
): Record<string, unknown> {
  const now = Date.now();
  const assigned = prev.assignedHeroes;
  return {
    ...prev,
    id: String(prev.id || 'home'),
    mapStyle: prev.mapStyle || 'iron',
    nodes: Array.isArray(prev.nodes) ? prev.nodes : [],
    sheep: Array.isArray(prev.sheep) ? prev.sheep : [],
    skinningNodes: Array.isArray(prev.skinningNodes) ? prev.skinningNodes : [],
    assignedHeroes:
      assigned && typeof assigned === 'object' && !Array.isArray(assigned)
        ? assigned
        : {},
    createdAt: asNum(prev.createdAt, now),
    lastUpdate: now,
    threeflow: stamp,
  };
}
