/**
 * Player harvest bag — same law as Casting mainPanelSlots.
 * Player never shows Xtra_bag / Xtra_wood. Resources go here (cache) + Railway.
 * 100 slots · harvest/craft stack 10.
 */
import { readFleetToken } from './fleetAuth';

export const BAG_CAPACITY = 100;
export const HARVEST_STACK_MAX = 10;

export type HarvestKind =
  | 'wood'
  | 'stone'
  | 'ore'
  | 'scrap'
  | 'herb'
  | 'hide'
  | 'fish'
  | 'gold'
  | 'meat'
  | 'bone';

/**
 * ObjectStore professions.json — 6 harvest + 5 craft. Do not invent extras.
 * scrap→engineer · herb→mystic · hide→forester · wood→forester · ore/stone/gold→miner · fish→chef
 */
export const HARVEST_DEFS: Record<
  HarvestKind,
  {
    id: string;
    name: string;
    carry: 'wood' | 'bag';
    harvest:
      | 'mining'
      | 'logging'
      | 'skinning'
      | 'fishing'
      | 'herbalism'
      | 'scavenging';
    craft: 'miner' | 'forester' | 'mystic' | 'chef' | 'engineer';
  }
> = {
  wood: {
    id: 'mat-wood',
    name: 'Wood',
    carry: 'wood',
    harvest: 'logging',
    craft: 'forester',
  },
  stone: {
    id: 'mat-stone',
    name: 'Stone',
    carry: 'bag',
    harvest: 'mining',
    craft: 'miner',
  },
  ore: {
    id: 'mat-ore',
    name: 'Ore',
    carry: 'bag',
    harvest: 'mining',
    craft: 'miner',
  },
  scrap: {
    id: 'mat-scrap',
    name: 'Scrap',
    carry: 'bag',
    harvest: 'scavenging',
    craft: 'engineer',
  },
  herb: {
    id: 'mat-herb',
    name: 'Herb',
    carry: 'bag',
    harvest: 'herbalism',
    craft: 'mystic',
  },
  hide: {
    id: 'mat-hide',
    name: 'Leather',
    carry: 'bag',
    harvest: 'skinning',
    craft: 'forester',
  },
  fish: {
    id: 'mat-fish',
    name: 'Fish',
    carry: 'bag',
    harvest: 'fishing',
    craft: 'chef',
  },
  gold: {
    id: 'mat-gold',
    name: 'Gold',
    carry: 'bag',
    harvest: 'mining',
    craft: 'miner',
  },
  meat: {
    id: 'mat-meat',
    name: 'Meat',
    carry: 'bag',
    harvest: 'skinning',
    craft: 'chef',
  },
  bone: {
    id: 'mat-bone',
    name: 'Bone',
    carry: 'bag',
    harvest: 'scavenging',
    craft: 'engineer',
  },
};

const LS = 'threeflow.harvestBag.v1';

export type BagSlot = {
  id: string;
  name: string;
  kind: string;
  qty: number;
  harvest?: string;
  craft?: string;
} | null;

export function loadHarvestBag(): { slots: BagSlot[] } {
  try {
    const raw = JSON.parse(localStorage.getItem(LS) || 'null');
    const slots: BagSlot[] = Array.isArray(raw?.slots)
      ? raw.slots.slice(0, BAG_CAPACITY)
      : [];
    while (slots.length < BAG_CAPACITY) slots.push(null);
    return { slots };
  } catch {
    return { slots: Array(BAG_CAPACITY).fill(null) };
  }
}

function kindFromResourceId(id: string): HarvestKind | null {
  const k = id.replace(/^mat-/, '') as HarvestKind;
  return k in HARVEST_DEFS ? k : null;
}

function bagFromResources(resources: Record<string, number>): { slots: BagSlot[] } {
  const bag = { slots: Array(BAG_CAPACITY).fill(null) as BagSlot[] };
  let i = 0;
  for (const [rawId, qty] of Object.entries(resources)) {
    const n = Number(qty);
    if (!Number.isFinite(n) || n <= 0) continue;
    const kind = kindFromResourceId(rawId);
    const def = kind ? HARVEST_DEFS[kind] : null;
    if (!def || i >= BAG_CAPACITY) continue;
    bag.slots[i++] = {
      id: def.id,
      name: def.name,
      kind: 'mat',
      qty: n,
      harvest: def.harvest,
      craft: def.craft,
    };
  }
  return bag;
}

/** Railway account bag is SSOT. localStorage is a TTL cache only. */
export async function hydrateHarvestBag(): Promise<{ slots: BagSlot[] }> {
  const token = readFleetToken();
  if (!token) return loadHarvestBag();
  try {
    const res = await fetch('/api/account/resources', {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) return loadHarvestBag();
    const body = (await res.json()) as {
      resources?: Record<string, number>;
    } & Record<string, number>;
    const resources =
      body.resources && typeof body.resources === 'object'
        ? body.resources
        : body;
    const bag = bagFromResources(resources);
    saveHarvestBag(bag);
    return bag;
  } catch {
    return loadHarvestBag();
  }
}

function saveHarvestBag(bag: { slots: BagSlot[] }) {
  localStorage.setItem(LS, JSON.stringify(bag));
}

export function addHarvestLoot(kind: HarvestKind, qty: number) {
  const def = HARVEST_DEFS[kind] || HARVEST_DEFS.wood;
  const bag = loadHarvestBag();
  let left = Math.max(1, qty);
  for (let i = 0; i < bag.slots.length && left > 0; i++) {
    const s = bag.slots[i];
    if (s && s.id === def.id) {
      const room = HARVEST_STACK_MAX - (s.qty || 0);
      if (room <= 0) continue;
      const take = Math.min(room, left);
      s.qty += take;
      left -= take;
    }
  }
  while (left > 0) {
    const free = bag.slots.findIndex((s) => !s);
    if (free < 0) {
      saveHarvestBag(bag);
      return { ok: false, full: true, leftover: left, id: def.id };
    }
    const take = Math.min(HARVEST_STACK_MAX, left);
    bag.slots[free] = {
      id: def.id,
      name: def.name,
      kind: 'mat',
      qty: take,
      harvest: def.harvest,
      craft: def.craft,
    };
    left -= take;
  }
  saveHarvestBag(bag);
  void depositRailway(def.id.replace(/^mat-/, ''), qty);
  return { ok: true, id: def.id, name: def.name, qty };
}

async function depositRailway(resourceId: string, amount: number) {
  const token = readFleetToken();
  if (!token) return;
  try {
    const res = await fetch('/api/account/resources/batch', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        items: [{ resourceId, amount }],
      }),
    });
    if (res.ok) void hydrateHarvestBag();
  } catch {
    /* cache only until next hydrate */
  }
}

export function carryVisualFor(kind: HarvestKind): {
  bag: boolean;
  wood: boolean;
} {
  const carry = HARVEST_DEFS[kind]?.carry || 'bag';
  return { bag: carry === 'bag', wood: carry === 'wood' };
}
