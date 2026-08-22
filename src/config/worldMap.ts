/**
 * Warlords world-map destinations — one table for the overlay.
 * Sectors + events from warlords-zones.json. Home + pirate stay their own maps.
 * Open sea uses WORLD_STACK + THREE_LAYER_TERRAIN (seafloor −100, weld −10, water 0).
 */
import { WORLD_STACK } from './fleetSystems';
import { SEAFLOOR_GRID } from './hdTerrainDeploy';
import { HOME_ISLAND_CONTRACT, INFO_JSON } from './objectStoreSsot';
import { minimapUrl } from './sectorMinimaps';
import {
  packForSector,
  localToWorld,
  type WorldIslandDef,
} from './worldIslands';

export type MapDestKind =
  'sector' | 'event' | 'static' | 'lobby' | 'home' | 'sea';

export interface WorldEventPin {
  id: string;
  sectorId: string;
  name: string;
  eventType: string;
  schedule: string;
}

export interface MapDestination {
  id: string;
  kind: MapDestKind;
  label: string;
  detail: string;
  sectorId?: string;
  thumb: string;
  playUrl?: string;
  model?: string;
}

/** Canonical events from warlords-zones.json (v2). */
export const WARLORDS_EVENTS: WorldEventPin[] = [
  {
    id: 'evt_haven_trade_day',
    sectorId: 'haven_shore',
    name: 'Trade Day',
    eventType: 'island_event',
    schedule: 'daily',
  },
  {
    id: 'evt_frost_blizzard',
    sectorId: 'frostbite_expanse',
    name: 'Howling Blizzard',
    eventType: 'weather_hazard',
    schedule: 'hourly_chance',
  },
  {
    id: 'evt_fabled_forge_surge',
    sectorId: 'frostbite_expanse',
    name: 'Forge Surge',
    eventType: 'island_event',
    schedule: 'weekend',
  },
  {
    id: 'evt_thorn_hunt',
    sectorId: 'thornwood_wilds',
    name: 'Worge Hunt',
    eventType: 'island_event',
    schedule: 'daily',
  },
  {
    id: 'evt_nexus_clash',
    sectorId: 'convergence_nexus',
    name: 'Faction Clash',
    eventType: 'pvp_event',
    schedule: 'weekend',
  },
  {
    id: 'evt_ember_eruption',
    sectorId: 'ember_depths',
    name: 'Caldera Eruption',
    eventType: 'hazard',
    schedule: 'hourly_chance',
  },
  {
    id: 'evt_abyss_tide',
    sectorId: 'abyssal_trench',
    name: 'Black Tide',
    eventType: 'hazard',
    schedule: 'tide_cycle',
  },
  {
    id: 'evt_ashen_storm',
    sectorId: 'ashen_wastes',
    name: 'Glass Storm',
    eventType: 'weather_hazard',
    schedule: 'daily',
  },
];

export const MAP_DESTINATIONS: MapDestination[] = [
  {
    id: 'open-sea',
    kind: 'sea',
    label: 'Open sea',
    detail: '3×3 seafloor · water 0 · sail the 9 cells',
    thumb: minimapUrl('convergence_nexus'),
  },
  {
    id: 'home-island',
    kind: 'home',
    label: 'Home island',
    detail: `1024 m · ${HOME_ISLAND_CONTRACT.foundations.join(' / ')}`,
    sectorId: 'haven_shore',
    thumb: minimapUrl('home-island'),
    playUrl: 'https://client.grudge-studio.com/home-island',
    model: 'models/nature/stylized/concept/example_home_island.glb',
  },
  {
    id: 'pirate-lobby',
    kind: 'lobby',
    label: 'Pirate lobby',
    detail: 'Chicken Gun lobby · nexus harbor',
    sectorId: 'convergence_nexus',
    thumb: minimapUrl('pirate-islands'),
    playUrl:
      'https://grudgewarlords.com/island-3d?mode=lobby&map=pirate-islands',
    model: 'models/lobby/pirate-islands/scene.glb',
  },
];

export function eventsForSector(sectorId: string): WorldEventPin[] {
  return WARLORDS_EVENTS.filter((e) => e.sectorId === sectorId);
}

export function staticIslandsForSector(sectorId: string): WorldIslandDef[] {
  return (packForSector(sectorId)?.islands || []).filter(
    (i) => i.islandKind === 'static'
  );
}

export function worldMapCells() {
  return SEAFLOOR_GRID.flat().map((id) => {
    const pack = packForSector(id);
    return {
      sectorId: id,
      name: pack?.name || id.replace(/_/g, ' '),
      biome: pack?.biome || '',
      thumb: minimapUrl(id),
      islands: pack?.islands || [],
      events: eventsForSector(id),
    };
  });
}

export function destWorldPos(
  sectorId: string,
  local: [number, number] = [5000, 5000]
) {
  const p = localToWorld(sectorId, local[0], local[1]);
  return { x: p.x, y: WORLD_STACK.waterY + 8, z: p.z };
}

export async function fetchLiveEvents(): Promise<WorldEventPin[]> {
  try {
    const r = await fetch(INFO_JSON.warlordsZones, {
      headers: { Accept: 'application/json' },
    });
    if (!r.ok) return WARLORDS_EVENTS;
    const data = (await r.json()) as { events?: WorldEventPin[] };
    return Array.isArray(data.events) && data.events.length
      ? data.events
      : WARLORDS_EVENTS;
  } catch {
    return WARLORDS_EVENTS;
  }
}

export const WORLD_MAP_META = {
  name: WORLD_STACK.worldName,
  seed: WORLD_STACK.worldSeed,
  cellM: WORLD_STACK.sectorTileM,
  waterY: WORLD_STACK.waterY,
  weldY: WORLD_STACK.islandWeldY,
  seafloorY: WORLD_STACK.seafloorY,
} as const;
